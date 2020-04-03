/*
 * payload.c
 *
 *  Created on: Mar 31, 2020
 *      Author: fu
 */
#include "stm32f4xx_hal.h"
#include "payload.h"
#include "crc.h"
#include "queue.h"
#include "can.h"
#include "stdio.h"
#include "gimbal_camera_ctrl.h"
#include "float32_float16_convert.h"

#define  HARDWARE_VERSION       2
#define  FUNCTION_VERSION       2
#define  OPT_VERSION            8

#define  TYPE_PHOTO_COUNT       4

#define  TYPE_REQUEST_IDENTIFY  (0xFD)
#define  TYPE_REQUEST_ID        (0xFE)
#define  TYPE_REQUEST_FILE      (0xFC)
#define  SEND_TO_DRONE_HEAD 	(0xA5)

typedef enum
{
	PROCEDURE_IDEL,
	PROCEDURE_REQUEST_IDENTIFY,
	PROCEDURE_SEND_ID,
	PROCEDURE_SEND_PAGE,
	PROCEDURE_OK,
} identification_procedure_e;

typedef enum
{
	DRONE_MSG_TAKE_PHOTO = 0x1,
	DRONE_MSG_YAW_INFO = 0x2,
	DRONE_MSG_RC_CHANNEL = 0x3,
	DRONE_MSG_CARMER_ZOOM = 0x04,
	DRONE_MSG_CARMER_RECORD = 0x05,
	DRONE_MSG_GIMBAL_PITCH_CTRL = 0x06,
	DRONE_MSG_GIMBAL_YAW_CTRL = 0x07,
	DRONE_MSG_GIMBAL_MODE_CTRL = 0x08,
	DRONE_MSG_CAMERA_MODE_CTRL = 0x09,
	DRONE_MSG_CARMER_TRACKING_ON_OFF = 0x0A,
	DRONE_MSG_COORDINATE = 0x0B,
	DRONE_MSG_REQUEST_PID_PARAM = 0x0C,
	DRONE_MSG_PID_PARAM = 0x0D,
	DRONE_MSG_SET_PITCH_ANGLE = 0x0E,
	DRONE_MSG_CAMERA_COMMAND = 0x0F,
	DRONE_MSG_CARMER_ZOOM_POSITION = 0x10,
	DRONE_MSG_FOCUS_CTRL = 0x11,
	DRONE_MSG_SET_YAW_ANGLE = 0x12,
	DRONE_MSG_REALTIME = 0x13,
	DRONE_MSG_GESTURE_INFO = 0x14,
	DRONE_MSG_GPS_INFO = 0x15,
	DRONE_MSG_CAMERA_IA_MF = 0x16,
	DRONE_MSG_CAMERA_IRIS = 0x17,
	DRONE_MSG_CAMERA_SHUTTER = 0x18,
	DRONE_MSG_CAMERA_WB = 0x19,
	DRONE_MSG_CAMERA_SHARPNESS = 0x1A,
	DRONE_MSG_CAMERA_SATURATION = 0x1B,
	DRONE_MSG_CAMERA_BRIGHTNESS = 0x1C,
	DRONE_MSG_CAMERA_PRIORITY = 0x1D,
	DRONE_MSG_CAMERA_BACKLIGHT = 0x1E,
	DRONE_MSG_CAMERA_NIGHT_MODE = 0x1F,
	DRONE_MSG_CAMERA_PENETRATING_FOG = 0x20,
	DRONE_MSG_CAMERA_AF_AE = 0x21,

	DRONE_MSG_IDENTIFICATION = 0xFF,
} drone_msg_type;

typedef enum
{
	IDEL, GET_HEAD, GET_TYPE, GET_LEN, GET_DATA,
} parser_stat_t;

#pragma pack(1)

typedef struct
{
	uint8_t head;
	uint8_t type;
	uint8_t len;
	uint16_t photo_count;
	uint8_t crc;
} msg_to_drone_photo_count_t;

typedef struct
{
	uint8_t head;
	uint8_t type;
	uint8_t len;
	uint8_t data;
	uint8_t crc;
} msg_to_drone_request_identify_t;
typedef struct
{
	uint8_t head;
	uint8_t type;
	uint8_t len;
	uint16_t vender_ID;
	uint16_t payload_type;
	uint32_t UID[4];
	uint32_t version;
	uint8_t crc;
} msg_to_drone_ID_t;

typedef struct
{
	uint8_t head;
	uint8_t type;
	uint8_t len;
	uint16_t width;
	uint16_t height;
	uint8_t filename[20];
	uint8_t crc;
} msg_to_drone_fileinfo_t;
#pragma pack()

typedef struct
{
	int16_t x;
	int16_t y;
} gesture_info_t;
typedef struct
{
	uint32_t lat;         //latitude * 10^7
	uint32_t lng;         //longitude * 10^7
	uint32_t altitude;    //meters
} gps_info_t;

gesture_info_t gesture_info;
gps_info_t gps_info;

identification_procedure_e identification_procedure = PROCEDURE_IDEL;
queue_t can_msg_queue;
CAN_TxHeaderTypeDef drone_can_msg_head;
uint8_t can_busy_flag = RESET;
parser_stat_t parser_stat = IDEL;
uint8_t drone_data_buf[256];
uint32_t photo = 0;

static void send_can_msg_to_drone(void);

void g_payload_init(void)
{
	g_o1heap_init();
	g_queue_init(&can_msg_queue);

	drone_can_msg_head.StdId = DEVICE_ID;
	drone_can_msg_head.ExtId = 0;
	drone_can_msg_head.IDE = CAN_ID_STD;
	drone_can_msg_head.RTR = CAN_RTR_DATA;
	drone_can_msg_head.DLC = 8;
	drone_can_msg_head.TransmitGlobalTime = DISABLE;
}

void g_send_to_drone(void *addr, uint8_t len)
{
	can_msg_t msg_to_drone;
	uint8_t i, j, pack_count, remain_byte;
	pack_count = len / 8;
	remain_byte = len % 8;

	for (j = 0; j < pack_count; j++)
	{
		for (i = 0; i < 8; i++)
		{
			msg_to_drone.data[i] = ((uint8_t*) addr)[j * 8 + i];
		}
		msg_to_drone.len = 8;
		queue_push(&can_msg_queue, &msg_to_drone);
		//add error handle
	}
	if (remain_byte > 0)
	{
		for (i = 0; i < remain_byte; i++)
		{
			msg_to_drone.data[i] = ((uint8_t*) addr)[j * 8 + i];
		}
		msg_to_drone.len = remain_byte;
		queue_push(&can_msg_queue, &msg_to_drone);
		//add error handle
	}
	send_can_msg_to_drone();
}

static void request_identify(void)
{
	msg_to_drone_request_identify_t request_identify;

	request_identify.head = SEND_TO_DRONE_HEAD;
	request_identify.type = TYPE_REQUEST_IDENTIFY;
	request_identify.len = sizeof(request_identify) - 2;

	request_identify.data = 0;

	request_identify.crc = g_generate_crc((uint8_t*) &(request_identify.type),
			request_identify.len);
	g_send_to_drone(&request_identify, sizeof(request_identify));
}

static void get_compile_date(uint8_t *year, uint8_t *month, uint8_t *day)
{
	uint8_t i;
	const char *p_month[] =
	{ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct",
			"Nov", "Dec" };
	const char Date[12] = __DATE__;

	for (i = 0; i < 12; i++)
	{
		if (memcmp(Date, p_month[i], 3) == 0)
		{
			*month = i + 1;
			break;
		}
	}
	*year = (uint8_t) atoi(Date + 9);
	*day = (uint8_t) atoi(Date + 4);
}

uint32_t g_get_version(void)
{
	uint32_t version = 0;
	uint8_t year = 0;
	uint8_t month = 0;
	uint8_t day = 0;

	get_compile_date(&year, &month, &day);

	version = HARDWARE_VERSION << 30 | FUNCTION_VERSION << 24
			| OPT_VERSION << 16 | year << 9 | month << 5 | day;

	return version;
}

void send_photo_count_to_drone(uint16_t photo_count)
{
	msg_to_drone_photo_count_t msg_to_drone_photo_count;
	msg_to_drone_photo_count.head = SEND_TO_DRONE_HEAD;
	msg_to_drone_photo_count.type = TYPE_PHOTO_COUNT;
	msg_to_drone_photo_count.len = sizeof(msg_to_drone_photo_count) - 2;
	msg_to_drone_photo_count.photo_count = photo_count;
	msg_to_drone_photo_count.crc = g_generate_crc(
			(uint8_t*) &(msg_to_drone_photo_count.type),
			msg_to_drone_photo_count.len);
	g_send_to_drone(&msg_to_drone_photo_count,
			sizeof(msg_to_drone_photo_count));
}

void send_UID(void)
{
	msg_to_drone_ID_t UID;

	UID.head = SEND_TO_DRONE_HEAD;
	UID.type = TYPE_REQUEST_ID;
	UID.len = sizeof(UID) - 2;

	UID.vender_ID = 0;
	UID.payload_type = 0x1fd;
	UID.UID[0] = *(uint32_t*) (0x1fff7a10);    //cpu_id[0]
	UID.UID[1] = *(uint32_t*) (0x1fff7a14);    //cpu_id[1];
	UID.UID[2] = *(uint32_t*) (0x1fff7a18);    //cpu_id[2];
	UID.UID[3] = 0;
	UID.version = g_get_version();

	UID.crc = g_generate_crc((uint8_t*) &(UID.type), UID.len);
	g_send_to_drone(&UID, sizeof(UID));
}

void send_page_info(void)
{
	uint8_t len = 0;
	msg_to_drone_fileinfo_t fileinfo;

	fileinfo.head = SEND_TO_DRONE_HEAD;
	fileinfo.type = TYPE_REQUEST_FILE;

	fileinfo.width = 500;
	fileinfo.height = 270;

	len = snprintf((char*) (fileinfo.filename), 20, "%s", "Common_Payload");

	fileinfo.len = len + 6;
	fileinfo.filename[len] = g_generate_crc((uint8_t*) &(fileinfo.type),
			fileinfo.len);
	g_send_to_drone(&fileinfo, fileinfo.len + 2);
}

/**
 *identification procedure. called by SysTick_Handler() every 100ms.
 */
void g_identification(void)
{
	switch (identification_procedure)
	{
	case PROCEDURE_IDEL:
	case PROCEDURE_REQUEST_IDENTIFY:
		request_identify();
		break;

	case PROCEDURE_SEND_ID:
		send_UID();
		break;

	case PROCEDURE_SEND_PAGE:
		send_page_info();
		identification_procedure = PROCEDURE_OK;
		break;

	default:
		send_photo_count_to_drone(photo);
		break;
	}
}

/**
 *
 */
void g_update_identification_procedure(uint8_t data)
{
	switch (data)
	{
//	case 0x00:
//		send_payload_id_to_drone();
//		break;

	case 0x01:
		identification_procedure = PROCEDURE_SEND_ID;
		break;

	case 0x02:
		identification_procedure = PROCEDURE_SEND_PAGE;
		break;

	default:
		break;
	}
}

static void send_can_msg_to_drone(void)
{
	uint32_t mail_box;
	can_msg_t can_tx_msg;
	if (can_busy_flag == RESET)
	{
		can_busy_flag = SET;

		queue_pop(&can_msg_queue, &can_tx_msg);

		drone_can_msg_head.DLC = can_tx_msg.len;
		HAL_CAN_AddTxMessage(&hcan1, &drone_can_msg_head, can_tx_msg.data,
				&mail_box);
	}
}

void g_handle_drone_instruction(uint8_t *data)
{
	float value;
	switch (data[1])
	{

	/*俯仰控制*/
	case DRONE_MSG_GIMBAL_PITCH_CTRL:
		g_pitch_control(data[3]);
		break;

		/*航向控制*/
	case DRONE_MSG_GIMBAL_YAW_CTRL:
		g_yaw_control(data[3]);
		break;

		/*手势控制*/
	case DRONE_MSG_GESTURE_INFO:
		gesture_info.x = *(int16_t*) &(data[3]);
		gesture_info.y = *(int16_t*) &(data[5]);
		break;

		/*云台模式*/
	case DRONE_MSG_GIMBAL_MODE_CTRL:

		g_gimbal_mode(data[3]);

		break;

		/*指定俯仰角度*/
	case DRONE_MSG_SET_PITCH_ANGLE:
		value = g_convert_float16_to_native_float(data[4] << 8 | data[3]);
		g_set_gimbal_pitch(value);
		break;

		/*制定航向角度*/
	case DRONE_MSG_SET_YAW_ANGLE:
		value = g_convert_float16_to_native_float(data[4] << 8 | data[3]);
		g_set_gimbal_yaw(value);
		break;

		/*GPS信息拍照*/
	case DRONE_MSG_TAKE_PHOTO:
		gps_info.altitude = data[5] | data[6] << 8 | data[7] << 16
				| data[8] << 24;
		gps_info.lat = data[9] | data[10] << 8 | data[11] << 16
				| data[12] << 24;
		gps_info.lng = data[13] | data[14] << 8 | data[15] << 16
				| data[16] << 24;
		photo++;
		g_take_photo(gps_info.altitude, gps_info.lat, gps_info.lng);
		break;
	case DRONE_MSG_CARMER_ZOOM:
		g_control_zoom(data[3]);
		break;

	case DRONE_MSG_CARMER_RECORD:
		g_record(data[3]);
		break;
		/*发送用户屏幕指点数据
		 data[3] is the position type: 1 for move. 3 for tracking. 6 for focus.
		 data[4:5] is the X coordinate int16_t value.
		 data[5:6] is the Y coordinate int16_t value.
		 */
	case DRONE_MSG_COORDINATE:

		break;

		/*实时时间数据:  from data[3]
		 uint16_t year;
		 uint8_t month;
		 uint8_t day;
		 uint8_t hour;
		 uint8_t minute;*/
	case DRONE_MSG_REALTIME:

		break;

		/*飞机航向信息, 待航向信息稳定后在进行模式切换*/
	case DRONE_MSG_YAW_INFO:

		break;

		/*修改PID参数*/
	case DRONE_MSG_PID_PARAM:

		break;

		/*请求PID参数*/
	case DRONE_MSG_REQUEST_PID_PARAM:

		break;

	case DRONE_MSG_FOCUS_CTRL:

		break;

		/*控制相机功能：IA、光圈、快门、白平衡、锐度、饱和度、亮度、优先模式、逆光拍摄、夜晚模式、透雾、聚焦、变焦、录像*/
	case DRONE_MSG_CAMERA_IA_MF:
	case DRONE_MSG_CAMERA_IRIS:
	case DRONE_MSG_CAMERA_SHUTTER:
	case DRONE_MSG_CAMERA_WB:
	case DRONE_MSG_CAMERA_SHARPNESS:
	case DRONE_MSG_CAMERA_SATURATION:
	case DRONE_MSG_CAMERA_BRIGHTNESS:
	case DRONE_MSG_CAMERA_PRIORITY:
	case DRONE_MSG_CAMERA_BACKLIGHT:
	case DRONE_MSG_CAMERA_NIGHT_MODE:
	case DRONE_MSG_CAMERA_PENETRATING_FOG:
	case DRONE_MSG_CAMERA_AF_AE:
	case DRONE_MSG_CAMERA_MODE_CTRL:
	case DRONE_MSG_CARMER_TRACKING_ON_OFF:
		/*指定变焦位置 data[3] : zoom position*/
	case DRONE_MSG_CARMER_ZOOM_POSITION:

		break;

	case DRONE_MSG_IDENTIFICATION:

		g_update_identification_procedure(data[3]);

	default:

		break;
	}
}

void g_parser_drone_packet(can_msg_t *can_msg)
{
	static uint8_t count = 0, len = 0, crc = 0;
	uint8_t i = 0;
	uint8_t data = 0;
	for (i = 0; i < can_msg->len; i++)
	{
		data = can_msg->data[i];
		switch (parser_stat)
		{
		case IDEL:
			count = 0;
			if (data == SEND_TO_DRONE_HEAD)
			{
				drone_data_buf[count++] = data;
				parser_stat = GET_HEAD;
			}
			else
			{
				parser_stat = IDEL;
			}
			break;

		case GET_HEAD:
			parser_stat = GET_TYPE;
			drone_data_buf[count++] = data;
			break;

		case GET_TYPE:
			len = data;
			drone_data_buf[count++] = data;
			parser_stat = GET_LEN;
			break;

		case GET_LEN:
			drone_data_buf[count++] = data;
			if (count > len)
			{
				parser_stat = GET_DATA;
			}
			break;

		case GET_DATA:
			crc = g_generate_crc(&(drone_data_buf[1]), len);
			if (crc == data)
			{
				g_handle_drone_instruction(drone_data_buf);
			}
			parser_stat = IDEL;
			break;

		default:
			break;
		}
	}
}

void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
	CAN_RxHeaderTypeDef Header;
	can_msg_t can_rx_msg;
	HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &Header, can_rx_msg.data);
	can_rx_msg.len = Header.DLC;
	can_rx_msg.StdID = Header.StdId;
	g_parser_drone_packet(&can_rx_msg);
}

void can_send_complete(CAN_HandleTypeDef *hcan)
{
	uint32_t mail_box;
	can_msg_t can_tx_msg;
	if (queue_pop(&can_msg_queue, &can_tx_msg) == 0)
	{

		drone_can_msg_head.DLC = can_tx_msg.len;
		HAL_CAN_AddTxMessage(&hcan1, &drone_can_msg_head, can_tx_msg.data,
				&mail_box);
	}
	else
	{
		can_busy_flag = RESET;
	}
}

void HAL_CAN_TxMailbox0CompleteCallback(CAN_HandleTypeDef *hcan)
{
	can_send_complete(hcan);
}

void HAL_CAN_TxMailbox1CompleteCallback(CAN_HandleTypeDef *hcan)
{
	can_send_complete(hcan);
}

void HAL_CAN_TxMailbox2CompleteCallback(CAN_HandleTypeDef *hcan)
{
	can_send_complete(hcan);
}

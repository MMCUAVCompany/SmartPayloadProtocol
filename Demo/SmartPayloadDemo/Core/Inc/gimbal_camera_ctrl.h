/*
 * gimbal_camera_ctrl.h
 *
 *  Created on: Mar 31, 2020
 *      Author: fu
 */

#ifndef INC_GIMBAL_CAMERA_CTRL_H_
#define INC_GIMBAL_CAMERA_CTRL_H_

/*
 * gimbal_camera_ctrl.c
 *
 *  Created on: Mar 31, 2020
 *      Author: fu
 */

void g_take_photo(int32_t altitude, uint32_t lat, uint32_t lon);
void g_record(uint8_t start_or_stop);
void g_control_zoom(uint8_t zoom);
void g_pitch_control(int8_t pitch_ctrl);
void g_yaw_control(int8_t yaw_ctrl);
void g_gimbal_mode(uint8_t mode);
void g_set_gimbal_pitch(float angle);
void g_set_gimbal_yaw(float angle);
#endif /* INC_GIMBAL_CAMERA_CTRL_H_ */

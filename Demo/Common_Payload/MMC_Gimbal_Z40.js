//CRC 校验表
var crc_table = new Array(
    0x00, 0x31, 0x62, 0x53, 0xc4, 0xf5, 0xa6, 0x97, 0xb9, 0x88, 0xdb, 0xea, 0x7d, 0x4c, 0x1f, 0x2e,
    0x43, 0x72, 0x21, 0x10, 0x87, 0xb6, 0xe5, 0xd4, 0xfa, 0xcb, 0x98, 0xa9, 0x3e, 0x0f, 0x5c, 0x6d,
    0x86, 0xb7, 0xe4, 0xd5, 0x42, 0x73, 0x20, 0x11, 0x3f, 0x0e, 0x5d, 0x6c, 0xfb, 0xca, 0x99, 0xa8,
    0xc5, 0xf4, 0xa7, 0x96, 0x01, 0x30, 0x63, 0x52, 0x7c, 0x4d, 0x1e, 0x2f, 0xb8, 0x89, 0xda, 0xeb,
    0x3d, 0x0c, 0x5f, 0x6e, 0xf9, 0xc8, 0x9b, 0xaa, 0x84, 0xb5, 0xe6, 0xd7, 0x40, 0x71, 0x22, 0x13,
    0x7e, 0x4f, 0x1c, 0x2d, 0xba, 0x8b, 0xd8, 0xe9, 0xc7, 0xf6, 0xa5, 0x94, 0x03, 0x32, 0x61, 0x50,
    0xbb, 0x8a, 0xd9, 0xe8, 0x7f, 0x4e, 0x1d, 0x2c, 0x02, 0x33, 0x60, 0x51, 0xc6, 0xf7, 0xa4, 0x95,
    0xf8, 0xc9, 0x9a, 0xab, 0x3c, 0x0d, 0x5e, 0x6f, 0x41, 0x70, 0x23, 0x12, 0x85, 0xb4, 0xe7, 0xd6,
    0x7a, 0x4b, 0x18, 0x29, 0xbe, 0x8f, 0xdc, 0xed, 0xc3, 0xf2, 0xa1, 0x90, 0x07, 0x36, 0x65, 0x54,
    0x39, 0x08, 0x5b, 0x6a, 0xfd, 0xcc, 0x9f, 0xae, 0x80, 0xb1, 0xe2, 0xd3, 0x44, 0x75, 0x26, 0x17,
    0xfc, 0xcd, 0x9e, 0xaf, 0x38, 0x09, 0x5a, 0x6b, 0x45, 0x74, 0x27, 0x16, 0x81, 0xb0, 0xe3, 0xd2,
    0xbf, 0x8e, 0xdd, 0xec, 0x7b, 0x4a, 0x19, 0x28, 0x06, 0x37, 0x64, 0x55, 0xc2, 0xf3, 0xa0, 0x91,
    0x47, 0x76, 0x25, 0x14, 0x83, 0xb2, 0xe1, 0xd0, 0xfe, 0xcf, 0x9c, 0xad, 0x3a, 0x0b, 0x58, 0x69,
    0x04, 0x35, 0x66, 0x57, 0xc0, 0xf1, 0xa2, 0x93, 0xbd, 0x8c, 0xdf, 0xee, 0x79, 0x48, 0x1b, 0x2a,
    0xc1, 0xf0, 0xa3, 0x92, 0x05, 0x34, 0x67, 0x56, 0x78, 0x49, 0x1a, 0x2b, 0xbc, 0x8d, 0xde, 0xef,
    0x82, 0xb3, 0xe0, 0xd1, 0x46, 0x77, 0x24, 0x15, 0x3b, 0x0a, 0x59, 0x68, 0xff, 0xce, 0x9d, 0xac
);

var control_speed = 3;
var cam_index = 0;
var altitude = 0;
var latitude = 0;
var longitude = 0;
var record_status = false;
var click_mode_status = 1;
var goteuler2msg = false;
var gotstatus2 = false;
var gotversion = false;
var pitch_move = false;
var yaw_move = false;
var gimbal_mode = 1;
var IAMODE = 0;

var backlight = false;
var defog = false;
var nightmode = false;

var photo_last = 0;
var record_last = 0;
var zoom_last = 0;
var gimbal_mode_last = 0;
var camera_mode_last = 0;
var f1_last = 0;
var f2_last = 0;
var f3_last = 0;
var f4_last = 0;


var pitch_last = 0;
var yaw_last = 0;

//crc校验字节生成函数
function cal_crc_table(array) {
    var crc = 0;
    var i = 1;
    var len = array[2];
    while (len--) {
        crc = crc_table[crc ^ array[i]];
        i++;
    }
    return crc;
}

var webSocket = new WebSocket("ws://127.0.0.1:1234");
webSocket.binaryType = 'arraybuffer';

webSocket.onopen = function() {
    document.getElementById("version").innerHTML = "0.0.0.0";

    webSocket.send("name:Common_Payload");
}

webSocket.onmessage = function(event) {
    var recv_buff = event.data;
    on_receive(recv_buff);

}


webSocket.onclose = function() {}




// 数据解析START------------------------------------------------------------------
var version;

function get_float_from_4byte(srcbuf) {
    var buffer = new ArrayBuffer(4);
    var byte = new Uint8Array(buffer);
    var float = new Float32Array(buffer);
    byte[0] = srcbuf[0];
    byte[1] = srcbuf[1];
    byte[2] = srcbuf[2];
    byte[3] = srcbuf[3];

    return Number(float);

}
/**
 * @brief  Traditional floating point numbers use 4 bytes to express, but in communication application we should 
 *         preserve bandwidth, so we use 2 byte to express a floating point number. this function can convert native
 *         float to "float16" whitch is a 2 byte floating point number.
 * @param  value: a traditional/native floating point number.
 * @retval the convert result witch is a "uint16_t" type 16-bits number.
 */
function g_convert_native_float_to_float16(value) {
    var buffer1 = new ArrayBuffer(4);
    var f32inf = new Uint32Array(buffer1);
    var f32inff = new Float32Array(buffer1);

    var buffer2 = new ArrayBuffer(4);
    var f16inf = new Uint32Array(buffer2);
    var f16inff = new Float32Array(buffer2);

    var buffer3 = new ArrayBuffer(4);
    var magic = new Uint32Array(buffer3);
    var magicf = new Float32Array(buffer3);

    var buffer4 = new ArrayBuffer(4);
    var _in = new Uint32Array(buffer4);
    var _inf = new Float32Array(buffer4);

    f32inf[0] = 255 << 23;
    f16inf[0] = 31 << 23;
    magic[0] = 15 << 23;
    const sign_mask = 0x80000000;
    const round_mask = ~0xFFF;

    _inf[0] = value;
    var sign = _in[0] & sign_mask;
    _in[0] ^= sign;

    var out = 0;

    if (_in[0] >= f32inf) {
        out = (_in[0] > f32inf) ? 0x7FFF : 0x7C00;
    } else {
        _in[0] &= round_mask;
        _inf[0] *= magicf[0];
        _in[0] -= round_mask;
        if (_in[0] > f16inf[0]) {
            _in[0] = f16inf[0];
        }
        out = _in[0] >> 13;
    }

    out |= (sign >> 16);

    return Number(out);
}

/**
 * @brief  Traditional floating point numbers use 4 bytes to express, but in communication application we should 
 *         preserve bandwidth, so we use 2 byte to express a floating point number. this function can convert
 *         "float16" whitch is a 2 byte floating point number to a native floating point number.
 * @param  value: a "uint16_t" type 16-bits number
 * @retval a traditional/native floating point number.
 */
function g_convert_float16_to_native_float(value) {
    var buffer1 = new ArrayBuffer(4);
    var magic = new Uint32Array(buffer1);
    var magicf = new Float32Array(buffer1);

    var buffer2 = new ArrayBuffer(4);
    var was_inf_nan = new Uint32Array(buffer2);
    var was_inf_nanf = new Float32Array(buffer2);

    var buffer3 = new ArrayBuffer(4);
    var out = new Uint32Array(buffer3);
    var outf = new Float32Array(buffer3);


    magic[0] = (254 - 15) << 23;
    was_inf_nan[0] = (127 + 16) << 23;

    out[0] = (value & 0x7FFF) << 13;
    outf[0] *= magicf[0];
    if (outf[0] >= was_inf_nanf[0]) {
        out[0] = 255 << 23;
    }
    out[0] |= (value & 0x8000) << 16;

    return Number(outf[0]);
}

function set_version(version_number) {
    var day = version_number & 0x1f;
    var month = (version_number >> 5) & 0xf;
    var year = (version_number >> 9) & 0x7f;
    var op = (version_number >> 16) & 0xff;
    var func = (version_number >> 24) & 0x3f;
    var hardware = (version_number >> 30) & 0x3;
    version = hardware + "." + func + "." + op + "." + year + month + day;
    document.getElementById("version").innerHTML = version;
}

function set_gimbal_mode(mode) {
    document.getElementById("lockMode").style.backgroundColor = "darkgray"
    document.getElementById("followMode").style.backgroundColor = "darkgray"
    document.getElementById("resetMode").style.backgroundColor = "darkgray"

    switch (mode) {
        case 0:
            document.getElementById("lockMode").style.backgroundColor = "lawngreen"
            break;
        case 1:
            document.getElementById("followMode").style.backgroundColor = "lawngreen"
            break;
        case 2:
            document.getElementById("resetMode").style.backgroundColor = "lawngreen"
            break;
    }
}

function set_camera_mode(mode) {
    document.getElementById("movieMode").style.backgroundColor = "darkgray"
    document.getElementById("photoMode").style.backgroundColor = "darkgray"

    switch (mode) {
        case 0:
            document.getElementById("movieMode").style.backgroundColor = "lawngreen"
            break;
        case 1:
            document.getElementById("photoMode").style.backgroundColor = "lawngreen"
            break;
    }
}

function set_click_mode(mode) {
    console.log("set click mode:" + mode)
    switch (mode) {
        case 1:
            document.getElementById("focusMode").style.backgroundColor = "darkgray"
            document.getElementById("moveMode").style.backgroundColor = "lawngreen"
            break;
        case 6:
            document.getElementById("focusMode").style.backgroundColor = "lawngreen"
            document.getElementById("moveMode").style.backgroundColor = "darkgray"

            break;
    }
}

function set_record_mode(mode) {
    switch (mode) {
        case 0:
            record_status = false;
            document.getElementById("recordStatus").src = "./ic_videocam_black_48dp.png"
            break;

        case 1:
            if (record_status == false) {
                var music = document.getElementById("record_audio");
                music.play();
            }
            record_status = true;
            document.getElementById("recordStatus").src = "./ic_play_circle_filled_black_48dp.png"
            break;
    }
}

function set_ia_mode(mode) {
    if (mode == 0) {
        document.getElementById("camera").style.backgroundColor = "dimgray";
        document.getElementById("AUTOMode").style.backgroundColor = "lawngreen";
        document.getElementById("MFMode").style.backgroundColor = "ghostwhite";

        document.getElementById("backlight").style.visibility = "hidden";
        document.getElementById("defog").style.visibility = "hidden";
        document.getElementById("nightmode").style.visibility = "hidden";

    } else {
        set_click_mode(1);
        document.getElementById("camera").style.backgroundColor = "ivory";
        document.getElementById("AUTOMode").style.backgroundColor = "ghostwhite";
        document.getElementById("MFMode").style.backgroundColor = "lawngreen";

        document.getElementById("backlight").style.visibility = "visible";
        document.getElementById("defog").style.visibility = "visible";
        document.getElementById("nightmode").style.visibility = "visible";

    }

}

function set_euler_angle(pitch, roll, yaw) {
    document.getElementById("pitchAngle").innerHTML = pitch.toFixed(2);
    document.getElementById("rollAngle").innerHTML = roll.toFixed(2);
    document.getElementById("yawAngle").innerHTML = yaw.toFixed(2);
}

function set_zoom_times(times) {
    document.getElementById("ZoomTimes").innerHTML = times;
}

function msg_key_status1(data) {
    //console.log("parser key status 1:" + data);
    if (!gotstatus2) {
        var buffer = new ArrayBuffer(4);
        var byte = new Uint8Array(buffer);
        var version_number = new Uint32Array(buffer);

        byte[0] = data[3];
        byte[1] = data[4];
        byte[2] = data[5];
        byte[3] = data[6];


        set_gimbal_mode(data[7] & 0x3);
        set_record_mode((data[7] >> 6) & 0x1);

        set_zoom_times(data[8]);
    }
}

function msg_key_status2(data) {
    //  console.log("parser key status 2:" + data);
    gotstatus2 = true;
    set_gimbal_mode(data[3] & 0x3);
    set_camera_mode((data[3] >> 2) & 0x1);
    set_record_mode((data[3] >> 3) & 0x1);
}

function msg_euler(data) {
    if (!goteuler2msg) {
        //console.log("parser euler 1:" + data);
        var pitch = get_float_from_4byte(data.slice(3, 7));
        var roll = get_float_from_4byte(data.slice(7, 11));
        var yaw = get_float_from_4byte(data.slice(11, 15));
        set_euler_angle(pitch, roll, yaw);
    }
}

function msg_photo_feedback(data) {
    var music = document.getElementById("take_photo_audio");
    music.play();
    var count = (data[4] << 8) | data[3];
    document.getElementById("photoCount").innerHTML = count;
}

function msg_zoom_info(data) {
    set_zoom_times(data[5]);
}

function msg_updata_time(data) {
    var realTime = new Date();
    var year = realTime.getFullYear();
    var month = realTime.getMonth() + 1;
    var day = realTime.getDate();
    var hour = realTime.getHours();
    var minute = realTime.getMinutes();

    var buff = new Array(0xA5, 0x13, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
    buff[3] = year & 0xff;
    buff[4] = (year >> 8) & 0xff;
    buff[5] = month;
    buff[6] = day;
    buff[7] = hour;
    buff[8] = minute;
    buff[9] = cal_crc_table(buff);
    webSocket.send(buff);
}

function msg_euler2(dataArray) {
    //console.log("euler2:" + dataArray)
    goteuler2msg = true;
    var pitch = g_convert_float16_to_native_float(dataArray[3] | (dataArray[4] << 8));
    var roll = g_convert_float16_to_native_float(dataArray[5] | (dataArray[6] << 8));
    var yaw = g_convert_float16_to_native_float(dataArray[7] | (dataArray[8] << 8));
    set_euler_angle(pitch, roll, yaw);
    //console.log(pitch + "  " + roll + "  " + yaw);
}

function msg_id(data) {
    console.log("msg_id")
    gotversion = true;
    var manufacturer = (data[4] << 8) | data[3];
    var type = (data[6] << 8) | data[5];
    var ID1 = (data[10] << 24) | (data[9] << 16) | (data[8] << 8) | data[7];
    var ID2 = (data[14] << 24) | (data[13] << 16) | (data[12] << 8) | data[11];
    var ID3 = (data[18] << 24) | (data[17] << 16) | (data[16] << 8) | data[15];
    var ID4 = (data[22] << 24) | (data[21] << 16) | (data[20] << 8) | data[19];
    var version = (data[26] << 24) | (data[25] << 16) | (data[24] << 8) | data[23];
    set_version(version);
}

function gcs_click_coordinates(data) {
    console.log("gcs_click_coordinates");
    var x = (data[4] << 8) | data[3];
    var y = (data[6] << 8) | data[5];
    move_or_focus_ctrl(x, y);

}

function msg_control_feedback(data) {
    var pitch_ctrl_status = data[3] & 0x03;
    var yaw_ctrl_status = data[3] & 0x0C;

    var nav = document.getElementById("navigation");

    if (data[3] === 5) {
        nav.style.backgroundColor = "lightgray";
    } else {
        nav.style.backgroundColor = "aqua";
    }

    if (pitch_move == false && pitch_ctrl_status != 0x01) {
        gimbal_pitch_ctrl(0);
    }

    if (yaw_move == false && gimbal_yaw_ctrl != 0x04) {
        gimbal_yaw_ctrl(0);
    }
}

function gcs_button_ctrl(data) {
    console.log("gcs_button_ctrl:" + data);
    var photo_updated = data[3];
    var record_updated = data[4];
    var zoom_updated = data[5];
    var gimbal_mode_updated = data[6];
    var camera_mode_updated = data[7];
    var f1_updated = data[8];
    var f2_updated = data[9];
    var f3_updated = data[10];
    var f4_updated = data[11];

    if (photo_last === 0 && photo_updated === 1) {
        take_photo();
    }

    if (record_last === 0 && record_updated === 1) {
        record();
    }

    if (zoom_last !== 0 && zoom_updated === 0) {
        zoom(0);
    } else if (zoom_last !== 1 && zoom_updated === 1) {
        zoom(1)
    } else if (zoom_last !== 2 && zoom_updated === 2) {
        zoom(2)
    }

    gimbal_mode = gimbal_mode_updated;
    gimbal_mode_ctrl(gimbal_mode);


    if (camera_mode_last === 0 && camera_mode_updated === 1) {
        camera_mode_ctrl(1);
    }


    photo_last = photo_updated;
    record_last = record_updated;
    zoom_last = zoom_updated;
    gimbal_mode_last = gimbal_mode_updated;
    camera_mode_last = camera_mode_updated;
    f1_last = f1_updated;
    f2_last = f2_updated;
    f3_last = f3_updated;
    f4_last = f4_updated;

}

function gcs_attitude_ctrl(data) {

    var pitch_updated = (data[4] << 8) | data[3];
    var yaw_updated = (data[6] << 8) | data[5];


    if (pitch_last !== pitch_updated) {
        if (pitch_updated > 1600 && pitch_updated < 2100) {
            gimbal_pitch_ctrl(1)
        }
        if (pitch_updated < 1400 && pitch_updated > 900) {
            gimbal_pitch_ctrl(-1);
        }
        if (pitch_updated >= 1400 && pitch_updated <= 1600) {
            gimbal_pitch_ctrl(0)
        }
    }
    if (yaw_last != yaw_updated) {
        if (yaw_updated > 1600 && yaw_updated < 2100) {
            gimbal_yaw_ctrl(-1)
        }
        if (yaw_updated < 1400 && yaw_updated > 900) {
            gimbal_yaw_ctrl(1);
        }
        if (yaw_updated >= 1400 && yaw_updated <= 1600) {
            gimbal_yaw_ctrl(0)
        }
    }

    pitch_last = pitch_updated;
    yaw_last = yaw_updated;
}

function gcs_pos_info(data) {
    altitude = (data[8] << 24) | (data[7] << 16) | (data[6] << 8) | data[5];
    latitude = (data[12] << 24) | (data[11] << 16) | (data[10] << 8) | data[9];
    longitude = (data[16] << 24) | (data[15] << 16) | (data[14] << 8) | data[13];
}

// 数据解析END--------------------------------------------------------------------

// 接收到数据，开始处理


function on_receive(buff) {
    var dataArray = new Uint8Array(buff);
    if (!gotversion) {
        get_version();
    }

    if (dataArray[0] === 0xA5 && cal_crc_table(dataArray) === dataArray[dataArray.length - 1]) {
        switch (dataArray[1]) {
            case 0x01:
                msg_key_status1(dataArray);
                break;
            case 0x02:
                msg_euler(dataArray);
                break;
            case 0x04:
                msg_photo_feedback(dataArray);
                break;
            case 0x05:
                msg_zoom_info(dataArray);
                break;
            case 0x0a:
                msg_control_feedback(dataArray);
                break;

            case 0x0b:
                msg_updata_time(dataArray);
                break;
            case 0x0c:
                msg_euler2(dataArray);
                break;
            case 0x0d:
                msg_key_status2(dataArray);
                break;
            case 0xff:
                msg_id(dataArray);
                break;
            case 0xf7:
                gcs_click_coordinates(dataArray);
                break;
            case 0xf8:
                gcs_button_ctrl(dataArray);
                break;
            case 0xf9:
                gcs_pos_info(dataArray);
                break;
            case 0xf6:
                gcs_attitude_ctrl(dataArray);
                break;

            case 0xfe:
                msg_id(dataArray);
                break;

            default:
                break;
        }
    }
}


function gimbal_mode_ctrl(mode) {
    console.log("gimbal_mode_ctrl:" + mode);
    var buff = new Array(0xA5, 0x08, 0x03, 0x00, 0x00);
    buff[3] = mode;
    buff[4] = cal_crc_table(buff);
    console.log("gimbal_mode_ctrl:" + buff);
    webSocket.send(buff);

    gimbal_mode = mode;
}

function gimbal_pitch_ctrl(speed) {
    var realspeed = ((speed * control_speed) >>> 0) & 0xff;
    console.log("gimbal_pitch_ctrl:" + realspeed);
    var buff = new Array(0xA5, 0x06, 0x03, 0x00, 0x00);
    buff[3] = realspeed;
    buff[4] = cal_crc_table(buff);
    console.log("gimbal_pitch_ctrl:" + buff);
    webSocket.send(buff);

    if (speed == 0) {
        pitch_move = false;
    } else {
        pitch_move = true;
    }
}

function gimbal_yaw_ctrl(speed) {
    var realspeed = ((speed * control_speed) >>> 0) & 0xff;
    console.log("gimbal_yaw_ctrl:" + realspeed);
    var buff = new Array(0xA5, 0x07, 0x03, 0x00, 0x00);
    buff[3] = realspeed;
    buff[4] = cal_crc_table(buff);
    console.log("gimbal_pitch_ctrl:" + buff);
    webSocket.send(buff);
    if (speed == 0) {
        yaw_move = false;
    } else {
        yaw_move = true;
    }
}

function gimbal_change_ctrl_speed(change_speed) {
    control_speed = change_speed;
    console.log("gimbal_change_ctrl_speed:" + change_speed);
}

function change_zoom_times(times) {
    var realspeed = ((speed * control_speed) >>> 0) & 0xff;
    console.log("gimbal_yaw_ctrl:" + realspeed);
    var buff = new Array(0xA5, 0x07, 0x03, 0x00, 0x00);
    buff[3] = realspeed;
    buff[4] = cal_crc_table(buff);
    console.log("gimbal_pitch_ctrl:" + buff);
    webSocket.send(buff);
}
/**
 * @brief  camera mode ctrl
 * @param  camera_mode: 0 movive 1 change  2 photo
 * @retval a traditional/native floating point number.
 */
function camera_mode_ctrl(camera_mode) {
    var buff = new Array(0xA5, 0x09, 0x03, 0x00, 0x00);
    buff[3] = camera_mode;
    buff[4] = cal_crc_table(buff);
    console.log("camera_mode_ctrl" + buff);
    webSocket.send(buff);
}

/**
 * 
 * @param {*} click_mode ： 1 for move ， 6 for focus 
 */
function click_mode_ctrl(click_mode) {
    console.log("click_mode_ctrl:" + click_mode);
    click_mode_status = click_mode;
    set_click_mode(click_mode);

    if (click_mode == 6) {
        ia_mode(0);
    }
}

/**
 * 
 * @param {*} ia_mode 0 for auto ， 1 for MF 
 */
function ia_mode(ia_mode) {
    var buff = new Array(0xA5, 0x16, 0x03, 0x00, 0x00);
    buff[3] = ia_mode;
    buff[4] = cal_crc_table(buff);
    console.log("ia_mode" + buff);
    webSocket.send(buff);

    IAMODE = ia_mode;
    set_ia_mode(IAMODE);
}


function take_photo() {
    console.log("take_photo");

    var buff = new Array(0xA5, 0x01, 16, /*index*/ 0x00, 0x00, /*altitude*/ 0x00, 0x00, 0x00, 0x00,
        /*latitude*/
        0x00, 0x00, 0x00, 0x00, /*longitude*/ 0x00, 0x00, 0x00, 0x00, 0x00);

    buff[5] = (altitude) & 0xff;
    buff[6] = (altitude >> 8) & 0xff;
    buff[7] = (altitude >> 16) & 0xff;
    buff[8] = (altitude >> 24) & 0xff;

    buff[9] = (latitude) & 0xff;
    buff[10] = (latitude >> 8) & 0xff;
    buff[11] = (latitude >> 16) & 0xff;
    buff[12] = (latitude >> 24) & 0xff;

    buff[13] = (longitude) & 0xff;
    buff[14] = (longitude >> 8) & 0xff;
    buff[15] = (longitude >> 16) & 0xff;
    buff[16] = (longitude >> 24) & 0xff;

    buff[17] = cal_crc_table(buff);
    console.log("buf:" + buff);
    webSocket.send(buff);

}

function record() {
    console.log("record");

    var buff = new Array(0xA5, 0x05, 0x03, 0x00, 0x00);
    if (record_status) {
        buff[3] = 0;
    } else {
        buff[3] = 2;
    }
    buff[4] = cal_crc_table(buff);
    console.log("buf:" + buff);
    webSocket.send(buff);
}

/**
 * @brief  zoom ctrl
 * @param  zoom_ctrl: 0 zoomout 1 zoomstop 2 zoomout
 * @retval a traditional/native floating point number.
 */
function zoom(zoom_ctrl) {
    console.log("zoom:" + zoom_ctrl);
    var buff = new Array(0xA5, 0x04, 0x03, 0x00, 0x00);
    buff[3] = (zoom_ctrl >>> 0) & 0xff;
    buff[4] = cal_crc_table(buff);
    console.log("buf:" + buff);
    webSocket.send(buff);

    if (zoom_ctrl == 1) {
        var input = document.getElementById("zoom");
        input.value = 1;
    }
}

function camerafocus(focus_ctrl) {
    console.log("focus:" + focus_ctrl);

    var buff = new Array(0xA5, 0x11, 0x04, 0x00, 0x00, 0x00);
    buff[3] = (focus_ctrl >>> 0) & 0xff;
    buff[5] = cal_crc_table(buff);
    console.log("buf:" + buff);
    webSocket.send(buff);

    if (focus_ctrl == 1) {
        var input = document.getElementById("camerafocus");
        input.value = 1;
    }
}

function change_zoom_times(times) {
    console.log("change_zoom_times:" + times);
    var buff = new Array(0xA5, 0x10, 0x03, 0x00, 0x00);
    buff[3] = (times >>> 0) & 0xff;
    buff[4] = cal_crc_table(buff);
    console.log("buf:" + buff);
    webSocket.send(buff);
}

function change_pitch_angle() {
    var angle = Number(document.getElementById("setPitchAngle").value);

    console.log("change_pitch_angle:" + typeof(angle) + "  " + angle);
    var buff = new Array(0xA5, 0x22, 0x04, 0x00, 0x00, 0x00);

    var uint16data = g_convert_native_float_to_float16(angle);

    buff[3] = (uint16data) & 0xff;
    buff[4] = (uint16data >> 8) & 0xff;
    buff[5] = cal_crc_table(buff);
    console.log("buf:" + buff);
    webSocket.send(buff);
}

function change_yaw_angle() {
    var angle = document.getElementById("setYawAngle").value;
    console.log("change_yaw_angle:" + typeof(angle) + "  " + angle);
    var buff = new Array(0xA5, 0x23, 0x04, 0x00, 0x00, 0x00);

    var uint16data = g_convert_native_float_to_float16(angle);

    buff[3] = (uint16data) & 0xff;
    buff[4] = (uint16data >> 8) & 0xff;
    buff[5] = cal_crc_table(buff);
    console.log("buf:" + buff);
    webSocket.send(buff);
}

function move_or_focus_ctrl(x, y) {
    console.log("move_or_focus_ctrl");
    var buff = new Array(0xA5, 0x0B, 11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);

    buff[3] = click_mode_status;
    buff[4] = (x) & 0xff;
    buff[5] = (x >> 8) & 0xff;
    buff[6] = (y) & 0xff;
    buff[7] = (y >> 8) & 0xff;
    buff[12] = cal_crc_table(buff);
    console.log("buf:" + buff);
    webSocket.send(buff);
}


function get_version() {
    console.log("getversion:");
    var buff = new Array(0xA5, 0xff, 0x03, 0x00, 0x00);

    buff[3] = 0;
    buff[4] = cal_crc_table(buff);
    webSocket.send(buff);
}
/**
 * 
 * @param {*} brightness -5 -4 -3 -2 -1 0 1 2 3 4 5
 */
function set_brightness(change) {
    if (IAMODE === 1) {
        var value = Number(change);
        console.log("brightness:" + typeof(value) + value);
        var buff = new Array(0xA5, 0x1c, 0x03, 0x00, 0x00);
        buff[3] = (value >>> 0) & 0xff;
        buff[4] = cal_crc_table(buff);
        console.log(buff);
        webSocket.send(buff);
    }
}

/**
 * 
 * @param {*} sharpness -5 -4 -3 -2 -1 0 1 2 3 4 5
 */
function set_sharpness(change) {
    if (IAMODE == 1) {
        var value = Number(change);
        console.log("Sharpness:" + typeof(value) + value);
        var buff = new Array(0xA5, 0x1A, 0x03, 0x00, 0x00);
        buff[3] = (value >>> 0) & 0xff;
        buff[4] = cal_crc_table(buff);
        console.log(buff);
        webSocket.send(buff);
    }
}

/**
 * 
 * @param {*} saturation -5 -4 -3 -2 -1 0 1 2 3 4 5
 */
function set_saturation(change) {
    if (IAMODE == 1) {
        var value = Number(change);
        console.log("Saturation:" + typeof(value) + value);
        var buff = new Array(0xA5, 0x1B, 0x03, 0x00, 0x00);
        buff[3] = (value >>> 0) & 0xff;
        buff[4] = cal_crc_table(buff);
        console.log(buff);
        webSocket.send(buff);
    }
}

/**
 * @param {*} shutter  0x01-0x12
 */
function set_shutter(change) {
    if (IAMODE == 1) {
        var value = Number(change);
        console.log("Shutter:" + typeof(value) + value);
        var buff = new Array(0xA5, 0x18, 0x03, 0x00, 0x00);
        buff[3] = (value >>> 0) & 0xff;
        buff[4] = cal_crc_table(buff);
        console.log(buff);
        webSocket.send(buff);
    }
}

/**
 * 
 * @param {*} IRIS 0x04-0x1d
 */
function set_IRIS(change) {
    if (IAMODE == 1) {
        var value = Number(change);
        console.log("IRIS:" + typeof(value) + value);
        var buff = new Array(0xA5, 0x17, 0x03, 0x00, 0x00);
        buff[3] = (value >>> 0) & 0xff;
        buff[4] = cal_crc_table(buff);
        console.log(buff);
        webSocket.send(buff);
    }
}

/**
 * 
 * @param {*} 0x01-0x12
 */
function set_WB(change) {
    if (IAMODE == 1) {
        var value = Number(change);
        console.log("WB:" + typeof(value) + value);
        var buff = new Array(0xA5, 0x19, 0x03, 0x00, 0x00);
        buff[3] = (value >>> 0) & 0xff;
        buff[4] = cal_crc_table(buff);
        console.log(buff);
        webSocket.send(buff);
    }
}
/**
 * 
 * @param {*} mode 0 for auto , 1 for IRIS first, 2 for shutter first.
 */
function set_ISO(mode) {
    if (IAMODE == 1) {
        console.log("ISO:" + Number(mode));
        var buff = new Array(0xA5, 0x1d, 0x03, 0x00, 0x00);
        buff[3] = Number(mode);
        buff[4] = cal_crc_table(buff);
        console.log(buff);
        webSocket.send(buff);
    }
}

function set_backlight() {
    backlight = !backlight;
    var buff = new Array(0xA5, 0x1E, 0x03, 0x00, 0x00);

    if (backlight) {
        buff[3] = 1;
        document.getElementById("backlight").style.backgroundColor = "lawngreen";
    } else {
        buff[3] = 0;
        document.getElementById("backlight").style.backgroundColor = "ghostwhite";
    }
    buff[4] = cal_crc_table(buff);
    console.log(buff);
    webSocket.send(buff);
}

function set_defog() {
    defog = !defog;
    var buff = new Array(0xA5, 0x20, 0x03, 0x00, 0x00);

    if (defog) {
        buff[3] = 1;
        document.getElementById("defog").style.backgroundColor = "lawngreen";
    } else {
        buff[3] = 0;
        document.getElementById("defog").style.backgroundColor = "ghostwhite";
    }
    buff[4] = cal_crc_table(buff);
    console.log(buff);
    webSocket.send(buff);
}

function set_nightmode() {
    nightmode = !nightmode;
    var buff = new Array(0xA5, 0x1f, 0x03, 0x00, 0x00);

    if (nightmode) {
        buff[3] = 1;
        document.getElementById("nightmode").style.backgroundColor = "lawngreen";
    } else {
        buff[3] = 0;
        document.getElementById("nightmode").style.backgroundColor = "ghostwhite";
    }
    buff[4] = cal_crc_table(buff);
    console.log(buff);
    webSocket.send(buff);
}

function Joystick(opt) {
    if (!opt.zone) return;
    var disabledColor = opt && opt.disabledColor || true;

    this.options = {
        mode: opt && opt.mode || 'static',
        size: opt && opt.size || 150,
        color: disabledColor ? 'ddd' : (opt && opt.color || '#eee'),
        position: opt && opt.position || {
            left: '50%',
            top: '70%'
        },
        zone: opt && opt.zone
    };

    this.distance = 0;
    this.angle = null;
    this.time = null;
}

Joystick.prototype.init = function() {
    var manager = nipplejs.create(this.options);
    this.manager = manager;
    this._on();
    return this;
}

Joystick.prototype._on = function() {
    var me = this;
    this.manager
        .on('start', function(evt, data) {
            me.time = setInterval(() => {
                me.onStart && me.onStart(me.distance, me.angle);
            }, 200);
        })
        .on('move', function(evt, data) {
            if (data.direction) {
                me.angle = data.direction.angle;
                me.distance = data.distance;
            }
        })
        .on('end', function(evt, data) {
            clearInterval(me.time);
            me.onEnd && me.onEnd();
        });
}

Joystick.prototype.onStart = function(distance, angle) {
    if (angle === "right") {
        gimbal_yaw_ctrl(-1);
    } else if (angle === "left") {
        gimbal_yaw_ctrl(1);
    } else if (angle === "up") {
        gimbal_pitch_ctrl(1);
    } else {
        gimbal_pitch_ctrl(-1);
    }
}

Joystick.prototype.onEnd = function(distance, angle) {
    console.log("end");
    gimbal_pitch_ctrl(0);
    gimbal_yaw_ctrl(0);
}

function select(val) {
    return document.querySelector(val);
}

new Joystick({
        zone: select('#navigation')
    })
    .init();

var zoomInput = document.getElementById("zoom");
zoomInput.addEventListener('touchend', function(event) {
    zoom(1);
    event.preventDefault(); //阻止click事件的执行
}, false);

var cameraInput = document.getElementById("camerafocus");
cameraInput.addEventListener('touchend', function(event) {
    camerafocus(1);
    event.preventDefault(); //阻止click事件的执行
}, false);
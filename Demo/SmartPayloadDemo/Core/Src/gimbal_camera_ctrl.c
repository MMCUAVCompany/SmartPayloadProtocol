/*
 * gimbal_camera_ctrl.c
 *
 *  Created on: Mar 31, 2020
 *      Author: fu
 */

/**
 * @brief  Control camera to take a photo.
 * @param  altitude: altitude of position in meters
 * @param  lat:  latitude*10^7 of position
 * @param  lon: longitude*10^7 of position
 * @retval none
 */

#include "stm32f4xx_hal.h"

void g_take_photo(int32_t altitude, uint32_t lat, uint32_t lon)
{

}

/**
 * @brief  Control camera to record.
 * @param  start_or_stop: start record or stop record
 *         This parameter can be one of the following values:
 *            @arg 0x01: start record
 *            @arg 0x00: stop record
 * @retval none
 */
void g_record(uint8_t start_or_stop)
{

}

/**
 * @brief  gimbal pitch ctrl.
 * @param  pitch_ctrl: ctrl value
 *         This parameter can be one of the following values:
 *            [-5,5].
 * @retval none
 */
void g_pitch_control(int8_t pitch_ctrl)
{

}

/**
 * @brief  gimbal yaw ctrl.
 * @param  yaw_ctrl: ctrl value
 *         This parameter can be one of the following values:
 *            [-5,5].
 * @retval none
 */
void g_yaw_control(int8_t yaw_ctrl)
{

}

/**
 * @brief  gimbal mode ctrl.
 * @param  mode:
 *         This parameter can be one of the following values:
 *            @arg 0x00: Lock
 *            @arg 0x01: Follow
 *            @arg 0x02: Reset Position
 * @retval none
 */
void g_gimbal_mode(uint8_t mode)
{

}

/**
 * @brief  set gimbal pitch angle.
 * @param  angle
 * @retval none
 */
void g_set_gimbal_pitch(float angle)
{

}

/**
 * @brief  set gimbal yaw angle.
 * @param  angle
 * @retval none
 */
void g_set_gimbal_yaw(float angle)
{

}

/**
 * @brief  camera zoom ctrl.
 * @param  zoom:
 *         This parameter can be one of the following values:
 *            @arg 0x00: zoom far
 *            @arg 0x01: zoom stop
 *            @arg 0x02: zoom near
 * @retval none
 */
void g_control_zoom(uint8_t zoom)
{

}

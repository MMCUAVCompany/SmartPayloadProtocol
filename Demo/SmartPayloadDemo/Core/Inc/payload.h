/*
 * payload.h
 *
 *  Created on: Mar 31, 2020
 *      Author: fu
 */

#ifndef INC_PAYLOAD_H_
#define INC_PAYLOAD_H_

#define DEVICE_ID 0x401

void g_payload_init(void);
void g_identification(void);
void send_can_msg_to_drone(void);
#endif /* INC_PAYLOAD_H_ */

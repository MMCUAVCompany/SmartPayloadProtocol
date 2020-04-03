/*
 * queue.h
 *
 *  Created on: Mar 31, 2020
 *      Author: fu
 */

#ifndef INC_QUEUE_H_
#define INC_QUEUE_H_

typedef struct
{
	uint32_t StdID;
	uint8_t len;
	uint8_t data[8];
} can_msg_t;

typedef can_msg_t queue_item_t;

typedef struct _node
{
	struct _node *front;
	struct _node *next;
	queue_item_t item;
} queue_node_t;

typedef struct
{
	queue_node_t *head;
	queue_node_t *tail;
	uint16_t queue_size;
} queue_t;

void g_o1heap_init(void);
void g_queue_init(queue_t *queue);
uint8_t queue_pop(queue_t *queue, queue_item_t *queue_item);
uint8_t queue_push(queue_t *queue, queue_item_t *queue_item);

#endif /* INC_QUEUE_H_ */

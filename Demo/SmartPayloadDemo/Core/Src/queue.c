/*
 * queue.c
 *
 *  Created on: Mar 31, 2020
 *      Author: fu
 */
#include "string.h"
#include "o1heap.h"
#include "assert.h"
#include "queue.h"

static O1HeapInstance *heap;
__attribute((aligned (O1HEAP_ALIGNMENT)))
         uint8_t mem[5120] =
{ 0 };
__attribute__ ((packed))

void g_o1heap_init(void)
{
	heap = o1heapInit(mem, 5120, NULL, NULL);
}

void g_queue_init(queue_t *queue)
{
	queue->head = NULL;
	queue->tail = NULL;
	queue->queue_size = 0;
}

uint8_t queue_pop(queue_t *queue, queue_item_t *queue_item)
{
	queue_node_t *node;
	if (queue->queue_size == 0 || queue_item == NULL || heap == NULL)
	{
		return -1;
	}

	node = queue->tail;

	if (queue->queue_size == 1)
	{
		queue->head = NULL;
		queue->tail = NULL;
	}
	else
	{
		queue->tail = node->front;
		queue->tail->next = NULL;
	}
	queue->queue_size--;

	memcpy(queue_item, &(node->item), sizeof(queue_item_t));
	o1heapFree(heap, node);

	return 0;
}

uint8_t queue_push(queue_t *queue, queue_item_t *queue_item)
{
	queue_node_t *node = NULL;
	if (queue_item == NULL || heap == NULL || queue == NULL)
	{
		return -1;
	}

	node = o1heapAllocate(heap, sizeof(queue_node_t));
	if (node == NULL)
	{
		return -2;
	}

	if (queue->queue_size > 0)
	{
		queue->head->front = node;
	}
	else
	{
		queue->tail = node;
	}
	node->next = queue->head;
	node->front = NULL;

	queue->head = node;
	queue->queue_size++;

	memcpy(&(node->item), queue_item, sizeof(queue_item_t));

	return 0;
}

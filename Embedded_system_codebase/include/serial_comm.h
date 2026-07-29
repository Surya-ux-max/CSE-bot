/**
 * @file serial_comm.h
 * @brief UART / RS232 Serial Driver with Ring Buffer Management
 */

#ifndef SERIAL_COMM_H
#define SERIAL_COMM_H

#include "config.h"
#include "protocol_parser.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint8_t buffer[SERIAL_RX_BUFFER_SIZE];
    volatile uint16_t head;
    volatile uint16_t tail;
    volatile uint16_t count;
} ring_buffer_t;

typedef struct {
    uint32_t baud_rate;
    bool is_open;
    ring_buffer_t rx_ring;
} serial_handle_t;

/**
 * @brief Initializes the serial interface at configured baud rate
 */
embedded_status_t serial_init(serial_handle_t *handle, uint32_t baud_rate);

/**
 * @brief Transmits raw bytes over serial interface
 */
embedded_status_t serial_write(serial_handle_t *handle, const uint8_t *data, uint16_t length);

/**
 * @brief Reads available bytes from RX ring buffer
 */
uint16_t serial_read(serial_handle_t *handle, uint8_t *buffer, uint16_t max_len);

/**
 * @brief Sends a protocol packet over serial bus
 */
embedded_status_t serial_send_packet(serial_handle_t *handle, message_id_t msg_id, const uint8_t *payload, uint8_t payload_len);

/**
 * @brief Simulates UART interrupt service routine (ISR) byte reception
 */
void serial_isr_rx_callback(serial_handle_t *handle, uint8_t rx_byte);

#ifdef __cplusplus
}
#endif

#endif /* SERIAL_COMM_H */

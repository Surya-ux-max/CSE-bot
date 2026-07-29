/**
 * @file serial_comm.c
 * @brief UART Serial Driver & Ring Buffer Implementation
 */

#include "../include/serial_comm.h"
#include <stdio.h>
#include <string.h>

embedded_status_t serial_init(serial_handle_t *handle, uint32_t baud_rate) {
    if (!handle) return EMBEDDED_ERR_PARAM;

    handle->baud_rate = baud_rate;
    handle->rx_ring.head = 0;
    handle->rx_ring.tail = 0;
    handle->rx_ring.count = 0;
    handle->is_open = true;

    printf("[UART DRIVER] Serial port initialized at %u baud.\n", baud_rate);
    return EMBEDDED_OK;
}

embedded_status_t serial_write(serial_handle_t *handle, const uint8_t *data, uint16_t length) {
    if (!handle || !handle->is_open || !data) return EMBEDDED_ERR_PARAM;

    printf("[UART TX] Transmitting %u raw bytes: ", length);
    for (uint16_t i = 0; i < length; i++) {
        printf("%02X ", data[i]);
    }
    printf("\n");
    return EMBEDDED_OK;
}

uint16_t serial_read(serial_handle_t *handle, uint8_t *buffer, uint16_t max_len) {
    if (!handle || !handle->is_open || !buffer || max_len == 0) return 0;

    uint16_t bytes_read = 0;
    while (handle->rx_ring.count > 0 && bytes_read < max_len) {
        buffer[bytes_read++] = handle->rx_ring.buffer[handle->rx_ring.tail];
        handle->rx_ring.tail = (handle->rx_ring.tail + 1) % SERIAL_RX_BUFFER_SIZE;
        handle->rx_ring.count--;
    }
    return bytes_read;
}

embedded_status_t serial_send_packet(serial_handle_t *handle, message_id_t msg_id, const uint8_t *payload, uint8_t payload_len) {
    packet_t packet;
    uint16_t total_len = 0;

    embedded_status_t status = protocol_pack(msg_id, payload, payload_len, &packet, &total_len);
    if (status != EMBEDDED_OK) {
        return status;
    }

    uint8_t tx_buf[sizeof(packet_t)];
    uint16_t crc_bytes_len = sizeof(packet_header_t) + payload_len;

    memcpy(tx_buf, &packet.header, sizeof(packet_header_t));
    if (payload_len > 0) {
        memcpy(tx_buf + sizeof(packet_header_t), packet.payload, payload_len);
    }
    tx_buf[crc_bytes_len] = (uint8_t)(packet.crc16 & 0xFF);
    tx_buf[crc_bytes_len + 1] = (uint8_t)((packet.crc16 >> 8) & 0xFF);

    return serial_write(handle, tx_buf, total_len);
}

void serial_isr_rx_callback(serial_handle_t *handle, uint8_t rx_byte) {
    if (!handle || handle->rx_ring.count >= SERIAL_RX_BUFFER_SIZE) {
        return; /* Overflow drop */
    }

    handle->rx_ring.buffer[handle->rx_ring.head] = rx_byte;
    handle->rx_ring.head = (handle->rx_ring.head + 1) % SERIAL_RX_BUFFER_SIZE;
    handle->rx_ring.count++;
}

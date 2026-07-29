/**
 * @file protocol_parser.c
 * @brief Binary Packet Framing & CRC-16 Implementation
 */

#include "../include/protocol_parser.h"
#include <string.h>

/**
 * @brief Standard CRC-16 CCITT polynomial (0x1021) lookup-free calculation
 */
uint16_t protocol_crc16(const uint8_t *data, uint16_t length) {
    uint16_t crc = 0xFFFF;
    for (uint16_t i = 0; i < length; i++) {
        crc ^= (uint16_t)data[i] << 8;
        for (uint8_t j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    return crc;
}

embedded_status_t protocol_pack(message_id_t msg_id, const uint8_t *payload, uint8_t payload_len, packet_t *out_packet, uint16_t *out_total_len) {
    if (!out_packet || !out_total_len) {
        return EMBEDDED_ERR_PARAM;
    }
    if (payload_len > PROTOCOL_MAX_PAYLOAD) {
        return EMBEDDED_ERR_OVERFLOW;
    }

    out_packet->header.header1 = PROTOCOL_MAGIC_HEADER_1;
    out_packet->header.header2 = PROTOCOL_MAGIC_HEADER_2;
    out_packet->header.msg_id = (uint8_t)msg_id;
    out_packet->header.payload_len = payload_len;

    if (payload && payload_len > 0) {
        memcpy(out_packet->payload, payload, payload_len);
    }

    /* Calculate CRC over header + payload */
    uint16_t crc_bytes_len = sizeof(packet_header_t) + payload_len;
    out_packet->crc16 = protocol_crc16((const uint8_t *)out_packet, crc_bytes_len);

    *out_total_len = crc_bytes_len + sizeof(uint16_t);
    return EMBEDDED_OK;
}

embedded_status_t protocol_unpack(const uint8_t *raw_buf, uint16_t raw_len, packet_t *out_packet) {
    if (!raw_buf || !out_packet) {
        return EMBEDDED_ERR_PARAM;
    }

    uint16_t min_packet_size = sizeof(packet_header_t) + sizeof(uint16_t);
    if (raw_len < min_packet_size) {
        return EMBEDDED_ERR_PARAM;
    }

    const packet_header_t *hdr = (const packet_header_t *)raw_buf;
    if (hdr->header1 != PROTOCOL_MAGIC_HEADER_1 || hdr->header2 != PROTOCOL_MAGIC_HEADER_2) {
        return EMBEDDED_ERR_PARAM;
    }

    if (hdr->payload_len > PROTOCOL_MAX_PAYLOAD) {
        return EMBEDDED_ERR_OVERFLOW;
    }

    uint16_t expected_total_len = sizeof(packet_header_t) + hdr->payload_len + sizeof(uint16_t);
    if (raw_len < expected_total_len) {
        return EMBEDDED_ERR_PARAM;
    }

    /* Verify CRC16 */
    uint16_t calc_crc = protocol_crc16(raw_buf, sizeof(packet_header_t) + hdr->payload_len);
    uint16_t recv_crc = (uint16_t)(raw_buf[expected_total_len - 2] | (raw_buf[expected_total_len - 1] << 8));

    if (calc_crc != recv_crc) {
        return EMBEDDED_ERR_CRC;
    }

    /* Copy valid packet to output */
    out_packet->header = *hdr;
    if (hdr->payload_len > 0) {
        memcpy(out_packet->payload, raw_buf + sizeof(packet_header_t), hdr->payload_len);
    }
    out_packet->crc16 = recv_crc;

    return EMBEDDED_OK;
}

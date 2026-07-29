/**
 * @file protocol_parser.h
 * @brief Binary Packet Framing & CRC Verification Protocol for Embedded Host <-> MCU
 */

#ifndef PROTOCOL_PARSER_H
#define PROTOCOL_PARSER_H

#include "config.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Message Identifier Codes */
typedef enum {
    MSG_ID_PING             = 0x01,
    MSG_ID_PONG             = 0x02,
    MSG_ID_GET_SENSOR_DATA  = 0x10,
    MSG_ID_SENSOR_DATA_RESP = 0x11,
    MSG_ID_SET_ACTUATOR     = 0x20,
    MSG_ID_ACTUATOR_RESP    = 0x21,
    MSG_ID_SYSTEM_ERROR     = 0xFF
} message_id_t;

/* Packed Binary Packet Header Structure */
#pragma pack(push, 1)
typedef struct {
    uint8_t header1;     /* Magic 0xAA */
    uint8_t header2;     /* Magic 0x55 */
    uint8_t msg_id;      /* message_id_t */
    uint8_t payload_len; /* Length of payload bytes */
} packet_header_t;

typedef struct {
    packet_header_t header;
    uint8_t payload[PROTOCOL_MAX_PAYLOAD];
    uint16_t crc16;      /* CRC-16 CCITT (0x1021) */
} packet_t;

/* Sensor Telemetry Payload Structure */
typedef struct {
    float temperature_c;
    float humidity_pct;
    float pressure_hpa;
    uint32_t uptime_ms;
} sensor_telemetry_payload_t;

/* Actuator Command Payload Structure */
typedef struct {
    uint8_t channel;
    uint8_t state_or_pwm; /* 0=OFF, 1=ON, or 0-255 PWM */
} actuator_command_payload_t;
#pragma pack(pop)

/**
 * @brief Computes CRC-16 CCITT over data buffer
 */
uint16_t protocol_crc16(const uint8_t *data, uint16_t length);

/**
 * @brief Packs data into a framed packet ready for serial transmission
 */
embedded_status_t protocol_pack(message_id_t msg_id, const uint8_t *payload, uint8_t payload_len, packet_t *out_packet, uint16_t *out_total_len);

/**
 * @brief Unpacks & verifies CRC-16 of incoming raw bytes into a packet structure
 */
embedded_status_t protocol_unpack(const uint8_t *raw_buf, uint16_t raw_len, packet_t *out_packet);

#ifdef __cplusplus
}
#endif

#endif /* PROTOCOL_PARSER_H */

/**
 * @file main.c
 * @brief Demonstration of Embedded Systems Hardware Communication Drivers
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "../include/config.h"
#include "../include/protocol_parser.h"
#include "../include/serial_comm.h"
#include "../include/i2c_driver.h"
#include "../include/spi_driver.h"

int main(void) {
    printf("=========================================================\n");
    printf("  EMBEDDED SYSTEMS HARDWARE COMMUNICATION FRAMEWORK  \n");
    printf("=========================================================\n\n");

    /* 1. Initialize Serial Communication (UART) */
    serial_handle_t uart_handle;
    serial_init(&uart_handle, DEFAULT_BAUD_RATE);

    /* 2. Initialize I2C Bus Master & Probe Sensor */
    i2c_handle_t i2c_handle;
    i2c_init(&i2c_handle, 1, I2C_DEFAULT_SPEED_HZ);
    uint8_t sensor_i2c_addr = 0x68; /* e.g. MPU6050 / BME280 */
    i2c_probe(&i2c_handle, sensor_i2c_addr);

    /* Read 6-byte sensor data register */
    uint8_t raw_sensor_buf[6];
    i2c_read_reg(&i2c_handle, sensor_i2c_addr, 0x3B, raw_sensor_buf, 6);

    /* 3. Initialize SPI Peripheral */
    spi_handle_t spi_handle;
    spi_init(&spi_handle, 1, SPI_DEFAULT_SPEED_HZ, SPI_MODE_0, 10);
    uint8_t spi_tx_buf[4] = {0x9F, 0x00, 0x00, 0x00}; /* Read JEDEC ID command */
    uint8_t spi_rx_buf[4] = {0};
    spi_transfer(&spi_handle, spi_tx_buf, spi_rx_buf, 4);

    printf("\n---------------------------------------------------------\n");
    printf("  PROTOCOL PACKET TRANSMISSION & CRC VERIFICATION TEST   \n");
    printf("---------------------------------------------------------\n");

    /* Construct Sensor Telemetry Payload */
    sensor_telemetry_payload_t telemetry = {
        .temperature_c = 26.5f,
        .humidity_pct = 62.4f,
        .pressure_hpa = 1013.25f,
        .uptime_ms = 14250
    };

    printf("\n[STEP 1] Packing Sensor Telemetry Data into Framed Packet...\n");
    serial_send_packet(&uart_handle, MSG_ID_SENSOR_DATA_RESP, (const uint8_t *)&telemetry, sizeof(telemetry));

    /* Simulate Raw Incoming Serial Stream Parsing */
    printf("\n[STEP 2] Simulating Incoming Packet Unpacking & CRC Check...\n");
    packet_t test_packet;
    uint16_t packet_len = 0;
    protocol_pack(MSG_ID_SET_ACTUATOR, (const uint8_t *)&(actuator_command_payload_t){ .channel = 1, .state_or_pwm = 128 }, sizeof(actuator_command_payload_t), &test_packet, &packet_len);

    uint8_t rx_stream[PROTOCOL_MAX_PAYLOAD + 10];
    memcpy(rx_stream, &test_packet.header, sizeof(packet_header_t));
    memcpy(rx_stream + sizeof(packet_header_t), test_packet.payload, test_packet.header.payload_len);
    rx_stream[packet_len - 2] = (uint8_t)(test_packet.crc16 & 0xFF);
    rx_stream[packet_len - 1] = (uint8_t)((test_packet.crc16 >> 8) & 0xFF);

    packet_t unpacked;
    embedded_status_t status = protocol_unpack(rx_stream, packet_len, &unpacked);

    if (status == EMBEDDED_OK) {
        printf("[PROTOCOL] Unpacked Packet SUCCESS! MSG ID: 0x%02X | Payload Len: %u | CRC16: 0x%04X\n",
               unpacked.header.msg_id, unpacked.header.payload_len, unpacked.crc16);
        if (unpacked.header.msg_id == MSG_ID_SET_ACTUATOR) {
            actuator_command_payload_t *act = (actuator_command_payload_t *)unpacked.payload;
            printf("[ACTUATOR] Executing Command -> Channel: %u | PWM/State: %u\n", act->channel, act->state_or_pwm);
        }
    } else {
        printf("[PROTOCOL ERROR] Unpacking failed with status code: %d\n", status);
    }

    printf("\n=========================================================\n");
    printf("  EMBEDDED COMMUNICATION DRIVER TEST COMPLETED  \n");
    printf("=========================================================\n");

    return 0;
}

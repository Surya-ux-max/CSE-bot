/**
 * @file config.h
 * @brief System configuration constants for Embedded Systems Communication Driver
 */

#ifndef EMBEDDED_CONFIG_H
#define EMBEDDED_CONFIG_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Serial Communication Configuration */
#define DEFAULT_BAUD_RATE       115200
#define SERIAL_TX_BUFFER_SIZE   256
#define SERIAL_RX_BUFFER_SIZE   256

/* Packet Protocol Constants */
#define PROTOCOL_MAGIC_HEADER_1 0xAA
#define PROTOCOL_MAGIC_HEADER_2 0x55
#define PROTOCOL_MAX_PAYLOAD    128

/* I2C Configuration */
#define I2C_DEFAULT_SPEED_HZ    400000 /* 400 kHz Fast Mode */
#define I2C_TIMEOUT_MS          100

/* SPI Configuration */
#define SPI_DEFAULT_SPEED_HZ    10000000 /* 10 MHz */

/* Return / Error Status Codes */
typedef enum {
    EMBEDDED_OK                 = 0,
    EMBEDDED_ERR_PARAM          = -1,
    EMBEDDED_ERR_TIMEOUT        = -2,
    EMBEDDED_ERR_CRC            = -3,
    EMBEDDED_ERR_OVERFLOW       = -4,
    EMBEDDED_ERR_BUSY           = -5,
    EMBEDDED_ERR_IO             = -6
} embedded_status_t;

#ifdef __cplusplus
}
#endif

#endif /* EMBEDDED_CONFIG_H */

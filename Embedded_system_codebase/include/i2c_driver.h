/**
 * @file i2c_driver.h
 * @brief Master I2C Peripheral Driver Interface
 */

#ifndef I2C_DRIVER_H
#define I2C_DRIVER_H

#include "config.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint8_t bus_id;
    uint32_t speed_hz;
    bool is_initialized;
} i2c_handle_t;

/**
 * @brief Initializes I2C Bus peripheral
 */
embedded_status_t i2c_init(i2c_handle_t *handle, uint8_t bus_id, uint32_t speed_hz);

/**
 * @brief Reads register bytes from target I2C slave device
 */
embedded_status_t i2c_read_reg(i2c_handle_t *handle, uint8_t device_addr, uint8_t reg_addr, uint8_t *data, uint16_t length);

/**
 * @brief Writes register bytes to target I2C slave device
 */
embedded_status_t i2c_write_reg(i2c_handle_t *handle, uint8_t device_addr, uint8_t reg_addr, const uint8_t *data, uint16_t length);

/**
 * @brief Probes targeting I2C address to check ACK response
 */
bool i2c_probe(i2c_handle_t *handle, uint8_t device_addr);

#ifdef __cplusplus
}
#endif

#endif /* I2C_DRIVER_H */

/**
 * @file i2c_driver.c
 * @brief Master I2C Peripheral Driver Implementation
 */

#include "../include/i2c_driver.h"
#include <stdio.h>

embedded_status_t i2c_init(i2c_handle_t *handle, uint8_t bus_id, uint32_t speed_hz) {
    if (!handle) return EMBEDDED_ERR_PARAM;

    handle->bus_id = bus_id;
    handle->speed_hz = speed_hz;
    handle->is_initialized = true;

    printf("[I2C DRIVER] Bus %u initialized at %u Hz.\n", bus_id, speed_hz);
    return EMBEDDED_OK;
}

embedded_status_t i2c_read_reg(i2c_handle_t *handle, uint8_t device_addr, uint8_t reg_addr, uint8_t *data, uint16_t length) {
    if (!handle || !handle->is_initialized || !data) return EMBEDDED_ERR_PARAM;

    printf("[I2C READ] Device 0x%02X | Reg 0x%02X | Reading %u bytes...\n", device_addr, reg_addr, length);
    
    /* Simulated Hardware Register Read */
    for (uint16_t i = 0; i < length; i++) {
        data[i] = (uint8_t)(reg_addr + i + 0x10);
    }
    return EMBEDDED_OK;
}

embedded_status_t i2c_write_reg(i2c_handle_t *handle, uint8_t device_addr, uint8_t reg_addr, const uint8_t *data, uint16_t length) {
    if (!handle || !handle->is_initialized || !data) return EMBEDDED_ERR_PARAM;

    printf("[I2C WRITE] Device 0x%02X | Reg 0x%02X | Writing %u bytes...\n", device_addr, reg_addr, length);
    return EMBEDDED_OK;
}

bool i2c_probe(i2c_handle_t *handle, uint8_t device_addr) {
    if (!handle || !handle->is_initialized) return false;

    printf("[I2C PROBE] Probing device address 0x%02X -> ACK Received.\n", device_addr);
    return true;
}

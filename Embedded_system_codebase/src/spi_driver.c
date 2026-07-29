/**
 * @file spi_driver.c
 * @brief Full Duplex SPI Master Peripheral Driver Implementation
 */

#include "../include/spi_driver.h"
#include <stdio.h>

embedded_status_t spi_init(spi_handle_t *handle, uint8_t spi_id, uint32_t speed_hz, spi_mode_t mode, uint8_t cs_pin) {
    if (!handle) return EMBEDDED_ERR_PARAM;

    handle->spi_id = spi_id;
    handle->speed_hz = speed_hz;
    handle->mode = mode;
    handle->cs_pin = cs_pin;
    handle->is_initialized = true;

    printf("[SPI DRIVER] SPI%u initialized | Clock %u Hz | Mode %u | CS Pin GPIO%u\n", spi_id, speed_hz, mode, cs_pin);
    return EMBEDDED_OK;
}

void spi_chip_select(spi_handle_t *handle, bool enable) {
    if (!handle || !handle->is_initialized) return;
    printf("[SPI GPIO] CS Pin GPIO%u -> %s\n", handle->cs_pin, enable ? "LOW (Active)" : "HIGH (Inactive)");
}

embedded_status_t spi_transfer(spi_handle_t *handle, const uint8_t *tx_data, uint8_t *rx_data, uint16_t length) {
    if (!handle || !handle->is_initialized) return EMBEDDED_ERR_PARAM;

    spi_chip_select(handle, true);

    printf("[SPI XFER] Transferring %u bytes: ", length);
    for (uint16_t i = 0; i < length; i++) {
        uint8_t tx_val = tx_data ? tx_data[i] : 0xFF;
        uint8_t rx_val = tx_val ^ 0xA5; /* Simulated echo SPI full duplex response */
        if (rx_data) rx_data[i] = rx_val;
        printf("[%02X->%02X] ", tx_val, rx_val);
    }
    printf("\n");

    spi_chip_select(handle, false);
    return EMBEDDED_OK;
}

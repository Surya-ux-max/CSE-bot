/**
 * @file spi_driver.h
 * @brief Full Duplex SPI Master Peripheral Driver Interface
 */

#ifndef SPI_DRIVER_H
#define SPI_DRIVER_H

#include "config.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    SPI_MODE_0 = 0, /* CPOL=0, CPHA=0 */
    SPI_MODE_1 = 1, /* CPOL=0, CPHA=1 */
    SPI_MODE_2 = 2, /* CPOL=1, CPHA=0 */
    SPI_MODE_3 = 3  /* CPOL=1, CPHA=1 */
} spi_mode_t;

typedef struct {
    uint8_t spi_id;
    uint32_t speed_hz;
    spi_mode_t mode;
    uint8_t cs_pin;
    bool is_initialized;
} spi_handle_t;

/**
 * @brief Initializes SPI Master peripheral
 */
embedded_status_t spi_init(spi_handle_t *handle, uint8_t spi_id, uint32_t speed_hz, spi_mode_t mode, uint8_t cs_pin);

/**
 * @brief Full duplex transfer: Sends tx_data while simultaneously reading rx_data
 */
embedded_status_t spi_transfer(spi_handle_t *handle, const uint8_t *tx_data, uint8_t *rx_data, uint16_t length);

/**
 * @brief Asserts or Deasserts Chip Select (CS) line
 */
void spi_chip_select(spi_handle_t *handle, bool enable);

#ifdef __cplusplus
}
#endif

#endif /* SPI_DRIVER_H */

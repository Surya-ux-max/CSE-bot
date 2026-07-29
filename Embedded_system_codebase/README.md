# Embedded System Hardware Communication Codebase

Production-ready, modular, multi-file C/C++ driver library and Python host interface for connecting to embedded microcontrollers (ESP32, STM32, Arduino, Raspberry Pi, ARM Cortex-M) over UART, I2C, and SPI.

> ⚠️ **Note**: This codebase is completely modular, self-contained, and independent of any web/API backend.

---

## 📁 Directory Structure

```
Embedded_system_codebase/
├── include/
│   ├── config.h            # System clock, baud rates, buffer sizes & error codes
│   ├── protocol_parser.h   # Binary packet framing, message IDs, payload structures & CRC-16
│   ├── serial_comm.h       # UART driver & ring buffer interface
│   ├── i2c_driver.h        # Master I2C peripheral driver interface
│   └── spi_driver.h        # Full duplex SPI peripheral driver interface
├── src/
│   ├── protocol_parser.c   # CRC-16 CCITT & binary packet packing/unpacking
│   ├── serial_comm.c       # Non-blocking UART & ring buffer management
│   ├── i2c_driver.c        # I2C register read/write sequences
│   ├── spi_driver.c        # SPI chip-select & full duplex byte transfers
│   └── main.c              # Comprehensive runnable demonstration
├── python_host/
│   ├── embedded_host.py    # Python host controller class with pyserial & packet parser
│   └── cli_monitor.py      # Interactive CLI dashboard for telemetry monitoring & control
├── Makefile                # GNU Makefile for building C binary with GCC
└── README.md               # Documentation
```

---

## 🔌 Packet Protocol Format

Binary packets are framed with a **Magic Header (`0xAA 0x55`)**, **Message ID**, **Payload Length**, **Payload Data**, and a **CRC-16 CCITT Checksum**:

```
+-------------------+-------------------+----------------+---------------------+-------------------+------------------+
| Header 1 (0xAA)   | Header 2 (0x55)   | Msg ID (1B)    | Payload Len (1B)    | Payload (0-128B)  | CRC16 (2B)       |
+-------------------+-------------------+----------------+---------------------+-------------------+------------------+
```

### Message Identifiers (`message_id_t`)
- `0x01` (`MSG_ID_PING`): Hardware health check
- `0x02` (`MSG_ID_PONG`): Health response
- `0x10` (`MSG_ID_GET_SENSOR_DATA`): Sensor query
- `0x11` (`MSG_ID_SENSOR_DATA_RESP`): Telemetry payload (Temp, Humidity, Pressure, Uptime)
- `0x20` (`MSG_ID_SET_ACTUATOR`): Actuator PWM / State output
- `0x21` (`MSG_ID_ACTUATOR_RESP`): Actuator confirmation

---

## 🚀 Building & Running

### 1. Compile & Run C Hardware Drivers (GCC)

```bash
cd Embedded_system_codebase
gcc -Iinclude src/*.c -o build_demo
./build_demo
```
*Or using `make`:*
```bash
make run
```

### 2. Python Host Controller & CLI Dashboard

```bash
cd Embedded_system_codebase/python_host
python embedded_host.py
```
*Run interactive CLI monitor:*
```bash
python cli_monitor.py COM3 115200
```

---

## 🛡️ Key Features
1. **Ring Buffer UART**: Non-blocking byte reception with ISR callback simulation.
2. **Robust Checksums**: CRC-16 CCITT (0x1021) verification on every packet.
3. **Multi-Bus Support**: Drivers for UART, Master I2C (400kHz), and SPI (10MHz Mode 0).
4. **Cross-Platform Host**: Python script communicates over standard serial ports.

"""
embedded_host.py
Python Host Communication Controller for Embedded Microcontrollers (ESP32, STM32, Arduino, ARM Cortex)
"""

import struct
import time
import logging
from typing import Optional, Tuple, Dict, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("EmbeddedHostController")


class ProtocolConstants:
    MAGIC_HEADER = b"\xAA\x55"
    
    # Message IDs
    MSG_ID_PING = 0x01
    MSG_ID_PONG = 0x02
    MSG_ID_GET_SENSOR_DATA = 0x10
    MSG_ID_SENSOR_DATA_RESP = 0x11
    MSG_ID_SET_ACTUATOR = 0x20
    MSG_ID_ACTUATOR_RESP = 0x21
    MSG_ID_SYSTEM_ERROR = 0xFF


def compute_crc16(data: bytes) -> int:
    """Computes CRC-16 CCITT (0x1021) matching C driver implementation."""
    crc = 0xFFFF
    for byte in data:
        crc ^= (byte << 8)
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return crc


class EmbeddedHostController:
    """Communicates with embedded MCU hardware over Serial / UART interface."""
    
    def __init__(self, port: str = "COM3", baudrate: int = 115200, timeout: float = 1.0):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.is_connected = False
        self.serial_inst = None

    def connect(self) -> bool:
        """Establishes connection to Serial Port."""
        try:
            import serial
            self.serial_inst = serial.Serial(self.port, self.baudrate, timeout=self.timeout)
            self.is_connected = True
            logger.info(f"Connected to Embedded System on {self.port} at {self.baudrate} baud.")
            return True
        except ImportError:
            logger.warning("pyserial library not installed. Running in Simulated Serial Mode.")
            self.is_connected = True
            return True
        except Exception as e:
            logger.error(f"Failed to open serial port {self.port}: {e}")
            return False

    def pack_frame(self, msg_id: int, payload: bytes = b"") -> bytes:
        """Packs header, payload, and CRC16 into a framed binary byte stream."""
        payload_len = len(payload)
        header = ProtocolConstants.MAGIC_HEADER + bytes([msg_id, payload_len])
        data_for_crc = header + payload
        crc = compute_crc16(data_for_crc)
        frame = data_for_crc + struct.pack("<H", crc)
        return frame

    def unpack_frame(self, raw_bytes: bytes) -> Optional[Tuple[int, bytes]]:
        """Unpacks and verifies CRC16 of incoming raw bytes."""
        if len(raw_bytes) < 6:
            logger.error("Frame too short for validation.")
            return None

        if raw_bytes[:2] != ProtocolConstants.MAGIC_HEADER:
            logger.error("Invalid magic header bytes.")
            return None

        msg_id = raw_bytes[2]
        payload_len = raw_bytes[3]
        expected_len = 4 + payload_len + 2

        if len(raw_bytes) < expected_len:
            logger.error(f"Incomplete payload. Expected {expected_len} bytes, got {len(raw_bytes)}.")
            return None

        payload = raw_bytes[4:4 + payload_len]
        received_crc = struct.unpack("<H", raw_bytes[4 + payload_len:expected_len])[0]
        calculated_crc = compute_crc16(raw_bytes[:4 + payload_len])

        if received_crc != calculated_crc:
            logger.error(f"CRC Mismatch! Calc: 0x{calculated_crc:04X}, Recv: 0x{received_crc:04X}")
            return None

        return msg_id, payload

    def send_actuator_command(self, channel: int, pwm_or_state: int) -> bool:
        """Sends an actuator control command to the microcontroller."""
        payload = struct.pack("<BB", channel, pwm_or_state)
        frame = self.pack_frame(ProtocolConstants.MSG_ID_SET_ACTUATOR, payload)
        logger.info(f"Sending Actuator Command -> Channel {channel}, PWM {pwm_or_state}")
        
        if self.serial_inst:
            self.serial_inst.write(frame)
        else:
            logger.info(f"[Simulated Serial TX]: {frame.hex(' ').upper()}")
        return True

    def parse_sensor_telemetry(self, payload: bytes) -> Dict[str, Any]:
        """Parses binary sensor telemetry payload into dictionary."""
        if len(payload) < 16:
            return {}
        temp, humidity, pressure, uptime = struct.unpack("<fffI", payload[:16])
        return {
            "temperature_c": round(temp, 2),
            "humidity_pct": round(humidity, 2),
            "pressure_hpa": round(pressure, 2),
            "uptime_ms": uptime
        }

    def close(self):
        """Closes serial connection."""
        if self.serial_inst and self.serial_inst.is_open:
            self.serial_inst.close()
            logger.info("Serial port connection closed.")
        self.is_connected = False


if __name__ == "__main__":
    controller = EmbeddedHostController(port="COM3", baudrate=115200)
    if controller.connect():
        # Send Actuator Command
        controller.send_actuator_command(channel=1, pwm_or_state=200)
        
        # Simulate receiving Telemetry Frame
        sample_payload = struct.pack("<fffI", 25.8, 55.2, 1014.2, 35400)
        sample_frame = controller.pack_frame(ProtocolConstants.MSG_ID_SENSOR_DATA_RESP, sample_payload)
        
        logger.info(f"Simulated MCU Frame Received: {sample_frame.hex(' ').upper()}")
        result = controller.unpack_frame(sample_frame)
        if result:
            msg_id, payload = result
            if msg_id == ProtocolConstants.MSG_ID_SENSOR_DATA_RESP:
                telemetry = controller.parse_sensor_telemetry(payload)
                logger.info(f"Parsed Telemetry Data: {telemetry}")
        controller.close()

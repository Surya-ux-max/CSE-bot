"""
cli_monitor.py
Interactive CLI Hardware Dashboard for Embedded System Telemetry & Control
"""

import sys
import time
from embedded_host import EmbeddedHostController, ProtocolConstants

def print_banner():
    print("=========================================================")
    print("  EMBEDDED SYSTEM HARDWARE INTERACTIVE CLI DASHBOARD    ")
    print("=========================================================")
    print("Commands:")
    print("  [1] Send Ping Request to Microcontroller")
    print("  [2] Read Telemetry Sensors (Temp, Humidity, Pressure)")
    print("  [3] Set Actuator State / PWM Output")
    print("  [4] Exit Dashboard")
    print("---------------------------------------------------------")

def main():
    port = sys.argv[1] if len(sys.argv) > 1 else "COM3"
    baud = int(sys.argv[2]) if len(sys.argv) > 2 else 115200

    controller = EmbeddedHostController(port=port, baudrate=baud)
    if not controller.connect():
        print(f"Error: Could not connect to hardware on {port}.")
        return

    try:
        while True:
            print_banner()
            choice = input("Enter choice (1-4): ").strip()
            
            if choice == '1':
                frame = controller.pack_frame(ProtocolConstants.MSG_ID_PING)
                print(f"[TX PING] Frame: {frame.hex(' ').upper()}")
                print("✓ Ping command transmitted successfully.")
            elif choice == '2':
                frame = controller.pack_frame(ProtocolConstants.MSG_ID_GET_SENSOR_DATA)
                print(f"[TX GET_SENSORS] Frame: {frame.hex(' ').upper()}")
                print("✓ Telemetry request transmitted.")
            elif choice == '3':
                try:
                    ch = int(input("Enter Channel (0-7): "))
                    val = int(input("Enter Value (0-255): "))
                    controller.send_actuator_command(ch, val)
                except ValueError:
                    print("Invalid input numbers.")
            elif choice == '4':
                print("Exiting CLI Dashboard...")
                break
            else:
                print("Invalid selection.")
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nTerminated by user.")
    finally:
        controller.close()

if __name__ == "__main__":
    main()

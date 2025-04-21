import socket
import json
import time
import argparse

class OSCClient:
    def __init__(self, host="127.0.0.1", port=12000):
        self.host = host
        self.port = port
        self.client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        print(f"OSC Client initialized: {host}:{port}")

    def send_osc(self, address, *args):
        """Send an OSC message"""
        message = json.dumps({"address": address, "args": args})
        self.client.sendto(message.encode(), (self.host, self.port))
        print(f"Sent OSC message: {address} {args}")

    def start_recording(self):
        """Start speech recording"""
        self.send_osc("/startRecording")

    def stop_recording(self):
        """Stop speech recording"""
        self.send_osc("/stopRecording")

    def close(self):
        """Close the socket connection"""
        self.client.close()

def main():
    parser = argparse.ArgumentParser(description='OSC Client for Speech to Text')
    parser.add_argument('--host', default='127.0.0.1', help='OSC server host')
    parser.add_argument('--port', type=int, default=12000, help='OSC server port')
    args = parser.parse_args()

    client = OSCClient(args.host, args.port)

    try:
        while True:
            print("\nCommands:")
            print("1. Start recording")
            print("2. Stop recording")
            print("3. Exit")
            
            choice = input("Enter your choice (1-3): ")
            
            if choice == "1":
                client.start_recording()
            elif choice == "2":
                client.stop_recording()
            elif choice == "3":
                break
            else:
                print("Invalid choice. Please try again.")
            
            time.sleep(0.1)  # Small delay to prevent CPU overuse

    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        client.close()

if __name__ == "__main__":
    main() 
import time
from pythonosc import udp_client
from pythonosc import dispatcher
from pythonosc import osc_server
import threading

# Server configuration
SERVER_IP = "127.0.0.1"  # Change this to your server's IP
SERVER_PORT = 57120
CLIENT_PORT = 57121

# Create OSC client for sending messages
client = udp_client.SimpleUDPClient(SERVER_IP, SERVER_PORT)

# Create dispatcher for handling incoming messages
dispatcher = dispatcher.Dispatcher()

# Message handlers
def handle_connected(unused_addr, args):
    print(f"Connected to server: {args}")

def handle_recording_status(unused_addr, args):
    print(f"Recording status: {args}")

def handle_transcription(unused_addr, args):
    print(f"Transcription: {args}")

# Register message handlers
dispatcher.map("/connected", handle_connected)
dispatcher.map("/recordingStatus", handle_recording_status)
dispatcher.map("/transcription", handle_transcription)

# Create OSC server for receiving messages
server = osc_server.ThreadingOSCUDPServer(("0.0.0.0", CLIENT_PORT), dispatcher)
print(f"Listening on port {CLIENT_PORT}")

# Start server in a separate thread
server_thread = threading.Thread(target=server.serve_forever)
server_thread.daemon = True
server_thread.start()

def connect():
    """Connect to the server"""
    print("Connecting to server...")
    client.send_message("/connect", 1)

def start_recording():
    """Start recording"""
    print("Starting recording...")
    client.send_message("/startRecording", 1)

def stop_recording():
    """Stop recording"""
    print("Stopping recording...")
    client.send_message("/stopRecording", 1)

# Example usage
if __name__ == "__main__":
    try:
        # Connect to server
        connect()
        time.sleep(1)  # Wait for connection confirmation

        # Start recording
        start_recording()
        time.sleep(5)  # Record for 5 seconds

        # Stop recording
        stop_recording()

        # Keep the program running to receive messages
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nExiting...")
        server.shutdown() 
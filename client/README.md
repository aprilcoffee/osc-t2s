# OSC Text to Speech Client Examples

This folder contains example clients that can be used to test the OSC Text to Speech server.

## Python OSC Receiver

A simple Python script that listens for OSC messages and prints them to the console.

### Requirements

- Python 3.x
- python-osc library

### Installation

```bash
pip install python-osc
```

### Usage

```bash
python osc_receiver.py --ip 127.0.0.1 --port 57120
```

This will start an OSC receiver that listens on the specified IP address and port. The default is 127.0.0.1:57120.

## Web OSC Receiver

A simple HTML page with JavaScript that can receive OSC messages via WebSocket.

### Usage

1. Open the `osc_receiver.html` file in a web browser
2. Enter the WebSocket server URL (default: ws://localhost:8080)
3. Enter the OSC address and port you want to receive messages on
4. Click "Connect" to connect to the WebSocket server
5. Messages will appear in the messages area

## Testing the System

To test the entire system:

1. Start the WebSocket server:
   ```bash
   node ../server.js
   ```

2. Start the Python OSC receiver:
   ```bash
   python osc_receiver.py
   ```

3. Open the web interface (index.html) in a browser and start recording

4. Open the web OSC receiver (osc_receiver.html) in another browser window

5. You should see the OSC messages appear in both the Python console and the web receiver

## Notes

- The Python receiver is useful for debugging and testing with other OSC applications
- The web receiver is useful for testing the WebSocket server directly
- Both clients can be used simultaneously to verify that messages are being properly forwarded 
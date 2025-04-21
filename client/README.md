# OSC Client Examples

This directory contains example clients for interacting with the Speech to OSC bridge in different programming languages and environments.

## Python Client

Located in `python/osc_client.py`

A command-line Python client that allows you to control speech recording via OSC messages.

### Requirements
- Python 3.6 or higher
- No additional dependencies required

### Usage
```bash
# Basic usage with default settings
python osc_client.py

# Specify custom host and port
python osc_client.py --host 192.168.1.100 --port 12000
```

## JavaScript Client

Located in `javascript/osc_client.js`

A Node.js client that uses WebSocket to communicate with the OSC bridge.

### Requirements
- Node.js 12 or higher
- WebSocket package (`npm install ws`)

### Usage
```bash
# Install dependencies
npm install

# Run the example
node osc_client.js
```

## Max/MSP Patch

Located in `max/osc_client.maxpat`

A Max/MSP patch that demonstrates how to send and receive OSC messages.

### Features
- UDP receive on port 12000
- UDP send to localhost:12000
- Buttons for starting and stopping recording
- Message routing and printing

### Usage
1. Open the patch in Max/MSP
2. Click the buttons to start/stop recording
3. Watch the console for incoming messages

## OSC Message Format

All clients use the following OSC message format:

### Start Recording
```
/startRecording
```

### Stop Recording
```
/stopRecording
```

### Speech Results
```
/speech "transcribed text"
```

## Connection Information

- OSC Server Port: 12000
- WebSocket Server: ws://localhost:8081
- Default Host: 127.0.0.1

## Notes

- The Python and JavaScript clients include error handling and connection management
- The Max/MSP patch provides a visual interface for testing
- All clients are compatible with the main Speech to OSC bridge
- Make sure the bridge is running before testing the clients 
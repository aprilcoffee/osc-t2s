# OSC Client Examples

This directory contains example clients for connecting to the OSC server using different programming languages and platforms.

## Python Example

The Python example uses the `python-osc` library.

### Setup
1. Install the required package:
```bash
pip install python-osc
```

2. Run the example:
```bash
python python/osc_client.py
```

## p5.js Example

The p5.js example uses the `osc.js` library and provides a visual interface for controlling the server.

### Setup
1. Open `p5js/index.html` in a web browser
2. The example includes:
   - Connection status display
   - Recording controls
   - Transcription display

## Node.js Example

The Node.js example uses the `osc` package and provides a command-line interface.

### Setup
1. Navigate to the nodejs directory:
```bash
cd nodejs
```

2. Install dependencies:
```bash
npm install
```

3. Run the example:
```bash
npm start
```

## Max/MSP Example

The Max/MSP example is in the `max` directory. Open the patch in Max/MSP to use it.

## TouchDesigner Example

The TouchDesigner example is in the `touchdesigner` directory. Open the project in TouchDesigner to use it.

## Common Features

All examples demonstrate:
- Connecting to the server
- Starting and stopping recording
- Receiving transcription results
- Handling connection status

## Configuration

Before running any example, make sure to:
1. Update the server IP address to match your server
2. Ensure the server is running
3. Check that the ports (57120 and 57121) are available

## Message Format

All examples use the following OSC messages:

### Sending Messages
- `/connect` - Connect to the server
- `/startRecording` - Start recording
- `/stopRecording` - Stop recording

### Receiving Messages
- `/connected` - Connection status
- `/recordingStatus` - Recording status
- `/transcription` - Transcription results 
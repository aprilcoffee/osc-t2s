# OSC Text to Speech

A web application that records audio, transcribes it using the Whisper API, and sends the results via OSC messages.

## Features

- Audio recording with start/stop controls
- Whisper API integration for speech-to-text
- OSC communication for:
  - Start recording signal
  - Stop recording signal
  - Transcribed text output
- Configurable OSC address and port
- Simple and intuitive user interface
- WebSocket server for external access
- Example clients for testing

## Setup

### 1. WebSocket Server Setup

1. Install Node.js if you haven't already
2. Install server dependencies:
```bash
npm install
```

3. Start the WebSocket server:
```bash
npm start
```

The server will run on port 8080 by default and will be accessible from other devices on your network.

### 2. Web Application Setup

There are two ways to run the web application:

#### Method 1: Using npm (recommended for external access)
```bash
npm run serve
```

This will start a web server on port 8000 that is accessible from other devices on your network.

#### Method 2: Using Python's built-in HTTP server
1. Open a terminal in the project directory
2. Run one of these commands:
   - Python 3: `python -m http.server 8000`
   - Python 2: `python -m SimpleHTTPServer 8000`
3. Open your browser and navigate to `http://localhost:8000`

#### Method 3: Using any web server
Simply place the files in your web server's directory and access them through your browser.

### 3. Running Both Server and Web Interface

To run both the WebSocket server and web interface with a single command:

```bash
npm run dev
```

This will start both servers concurrently, making the entire application accessible from other devices.

### 4. External Access

To allow external access:

1. Make sure your server's firewall allows connections on ports 8000 (web) and 8080 (WebSocket)
2. Configure your router to forward these ports if needed
3. External users should connect using your server's public IP or domain name:
   - Web interface: `http://your-server-ip:8000`
   - WebSocket server: `ws://your-server-ip:8080`

When you start the server, it will display the IP address and ports that can be used to access it from other devices.

### 5. Testing with Example Clients

The `client` folder contains example clients that can be used to test the system:

#### Python OSC Receiver
```bash
cd client
pip install python-osc
python osc_receiver.py
```

#### Web OSC Receiver
Open `client/osc_receiver.html` in a web browser.

See the [client README](client/README.md) for more details.

## Usage

1. Enter your Whisper API key in the provided input field
2. Enter the WebSocket server URL (default: ws://localhost:8080)
3. (Optional) Modify the OSC address and port if needed
4. Click "Start Recording" to begin capturing audio
5. Click "Stop Recording" to end the recording and process the audio
6. The transcribed text will appear in the output area and be sent via OSC

## OSC Messages

The application sends the following OSC messages:

- `/startRecording` - Sent when recording starts
- `/stopRecording` - Sent when recording stops
- `/text` - Contains the transcribed text from Whisper API

## Requirements

- Modern web browser with JavaScript enabled
- Whisper API key
- OSC receiver application (for receiving the messages)
- Node.js (for the WebSocket server)

## Notes

- The application uses p5.js for audio handling
- Make sure your browser has permission to access the microphone
- The Whisper API key is required for transcription functionality
- The WebSocket server must be running for OSC communication to work 
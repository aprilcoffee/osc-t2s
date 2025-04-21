# OSC Text to Speech

A simple local application that records audio, transcribes it using the Whisper API, and sends the results via OSC messages.

## Features

- Audio recording with start/stop controls
- Whisper API integration for speech-to-text
- OSC communication for:
  - Start recording signal
  - Stop recording signal
  - Transcribed text output
- Simple and intuitive user interface
- Local WebSocket server for OSC communication

## Quick Start

### Method 1: Using Node.js (Recommended)

1. **Install Node.js** if you haven't already (from [nodejs.org](https://nodejs.org/))

2. **Clone or download this repository**

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:8000
   ```

### Method 2: Using Python's Built-in HTTP Server

1. **Install Python** if you haven't already (from [python.org](https://python.org))

2. **Clone or download this repository**

3. **Start the WebSocket server** (requires Node.js):
   ```bash
   npm install
   npm start
   ```

4. **In a separate terminal, start the web server** using Python:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:8000
   ```

### Method 3: Using Any Web Server

1. **Start the WebSocket server** (requires Node.js):
   ```bash
   npm install
   npm start
   ```

2. **Copy the web files** to any web server:
   - index.html
   - sketch.js
   - Any other web assets

3. **Access the application** through your web server

### Method 4: Using a Pre-built Executable (Coming Soon)

A standalone executable version is planned for future releases, which will eliminate the need for Node.js installation.

## Usage

1. Enter your Whisper API key in the provided input field
2. Click "Start Recording" to begin capturing audio
3. Click "Stop Recording" to end the recording and process the audio
4. The transcribed text will appear in the output area and be sent via OSC

## Advanced Settings

Click "Show Advanced Settings" to configure:
- WebSocket server URL (default: ws://localhost:8080)
- OSC address (default: 127.0.0.1)
- OSC port (default: 57120)

## OSC Messages

The application sends the following OSC messages:

- `/startRecording` - Sent when recording starts
- `/stopRecording` - Sent when recording stops
- `/text` - Contains the transcribed text from Whisper API

## Requirements

- Node.js
- Modern web browser with JavaScript enabled
- Whisper API key
- OSC receiver application (for receiving the messages)

## Troubleshooting

### npm Installation Issues

If `npm install` gets stuck or fails:

1. Cancel the process (Ctrl+C) and try:
   ```bash
   npm cache clean --force
   npm install --no-package-lock
   ```

2. If that doesn't work, try using yarn:
   ```bash
   npm install -g yarn
   yarn
   ```

### WebSocket Connection Issues

If you see "Upgrade Required" when accessing the WebSocket server directly in a browser:
- Don't access the WebSocket server (port 8080) directly in a browser
- Access the web interface at http://localhost:8000 instead
- The web interface will automatically connect to the WebSocket server 
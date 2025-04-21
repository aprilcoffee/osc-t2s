# Speech to OSC

A web application that converts speech to OSC messages, allowing you to control OSC-compatible applications with your voice.

## Features

- Speech recognition using the Web Speech API
- Support for both Google Cloud Speech Recognition and Whisper API
- OSC message sending for transcriptions
- OSC message receiving for remote control (start/stop recording)
- Simple and intuitive user interface
- Works in modern browsers (Chrome recommended)

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- A modern web browser (Chrome recommended)

### Setup

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yourusername/osc-t2s.git
   cd osc-t2s
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Method 1: Using Node.js (Recommended)

1. Start the server:
   ```bash
   npm start
   ```
   This runs the Node.js server that serves the web application and handles WebSocket connections.

2. Open your browser and navigate to:
   ```
   http://localhost:9527
   ```

### Method 2: Using Python's Built-in HTTP Server

If you don't want to install Node.js, you can use Python's built-in HTTP server, but you'll still need to run the Node.js server for WebSocket and OSC functionality:

1. Start the Node.js server in one terminal:
   ```bash
   npm start
   ```

2. Start the Python HTTP server in another terminal:
   ```bash
   # Python 3
   python -m http.server 9527
   
   # Python 2
   python -m SimpleHTTPServer 9527
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:9527
   ```

## Usage

1. Open the application in your browser
2. Enter your API key (Google Cloud or Whisper)
3. Configure OSC settings (address and port)
4. Click "Start Recording" and speak
5. Your speech will be converted to text and sent as OSC messages

## OSC Settings

- **OSC Address**: The IP address of the OSC server to send transcriptions to (default: 127.0.0.1)
- **OSC Port**: The port number of the OSC server to send transcriptions to (default: 57120)
- **OSC Receive Port**: The port number for receiving OSC commands (default: 12000)

## OSC Messages

### Sending (Transcriptions)
- `/transcription` - Contains the transcribed text from speech recognition

### Receiving (Commands)
- `/startRecording` - Starts the recording process
- `/stopRecording` - Stops the recording process

## API Options

### Google Cloud Speech Recognition

- Free tier available with limited usage
- Good for general speech recognition
- Requires a Google Cloud API key

### Whisper API

- More accurate transcription
- Supports multiple languages
- Requires an OpenAI API key

## Troubleshooting

### Speech Recognition Issues

- Make sure you're using a modern browser (Chrome recommended)
- Check that your microphone is properly connected and working
- Ensure you have granted microphone access to the website

### OSC Connection Issues

- Verify that the OSC server is running and accessible
- Check that the OSC address and port are correct
- Make sure your firewall isn't blocking the connection
- For receiving OSC commands, ensure port 12000 is open and accessible

### Server Issues

- If you see "Connection refused" errors, make sure the Node.js server is running
- If you see WebSocket errors, check that the server.js file is running correctly
- If you're using the Python HTTP server method, ensure both servers are running

## Credits

This project uses the following libraries:

- [p5.js](https://p5js.org/) - A JavaScript library for creative coding
- [p5js-osc](https://github.com/genekogan/p5js-osc) by [Gene Kogan](https://github.com/genekogan) - OSC library for p5.js
- [osc.js](https://github.com/colinbdclark/osc.js) - A JavaScript implementation of the Open Sound Control protocol

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
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

## Setup

There are two ways to run the application:

### Method 1: Using Python's built-in HTTP server
1. Open a terminal in the project directory
2. Run one of these commands:
   - Python 3: `python -m http.server 8000`
   - Python 2: `python -m SimpleHTTPServer 8000`
3. Open your browser and navigate to `http://localhost:8000`

### Method 2: Using any web server
Simply place the files in your web server's directory and access them through your browser.

## Usage

1. Enter your Whisper API key in the provided input field
2. (Optional) Modify the OSC address and port if needed
3. Click "Start Recording" to begin capturing audio
4. Click "Stop Recording" to end the recording and process the audio
5. The transcribed text will appear in the output area and be sent via OSC

## OSC Messages

The application sends the following OSC messages:

- `/startRecording` - Sent when recording starts
- `/stopRecording` - Sent when recording stops
- `/text` - Contains the transcribed text from Whisper API

## Requirements

- Modern web browser with JavaScript enabled
- Whisper API key
- OSC receiver application (for receiving the messages)

## Notes

- The application uses p5.js for audio handling and OSC communication
- Make sure your browser has permission to access the microphone
- The Whisper API key is required for transcription functionality 
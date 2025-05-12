# OSC-T2S (Speech to OSC Converter)

A tool that converts speech to OSC messages, allowing you to control any OSC-compatible application with your voice.

## Features

- Real-time speech recognition using OpenAI's Whisper API
- OSC message broadcasting to any OSC-compatible application
- Web interface for easy control and monitoring
- Cross-platform support (Windows, macOS, Linux)

## Prerequisites

- Node.js 16 or higher
- npm (Node Package Manager)
- OpenAI API key for Whisper speech recognition

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/osc-t2s.git
cd osc-t2s
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Usage

1. The web interface will automatically open in your browser at `http://localhost:9527`
2. Enter your OpenAI API key in the settings
3. Click "Start Recording" to begin speech recognition
4. Speak into your microphone - your speech will be converted to OSC messages

## OSC Message Format

The application sends OSC messages with the following format:

- Address: `/speech`
- Arguments: 
  - String: The transcribed text
  - Float: Confidence score (0-1)

## Configuration

The application can be configured through the web interface:

- OSC Port: Default is 57120
- OSC Address: Default is 127.0.0.1
- Speech Recognition Engine: Choose between Whisper API and Google Cloud Speech Recognition

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
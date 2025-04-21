# OSC-T2S (Speech to OSC Converter)

A tool that converts speech to OSC messages, allowing you to control any OSC-compatible application with your voice.

## Features

- Real-time speech recognition using OpenAI's Whisper API
- OSC message broadcasting to any OSC-compatible application
- Web interface for easy control and monitoring
- Cross-platform support (Windows, macOS, Linux)
- Example clients in Python, JavaScript, and Max/MSP

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

## Building Executables

You can build executables for your platform using the provided build script:

```bash
./build.sh
```

This will create executables in the `dist` directory. The script will:
1. Check for required dependencies
2. Install necessary packages
3. Build executables for your current platform
4. Optionally build for all platforms (Windows, macOS, Linux)

## Usage

### Running from Source

1. Start the server:
```bash
npm start
```

2. Open your web browser and navigate to:
```
http://localhost:8081
```

3. Enter your OpenAI API key in the web interface

4. Click "Start Recording" to begin speech recognition

### Running from Executable

1. Navigate to the `dist` directory
2. Run the appropriate executable for your platform:
   - Windows: `osc-t2s-win.exe`
   - macOS: `osc-t2s-mac`
   - Linux: `osc-t2s-linux`

3. Open your web browser and navigate to:
```
http://localhost:8081
```

## OSC Message Format

The application sends OSC messages with the following format:

- Address: `/speech` (configurable)
- Arguments: 
  - String: The transcribed text
  - Float: Confidence score (0-1)

## Example Clients

Check the `client` directory for example clients in different programming languages:

- Python: Simple OSC client using python-osc
- JavaScript: Web-based client using osc.js
- Max/MSP: Max patch for receiving OSC messages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
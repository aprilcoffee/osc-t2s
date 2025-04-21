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

### Option 1: Download Pre-built Executable

1. Go to the [Releases](https://github.com/yourusername/osc-t2s/releases) page
2. Download the appropriate executable for your platform:
   - Windows: `osc-t2s-win.exe`
   - macOS: `osc-t2s-mac`
   - Linux: `osc-t2s-linux`
3. Run the executable - it will automatically open your browser to the web interface

### Option 2: Build from Source

1. Clone this repository:
```bash
git clone https://github.com/yourusername/osc-t2s.git
cd osc-t2s
```

2. Install dependencies:
```bash
npm install
```

3. Build the executable:
```bash
# For current platform
npm run build

# For specific platform
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux

# For all platforms
npm run build:all
```

The executables will be created in the `dist` directory.

## Usage

1. Run the executable for your platform
2. The web interface will automatically open in your browser
3. Enter your OpenAI API key
4. Click "Start Recording" to begin speech recognition

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
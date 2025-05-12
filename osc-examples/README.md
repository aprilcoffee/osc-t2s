# OSC Examples

This directory contains various OSC examples for different purposes.

## Drawing Example

Located in `osc-drawing/`, this example demonstrates collaborative drawing using OSC.

### Requirements

1. Processing IDE (https://processing.org/download)
2. OSCP5 library for Processing
   - Open Processing
   - Go to Sketch > Import Library > Add Library
   - Search for "OSCP5"
   - Install the library by "Andreas Schlegel"

### Server

The server (`osc-drawing/server/server.pde`) manages multiple clients and their drawings.

Features:
- Draws with local mouse (black)
- Assigns unique colors to each client
- Shows number of connected clients
- Displays drawings from all clients

### Client

The client (`osc-drawing/client/client.pde`) connects to the server and sends drawing coordinates.

Features:
- Connect to server with 'c' key
- Draw with mouse (client's assigned color)
- Shows connection status

### How to Use

1. Open the server sketch in Processing and run it
2. Open one or more client sketches in Processing and run them
3. Press 'c' in each client to connect to the server
4. Draw in any window to see the drawings appear on the server
5. Each client gets a unique color for their drawings

### Message Types

#### Client to Server
- `/connect` - Connect to server
- `/draw` - Send drawing coordinates (x, y, prevX, prevY)

#### Server to Client
- `/connected` - Connection confirmation with assigned color (r, g, b)

### Ports
- Server listens on: 57120
- Client listens on: 57121 
#!/usr/bin/env python3
"""
Simple OSC receiver client for testing the OSC Text to Speech server.
This client listens for OSC messages and prints them to the console.
"""

import argparse
import sys
from pythonosc import dispatcher
from pythonosc import osc_server

def handle_start_recording(address, *args):
    """Handle the /startRecording OSC message."""
    print(f"Received start recording signal at {address}")

def handle_stop_recording(address, *args):
    """Handle the /stopRecording OSC message."""
    print(f"Received stop recording signal at {address}")

def handle_text(address, *args):
    """Handle the /text OSC message containing transcribed text."""
    text = args[0] if args else "No text received"
    print(f"Received transcribed text at {address}: {text}")

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="OSC Text to Speech Receiver Client")
    parser.add_argument("--ip", default="127.0.0.1", help="IP address to listen on")
    parser.add_argument("--port", type=int, default=57120, help="Port to listen on")
    args = parser.parse_args()

    # Create a dispatcher
    disp = dispatcher.Dispatcher()
    
    # Register message handlers
    disp.map("/startRecording", handle_start_recording)
    disp.map("/stopRecording", handle_stop_recording)
    disp.map("/text", handle_text)
    
    # Create and start the server
    server = osc_server.ThreadingOSCUDPServer((args.ip, args.port), disp)
    print(f"OSC receiver listening on {args.ip}:{args.port}")
    print("Press Ctrl+C to exit")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down OSC receiver")
        server.shutdown()
        sys.exit(0)

if __name__ == "__main__":
    main() 
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status messages
print_status() {
    echo -e "${GREEN}==>${NC} $1"
}

print_error() {
    echo -e "${RED}Error:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}Warning:${NC} $1"
}

# Check for required dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    if [ "$(echo "$NODE_VERSION 16.0.0" | awk '{print ($1 < $2)}')" -eq 1 ]; then
        print_error "Node.js version $NODE_VERSION is too old. Please upgrade to version 16 or higher."
        exit 1
    fi
    
    print_status "All dependencies satisfied."
}

# Install required packages
install_packages() {
    print_status "Installing required packages..."
    
    # Install pkg globally if not already installed
    if ! command_exists pkg; then
        print_status "Installing pkg globally..."
        npm install -g pkg
    fi
    
    # Install project dependencies
    npm install
    
    print_status "Packages installed successfully."
}

# Build executables
build_executables() {
    print_status "Building executables..."
    
    # Create dist directory if it doesn't exist
    mkdir -p dist
    
    # Build for current platform
    print_status "Building for current platform..."
    npm run build
    
    # Ask if user wants to build for all platforms
    read -p "Do you want to build for all platforms (Windows, macOS, Linux)? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Building for all platforms..."
        npm run build:all
    fi
    
    print_status "Build complete. Executables are in the dist directory."
}

# Main script
main() {
    print_status "Starting build process..."
    
    check_dependencies
    install_packages
    build_executables
    
    print_status "Build process completed successfully!"
}

# Run main function
main

echo -e "\n${YELLOW}Usage:${NC}"
echo "1. Run the executable for your platform from the dist directory"
echo "2. Open a web browser and navigate to http://localhost:8081"
echo "3. Enter your Whisper API key and start recording" 
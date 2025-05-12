const osc = require('osc');

// Create OSC UDP Port for sending messages
const sendPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 57121,
    remoteAddress: "127.0.0.1", // Change this to your server's IP
    remotePort: 57120
});

// Create OSC UDP Port for receiving messages
const receivePort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 57121,
    remoteAddress: "127.0.0.1",
    remotePort: 57120
});

// Open the ports
sendPort.open();
receivePort.open();

// Handle incoming messages
receivePort.on("message", function (oscMsg) {
    console.log("Received message:", oscMsg);
    
    switch(oscMsg.address) {
        case "/connected":
            console.log("Connected to server:", oscMsg.args[0]);
            break;
        case "/recordingStatus":
            console.log("Recording status:", oscMsg.args[0]);
            break;
        case "/transcription":
            console.log("Transcription:", oscMsg.args[0]);
            break;
    }
});

// Function to connect to server
function connect() {
    console.log("Connecting to server...");
    sendPort.send({
        address: "/connect",
        args: [1]
    });
}

// Function to start recording
function startRecording() {
    console.log("Starting recording...");
    sendPort.send({
        address: "/startRecording",
        args: [1]
    });
}

// Function to stop recording
function stopRecording() {
    console.log("Stopping recording...");
    sendPort.send({
        address: "/stopRecording",
        args: [1]
    });
}

// Example usage
console.log("OSC Client started. Press Ctrl+C to exit.");

// Connect to server
connect();

// Example: Start recording after 1 second
setTimeout(() => {
    startRecording();
    
    // Stop recording after 5 seconds
    setTimeout(() => {
        stopRecording();
    }, 5000);
}, 1000);

// Handle cleanup
process.on('SIGINT', () => {
    console.log("\nClosing OSC ports...");
    sendPort.close();
    receivePort.close();
    process.exit();
}); 
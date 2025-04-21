const WebSocket = require('ws');
const osc = require('node-osc');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const { Client } = require('node-osc');

// Create HTTP server to serve web files
const httpServer = http.createServer((req, res) => {
    // Serve static files
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/sketch.js') {
        fs.readFile(path.join(__dirname, 'sketch.js'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading sketch.js');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Start HTTP server
const HTTP_PORT = 9527;
httpServer.listen(HTTP_PORT, 'localhost', () => {
    console.log(`HTTP server running at http://localhost:${HTTP_PORT}`);
});

// Create WebSocket server that listens on localhost only
const wss = new WebSocket.Server({ 
    host: '0.0.0.0',  // Listen only on 0.0.0.0
    port: 8080 
});

// Store OSC clients and WebSocket connections
const oscClients = new Map();
const wsConnections = new Map();

// Create a default OSC client for standalone operation
const defaultOscClient = new osc.Client('127.0.0.1', 57120);
console.log('Default OSC client created for standalone operation');

// Function to send OSC message
function sendOscMessage(address, value) {
    try {
        defaultOscClient.send(address, value);
        console.log(`Sent OSC message: ${address} = ${value}`);
    } catch (error) {
        console.error('Error sending OSC message:', error);
    }
}

// Function to test Whisper API
async function testWhisperApi(apiKey) {
    try {
        // In a real implementation, you would make a test call to the Whisper API
        // For now, we'll just simulate a successful response
        console.log('Testing Whisper API...');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if API key is provided
        if (!apiKey || apiKey.trim() === '') {
            return { success: false, message: 'Whisper API key is required' };
        }
        
        // Simulate successful API test
        return { success: true, message: 'Whisper API test successful' };
    } catch (error) {
        console.error('Error testing Whisper API:', error);
        return { success: false, message: `Whisper API test failed: ${error.message}` };
    }
}

// Function to test Google Cloud Speech Recognition API
async function testGoogleApi(apiKey) {
    try {
        // In a real implementation, you would make a test call to the Google Cloud Speech Recognition API
        // For now, we'll just simulate a successful response
        console.log('Testing Google Cloud Speech Recognition API...');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if API key is provided
        if (!apiKey || apiKey.trim() === '') {
            return { success: false, message: 'Google Cloud API key is required' };
        }
        
        // Simulate successful API test
        return { success: true, message: 'Google Cloud Speech Recognition API test successful' };
    } catch (error) {
        console.error('Error testing Google Cloud API:', error);
        return { success: false, message: `Google Cloud API test failed: ${error.message}` };
    }
}

// Function to process audio with Whisper API
async function processWithWhisper(audioData, apiKey) {
    try {
        // In a real implementation, you would send this to the Whisper API
        // For now, we'll just simulate a response
        console.log('Processing with Whisper API...');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate transcription result
        const text = "This is a simulated transcription from Whisper API";
        
        // Send the result via OSC
        sendOscMessage('/text', text);
        
        return text;
    } catch (error) {
        console.error('Error processing with Whisper API:', error);
        throw error;
    }
}

// Function to process audio with Google Cloud Speech Recognition
async function processWithGoogle(audioData, apiKey) {
    try {
        // In a real implementation, you would send this to the Google Cloud Speech Recognition API
        // For now, we'll just simulate a response
        console.log('Processing with Google Cloud Speech Recognition...');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate transcription result
        const text = "This is a simulated transcription from Google Cloud Speech Recognition";
        
        // Send the result via OSC
        sendOscMessage('/text', text);
        
        return text;
    } catch (error) {
        console.error('Error processing with Google Cloud Speech Recognition:', error);
        throw error;
    }
}

// Create OSC client
const oscClient = new Client('127.0.0.1', 57120);

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Send registration confirmation
    ws.send(JSON.stringify({
        type: 'registered',
        oscAddress: '127.0.0.1',
        oscPort: 57120
    }));
    
    // Handle messages from client
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            // Handle API test request
            if (data.type === 'testApi') {
                console.log(`Testing ${data.apiType} API...`);
                
                let result;
                if (data.apiType === 'whisper') {
                    result = await testWhisperApi(data.apiKey);
                } else if (data.apiType === 'google') {
                    result = await testGoogleApi(data.apiKey);
                } else {
                    result = { success: false, message: 'Unknown API type' };
                }
                
                // Send test result back to client
                ws.send(JSON.stringify({
                    type: 'apiTestResult',
                    success: result.success,
                    message: result.message
                }));
            }
            // Handle transcription from Web Speech API
            else if (data.type === 'transcription') {
                console.log(`Received transcription: ${data.text}`);
                
                // Process with the selected API
                if (data.apiType === 'whisper') {
                    processWithWhisper(data.text, data.apiKey)
                        .then(text => {
                            console.log(`Whisper transcription: ${text}`);
                            // Send to OSC
                            oscClient.send('/transcription', text, () => {
                                console.log(`Sent to OSC: ${text}`);
                            });
                        })
                        .catch(error => {
                            console.error('Error processing with Whisper:', error);
                        });
                } else if (data.apiType === 'google') {
                    processWithGoogle(data.text, data.apiKey)
                        .then(text => {
                            console.log(`Google transcription: ${text}`);
                            // Send to OSC
                            oscClient.send('/transcription', text, () => {
                                console.log(`Sent to OSC: ${text}`);
                            });
                        })
                        .catch(error => {
                            console.error('Error processing with Google:', error);
                        });
                }
            }
            // Handle OSC message
            else if (data.type === 'osc') {
                const { address, value, oscAddress, oscPort } = data;
                
                // Create a new OSC client for this specific message
                const tempClient = new Client(oscAddress, oscPort);
                
                // Send the message
                tempClient.send(address, value, () => {
                    console.log(`Sent OSC message to ${oscAddress}:${oscPort} - ${address}: ${value}`);
                    // Close the temporary client
                    tempClient.close();
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server running on localhost:8080');

// Open the browser automatically
const url = `http://localhost:${HTTP_PORT}`;
let command;

if (process.platform === 'win32') {
    command = `start ${url}`;
} else if (process.platform === 'darwin') {
    command = `open ${url}`;
} else {
    command = `xdg-open ${url}`;
}

exec(command, (error) => {
    if (error) {
        console.error(`Could not open browser: ${error.message}`);
        console.log(`Please open your browser and navigate to: ${url}`);
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    oscClient.close();
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}); 
const WebSocket = require('ws');
const osc = require('node-osc');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const { Client } = require('node-osc');
const axios = require('axios');
const FormData = require('form-data');
const { OpenAI } = require('openai');

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
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`HTTP server running at http://localhost:${HTTP_PORT}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
    host: '0.0.0.0',
    port: 8080 
});

// Store WebSocket connections and recording state
const wsConnections = new Map();
const oscConnections = new Set(); // Store connected OSC clients
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let transcriptionMode = 'audio'; // Default to audio mode

// Function to get network info
function getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const validInterfaces = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                // Calculate broadcast address
                const ipParts = iface.address.split('.');
                const netmaskParts = iface.netmask.split('.');
                const broadcastParts = ipParts.map((part, i) => 
                    (parseInt(part) | (~parseInt(netmaskParts[i]) & 255)).toString()
                );
                const broadcastAddress = broadcastParts.join('.');
                
                validInterfaces.push({
                    name: name,
                    ip: iface.address,
                    broadcast: broadcastAddress,
                    netmask: iface.netmask
                });
            }
        }
    }
    
    if (validInterfaces.length === 0) {
        console.warn('No external network interfaces found. Using localhost.');
        return {
            name: 'lo',
            ip: '127.0.0.1',
            broadcast: '127.255.255.255',
            netmask: '255.0.0.0'
        };
    }
    
    // Log all available network interfaces
    console.log('\nAvailable network interfaces:');
    validInterfaces.forEach(iface => {
        console.log(`\nInterface: ${iface.name}`);
        console.log(`IP Address: ${iface.ip}`);
        console.log(`Broadcast: ${iface.broadcast}`);
        console.log(`Netmask: ${iface.netmask}`);
    });
    
    // Use the first non-localhost interface
    return validInterfaces[0];
}

// Get network information
const networkInfo = getNetworkInfo();
const serverIP = networkInfo.ip;
const broadcastAddress = networkInfo.broadcast;
console.log('\nSelected network configuration:');
console.log('Server IP address:', serverIP);
console.log('Broadcast address:', broadcastAddress);
console.log('Network interface:', networkInfo.name);
console.log('Netmask:', networkInfo.netmask);

// Create OSC server to receive messages
const oscServer = new osc.Server(57120, '0.0.0.0');
console.log('OSC server listening on port 57120');

// Create OSC client for sending transcriptions
const OSC_PORT = 57121; // Port for sending messages
const oscClient = new osc.Client('127.0.0.1', OSC_PORT);
console.log(`OSC client sending to localhost:${OSC_PORT}`);

// Function to send OSC message
function sendOscMessage(address, value) {
    try {
        // Send to all connected WebSocket clients
        wsConnections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'osc',
                    address: address,
                    value: value
                }));
            }
        });
        
        // Send via OSC to local port
        console.log(`Sending OSC message: ${address} = ${value}`);
        console.log(`Target: localhost:${OSC_PORT}`);
        
        // Create a new OSC message with proper format
        const message = new osc.Message(address);
        if (typeof value === 'string') {
            message.append(value);
        } else {
            message.append(value);
        }
        
        // Send the message
        oscClient.send(message);
        console.log('OSC message sent successfully');
    } catch (error) {
        console.error('Error sending OSC message:', error);
    }
}

// Function to broadcast connected clients to all WebSocket clients
function broadcastConnectedClients() {
    const clients = Array.from(oscConnections);
    wsConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'connectedClients',
                clients: clients
            }));
        }
    });
}

// Handle OSC messages
oscServer.on('message', async (msg, rinfo) => {
    console.log('Received OSC message:', msg, 'from:', rinfo.address);
    
    if (msg[0] === '/connect') {
        console.log('New OSC client connected from:', rinfo.address);
        oscConnections.add(rinfo.address);
        console.log('Current OSC connections:', Array.from(oscConnections));
        
        // Send confirmation back to the client
        try {
            const client = new osc.Client(rinfo.address, 57121);
            client.send('/connected', 1);
            client.close();
        } catch (error) {
            console.error('Error sending connection confirmation:', error);
        }

        // Broadcast updated client list
        broadcastConnectedClients();
    }
    else if (msg[0] === '/disconnect') {
        console.log('OSC client disconnected:', rinfo.address);
        oscConnections.delete(rinfo.address);
        console.log('Current OSC connections:', Array.from(oscConnections));
        
        // Broadcast updated client list
        broadcastConnectedClients();
    }
    else if (msg[0] === '/startRecording') {
        console.log('Starting recording via OSC');
        if (!isRecording) {
            isRecording = true;
            audioChunks = [];
            
            // Broadcast to all WebSocket clients
            wsConnections.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ 
                        type: 'startRecording',
                        timestamp: Date.now()
                    }));
                }
            });

            // Send to all connected OSC clients
            sendToAllOscClients('/recordingStatus', 1);
        }
    } 
    else if (msg[0] === '/stopRecording') {
        console.log('Stopping recording via OSC');
        if (isRecording) {
            isRecording = false;
            
            // Broadcast to all WebSocket clients
            wsConnections.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ 
                        type: 'stopRecording',
                        timestamp: Date.now()
                    }));
                }
            });

            // Send to all connected OSC clients
            sendToAllOscClients('/recordingStatus', 0);
        }
    }
});

// Function to send message to all connected OSC clients
function sendToAllOscClients(address, value) {
    console.log('Sending to all OSC clients:', address, value);
    console.log('Connected clients:', Array.from(oscConnections));
    
    oscConnections.forEach(clientIP => {
        try {
            const client = new osc.Client(clientIP, 57121);
            const message = new osc.Message(address);
            if (typeof value === 'string') {
                message.append(value);
            } else {
                message.append(value);
            }
            client.send(message);
            client.close();
            console.log(`Message sent successfully to ${clientIP}`);
        } catch (error) {
            console.error(`Error sending to ${clientIP}:`, error);
            // Remove failed client from connections
            oscConnections.delete(clientIP);
        }
    });
}

// Function to process audio with Whisper API
async function processWithWhisper(audioData, apiKey) {
    try {
        console.log('Processing with Whisper API...');
        
        // Create a temporary file for the audio
        const tempFile = path.join(__dirname, 'temp_audio.wav');
        fs.writeFileSync(tempFile, Buffer.from(audioData, 'base64'));
        
        // Create OpenAI client
        const openai = new OpenAI({
            apiKey: apiKey
        });

        // Create form data for the request
        const formData = new FormData();
        formData.append('file', fs.createReadStream(tempFile), {
            filename: 'audio.wav',
            contentType: 'audio/wav'
        });
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'json');
        formData.append('language', 'en'); // Optional: specify language

        // Send request to Whisper API
        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${apiKey}`
            }
        });

        // Clean up temporary file
        fs.unlinkSync(tempFile);

        if (response.data && response.data.text) {
            const transcription = response.data.text;
            console.log('Transcription received:', transcription);
            
            // Send transcription to all connected OSC clients
            sendToAllOscClients('/transcription', transcription);
            
            return transcription;
        } else {
            throw new Error('Invalid response from Whisper API');
        }
    } catch (error) {
        console.error('Error processing with Whisper API:', error);
        
        // Clean up temporary file if it exists
        try {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up temporary file:', cleanupError);
        }

        // Provide more specific error messages
        if (error.response) {
            throw new Error(`Whisper API Error: ${error.response.data.error?.message || error.response.statusText}`);
        } else if (error.request) {
            throw new Error('No response from Whisper API. Please check your internet connection.');
        } else {
            throw new Error(`Error setting up request: ${error.message}`);
        }
    }
}

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`Client connected from ${clientIP}`);
    const clientId = Date.now().toString();
    wsConnections.set(clientId, ws);
    
    // Send registration confirmation and current recording state
    ws.send(JSON.stringify({
        type: 'registered',
        oscAddress: serverIP,
        oscPort: 57120,
        oscBroadcastPort: OSC_PORT,
        oscBroadcastAddress: broadcastAddress,
        networkInterface: networkInfo.name,
        clientIP: clientIP,
        isRecording: isRecording
    }));

    // Send current list of connected OSC clients
    ws.send(JSON.stringify({
        type: 'connectedClients',
        clients: Array.from(oscConnections)
    }));
    
    // Handle messages from client
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data.type);
            
            // Handle audio data
            if (data.type === 'audioData') {
                console.log('Processing audio data...');
                try {
                    const transcription = await processWithWhisper(data.audio, data.whisperKey);
                    console.log('Final transcription:', transcription);
                    
                    // Send final transcription back to client
                    ws.send(JSON.stringify({
                        type: 'transcription',
                        text: transcription,
                        isFinal: true
                    }));

                    // Broadcast transcription via OSC
                    oscClient.send('/transcription', transcription);
                } catch (error) {
                    console.error('Error processing audio:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            }
            // Handle recording state changes from web interface
            else if (data.type === 'startRecording') {
                console.log('Starting recording via WebSocket');
                isRecording = true;
                audioChunks = [];
                // Broadcast to all clients
                wsConnections.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ 
                            type: 'startRecording',
                            timestamp: Date.now()
                        }));
                    }
                });
                // Send confirmation via OSC
                oscClient.send('/recordingStatus', 1);
                console.log('Recording started via WebSocket');
            }
            else if (data.type === 'stopRecording') {
                console.log('Stopping recording via WebSocket');
                isRecording = false;
                // Broadcast to all clients
                wsConnections.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ 
                            type: 'stopRecording',
                            timestamp: Date.now()
                        }));
                    }
                });
                // Send confirmation via OSC
                oscClient.send('/recordingStatus', 0);
                console.log('Recording stopped via WebSocket');
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        wsConnections.delete(clientId);
    });
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    oscServer.close();
    oscClient.close();
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

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
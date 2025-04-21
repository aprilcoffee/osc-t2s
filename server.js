const WebSocket = require('ws');
const osc = require('node-osc');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// Create HTTP server to serve web files
const httpServer = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start HTTP server
const HTTP_PORT = 8000;
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

wss.on('connection', function connection(ws) {
    console.log('New WebSocket connection');
    const clientId = Date.now().toString();
    wsConnections.set(clientId, ws);

    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'register') {
                // Client is registering to receive OSC messages
                const clientKey = `${data.oscAddress}:${data.oscPort}`;
                console.log(`Client ${clientId} registered for OSC at ${clientKey}`);
                
                // Store the WebSocket connection for this OSC address/port
                if (!oscClients.has(clientKey)) {
                    oscClients.set(clientKey, new Set());
                }
                oscClients.get(clientKey).add(clientId);
                
                // Send confirmation
                ws.send(JSON.stringify({
                    type: 'registered',
                    oscAddress: data.oscAddress,
                    oscPort: data.oscPort
                }));
            } else if (data.type === 'osc') {
                // Forward OSC message to registered clients
                const clientKey = `${data.oscAddress}:${data.oscPort}`;
                
                if (oscClients.has(clientKey)) {
                    const clientIds = oscClients.get(clientKey);
                    
                    // Send to all registered clients
                    clientIds.forEach(id => {
                        const clientWs = wsConnections.get(id);
                        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                            clientWs.send(JSON.stringify(data));
                        }
                    });
                    
                    console.log(`Forwarded OSC message to ${clientIds.size} clients: ${data.address} = ${data.value}`);
                } else {
                    console.log(`No clients registered for ${clientKey}`);
                }
            } else if (data.type === 'transcribe') {
                // Handle transcription request
                const { audioData, apiType, apiKey } = data;
                
                if (apiType === 'whisper') {
                    // Forward to client for Whisper API processing
                    ws.send(JSON.stringify({
                        type: 'transcribe',
                        audioData,
                        apiType: 'whisper',
                        apiKey
                    }));
                } else if (apiType === 'google') {
                    // Forward to client for Google Cloud Speech Recognition API processing
                    ws.send(JSON.stringify({
                        type: 'transcribe',
                        audioData,
                        apiType: 'google',
                        apiKey
                    }));
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', function() {
        console.log(`Client ${clientId} disconnected`);
        
        // Remove this client from all OSC client lists
        oscClients.forEach((clientIds, key) => {
            if (clientIds.has(clientId)) {
                clientIds.delete(clientId);
                console.log(`Removed client ${clientId} from ${key}`);
                
                // Clean up empty client lists
                if (clientIds.size === 0) {
                    oscClients.delete(key);
                    console.log(`Removed empty client list for ${key}`);
                }
            }
        });
        
        // Remove the WebSocket connection
        wsConnections.delete(clientId);
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
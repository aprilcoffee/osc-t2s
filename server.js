const WebSocket = require('ws');
const osc = require('node-osc');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

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

console.log('WebSocket server running on port 8080'); 
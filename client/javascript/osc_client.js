const WebSocket = require('ws');

class OSCClient {
    constructor(host = 'localhost', port = 8081) {
        this.host = host;
        this.port = port;
        this.ws = null;
        this.connected = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`ws://${this.host}:${this.port}`);

            this.ws.on('open', () => {
                console.log('Connected to OSC bridge');
                this.connected = true;
                resolve();
            });

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    console.log('Received:', message);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            });

            this.ws.on('close', () => {
                console.log('Disconnected from OSC bridge');
                this.connected = false;
            });
        });
    }

    sendOSC(address, ...args) {
        if (!this.connected) {
            console.error('Not connected to OSC bridge');
            return;
        }

        const message = {
            address: address,
            args: args
        };

        this.ws.send(JSON.stringify(message));
        console.log('Sent OSC message:', message);
    }

    startRecording() {
        this.sendOSC('/startRecording');
    }

    stopRecording() {
        this.sendOSC('/stopRecording');
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Example usage
async function main() {
    const client = new OSCClient();
    
    try {
        await client.connect();
        
        // Example: Start recording after 1 second
        setTimeout(() => {
            client.startRecording();
            
            // Stop recording after 5 seconds
            setTimeout(() => {
                client.stopRecording();
                
                // Close connection after 1 more second
                setTimeout(() => {
                    client.close();
                }, 1000);
            }, 5000);
        }, 1000);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = OSCClient; 
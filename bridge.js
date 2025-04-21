const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const config = {
	port: process.env.PORT || 8081,
	oscPort: process.env.OSC_PORT || 12000,
	oscClientPort: process.env.OSC_CLIENT_PORT || 57120
};

// Get the application directory
const getAppDir = () => {
	// When running as an executable, __dirname is the directory containing the executable
	// When running as a Node.js script, __dirname is the directory containing the script
	return process.pkg ? path.dirname(process.execPath) : __dirname;
};

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

// Serve static files from the application directory
app.use(express.static(getAppDir()));

// Handle audio transcription with Whisper API
async function transcribeAudio(audioData, whisperKey) {
	try {
		// Create form data for Whisper API
		const formData = new FormData();
		formData.append('file', Buffer.from(audioData, 'base64'), {
			filename: 'audio.wav',
			contentType: 'audio/wav'
		});
		formData.append('model', 'whisper-1');
		
		// Send to Whisper API
		const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
			headers: {
				...formData.getHeaders(),
				'Authorization': `Bearer ${whisperKey}`
			}
		});
		
		return response.data.text;
	} catch (error) {
		console.error('Error transcribing audio:', error);
		throw new Error(error.response?.data?.error?.message || 'Error processing audio');
	}
}

// Get local IP address
function getLocalIpAddress() {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			// Skip internal and non-IPv4 addresses
			if (!iface.internal && iface.family === 'IPv4') {
				return iface.address;
			}
		}
	}
	return '127.0.0.1';
}

// Socket.io connection handling
io.on('connection', (socket) => {
	console.log('Client connected');
	
	// Send initial configuration
	socket.emit('config', {
		oscPort: config.oscPort,
		oscClientPort: config.oscClientPort,
		localIp: getLocalIpAddress()
	});
	
	// Handle audio data for transcription
	socket.on('audioData', async (data) => {
		try {
			const { audio, whisperKey } = data;
			
			if (!whisperKey) {
				socket.emit('error', { message: 'Whisper API key is required' });
				return;
			}
			
			// Transcribe audio
			const transcription = await transcribeAudio(audio, whisperKey);
			
			// Send transcription back to client
			socket.emit('transcription', { text: transcription });
			
			// Send OSC message with transcription
			socket.emit('osc', ['/transcription', transcription]);
			
		} catch (error) {
			console.error('Error processing audio:', error);
			socket.emit('error', { message: error.message });
		}
	});
	
	// Handle OSC messages from client
	socket.on('send', (data) => {
		try {
			const { address, args } = data;
			console.log(`Received OSC message: ${address}`, args);
			
			// Broadcast OSC message to all connected clients
			io.emit('osc', [address, ...args]);
		} catch (error) {
			console.error('Error handling OSC message:', error);
		}
	});
	
	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

// Start server
server.listen(config.port, () => {
	const localIp = getLocalIpAddress();
	console.log(`Server running on port ${config.port}`);
	console.log(`Local IP address: ${localIp}`);
	console.log(`OSC server port: ${config.oscPort}`);
	console.log(`OSC client port: ${config.oscClientPort}`);
	console.log(`Access the application at: http://${localIp}:${config.port}`);
	console.log(`Or locally at: http://localhost:${config.port}`);
});
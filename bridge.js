const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Client, Server } = require('node-osc');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from current directory
app.use(express.static(__dirname));

// Create OSC client and server
const client = new Client('127.0.0.1', 57120);
const oscServer = new Server(12000, '0.0.0.0', () => {
	console.log('OSC Server is listening on port 12000');
});

// Store API keys
let whisperKey = '';
let googleToken = null;

// Configure Google OAuth
const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID',  // Replace with your actual client ID
	process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',  // Replace with your actual client secret
	'http://localhost:8081/oauth2callback'
);

// Handle incoming OSC messages
oscServer.on('message', function (msg) {
	console.log('Received OSC message:', msg);
	io.emit('oscMessage', msg);
});

// Handle socket.io connections
io.on('connection', (socket) => {
	console.log('Client connected');
	
	// Handle Google OAuth request
	socket.on('requestGoogleAuth', () => {
		console.log('Requesting Google Auth...');
		const authUrl = oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: ['https://www.googleapis.com/auth/cloud-platform'],
			prompt: 'consent'  // Force consent screen to always appear
		});
		console.log('Generated Auth URL:', authUrl);
		socket.emit('googleAuthUrl', authUrl);
	});
	
	// Handle OAuth callback
	app.get('/oauth2callback', async (req, res) => {
		const { code } = req.query;
		try {
			const { tokens } = await oauth2Client.getToken(code);
			oauth2Client.setCredentials(tokens);
			googleToken = tokens.access_token;
			io.emit('googleAuthSuccess', googleToken);
			res.send('Authentication successful! You can close this window.');
		} catch (error) {
			console.error('Error getting tokens:', error);
			io.emit('googleAuthError', error.message);
			res.send('Authentication failed. Please try again.');
		}
	});
	
	// Handle API key updates
	socket.on('updateAPIKeys', (keys) => {
		whisperKey = keys.whisperKey;
		googleToken = keys.googleToken;
		console.log('API keys updated');
	});
	
	// Handle audio processing
	socket.on('processAudio', async (audioData) => {
		try {
			// Process with Whisper API
			if (whisperKey) {
				const formData = new FormData();
				formData.append('file', Buffer.from(audioData), {
					filename: 'audio.webm',
					contentType: 'audio/webm'
				});
				formData.append('model', 'whisper-1');
				
				const whisperResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
					headers: {
						...formData.getHeaders(),
						'Authorization': `Bearer ${whisperKey}`
					}
				});
				
				const whisperText = whisperResponse.data.text;
				socket.emit('transcription', { text: whisperText, source: 'whisper' });
				client.send('/transcription', whisperText);
			}
			
			// Process with Google Cloud Speech
			if (googleToken) {
				const speechResponse = await axios.post(
					'https://speech.googleapis.com/v1/speech:recognize',
					{
						config: {
							encoding: 'WEBM_OPUS',
							sampleRateHertz: 48000,
							languageCode: 'en-US'
						},
						audio: {
							content: audioData.toString('base64')
						}
					},
					{
						headers: {
							'Authorization': `Bearer ${googleToken}`,
							'Content-Type': 'application/json'
						}
					}
				);
				
				const googleText = speechResponse.data.results[0].alternatives[0].transcript;
				socket.emit('transcription', { text: googleText, source: 'google' });
				client.send('/transcription', googleText);
			}
		} catch (error) {
			console.error('Error processing audio:', error);
			socket.emit('error', error.message);
		}
	});
	
	// Handle browser sending OSC messages
	socket.on('sendOSC', (msg) => {
		client.send(msg.address, msg.args);
	});
	
	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

// Start server
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`OSC Client sending to 127.0.0.1:57120`);
	console.log(`OSC Server listening on 0.0.0.0:12000`);
});
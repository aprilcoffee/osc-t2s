// Global variables
let socket;
let isRecording = false;
let whisperKey = '';
let mediaRecorder;
let audioChunks = [];

// DOM Elements
let statusIndicator;
let startBtn;
let stopBtn;
let transcriptionDiv;
let whisperKeyInput;
let ipAddressElement;
let oscServerPortElement;
let oscClientPortElement;

// Configuration
const config = {
  serverUrl: 'http://localhost:8081',
  oscAddress: '127.0.0.1',
  oscPort: 57120,
  oscServerPort: 12000
};

/**
 * Initialize the application
 */
function setup() {
  // Create canvas (required by p5.js)
  createCanvas(400, 400);
  noLoop();
  
  // Initialize DOM elements
  initializeDOMElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize socket connection
  setupSocketConnection();
}

/**
 * Initialize DOM elements
 */
function initializeDOMElements() {
  // Get DOM elements
  statusIndicator = document.getElementById('status');
  startBtn = document.getElementById('startBtn');
  stopBtn = document.getElementById('stopBtn');
  transcriptionDiv = document.getElementById('transcription');
  whisperKeyInput = document.getElementById('whisperKey');
  ipAddressElement = document.getElementById('ipAddress');
  oscServerPortElement = document.getElementById('oscServerPort');
  oscClientPortElement = document.getElementById('oscClientPort');
  
  // Initially disable stop button
  stopBtn.disabled = true;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // API key validation
  whisperKeyInput.addEventListener('input', validateWhisperKey);
  
  // Button event listeners
  startBtn.addEventListener('click', startRecording);
  stopBtn.addEventListener('click', stopRecording);
}

/**
 * Set up socket connection
 */
function setupSocketConnection() {
  // Connect to the socket.io server
  socket = io.connect(config.serverUrl);
  
  // Handle connection events
  socket.on('connect', () => {
    console.log('Connected to OSC bridge');
    updateStatus('Connected to OSC bridge', 'info');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from OSC bridge');
    updateStatus('Disconnected from OSC bridge', 'error');
  });
  
  // Handle configuration from server
  socket.on('config', (data) => {
    console.log('Received configuration:', data);
    config.oscPort = data.oscPort || config.oscPort;
    config.oscServerPort = data.oscClientPort || config.oscServerPort;
    
    // Update UI with configuration
    if (oscServerPortElement) {
      oscServerPortElement.textContent = config.oscServerPort;
    }
    if (oscClientPortElement) {
      oscClientPortElement.textContent = config.oscPort;
    }
    if (ipAddressElement && data.localIp) {
      ipAddressElement.textContent = data.localIp;
    }
  });
  
  // Handle incoming OSC messages
  socket.on('osc', (msg) => {
    console.log('Received OSC message:', msg);
    
    // Handle specific OSC messages
    if (msg[0] === '/startRecording') {
      startRecording();
    } else if (msg[0] === '/stopRecording') {
      stopRecording();
    }
  });
  
  // Handle Whisper API results
  socket.on('transcription', (data) => {
    console.log('Received transcription:', data);
    updateTranscription(data.text);
  });

  socket.on('error', (error) => {
    console.error('Error from server:', error);
    updateStatus(error.message || error, 'error');
  });
}

/**
 * Validate Whisper API key
 */
function validateWhisperKey() {
  whisperKey = whisperKeyInput.value.trim();
  startBtn.disabled = !whisperKey;
  updateStatus(whisperKey ? 'Ready to record' : 'Please enter Whisper API key');
}

/**
 * Start recording audio
 */
async function startRecording() {
  try {
    // Get audio stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    // Set up event handlers
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        socket.emit('audioData', {
          audio: base64Audio,
          whisperKey: whisperKey
        });
      };
      
      reader.readAsDataURL(audioBlob);
    };
    
    // Start recording
    mediaRecorder.start();
    isRecording = true;
    updateUI();
    updateStatus('Recording...');
  } catch (error) {
    console.error('Error starting recording:', error);
    updateStatus(`Error: ${error.message}`);
  }
}

/**
 * Stop recording audio
 */
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
  isRecording = false;
  updateUI();
  updateStatus('Processing audio...');
}

/**
 * Send OSC message
 * @param {string} text - Text to send as OSC message
 */
function sendOSCMessage(text) {
  if (socket && socket.connected) {
    try {
      socket.emit('send', {
        address: '/speech',
        args: [text]
      });
      console.log(`Sent OSC message: /speech = ${text}`);
    } catch (error) {
      console.error('Error sending OSC message:', error);
    }
  } else {
    console.error('Socket not connected');
  }
}

/**
 * Update transcription display
 * @param {string} text - Transcription text
 */
function updateTranscription(text) {
  transcriptionDiv.textContent = text;
  sendOSCMessage(text);
  updateStatus('Ready to record');
}

/**
 * Update UI elements based on current state
 */
function updateUI() {
  startBtn.disabled = isRecording || !whisperKey;
  stopBtn.disabled = !isRecording;
}

/**
 * Update status message
 * @param {string} message - Status message
 * @param {string} type - Message type (info, error)
 */
function updateStatus(message, type = 'info') {
  statusIndicator.textContent = message;
  statusIndicator.className = type;
} 
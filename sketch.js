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
  serverUrl: 'ws://localhost:8080',
  oscPort: 57120
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
  
  // Initialize WebSocket connection
  setupWebSocket();
}

/**
 * Initialize DOM elements
 */
function initializeDOMElements() {
  statusIndicator = document.getElementById('status');
  startBtn = document.getElementById('startBtn');
  stopBtn = document.getElementById('stopBtn');
  transcriptionDiv = document.getElementById('transcription');
  whisperKeyInput = document.getElementById('whisperKey');
  ipAddressElement = document.getElementById('serverIP');
  oscServerPortElement = document.getElementById('oscServerPort');
  oscClientPortElement = document.getElementById('oscClientPort');
  
  // Set initial button states
  startBtn.disabled = true;
  stopBtn.disabled = true;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  whisperKeyInput.addEventListener('input', validateWhisperKey);
  startBtn.addEventListener('click', () => {
    if (!isRecording) {
      startRecording();
      socket.send(JSON.stringify({ type: 'startRecording' }));
    }
  });
  stopBtn.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
      socket.send(JSON.stringify({ type: 'stopRecording' }));
    }
  });
}

/**
 * Set up WebSocket connection
 */
function setupWebSocket() {
  socket = new WebSocket(config.serverUrl);
  
  socket.onopen = () => {
    console.log('Connected to server');
    updateStatus('Connected to server', 'info');
    startBtn.disabled = false;
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received message from server:', data);
      
      if (data.type === 'transcription') {
        // Update transcription display
        transcriptionDiv.textContent = data.text;
        updateStatus('Transcription received', 'success');
        console.log('Transcription:', data.text);
      } else if (data.type === 'error') {
        updateStatus(data.message, 'error');
        console.error('Server error:', data.message);
      } else if (data.type === 'registered') {
        console.log('Registered with server:', data);
        updateStatus('Connected to server', 'success');
        // Update server IP address
        if (data.oscAddress) {
          ipAddressElement.textContent = data.oscAddress;
          console.log('Server IP address updated:', data.oscAddress);
        }
        // Sync recording state with server
        if (data.isRecording !== isRecording) {
          if (data.isRecording) {
            startRecording();
          } else {
            stopRecording();
          }
        }
      } else if (data.type === 'osc') {
        // Handle OSC messages
        console.log('Received OSC message:', data.address, data.value);
        if (data.address === '/transcription') {
          transcriptionDiv.textContent = data.value;
          updateStatus('Transcription received via OSC', 'success');
        }
      } else if (data.type === 'startRecording') {
        if (!isRecording) {
          startRecording();
        }
      } else if (data.type === 'stopRecording') {
        if (isRecording) {
          stopRecording();
        }
      } else {
        console.log('Other message type:', data.type, data);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      console.error('Raw message:', event.data);
      updateStatus('Error processing server response', 'error');
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    updateStatus('Connection error', 'error');
  };
  
  socket.onclose = () => {
    console.log('Disconnected from server');
    updateStatus('Disconnected from server', 'error');
    startBtn.disabled = true;
    stopBtn.disabled = true;
  };
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
        console.log('Audio data prepared, size:', base64Audio.length);
        
        // Send audio data to server
        if (socket && socket.readyState === WebSocket.OPEN) {
          console.log('Sending audio data to server...');
          socket.send(JSON.stringify({
            type: 'audioData',
            audio: base64Audio,
            whisperKey: whisperKey
          }));
          updateStatus('Sending audio to server...', 'info');
        } else {
          console.error('WebSocket not connected');
          updateStatus('Server not connected', 'error');
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading audio data:', error);
        updateStatus('Error processing audio', 'error');
      };
      
      reader.readAsDataURL(audioBlob);
    };
    
    // Start recording
    mediaRecorder.start();
    isRecording = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateStatus('Recording...', 'info');
    
  } catch (error) {
    console.error('Error starting recording:', error);
    updateStatus('Error starting recording: ' + error.message, 'error');
  }
}

/**
 * Stop recording audio
 */
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('Processing audio...', 'info');
  }
}

/**
 * Update status message
 */
function updateStatus(message, type = 'info') {
  statusIndicator.textContent = message;
  statusIndicator.className = type;
}

/**
 * Clean up resources
 */
function cleanup() {
  if (socket) {
    socket.close();
  }
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
}

// Register cleanup function
window.addEventListener('beforeunload', cleanup); 
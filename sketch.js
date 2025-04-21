// Global variables
let socket;
let oscAddress = "127.0.0.1";
let oscPort = 57120;
let oscServerPort = 12000;

let isRecording = false;
let whisperKey = '';
let mediaRecorder;
let audioChunks = [];

// Add at the top with other global variables
let isRecognitionStarting = false;
let recognitionRetryCount = 0;
const MAX_RETRIES = 3;
let recognitionState = 'stopped'; // 'stopped', 'starting', 'running', 'stopping'
let isWebSpeechAPIAvailable = false;

// DOM Elements
let statusIndicator;
let statusText;
let startBtn;
let stopBtn;
let transcriptionDiv;
let oscAddressInput;
let oscPortInput;
let whisperKeyInput;
let whisperKeyError;

function setup() {
    // Create canvas (required by p5.js)
    createCanvas(400, 400);
    noLoop();
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize OSC
    setupOSC();
    
    // Initialize speech recognition
    setupSpeechRecognition();
}

function initializeDOMElements() {
    statusIndicator = document.getElementById('statusIndicator');
    statusText = document.getElementById('statusText');
    startBtn = document.getElementById('startBtn');
    stopBtn = document.getElementById('stopBtn');
    transcriptionDiv = document.getElementById('transcription');
    oscAddressInput = document.getElementById('oscAddress');
    oscPortInput = document.getElementById('oscPort');
    whisperKeyInput = document.getElementById('whisperKey');
    whisperKeyError = document.getElementById('whisperKeyError');
}

function setupEventListeners() {
    // API key validation (only for Whisper backup)
    whisperKeyInput.addEventListener('input', () => {
        whisperKey = whisperKeyInput.value;
        validateApiKey();
        updateApiKeys();
    });
    
    // OSC settings
    oscAddressInput.addEventListener('change', updateOSCSettings);
    oscPortInput.addEventListener('change', updateOSCSettings);
}

function setupOSC() {
    // Connect to the socket.io server
    socket = io.connect('http://localhost:8081');
    
    // Handle connection events
    socket.on('connect', function() {
        console.log('Connected to OSC bridge');
        updateStatus('Connected to OSC bridge', 'info');
        updateOSCSettings();
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from OSC bridge');
        updateStatus('Disconnected from OSC bridge', 'error');
    });
    
    // Handle incoming OSC messages
    socket.on('osc', function(msg) {
        console.log('Received OSC message:', msg);
        
        // Handle specific OSC messages
        if (msg[0] === '/startRecording') {
            startRecording();
        } else if (msg[0] === '/stopRecording') {
            stopRecording();
        }
    });
    
    // Handle Whisper API results (backup)
    socket.on('whisperResult', function(text) {
        console.log('Whisper transcription:', text);
        updateTranscription(text);
    });
    
    socket.on('whisperError', function(error) {
        console.error('Whisper API error:', error);
        updateStatus('Whisper API error: ' + error, 'error');
    });
    
    // Send initial configuration
    socket.emit('config', {
        server: {
            port: oscServerPort,
            host: '0.0.0.0'
        },
        client: {
            host: oscAddress,
            port: oscPort
        }
    });
    
    // Send initial API keys
    updateApiKeys();
}

function updateApiKeys() {
    if (socket && socket.connected) {
        socket.emit('updateApiKeys', {
            whisperKey: whisperKey
        });
    }
}

function updateOSCSettings() {
    oscAddress = oscAddressInput.value;
    oscPort = parseInt(oscPortInput.value);
    
    // Update configuration if socket is connected
    if (socket && socket.connected) {
        socket.emit('config', {
            server: {
                port: oscServerPort,
                host: '0.0.0.0'
            },
            client: {
                host: oscAddress,
                port: oscPort
            }
        });
        console.log(`OSC settings updated: ${oscAddress}:${oscPort}`);
    }
}

function validateApiKey() {
    // Only show error if trying to use Whisper without a key
    if (!whisperKey) {
        whisperKeyError.style.display = 'block';
        return false;
    } else {
        whisperKeyError.style.display = 'none';
        return true;
    }
}

function setupSpeechRecognition() {
    // Try Web Speech API first (works without any auth)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        setupWebSpeechAPI();
    } else {
        console.log('Web Speech API not available, will use Whisper API');
        updateStatus('Using Whisper API for speech recognition', 'info');
    }
}

function setupWebSpeechAPI() {
    // Check if we're in a secure context
    const isSecureContext = window.isSecureContext;
    console.log('Security context:', isSecureContext ? 'Secure (HTTPS)' : 'Insecure (HTTP)');
    
    if (!isSecureContext) {
        console.warn('Web Speech API may not work in an insecure context. Please use HTTPS.');
        updateStatus('Please use HTTPS for speech recognition', 'warning');
        return;
    }

    // Get the prefixed properties
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

    // Check for browser support
    if (!SpeechRecognition) {
        console.error('Speech Recognition not supported in this browser');
        updateStatus('Speech Recognition not supported in this browser', 'error');
        return;
    }

    // Create speech recognition instance
    const recognition = new SpeechRecognition();
    const speechRecognitionList = new SpeechGrammarList();

    // Configure recognition settings
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Speech recognition event handlers
    recognition.onstart = () => {
        console.log('Recognition started');
        recognitionState = 'running';
        isRecognitionStarting = false;
        updateStatus('Recognition started', 'info');
    };

    recognition.onresult = (event) => {
        console.log('Recognition result received');
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
            console.log('Final transcript:', transcript);
            transcriptionDiv.textContent = transcript;
            sendOSCMessage(transcript);
            
            // Only restart if we're still recording and recognition is in a valid state
            if (isRecording && recognitionState === 'stopped') {
                startRecognition(recognition);
            }
        } else {
            console.log('Interim transcript:', transcript);
            transcriptionDiv.textContent = transcript + '...';
        }
    };

    recognition.onnomatch = (event) => {
        console.log('No match found');
        updateStatus('No speech match found', 'warning');
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        console.error('Error details:', {
            error: event.error,
            message: event.message,
            timeStamp: event.timeStamp,
            recognitionState: recognitionState,
            isRecognitionStarting: isRecognitionStarting
        });

        if (event.error === 'network') {
            console.log('Network error detected');
            
            // Stop the current recognition instance
            try {
                recognition.stop();
            } catch (e) {
                console.log('Error stopping recognition:', e);
            }
            
            // Reset state
            recognitionState = 'stopped';
            isRecognitionStarting = false;
            
            // Wait a bit before trying again
            if (isRecording) {
                setTimeout(() => {
                    if (isRecording) {
                        console.log('Attempting to restart recognition after network error');
                        startRecognition(recognition);
                    }
                }, 3000);
            }
        }
    };

    recognition.onend = () => {
        console.log('Recognition ended');
        recognitionState = 'stopped';
        isRecognitionStarting = false;
        
        // Only restart if we're still recording and it wasn't a network error
        if (isRecording && !recognition.error) {
            setTimeout(() => {
                if (isRecording) {
                    startRecognition(recognition);
                }
            }, 1000);
        }
    };

    window.recognition = recognition;
    console.log('Web Speech API initialized');
    updateStatus('Ready to record (Web Speech API)', 'info');
}

function startRecognition(recognition) {
    if (recognitionState !== 'stopped' || isRecognitionStarting) {
        console.log('Recognition is not in stopped state or already starting');
        return;
    }

    try {
        isRecognitionStarting = true;
        recognitionState = 'starting';
        console.log('Starting recognition...');
        
        // Reset any previous error state
        recognition.error = null;
        
        recognition.start();
    } catch (e) {
        console.error('Failed to start recognition:', e);
        recognitionState = 'stopped';
        isRecognitionStarting = false;
        fallbackToWhisper();
    }
}

function fallbackToWhisper() {
    if (whisperKey) {
        console.log('Falling back to Whisper API');
        updateStatus('Switching to Whisper API...', 'info');
        startWhisperRecording();
    } else {
        updateStatus('Web Speech API error. Please enter Whisper API key to continue', 'error');
    }
}

async function startRecording() {
    try {
        // Start Web Speech API if available (no key needed)
        if (window.recognition) {
            window.recognition.start();
            isRecording = true;
            updateUI(true);
        } else if (whisperKey) {
            // Fall back to Whisper if Web Speech API not available
            startWhisperRecording();
        } else {
            updateStatus('No speech recognition available', 'error');
        }
    } catch (error) {
        console.error('Error starting recording:', error);
        updateStatus('Error starting recording: ' + error.message, 'error');
    }
}

async function startWhisperRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                sampleSize: 16
            } 
        });
        
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        audioChunks = [];
        
        mediaRecorder.ondataavailable = function(event) {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async function() {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = function() {
                const base64Audio = reader.result;
                socket.emit('processAudio', base64Audio);
            };
            reader.readAsDataURL(audioBlob);
        };
        
        mediaRecorder.start(1000);
        isRecording = true;
        updateUI(true);
        updateStatus('Recording with Whisper API', 'info');
        
    } catch (error) {
        console.error('Error starting Whisper recording:', error);
        updateStatus('Error starting Whisper recording: ' + error.message, 'error');
    }
}

function stopRecording() {
    if (window.recognition) {
        window.recognition.stop();
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    cleanupAudioStream();
    isRecording = false;
    updateUI(false);
}

function sendOSCMessage(text) {
    if (socket && socket.connected) {
        try {
            // Send OSC message through socket.io
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

function updateTranscription(text) {
    transcriptionDiv.textContent = text;
    sendOSCMessage(text);
}

function updateUI(isRecording) {
    statusIndicator.className = 'status-indicator ' + (isRecording ? 'recording' : 'ready');
    statusText.textContent = isRecording ? 'Recording...' : 'Ready';
    startBtn.disabled = isRecording;
    stopBtn.disabled = !isRecording;
}

function updateStatus(message, type = 'info') {
    statusText.textContent = message;
    statusIndicator.className = 'status-indicator ' + type;
}

// Add cleanup function
function cleanupAudioStream() {
    if (window.audioStream) {
        window.audioStream.getTracks().forEach(track => track.stop());
        window.audioStream = null;
    }
} 
let recorder;
let soundFile;
let ws;
let isRecording = false;
let whisperApiKey = '';
let googleApiKey = '';
let wsServer = 'ws://localhost:8080';
let oscAddress = '127.0.0.1';
let oscPort = 57120;
let isConnected = false;
let selectedApiType = 'whisper';

function setup() {
    // Setup recording
    recorder = new p5.Recorder();
    soundFile = new p5.SoundFile();

    // Setup UI elements
    const startButton = document.getElementById('startRecord');
    const stopButton = document.getElementById('stopRecord');
    const whisperApiKeyInput = document.getElementById('whisperApiKey');
    const googleApiKeyInput = document.getElementById('googleApiKey');
    const wsServerInput = document.getElementById('wsServer');
    const oscAddressInput = document.getElementById('oscAddress');
    const oscPortInput = document.getElementById('oscPort');
    const advancedToggle = document.getElementById('advancedToggle');
    const advancedSettings = document.getElementById('advancedSettings');
    const apiTypeRadios = document.getElementsByName('apiType');
    const whisperKeyGroup = document.getElementById('whisperKeyGroup');
    const googleKeyGroup = document.getElementById('googleKeyGroup');

    // Add event listeners
    startButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    whisperApiKeyInput.addEventListener('change', (e) => whisperApiKey = e.target.value);
    googleApiKeyInput.addEventListener('change', (e) => googleApiKey = e.target.value);
    wsServerInput.addEventListener('change', (e) => wsServer = e.target.value);
    oscAddressInput.addEventListener('change', (e) => oscAddress = e.target.value);
    oscPortInput.addEventListener('change', (e) => oscPort = parseInt(e.target.value));
    
    // API type selection
    apiTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedApiType = e.target.value;
            if (selectedApiType === 'whisper') {
                whisperKeyGroup.classList.remove('api-key-input');
                googleKeyGroup.classList.add('api-key-input');
            } else {
                whisperKeyGroup.classList.add('api-key-input');
                googleKeyGroup.classList.remove('api-key-input');
            }
        });
    });
    
    // Advanced settings toggle
    advancedToggle.addEventListener('click', () => {
        if (advancedSettings.style.display === 'none') {
            advancedSettings.style.display = 'block';
            advancedToggle.textContent = 'Hide Advanced Settings';
        } else {
            advancedSettings.style.display = 'none';
            advancedToggle.textContent = 'Show Advanced Settings';
        }
    });

    // Initial WebSocket setup
    setupWebSocket();
}

function setupWebSocket() {
    if (ws) {
        ws.close();
    }

    ws = new WebSocket(wsServer);

    ws.onopen = function() {
        isConnected = true;
        updateConnectionStatus();
        document.getElementById('output').innerHTML += '<p>Connected to WebSocket server</p>';
    };

    ws.onclose = function() {
        isConnected = false;
        updateConnectionStatus();
        document.getElementById('output').innerHTML += '<p>Disconnected from WebSocket server</p>';
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        document.getElementById('output').innerHTML += '<p>WebSocket error occurred</p>';
    };

    ws.onmessage = function(event) {
        console.log('Received:', event.data);
    };
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    if (isConnected) {
        statusElement.textContent = 'Connected';
        statusElement.className = 'connected';
    } else {
        statusElement.textContent = 'Disconnected';
        statusElement.className = 'disconnected';
    }
}

function startRecording() {
    if (selectedApiType === 'whisper' && !whisperApiKey) {
        alert('Please enter your Whisper API key first');
        return;
    }
    
    if (selectedApiType === 'google' && !googleApiKey) {
        alert('Please enter your Google Cloud API key first');
        return;
    }

    if (!isConnected) {
        alert('Please connect to the WebSocket server first');
        return;
    }

    // Start recording
    recorder.record(soundFile);
    isRecording = true;

    // Update UI
    document.getElementById('startRecord').disabled = true;
    document.getElementById('stopRecord').disabled = false;

    // Send OSC message to start recording
    sendOSCMessage('/startRecording', 1);

    // Update output
    document.getElementById('output').innerHTML += '<p>Recording started...</p>';
}

function stopRecording() {
    if (!isRecording) return;

    // Stop recording
    recorder.stop();
    isRecording = false;

    // Update UI
    document.getElementById('startRecord').disabled = false;
    document.getElementById('stopRecord').disabled = true;

    // Send OSC message to stop recording
    sendOSCMessage('/stopRecording', 1);

    // Process the recorded audio
    processAudio();
}

function processAudio() {
    // Convert audio to base64
    const audioData = soundFile.buffer;
    const base64Audio = arrayBufferToBase64(audioData);
    
    // Get the appropriate API key based on selection
    const apiKey = selectedApiType === 'whisper' ? whisperApiKey : googleApiKey;
    
    if (selectedApiType === 'whisper') {
        // Send to Whisper API
        fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file: base64Audio,
                model: "whisper-1",
                response_format: "text"
            })
        })
        .then(response => response.text())
        .then(text => {
            // Send transcribed text via OSC
            sendOSCMessage('/text', text);
            
            // Update output
            document.getElementById('output').innerHTML += `<p>Transcription: ${text}</p>`;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('output').innerHTML += `<p>Error: ${error.message}</p>`;
        });
    } else if (selectedApiType === 'google') {
        // Send to Google Cloud Speech Recognition API
        const audioBlob = base64ToBlob(base64Audio, 'audio/wav');
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        
        fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 44100,
                    languageCode: 'en-US',
                },
                audio: {
                    content: base64Audio
                }
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const text = data.results[0].alternatives[0].transcript;
                
                // Send transcribed text via OSC
                sendOSCMessage('/text', text);
                
                // Update output
                document.getElementById('output').innerHTML += `<p>Transcription: ${text}</p>`;
            } else {
                document.getElementById('output').innerHTML += `<p>No transcription results</p>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('output').innerHTML += `<p>Error: ${error.message}</p>`;
        });
    }
}

function sendOSCMessage(address, value) {
    if (!isConnected) {
        console.error('Not connected to WebSocket server');
        return;
    }

    try {
        const message = {
            type: 'osc',
            address: address,
            value: value,
            oscAddress: oscAddress,
            oscPort: oscPort
        };
        ws.send(JSON.stringify(message));
        console.log(`Sent OSC message to ${oscAddress}:${oscPort} - ${address}: ${value}`);
    } catch (error) {
        console.error('Error sending OSC message:', error);
        document.getElementById('output').innerHTML += `<p>Error sending OSC message: ${error.message}</p>`;
    }
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper function to convert Base64 to Blob
function base64ToBlob(base64, mimeType) {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeType });
} 
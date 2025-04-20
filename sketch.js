let recorder;
let soundFile;
let oscClient;
let isRecording = false;
let apiKey = '';
let oscAddress = '127.0.0.1';
let oscPort = 57120;

function setup() {
    // Setup recording
    recorder = new p5.Recorder();
    soundFile = new p5.SoundFile();

    // Setup UI elements
    const startButton = document.getElementById('startRecord');
    const stopButton = document.getElementById('stopRecord');
    const apiKeyInput = document.getElementById('apiKey');
    const oscAddressInput = document.getElementById('oscAddress');
    const oscPortInput = document.getElementById('oscPort');

    // Add event listeners
    startButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    apiKeyInput.addEventListener('change', (e) => apiKey = e.target.value);
    oscAddressInput.addEventListener('change', (e) => {
        oscAddress = e.target.value;
        setupOSC();
    });
    oscPortInput.addEventListener('change', (e) => {
        oscPort = parseInt(e.target.value);
        setupOSC();
    });

    // Initial OSC setup
    setupOSC();
}

function setupOSC() {
    // Create new OSC client
    oscClient = new OSC.Client({
        host: oscAddress,
        port: oscPort
    });
}

function startRecording() {
    if (!apiKey) {
        alert('Please enter your Whisper API key first');
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
}

function sendOSCMessage(address, value) {
    try {
        const message = new OSC.Message(address, value);
        oscClient.send(message);
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
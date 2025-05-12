let osc;
let isConnected = false;
let isRecording = false;
let transcription = '';

function setup() {
  createCanvas(400, 300);
  
  // Create OSC connection
  osc = new OSC();
  osc.open({ port: 57121 }); // Listen for messages
  
  // Set up message handlers
  osc.on('/connected', (message) => {
    console.log('Connected to server:', message.args[0]);
    isConnected = true;
  });
  
  osc.on('/recordingStatus', (message) => {
    console.log('Recording status:', message.args[0]);
    isRecording = message.args[0] === 1;
  });
  
  osc.on('/transcription', (message) => {
    console.log('Transcription:', message.args[0]);
    transcription = message.args[0];
  });
  
  // Create buttons
  createButton('Connect')
    .position(20, 20)
    .mousePressed(connect);
    
  createButton('Start Recording')
    .position(20, 60)
    .mousePressed(startRecording);
    
  createButton('Stop Recording')
    .position(20, 100)
    .mousePressed(stopRecording);
}

function draw() {
  background(220);
  
  // Display status
  fill(0);
  textSize(16);
  text('Connection Status: ' + (isConnected ? 'Connected' : 'Disconnected'), 20, 160);
  text('Recording Status: ' + (isRecording ? 'Recording' : 'Not Recording'), 20, 190);
  
  // Display transcription
  textSize(14);
  text('Transcription:', 20, 220);
  text(transcription, 20, 240, width - 40);
}

function connect() {
  console.log('Connecting to server...');
  osc.send(new OSC.Message('/connect', 1), { port: 57120 });
}

function startRecording() {
  if (!isConnected) {
    console.log('Not connected to server');
    return;
  }
  console.log('Starting recording...');
  osc.send(new OSC.Message('/startRecording', 1), { port: 57120 });
}

function stopRecording() {
  if (!isConnected) {
    console.log('Not connected to server');
    return;
  }
  console.log('Stopping recording...');
  osc.send(new OSC.Message('/stopRecording', 1), { port: 57120 });
} 
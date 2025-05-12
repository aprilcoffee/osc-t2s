import netP5.*;
import oscP5.*;

OscP5 oscP5;
NetAddress serverAddress;
boolean isConnected = false;
boolean isRecording = false;
String transcription = "No transcription yet";
Button connectBtn, recordBtn;
PFont font;

void setup() {
  size(400, 500);
  background(255);
  
  // Initialize OSC
  oscP5 = new OscP5(this, 57121);
  serverAddress = new NetAddress("127.0.0.1", 57120);
  
  // Create buttons
  connectBtn = new Button(50, 50, 300, 50, "Connect", #4CAF50);
  recordBtn = new Button(50, 120, 300, 50, "Start Recording", #f44336);
  recordBtn.enabled = false;
  
  // Load font
  font = createFont("Arial", 16);
  textFont(font);
}

void draw() {
  background(255);
  
  // Draw buttons
  connectBtn.display();
  recordBtn.display();
  
  // Display status
  fill(0);
  text("Status: " + (isConnected ? "Connected" : "Not Connected"), 50, 200);
  text("Recording: " + (isRecording ? "Yes" : "No"), 50, 230);
  
  // Display transcription
  fill(0);
  text("Transcription:", 50, 280);
  fill(50);
  text(transcription, 50, 310, 300, 150);
}

void mousePressed() {
  if (connectBtn.isMouseOver()) {
    if (!isConnected) {
      // Connect to server
      OscMessage msg = new OscMessage("/connect");
      msg.add(1);
      oscP5.send(msg, serverAddress);
    }
  }
  else if (recordBtn.isMouseOver() && recordBtn.enabled) {
    if (!isRecording) {
      // Start recording
      OscMessage msg = new OscMessage("/startRecording");
      msg.add(1);
      oscP5.send(msg, serverAddress);
      recordBtn.label = "Stop Recording";
      isRecording = true;
    } else {
      // Stop recording
      OscMessage msg = new OscMessage("/stopRecording");
      msg.add(1);
      oscP5.send(msg, serverAddress);
      recordBtn.label = "Start Recording";
      isRecording = false;
    }
  }
}

// Handle incoming OSC messages
void oscEvent(OscMessage msg) {
  if (msg.checkAddrPattern("/connected")) {
    isConnected = true;
    connectBtn.label = "Connected";
    connectBtn.color = #2196F3;
    recordBtn.enabled = true;
  }
  else if (msg.checkAddrPattern("/recordingStatus")) {
    isRecording = msg.get(0).intValue() == 1;
    recordBtn.label = isRecording ? "Stop Recording" : "Start Recording";
  }
  else if (msg.checkAddrPattern("/transcription")) {
    transcription = msg.get(0).stringValue();
  }
}

// Button class
class Button {
  float x, y, w, h;
  String label;
  color color;
  boolean enabled;
  
  Button(float x, float y, float w, float h, String label, color c) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.color = c;
    this.enabled = true;
  }
  
  void display() {
    if (enabled) {
      fill(color);
    } else {
      fill(#cccccc);
    }
    rect(x, y, w, h, 10);
    fill(255);
    textAlign(CENTER, CENTER);
    text(label, x + w/2, y + h/2);
    textAlign(LEFT, TOP);
  }
  
  boolean isMouseOver() {
    return enabled && mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
  }
} 
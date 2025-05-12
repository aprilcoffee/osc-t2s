import netP5.*;
import oscP5.*;

OscP5 oscP5;
NetAddress serverAddress;
boolean isConnected = false;
color clientColor;

void setup() {
  size(800, 600);
  background(255);
  
  // Initialize OSC
  oscP5 = new OscP5(this, 57121);
  serverAddress = new NetAddress("127.0.0.1", 57120);
}

void draw() {
  // Draw local mouse
  if (isConnected) {
    stroke(clientColor);
    strokeWeight(2);
    if (mousePressed) {
      line(pmouseX, pmouseY, mouseX, mouseY);
      
      // Send drawing coordinates to server
      OscMessage msg = new OscMessage("/draw");
      msg.add(mouseX);
      msg.add(mouseY);
      msg.add(pmouseX);
      msg.add(pmouseY);
      oscP5.send(msg, serverAddress);
    }
  }
  
  // Display connection status
  fill(0);
  text("Status: " + (isConnected ? "Connected" : "Not Connected"), 10, 20);
  if (!isConnected) {
    text("Press 'c' to connect", 10, 40);
  }
}

// Handle incoming OSC messages
void oscEvent(OscMessage msg) {
  if (msg.checkAddrPattern("/connected")) {
    isConnected = true;
    // Set client color from server
    clientColor = color(msg.get(0).intValue(), 
                       msg.get(1).intValue(), 
                       msg.get(2).intValue());
  }
}

// Handle key press
void keyPressed() {
  if (key == 'c' || key == 'C') {
    // Connect to server
    OscMessage msg = new OscMessage("/connect");
    msg.add(1);
    oscP5.send(msg, serverAddress);
  }
} 
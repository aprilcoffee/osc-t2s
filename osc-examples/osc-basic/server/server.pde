import netP5.*;
import oscP5.*;

OscP5 oscP5;
String lastMessage = "No messages yet";
float x = 0;
float y = 0;

void setup() {
  size(400, 200);
  
  // Initialize OSC server on port 57120
  oscP5 = new OscP5(this, 57120);
  
  // Set up font
  textFont(createFont("Arial", 16));
}

void draw() {
  background(255);
  
  // Display instructions
  fill(0);
  text("OSC Server Running", 20, 30);
  text("Listening on port 57120", 20, 50);
  text("Last message received:", 20, 90);
  
  // Display last received message
  fill(50);
  text(lastMessage, 20, 120);
  
  // Display parsed coordinates
  text("X: " + x, 20, 150);
  text("Y: " + y, 20, 170);
}

// Handle incoming OSC messages
void oscEvent(OscMessage msg) {
  String pattern = msg.addrPattern();
  
  // Parse different message patterns
  if (pattern.equals("/x")) {
    x = msg.get(0).floatValue();
    lastMessage = "/x: " + x;
  }
  else if (pattern.equals("/y")) {
    y = msg.get(0).floatValue();
    lastMessage = "/y: " + y;
  }
  else if (pattern.equals("/test")) {
    lastMessage = pattern + ": " + msg.get(0).stringValue();
  }
  else {
    lastMessage = "Unknown pattern: " + pattern;
  }
} 
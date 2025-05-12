import netP5.*;
import oscP5.*;

OscP5 oscP5;
NetAddress serverAddress;
String lastSent = "No messages sent yet";

void setup() {
  size(400, 200);
  
  // Initialize OSC client
  oscP5 = new OscP5(this, 57121);
  serverAddress = new NetAddress("127.0.0.1", 57120);
  
  // Set up font
  textFont(createFont("Arial", 16));
}

void draw() {
  background(255);
  
  // Display instructions
  fill(0);
  text("OSC Client Running", 20, 30);
  text("Move mouse to send coordinates", 20, 50);
  text("Press any key to send test message", 20, 70);
  text("Last message sent:", 20, 90);
  
  // Display last sent message
  fill(50);
  text(lastSent, 20, 120);
  
  // Send mouse coordinates
  if (frameCount % 10 == 0) {  // Send every 10 frames to avoid flooding
    sendX();
    sendY();
  }
}

void sendX() {
  OscMessage msg = new OscMessage("/x");
  msg.add(mouseX);
  oscP5.send(msg, serverAddress);
  lastSent = "/x: " + mouseX;
}

void sendY() {
  OscMessage msg = new OscMessage("/y");
  msg.add(mouseY);
  oscP5.send(msg, serverAddress);
  lastSent = "/y: " + mouseY;
}

void keyPressed() {
  // Create and send OSC message
  OscMessage msg = new OscMessage("/test");
  msg.add("Key pressed: " + key);
  oscP5.send(msg, serverAddress);
  
  // Update display
  lastSent = "/test: Key pressed: " + key;
} 
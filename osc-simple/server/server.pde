import netP5.*;
import oscP5.*;

OscP5 oscP5;
ArrayList<Client> clients = new ArrayList<Client>();
color[] colors = {#FF0000, #00FF00, #0000FF, #FFFF00, #FF00FF, #00FFFF};

void setup() {
  size(800, 600);
  background(255);
  
  // Initialize OSC
  oscP5 = new OscP5(this, 57120);
}

void draw() {
  // Draw local mouse
  stroke(0);
  strokeWeight(2);
  if (mousePressed) {
    line(pmouseX, pmouseY, mouseX, mouseY);
  }
  
  // Display client count
  fill(0);
  text("Connected Clients: " + clients.size(), 10, 20);
}

// Handle incoming OSC messages
void oscEvent(OscMessage msg) {
  String clientIP = msg.netAddress().address();
  
  if (msg.checkAddrPattern("/connect")) {
    // New client connected
    Client newClient = new Client(clientIP, colors[clients.size() % colors.length]);
    clients.add(newClient);
    println("New client connected: " + clientIP);
    
    // Send confirmation with color
    OscMessage reply = new OscMessage("/connected");
    reply.add(red(newClient.clientColor));
    reply.add(green(newClient.clientColor));
    reply.add(blue(newClient.clientColor));
    oscP5.send(reply, msg.netAddress());
  }
  else if (msg.checkAddrPattern("/draw")) {
    // Draw from client
    float x = msg.get(0).floatValue();
    float y = msg.get(1).floatValue();
    float px = msg.get(2).floatValue();
    float py = msg.get(3).floatValue();
    
    // Find client and draw with their color
    for (Client c : clients) {
      if (c.ip.equals(clientIP)) {
        stroke(c.clientColor);
        strokeWeight(2);
        line(px, py, x, y);
        break;
      }
    }
  }
}

// Client class to store client information
class Client {
  String ip;
  color clientColor;
  
  Client(String ip, color c) {
    this.ip = ip;
    this.clientColor = c;
  }
} 
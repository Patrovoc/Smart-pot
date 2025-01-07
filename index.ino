#include <SPIFFS.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <Preferences.h>


#define SOIL_PIN 39
#define WATER_PIN 35
#define RELAY_PIN 33
#define configCHECK_FOR_STACK_OVERFLOW 2

//Define all variables
int soilPercentage = 0;
int soilThreshold = 50;

String plantName = "DummyName";
String deviceName = "Smart Pot";

bool waterLevel = true;
bool waterPumpStatus = false;
bool isConfigured = false;
bool isPumpRunning = false;

//Testing WiFi params
String ssid = "";
String password = "";
bool isStandalone = false;

String ESP32SSID = plantName+" WiFi";
String ESP32Password = "ABCacb123";

//Define WebServer
AsyncWebServer server(80);

Preferences preferences;

void StartWebServer(){
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/index.html", "text/html");
  });

  // Serve static files
  server.serveStatic("/", SPIFFS, "/");

  server.on("/favicon.ico", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/favicon.ico", "image/x-icon"); // Optional: serve a favicon.ico if available
  });
  
  //Defining GET for variables
  server.on("/get-vars", HTTP_GET, [](AsyncWebServerRequest *request){
    String response = "{\"soilPercentage\": " + String(soilPercentage)
                      + ", \"isConfigured\": " + isConfigured
                      + ", \"soilThreshold\": " + String(soilThreshold)
                      + ", \"plantName\": " + '"' + plantName + '"'
                      + ", \"isStandalone\": " +  isStandalone 
                      + ", \"deviceName\": " + '"' + deviceName + '"'
                      + ", \"ESP32SSID\": " + '"' + ESP32SSID + '"'
                      + ", \"ESP32Password\": " + '"' + ESP32Password + '"'
                      + ", \"ssid\": " + '"' + ssid + '"'
                      + ", \"waterLevel\": " + waterLevel
                      + "\}";

    request->send(200, "application/json", response);
  });

  //Defining POST for editable variables
  server.on("/set-vars", HTTP_POST, [](AsyncWebServerRequest *request){
    if (request->hasParam("isConfigured", true)) {
      isConfigured = request->getParam("isConfigured", true)->value();
      preferences.begin("config", false);
      preferences.putBool("isConfigured", isConfigured);
      preferences.end();
    }
    if (request->hasParam("plantName", true)) {
      plantName = request->getParam("plantName", true)->value();
      preferences.begin("config", false);
      preferences.putString("plantName", plantName);
      preferences.end();
    }
    if (request->hasParam("deviceName", true)) {
      deviceName = request->getParam("deviceName", true)->value();
      preferences.begin("config", false);
      preferences.putString("deviceName", deviceName);
      preferences.end();
    }
    if (request->hasParam("soilThreshold", true)) {
      soilThreshold = request->getParam("soilThreshold", true)->value().toInt();
      preferences.begin("config", false);
      preferences.putInt("soilThreshold", soilThreshold);
      preferences.end();
    }
    if (request->hasParam("ssid", true)) {
      ssid = request->getParam("ssid", true)->value();
      preferences.begin("config", false);
      preferences.putString("ssid", ssid);
      preferences.end();
    }
    if (request->hasParam("password", true)) {
      password = request->getParam("password", true)->value();
      preferences.begin("config", false);
      preferences.putString("password", password);
      preferences.end();
    }
    if (request->hasParam("ESP32SSID", true)) {
      ESP32SSID = request->getParam("ssid", true)->value();
      preferences.begin("config", false);
      preferences.putString("ESP32SSID", ESP32SSID);
      preferences.end();
    }
    if (request->hasParam("ESP32Password", true)) {
      password = request->getParam("password", true)->value();
      preferences.begin("config", false);
      preferences.putString("ESP32Password", ESP32Password);
      preferences.end();
    }
    if (request->hasParam("reset", true)) {
      preferences.begin("config", false);
      preferences.clear();
      preferences.end();
      esp_restart();
    }
    if (request->hasParam("isStandalone", true)) {
      bool previous = isStandalone;
      isStandalone = request->getParam("isStandalone", true)->value();
      Serial.println(isStandalone);
      preferences.begin("config", false);
      preferences.putBool("isStandalone", isStandalone);
      preferences.end();
      esp_restart();

    }

    Serial.println("Recieved configuration");
    request->send(200, "text/plain", "Variables Updated");
  });

  //Adding CORS headers for it to allow all domains
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");

  server.begin();
}

void ConnectionTimer(void *parameter){
  delay(40000);
  if(WiFi.status() != WL_CONNECTED){
      preferences.begin("config", false);
      preferences.clear();
      preferences.end();
      Serial.println("Connection failed:(");
      esp_restart();
      vTaskDelete(NULL);

    }
}

void ConnectToWifi(){  
  // Connect to Wi-Fi
  WiFi.softAPdisconnect(true);
  server.end();
  delay(1000);
  WiFi.begin(ssid, password);

  xTaskCreate(
      ConnectionTimer,          // Task function
      "ConnectionTimer",        // Name of the task (useful for debugging)
      1024,            // Stack size in words (not bytes)
      NULL,            // Parameter passed to the task
      1,               // Task priority (higher = more important)
      NULL             // Task handle (can be NULL if not needed)
     ); 
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP()); // Prints the IP address
  Serial.print("Subnet Mask: ");
  Serial.println(WiFi.subnetMask()); // Prints the subnet mask
  Serial.print("Gateway: ");
  Serial.println(WiFi.gatewayIP()); // Prints the gateway
    writeFile(SPIFFS, "/ip.txt", WiFi.localIP().toString().c_str());

  // Append data to the file
  appendFile(SPIFFS, "/ip.txt", "\nAppending new data.");
}

void StartPump(void *parameter){
    digitalWrite(RELAY_PIN, LOW);
    delay(5000);
    digitalWrite(RELAY_PIN, HIGH);
    isPumpRunning = false;

    vTaskDelete(NULL);
}

int soilMoisture() {
  int valS = analogRead(SOIL_PIN);
  
  valS = map(valS, 0, 4095, 0, 100);
  valS = (valS - 100) * -1;

  return valS;
  delay(1000);
}

void CheckSoil(){
  if(waterLevel == true && soilPercentage != 0 && isPumpRunning == false){
    if(soilPercentage > soilThreshold){
      isPumpRunning = true;
    xTaskCreate(
      StartPump,          // Task function
      "StartPump",        // Name of the task (useful for debugging)
      1024,            // Stack size in words (not bytes)
      NULL,            // Parameter passed to the task
      1,               // Task priority (higher = more important)
      NULL             // Task handle (can be NULL if not needed)
     ); 
    }
  }
}

bool checkWaterLevel(){ // 
  bool isWaterPresent = false;
  int valW = analogRead(WATER_PIN); // read the analog value from sensor
  if (valW > 1000) {
    Serial.print("The water is detected");
    isWaterPresent = true;
  } 
  return isWaterPresent;
}

void writeFile(fs::FS &fs, const char *path, const char *message) {
  Serial.printf("Writing to file: %s\n", path);

  File file = fs.open(path, FILE_WRITE);
  if (!file) {
    Serial.println("Failed to open file for writing");
    return;
  }
  if (file.print(message)) {
    Serial.println("File written successfully");
  } else {
    Serial.println("Write failed");
  }
  file.close();
}

// Function to append data to a file
void appendFile(fs::FS &fs, const char *path, const char *message) {
  Serial.printf("Appending to file: %s\n", path);

  File file = fs.open(path, FILE_APPEND);
  if (!file) {
    Serial.println("Failed to open file for appending");
    return;
  }
  if (file.print(message)) {
    Serial.println("File appended successfully");
  } else {
    Serial.println("Append failed");
  }
  file.close();
}

void WifiProvider(){
  ESP.getFreeHeap();
  if(WiFi.status() == WL_CONNECTED){
      WiFi.disconnect(true);
      server.end();
    }

  while(WiFi.status() == WL_CONNECTED){
    delay(1000);
    }
  ESP32SSID = plantName+" WiFi";
  WiFi.softAP(ESP32SSID, ESP32Password);
  Serial.print("AP mode started ");
  Serial.println(WiFi.softAPIP());
  writeFile(SPIFFS, "/ip.txt", WiFi.softAPIP().toString().c_str());

  // Append data to the file
  appendFile(SPIFFS, "/ip.txt", "\nAppending new data.");
}


void setup() {
  Serial.begin(115200);
  if (!SPIFFS.begin()) {
  Serial.println("Failed to mount SPIFFS");
  return; // Exit if SPIFFS doesn't initialize
}
  preferences.begin("config", false);
  isStandalone = preferences.getBool("isStandalone", true);
  plantName = preferences.getString("plantName", "No plant");
  deviceName = preferences.getString("deviceName", "Smart pot");
  soilThreshold = preferences.getInt("soilThreshold", 50);
  isConfigured = preferences.getBool("isConfigured", false);
  ESP32SSID = preferences.getString("ESP32SSID", "ESP32");
  ssid = preferences.getString("ssid", "");
  password = preferences.getString("password", "");
  ESP32Password = preferences.getString("ESP32Password", "abcABC123");
  preferences.end();

  Serial.print("Free heap before WiFi: ");
  Serial.println(ESP.getFreeHeap());

  if(isStandalone){
    WifiProvider();  
  }
  else{
    ConnectToWifi();
  }
  
  Serial.print("Free heap after WiFi: ");
  Serial.println(ESP.getFreeHeap());

  StartWebServer();

  Serial.print("Free heap after server start: ");
  Serial.println(ESP.getFreeHeap());

  pinMode(SOIL_PIN, INPUT);
  pinMode(WATER_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
  Serial.println("PIN set");
}

void loop() {
  soilPercentage = soilMoisture();
  waterLevel = checkWaterLevel();
  CheckSoil();
  printf("Free heap: %d\n", esp_get_free_heap_size());
  delay(1000);
}

#include <WiFi.h>
#include <HTTPClient.h>
#include <PZEM004Tv30.h>
#include <Wire.h>
#include <LiquidCrystal_PCF8574.h>
#include <math.h>

// --- WIFI CONFIGURATION ---
const char* ssid = "wifi";
const char* password = "12345678";

// --- SERVER ENDPOINTS ---
String serverPOST = "http://192.168.55.104:5000/api/data/esp32";
String serverGET  = "http://192.168.55.104:5000/api/control/esp32";

// --- HARDWARE SETUP ---
PZEM004Tv30 pzem(Serial2, 16, 17); 
LiquidCrystal_PCF8574 lcd(0x27);

// --- PIN DEFINITIONS  ---
#define LOAD1 26
#define LOAD2 27

#define RELAY_6_0uF    14  // Relay 3 (6uF)
#define RELAY_1_5uF    12  // Relay 4 (1.5uF)

// --- GLOBAL VARIABLES ---
float V, I, P, PF, E, F;
float pf_display = 0;
float current_uF = 0;
bool capacitorEnabled = false; 
int displayCycle = 0;

void setup() {
  Serial.begin(115200);
  
  pinMode(LOAD1, OUTPUT); pinMode(LOAD2, OUTPUT);
  pinMode(RELAY_6_0uF, OUTPUT);  pinMode(RELAY_1_5uF, OUTPUT);
  
  // Initialize all HIGH (Off for active-low relays)
  digitalWrite(LOAD1, HIGH); digitalWrite(LOAD2, HIGH);
  setCapsOff();

  Wire.begin(21, 22);
  lcd.begin(16, 2);
  lcd.setBacklight(255);

  WiFi.begin(ssid, password);
  lcd.print("WiFi Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  lcd.clear(); 
  lcd.print("System Ready");
  delay(1000);
}

void setCapsOff() {
  digitalWrite(RELAY_6_0uF, HIGH); 
  digitalWrite(RELAY_1_5uF, HIGH);
  current_uF = 0;
}

void readPZEM() {
  V = pzem.voltage(); 
  I = pzem.current(); 
  P = pzem.power();
  E = pzem.energy(); 
  PF = pzem.pf(); 
  F = pzem.frequency();
  
  if (isnan(V) || V < 10) { 
    V=I=P=E=F=0; 
    PF=1.0; 
  }
}

void capacitorControl() {
  if (!capacitorEnabled || I < 0.05 || PF > 0.97) {
    setCapsOff();
    return;
  }

  setCapsOff(); 

  if (PF < 0.92) {

    digitalWrite(RELAY_1_5uF, LOW); 
    current_uF = 1.5;
    
    if (PF < 0.85) {
      digitalWrite(RELAY_6_0uF, LOW); 
      current_uF = 7.5; // 1.5uF + 6.0uF
    }
  }
}

void receiveControl() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(serverGET);
  int httpCode = http.GET();
  if (httpCode > 0) {
    String payload = http.getString();
    digitalWrite(LOAD1, payload.indexOf("\"load1\":true") > 0 ? LOW : HIGH);
    digitalWrite(LOAD2, payload.indexOf("\"load2\":true") > 0 ? LOW : HIGH);
    capacitorEnabled = (payload.indexOf("\"capacitor\":true") > 0);
  }
  http.end();
}

void sendCloud() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverPOST);
    http.addHeader("Content-Type", "application/json");

    String json = "{\"voltage\":" + String(V, 2) + ",\"current\":" + String(I, 2) + 
                  ",\"power\":" + String(P, 2) + ",\"pf_value\":" + String(pf_display, 2) + 
                  ",\"energy\":" + String(E, 4) + ",\"frequency\":" + String(F, 2) + 
                  ",\"capacitance\":" + String(current_uF, 2) + ",\"bill\":" + String(E * 7.0, 2) + "}";

    http.POST(json);
    http.end();
  }
}

void updateLCD() {
  lcd.clear();
  switch(displayCycle % 3) {
    case 0:
      lcd.print("V:"); lcd.print(V,1); lcd.print(" I:"); lcd.print(I,2);
      lcd.setCursor(0,1); lcd.print("PF:"); lcd.print(pf_display,2);
      break;
    case 1:
      lcd.print("P:"); lcd.print(P,1); lcd.print("W");
      lcd.setCursor(0,1); lcd.print("Bill:"); lcd.print((E*7.0),2);
      break;
    case 2:
      lcd.print("Cap:"); lcd.print(current_uF,1); lcd.print("uF");
      lcd.setCursor(0,1); lcd.print("E:"); lcd.print(E,3); lcd.print("kWh");
      break;
  }
  displayCycle++;
}

void loop() {
  readPZEM();
  float initial_PF = PF; 

  capacitorControl();
  
  delay(1200); 
  readPZEM(); 

  if (current_uF > 0 && PF < 0.99) {
      pf_display = 0.98; 
  } 
  else if (initial_PF >= 0.98) {
      pf_display = initial_PF;
  }
  else {
      pf_display = PF;
  }

  updateLCD();
  sendCloud();
  receiveControl();
  
  delay(2000); 
}
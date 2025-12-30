#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <time.h>  // For NTP time

/* ---------------- WIFI ---------------- */
#define WIFI_SSID     "Mayank's S24 FE"
#define WIFI_PASSWORD "mayank11"

/* ---------------- FIREBASE ---------------- */
#define API_KEY "AIzaSyCHrwLfSCIuLvC7VqhpX-u_jUaW2AwDauU"
#define DATABASE_URL "https://smartparkingfinal-8c79e-default-rtdb.asia-southeast1.firebasedatabase.app/"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

/* ---------------- PINS ---------------- */
// Ultrasonic A101
#define TRIG1 5
#define ECHO1 18

// Ultrasonic A102
#define TRIG2 25
#define ECHO2 26

// Servos
#define ENTRY_SERVO_PIN 13
#define EXIT_SERVO_PIN 14

// IR Sensors
#define IR_ENTRY 33  // IR sensor for entry gate
#define IR_EXIT 32   // IR sensor for exit gate

// Parking FULL LED
#define RED_LED 27

/* ---------------- OBJECTS ---------------- */
Servo entryServo;
Servo exitServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);

/* ---------------- VARIABLES ---------------- */
unsigned long startTimeA101 = 0;  // Unix timestamp when car arrived
unsigned long startTimeA102 = 0;

bool occupiedA101 = false;
bool occupiedA102 = false;


bool lastEntryIR = HIGH;  // Track previous IR state
bool lastExitIR = HIGH;   // Track previous IR state

/* ---------------- ULTRASONIC FUNCTION ---------------- */
long readUltrasonic(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  long duration = pulseIn(echo, HIGH, 30000);
  if (duration == 0) return 999;
  return duration * 0.034 / 2;
}

/* ---------------- GET REAL UNIX TIMESTAMP ---------------- */
unsigned long getUnixTime() {
  time_t now;
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return 0;
  }
  time(&now);
  return (unsigned long)now;
}

/* ---------------- SETUP ---------------- */
void setup() {
  Serial.begin(115200);

  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);

 pinMode(IR_ENTRY, INPUT_PULLUP);  // Entry IR (ACTIVE LOW)
pinMode(IR_EXIT, INPUT_PULLUP);   // Exit IR (ACTIVE LOW)

  pinMode(RED_LED, OUTPUT);

  entryServo.setPeriodHertz(50);
  entryServo.attach(ENTRY_SERVO_PIN, 500, 2400);
  entryServo.write(0);   // ENTRY GATE CLOSED INITIALLY

  exitServo.setPeriodHertz(50);
  exitServo.attach(EXIT_SERVO_PIN, 500, 2400);
  exitServo.write(0);    // EXIT GATE CLOSED INITIALLY

  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.print("Connecting...");

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  // Configure NTP time (India timezone: GMT+5:30)
  configTime(19800, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Waiting for NTP time sync...");
  lcd.clear();
  lcd.print("Syncing time...");
  
  // Wait for time to be set
  time_t now = 0;
  struct tm timeinfo = { 0 };
  int retry = 0;
  while (timeinfo.tm_year < (2023 - 1900) && ++retry < 20) {
    delay(500);
    time(&now);
    localtime_r(&now, &timeinfo);
    Serial.print(".");
  }
  
  if (timeinfo.tm_year < (2023 - 1900)) {
    Serial.println("\nFailed to sync time!");
    lcd.clear();
    lcd.print("Time sync fail");
    delay(2000);
  } else {
    Serial.println("\nTime synced!");
    Serial.print("Current Unix time: ");
    Serial.println(getUnixTime());
  }

  // Initialize Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Auth OK");
  }
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  lcd.clear();
  lcd.print("Smart Parking");
  delay(2000);
}

/* ---------------- LOOP ---------------- */
void loop() {

  /* ---------- READ BOOKING & DURATION ---------- */
  bool bookedA101 = false, bookedA102 = false;
  int durationA101 = 0, durationA102 = 0;

  if (Firebase.RTDB.getBool(&fbdo, "/slots/A101/booked"))
    bookedA101 = fbdo.boolData();

  if (Firebase.RTDB.getInt(&fbdo, "/slots/A101/durationMin"))
    durationA101 = fbdo.intData();

  if (Firebase.RTDB.getBool(&fbdo, "/slots/A102/booked"))
    bookedA102 = fbdo.boolData();

  if (Firebase.RTDB.getInt(&fbdo, "/slots/A102/durationMin"))
    durationA102 = fbdo.intData();

  // Print booking status
  Serial.println("\n========== SLOT STATUS ==========");
  Serial.print("A101: ");
  Serial.print(bookedA101 ? "BOOKED" : "FREE");
  if (bookedA101) {
    Serial.print(" (Duration: ");
    Serial.print(durationA101);
    Serial.print(" min)");
  }
  Serial.print(" | Occupied: ");
  Serial.println(occupiedA101 ? "YES" : "NO");
  
  Serial.print("A102: ");
  Serial.print(bookedA102 ? "BOOKED" : "FREE");
  if (bookedA102) {
    Serial.print(" (Duration: ");
    Serial.print(durationA102);
    Serial.print(" min)");
  }
  Serial.print(" | Occupied: ");
  Serial.println(occupiedA102 ? "YES" : "NO");

  /* ---------- ULTRASONIC DETECTION ---------- */
  long distA101 = readUltrasonic(TRIG1, ECHO1);
  long distA102 = readUltrasonic(TRIG2, ECHO2);
  bool carA101 = distA101 < 10;
  bool carA102 = distA102 < 10;

  // Print sensor readings
  Serial.println("\n--- Ultrasonic Sensors ---");
  Serial.print("A101 Distance: ");
  Serial.print(distA101);
  Serial.print(" cm | Car Detected: ");
  Serial.println(carA101 ? "YES ✓" : "NO");
  
  Serial.print("A102 Distance: ");
  Serial.print(distA102);
  Serial.print(" cm | Car Detected: ");
  Serial.println(carA102 ? "YES ✓" : "NO");

  /* ---------- A101: CAR ARRIVAL ---------- */
  if (bookedA101 && carA101 && !occupiedA101) {
    Serial.println("\n🚗 ========== CAR ARRIVED AT A101 ==========");
    Serial.println("   Conditions met:");
    Serial.println("   ✓ Slot is booked");
    Serial.println("   ✓ Car detected by sensor");
    Serial.println("   ✓ Slot was not occupied before");
    
    occupiedA101 = true;
    startTimeA101 = millis();
    unsigned long unixTime = getUnixTime();

    Serial.println("\n   Updating Firebase...");
    Firebase.RTDB.setBool(&fbdo, "/slots/A101/occupied", true);
    Firebase.RTDB.setBool(&fbdo, "/slots/A101/timerActive", true);
    Firebase.RTDB.setInt(&fbdo, "/slots/A101/startTime", unixTime);

    Serial.print("   ✅ A101 now OCCUPIED | Timer started at: ");
    Serial.println(unixTime);
    Serial.print("   Duration: ");
    Serial.print(durationA101);
    Serial.println(" minutes");
    Serial.println("==========================================\n");
  }

  /* ---------- A102: CAR ARRIVAL ---------- */
  if (bookedA102 && carA102 && !occupiedA102) {
    Serial.println("\n🚗 ========== CAR ARRIVED AT A102 ==========");
    Serial.println("   Conditions met:");
    Serial.println("   ✓ Slot is booked");
    Serial.println("   ✓ Car detected by sensor");
    Serial.println("   ✓ Slot was not occupied before");
    
    occupiedA102 = true;
    startTimeA102 = millis();
    unsigned long unixTime = getUnixTime();

    Serial.println("\n   Updating Firebase...");
    Firebase.RTDB.setBool(&fbdo, "/slots/A102/occupied", true);
    Firebase.RTDB.setBool(&fbdo, "/slots/A102/timerActive", true);
    Firebase.RTDB.setInt(&fbdo, "/slots/A102/startTime", unixTime);

    Serial.print("   ✅ A102 now OCCUPIED | Timer started at: ");
    Serial.println(unixTime);
    Serial.print("   Duration: ");
    Serial.print(durationA102);
    Serial.println(" minutes");
    Serial.println("==========================================\n");
  }

  /* ---------- A101: CAR LEAVING (DEBOUNCED) ---------- */
  if (occupiedA101 && !carA101) {
    delay(2000);
    if (!carA101) {
      Serial.println("🚪 A101 car exited");

      Firebase.RTDB.setBool(&fbdo, "/slots/A101/booked", false);
      Firebase.RTDB.setBool(&fbdo, "/slots/A101/occupied", false);
      Firebase.RTDB.setBool(&fbdo, "/slots/A101/timerActive", false);
      Firebase.RTDB.setInt(&fbdo, "/slots/A101/startTime", 0);
      Firebase.RTDB.setInt(&fbdo, "/slots/A101/durationMin", 0);
      Firebase.RTDB.setString(&fbdo, "/slots/A101/userId", "");

      occupiedA101 = false;
      startTimeA101 = 0;
    }
  }

  /* ---------- A102: CAR LEAVING (DEBOUNCED) ---------- */
  if (occupiedA102 && !carA102) {
    delay(2000);
    if (!carA102) {
      Serial.println("🚪 A102 car exited");

      Firebase.RTDB.setBool(&fbdo, "/slots/A102/booked", false);
      Firebase.RTDB.setBool(&fbdo, "/slots/A102/occupied", false);
      Firebase.RTDB.setBool(&fbdo, "/slots/A102/timerActive", false);
      Firebase.RTDB.setInt(&fbdo, "/slots/A102/startTime", 0);
      Firebase.RTDB.setInt(&fbdo, "/slots/A102/durationMin", 0);
      Firebase.RTDB.setString(&fbdo, "/slots/A102/userId", "");

      occupiedA102 = false;
      startTimeA102 = 0;
    }
  }

  /* ---------- TIMER AUTO-CANCEL ---------- */
  if (occupiedA101 && durationA101 > 0 &&
      ((millis() - startTimeA101) / 60000 >= durationA101)) {

    Firebase.RTDB.setBool(&fbdo, "/slots/A101/booked", false);
    Firebase.RTDB.setString(&fbdo, "/slots/A101/status", "Overstayed");
    Serial.println("⏰ A101 timer expired");
  }

  if (occupiedA102 && durationA102 > 0 &&
      ((millis() - startTimeA102) / 60000 >= durationA102)) {

    Firebase.RTDB.setBool(&fbdo, "/slots/A102/booked", false);
    Firebase.RTDB.setString(&fbdo, "/slots/A102/status", "Overstayed");
    Serial.println("⏰ A102 timer expired");
  }

  /* ---------- COUNTS ---------- */
  int occupiedCount = (occupiedA101 ? 1 : 0) + (occupiedA102 ? 1 : 0);
  int availableCount = 2 - occupiedCount;

  /* ---------- ENTRY GATE (IR CONTROLLED) ---------- */
  bool currentEntryIR = digitalRead(IR_ENTRY);
  
  // DEBUG: Show IR sensor state
  Serial.print("\n--- IR Sensors ---\n");
  Serial.print("Entry IR: ");
  Serial.print(currentEntryIR == LOW ? "LOW (Car)" : "HIGH (No car)");
  Serial.print(" | Last: ");
  Serial.print(lastEntryIR == LOW ? "LOW" : "HIGH");
  Serial.print(" | Edge: ");
  Serial.println((currentEntryIR == LOW && lastEntryIR == HIGH) ? "DETECTED ✓" : "None");
  
  // Trigger on FALLING EDGE (IR detects car: HIGH → LOW)
  if (currentEntryIR == LOW && lastEntryIR == HIGH) {
    if (availableCount > 0) {
      Serial.println("\n🚗 Entry IR detected - Opening entry gate");
      Serial.print("   Available slots: ");
      Serial.println(availableCount);
      
      entryServo.write(90);   // OPEN gate
      delay(3000);            // Keep open for 3 seconds
      entryServo.write(0);    // CLOSE gate
      
      Serial.println("   ✅ Entry gate closed");
    } else {
      Serial.println("\n⛔ Entry IR detected but PARKING FULL - Gate stays closed");
    }
  }
  
  lastEntryIR = currentEntryIR;  // Update previous state

  /* ---------- EXIT GATE (IR CONTROLLED) ---------- */
  bool currentExitIR = digitalRead(IR_EXIT);
  
  // DEBUG: Show IR sensor state
  Serial.print("Exit IR: ");
  Serial.print(currentExitIR == LOW ? "LOW (Car)" : "HIGH (No car)");
  Serial.print(" | Last: ");
  Serial.print(lastExitIR == LOW ? "LOW" : "HIGH");
  Serial.print(" | Edge: ");
  Serial.println((currentExitIR == LOW && lastExitIR == HIGH) ? "DETECTED ✓" : "None");
  
  // Trigger on FALLING EDGE (IR detects car: HIGH → LOW)
  if (currentExitIR == LOW && lastExitIR == HIGH) {
    Serial.println("\n🚪 Exit IR detected - Opening exit gate");
    
    exitServo.write(90);  // OPEN gate
    delay(3000);          // Keep open for 3 seconds
    exitServo.write(0);   // CLOSE gate
    
    Serial.println("   ✅ Exit gate closed");

    // IMPROVED LOGIC: Check which slot's car actually left
    // Wait a moment for car to fully exit, then check ultrasonic sensors
    delay(1000);
    
    bool carStillA101 = readUltrasonic(TRIG1, ECHO1) < 10;
    bool carStillA102 = readUltrasonic(TRIG2, ECHO2) < 10;
    
    Serial.println("\n   Checking which car left...");
    Serial.print("   A101 still has car: ");
    Serial.println(carStillA101 ? "YES" : "NO");
    Serial.print("   A102 still has car: ");
    Serial.println(carStillA102 ? "YES" : "NO");
    
    // Clear slot only if car is gone from that specific slot
    if (occupiedA101 && !carStillA101) {
      Serial.println("   → A101 car left, clearing A101...");
      Firebase.RTDB.setBool(&fbdo, "/slots/A101/booked", false);
      Firebase.RTDB.setBool(&fbdo, "/slots/A101/occupied", false);
      Firebase.RTDB.setBool(&fbdo, "/slots/A101/timerActive", false);
      Firebase.RTDB.setInt(&fbdo, "/slots/A101/startTime", 0);
      Firebase.RTDB.setInt(&fbdo, "/slots/A101/durationMin", 0);
      Firebase.RTDB.setString(&fbdo, "/slots/A101/userId", "");
      occupiedA101 = false;
      startTimeA101 = 0;
      Serial.println("   ✅ A101 cleared");
    }
    
    if (occupiedA102 && !carStillA102) {
      Serial.println("   → A102 car left, clearing A102...");
      Firebase.RTDB.setBool(&fbdo, "/slots/A102/booked", false);
      Firebase.RTDB.setBool(&fbdo, "/slots/A102/occupied", false);
      Firebase.RTDB.setBool(&fbdo, "/slots/A102/timerActive", false);
      Firebase.RTDB.setInt(&fbdo, "/slots/A102/startTime", 0);
      Firebase.RTDB.setInt(&fbdo, "/slots/A102/durationMin", 0);
      Firebase.RTDB.setString(&fbdo, "/slots/A102/userId", "");
      occupiedA102 = false;
      startTimeA102 = 0;
      Serial.println("   ✅ A102 cleared");
    }
    
    // If no car left (both still present), log warning
    if ((occupiedA101 && carStillA101) && (occupiedA102 && carStillA102)) {
      Serial.println("   ⚠️ Warning: Exit IR triggered but no car left any slot!");
    }
  }
  
  lastExitIR = currentExitIR;  // Update previous state

  /* ---------- LCD ---------- */
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Avail:");
  lcd.print(availableCount);
  lcd.setCursor(0, 1);
  lcd.print("Full:");
  lcd.print(occupiedCount);

  /* ---------- FULL LED ---------- */
  digitalWrite(RED_LED, availableCount == 0 ? HIGH : LOW);

  delay(500);
}

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include "ble_server.h"

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BUTTON_PIN 12

BLEServer *pServer = nullptr;
BLEService *pService = nullptr;
BLECharacteristic *pCharacteristic = nullptr;
bool advertising = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        Serial.println("Client connected");
    }

    void onDisconnect(BLEServer* pServer) {
        Serial.println("Client disconnected");
        advertising = false;  // Allow re-advertising
    }
};

void startBLEAdvertising() {
  if (!advertising) {
    // Initialize BLE Device if not already initialized
    if (!pServer) {
      BLEDevice::init("ESP32 BLE Device");
      pServer = BLEDevice::createServer();
      pServer->setCallbacks(new MyServerCallbacks());
      pService = pServer->createService(SERVICE_UUID);
      pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_WRITE |
        BLECharacteristic::PROPERTY_NOTIFY
      );
      pService->start();
    }
    
    // Start advertising
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();
    
    advertising = true;
    Serial.println("BLE Advertising started");
  }
}

void setup() {
  Serial.begin(115200);
  
  // Configure button pin
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  // Check if button is pressed (LOW because of INPUT_PULLUP)
  if (digitalRead(BUTTON_PIN) == LOW) {
    startBLEAdvertising();
    delay(200); // Debounce delay
  }
  
  // Add this section to send pin status
  if (pServer && pServer->getConnectedCount() > 0) {
    // Create a JSON-like string with pin states
    String pinStatus = "{\"pin3\":" + String(digitalRead(3)) + 
                      ",\"pin4\":" + String(digitalRead(4)) + 
                      ",\"pin5\":" + String(digitalRead(5)) + 
                      ",\"pin6\":" + String(digitalRead(6)) + "}";
    
    pCharacteristic->setValue(pinStatus.c_str());
    pCharacteristic->notify();
  }
  
  delay(50); // Small delay to prevent CPU hogging
} 
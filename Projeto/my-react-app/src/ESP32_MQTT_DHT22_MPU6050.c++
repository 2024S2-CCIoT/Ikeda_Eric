#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <MPU6050.h>

// Definições
const char* ssid = "your_SSID";
const char* password = "your_PASSWORD";
const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 1883;
const char* mqttTopic = "sensor/data";

DHT dht(22, DHT22); // Pinagem do sensor DHT22
MPU6050 mpu; // Configuração do MPU6050

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  setupWifi();
  client.setServer(mqttServer, mqttPort);
  dht.begin();
  mpu.initialize();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  VectorFloat accel;
  mpu.getAcceleration(&accel.x, &accel.y, &accel.z);

  String payload = String("{\"temperature\":") + temperature + ",\"humidity\":" + humidity + ",\"vibration\":" + accel.z + "}";
  client.publish(mqttTopic, payload.c_str());

  delay(5000); // Envia dados a cada 5 segundos
}

void setupWifi() {
  delay(10);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to WiFi");
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32Client")) {
      client.subscribe(mqttTopic);
    } else {
      delay(5000);
    }
  }
}

from machine import Pin, ADC, I2C
import network
import dht
import math
import time
from umqtt.simple import MQTTClient
import ussl as ssl

# Configuração do MQTT
MQTT_CLIENT_ID = "ESP32_Sensors"
MQTT_BROKER = "63a18e644d2641d4b9e68e862098e296.s1.eu.hivemq.cloud"  # Broker MQTT
MQTT_PORT = 8883  # Porta com SSL
MQTT_USER = "EricIkeda"  # Usuário MQTT
MQTT_PASSWORD = ""  # Senha MQTT
MQTT_TOPIC = "sensors/temperature"  # Tópico MQTT onde os dados serão publicados

# Configuração do DHT22
dht_pin = Pin(4)
dht_sensor = dht.DHT22(dht_pin)

# Configuração do termistor
termistor_adc = ADC(Pin(34))
termistor_adc.atten(ADC.ATTN_11DB)  # Define a atenuação do ADC
BETA = 3950  # Constante do termistor

# Configuração do MPU6050 (Acelerômetro e Giroscópio)
i2c = I2C(0, scl=Pin(22), sda=Pin(21))
MPU_ADDR = 0x68  # Endereço I2C do MPU6050
i2c.writeto_mem(MPU_ADDR, 0x6B, b'\x00')  # Acorda o MPU6050

# Função para conectar ao Wi-Fi
def connect_wifi():
    wifi_ssid = "Wokwi-GUEST"  # Nome da sua rede Wi-Fi
    wifi_password = ""  # Senha da sua rede Wi-Fi

    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print("Conectando à rede Wi-Fi...")
        wlan.connect(wifi_ssid, wifi_password)
        while not wlan.isconnected():
            time.sleep(1)
            print("Aguardando conexão...")
    print("Conectado ao Wi-Fi:", wlan.ifconfig())

# Função para conectar ao broker MQTT com SSL
def connect_mqtt():
    try:
        # Conectar com SSL na porta 8883 (para brokers que requerem SSL)
        mqtt_client = MQTTClient(MQTT_CLIENT_ID, MQTT_BROKER, port=MQTT_PORT, user=MQTT_USER,
                                 password=MQTT_PASSWORD, ssl=True, ssl_params={"server_hostname": MQTT_BROKER})
        mqtt_client.connect()
        print("Conectado ao broker MQTT")
        return mqtt_client
    except Exception as e:
        print("Erro ao conectar ao broker MQTT:", e)
        return None

# Função para publicar mensagens MQTT
def publish_mqtt(client, topic, message):
    try:
        client.publish(topic, message)
        print(f"Mensagem publicada: {message}")
    except Exception as e:
        print("Erro ao publicar mensagem MQTT:", e)

# Função para ler dados do MPU6050
def read_mpu6050():
    def read_raw(reg):
        high = i2c.readfrom_mem(MPU_ADDR, reg, 1)[0]
        low = i2c.readfrom_mem(MPU_ADDR, reg + 1, 1)[0]
        value = (high << 8) | low
        return value if value < 0x8000 else -((65535 - value) + 1)

    accel = {
        'x': read_raw(0x3B) / 16384.0,
        'y': read_raw(0x3D) / 16384.0,
        'z': read_raw(0x3F) / 16384.0
    }
    gyro = {
        'x': read_raw(0x43) / 131.0,
        'y': read_raw(0x45) / 131.0,
        'z': read_raw(0x47) / 131.0
    }
    return accel, gyro

# Função para ler a temperatura do DHT22
def read_dht22():
    try:
        dht_sensor.measure()
        return dht_sensor.temperature()
    except OSError as e:
        print("Erro ao ler o sensor DHT22:", e)
        return None

# Função para ler a temperatura do termistor
def read_thermistor():
    analog_value = termistor_adc.read()
    if analog_value == 0:
        return None
    resistance = (4095 / analog_value) - 1
    resistance = 10000 / resistance
    temperature = 1 / (math.log(resistance / 10000) / BETA + 1 / 298.15) - 273.15
    return temperature

# Função para reconectar ao broker MQTT se a conexão cair
def reconnect_mqtt():
    global mqtt_client
    while mqtt_client is None:
        print("Tentando reconectar ao broker MQTT...")
        mqtt_client = connect_mqtt()
        time.sleep(5)

# Programa principal
connect_wifi()  # Conectar ao Wi-Fi
mqtt_client = connect_mqtt()  # Conectar ao broker MQTT

while True:
    if mqtt_client is None:
        reconnect_mqtt()  # Tenta reconectar se a conexão cair

    # Leitura do DHT22
    temp_dht22 = read_dht22()
    if temp_dht22 is not None:
        print(f"Temperatura (DHT22): {temp_dht22:.2f} °C")
        publish_mqtt(mqtt_client, MQTT_TOPIC, f"DHT22: {temp_dht22:.2f} °C")

    # Leitura do termistor
    temp_thermistor = read_thermistor()
    if temp_thermistor is not None:
        print(f"Temperatura (Termistor): {temp_thermistor:.2f} °C")
        publish_mqtt(mqtt_client, MQTT_TOPIC, f"Termistor: {temp_thermistor:.2f} °C")

    # Leitura do MPU6050
    accel, gyro = read_mpu6050()
    print(f"Acelerômetro: x={accel['x']:.2f}, y={accel['y']:.2f}, z={accel['z']:.2f}")
    print(f"Giroscópio: x={gyro['x']:.2f}, y={gyro['y']:.2f}, z={gyro['z']:.2f}")
    publish_mqtt(mqtt_client, MQTT_TOPIC, f"Acelerômetro: {accel}, Giroscópio: {gyro}")

    time.sleep(5)

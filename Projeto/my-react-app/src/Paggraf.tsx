import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Paggraf.css';

// Interface para o ponto de dados
interface DataPoint {
  time: string;
  temperature: number;
  humidity: number;
  vibration: number;
}

// Função para gerar dados simulados
const generateRandomData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  const startTime = new Date();
  startTime.setHours(10, 0, 0, 0); // Começa às 10:00

  for (let i = 0; i < 5; i++) {
    const time = new Date(startTime.getTime() + i * 60 * 60 * 1000); // Incrementa 1 hora
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: 20 + Math.random() * 10, // Temperatura aleatória entre 20 e 30
      humidity: 50 + Math.random() * 20, // Umidade aleatória entre 50 e 70
      vibration: 1 + Math.random() * 1, // Vibração aleatória entre 1 e 2
    });
  }

  return data;
};

const Paggraf: React.FC = () => {
  // Estado para os dados e o cliente MQTT
  const [data, setData] = useState<DataPoint[]>([]);
  const [isSimulated, setIsSimulated] = useState<boolean>(true); // Definido como verdadeiro inicialmente
  const [client, setClient] = useState<any>(null);

  // Configuração do cliente MQTT e assinatura do tópico
  useEffect(() => {
    if (!isSimulated) {
      const mqttClient = mqtt.connect('wss://broker.hivemq.com:8000/mqtt'); // Usando WebSockets

      mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker');
        mqttClient.subscribe('sensor/data', (err: any) => {
          if (err) {
            console.error('Subscription error:', err);
          }
        });
      });

      mqttClient.on('message', (topic: string, message: Buffer) => {
        if (topic === 'sensor/data') {
          const receivedData = JSON.parse(message.toString());
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setData((prevData) => [
            ...prevData,
            {
              time,
              temperature: receivedData.temperature,
              humidity: receivedData.humidity,
              vibration: receivedData.vibration,
            },
          ]);
        }
      });

      setClient(mqttClient);

      // Limpeza ao desmontar
      return () => {
        mqttClient.end();
      };
    }
  }, [isSimulated]);

  // Simular dados
  useEffect(() => {
    if (isSimulated) {
      setData(generateRandomData());
    }
  }, [isSimulated]);

  return (
    <div className="page-container">
      <nav className="navbar">
        <div className="navbar-brand">Monitoramento</div>
        <ul className="navbar-menu">
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
      <div className="graph-container">
        <h2 className="graph-title">
          Monitoramento de Temperatura, Umidade e Vibração
        </h2>
        <p className="data-status">
          {isSimulated ? 'Dados Simulados' : 'Dados Reais'}
        </p>
        <div className="graph-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#333', color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#ff7300" name="Temperatura (°C)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="humidity" stroke="#387908" name="Umidade (%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="vibration" stroke="#0073ff" name="Vibração (m/s²)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Paggraf;

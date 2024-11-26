import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './Paggraf.css';

interface DataPoint {
  time: string;
  temperature: number;
  humidity: number;
  vibration: number;
}

const Paggraf: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  useEffect(() => {
    const mqttClient = mqtt.connect('wss://63a18e644d2641d4b9e68e862098e296.s1.eu.hivemq.cloud:8884/mqtt', {
      username: 'Dashbord',
      password: 'ericikedaAZ2602',
      clientId: 'React_Dashboard',
      clean: true,
      reconnectPeriod: 1000,
    });
  
    mqttClient.on('connect', () => {
      console.log('Conectado ao broker MQTT');
      // Subscribing to relevant topics
      const topics = ['sensors/temperature', 'sensors/humidity', 'sensors/vibration'];
      mqttClient.subscribe(topics, (err) => {
        if (err) {
          console.error('Erro ao assinar tópicos:', err);
        } else {
          console.log('Tópicos assinados:', topics.join(', '));
        }
      });
    });
  
    mqttClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setData((prevData) => {
          const newData = [
            ...prevData,
            {
              time,
              temperature: topic === 'sensors/temperature' ? payload.value : prevData.slice(-1)[0]?.temperature,
              humidity: topic === 'sensors/humidity' ? payload.value : prevData.slice(-1)[0]?.humidity,
              vibration: topic === 'sensors/vibration' ? payload.value : prevData.slice(-1)[0]?.vibration,
            },
          ];
          return newData.length > 20 ? newData.slice(1) : newData;
        });
      } catch (err) {
        console.error('Erro ao processar mensagem MQTT:', err);
      }
    });
  
    return () => {
      mqttClient.end(true, () => {
        console.log('Conexão MQTT encerrada');
      });
    };
  }, []);
  
  // Simulação de dados
  useEffect(() => {
    if (isSimulated) {
      setData(generateRandomData());
    }
  }, [isSimulated]);

  const generateRandomData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    const startTime = new Date();
    startTime.setHours(10, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
      const time = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temperature: 20 + Math.random() * 10,
        humidity: 50 + Math.random() * 20,
        vibration: 1 + Math.random() * 1,
      });
    }

    return data;
  };

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
        <h2 className="graph-title">Monitoramento de Temperatura, Umidade e Vibração</h2>
        <p className="data-status">
          {isSimulated ? 'Dados Simulados' : 'Dados Reais'}
        </p>
        <button className="toggle-button" onClick={() => setIsSimulated(!isSimulated)}>
          {isSimulated ? 'Usar Dados Reais' : 'Usar Dados Simulados'}
        </button>
        <div className="graph-wrapper">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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

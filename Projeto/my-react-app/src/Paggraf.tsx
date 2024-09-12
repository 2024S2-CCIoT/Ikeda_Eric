import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Paggraf.css'; 

interface DataPoint {
  time: string;
  temperature: number;
  humidity: number;
  vibration: number;
}

const data: DataPoint[] = [
  { time: '10:00', temperature: 22, humidity: 60, vibration: 1.5 },
  { time: '11:00', temperature: 23, humidity: 63, vibration: 1.7 },
  { time: '12:00', temperature: 24, humidity: 65, vibration: 1.8 },
  { time: '13:00', temperature: 25, humidity: 62, vibration: 1.6 },
  { time: '14:00', temperature: 26, humidity: 61, vibration: 1.4 },
];

const Paggraf: React.FC = () => {
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

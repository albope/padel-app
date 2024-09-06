import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Equipo 1', victorias: 5 },
  { name: 'Equipo 2', victorias: 3 },
  // Añade más datos aquí
];

const StatsChart = () => (
  <BarChart width={300} height={300} data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="victorias" fill="#8884d8" />
  </BarChart>
);

export default StatsChart;

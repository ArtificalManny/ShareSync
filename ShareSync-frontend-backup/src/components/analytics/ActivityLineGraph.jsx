// src/components/analytics/ActivityLineGraph.jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

// Example mock data (replace with real backend data via props)
const mockData = [
  { date: 'Jul 01', value: 1 },
  { date: 'Jul 02', value: 2 },
  { date: 'Jul 03', value: 1 },
  { date: 'Jul 04', value: 3 },
  { date: 'Jul 05', value: 4 },
  { date: 'Jul 06', value: 2 },
  { date: 'Jul 07', value: 5 },
];

const ActivityLineGraph = ({ data = mockData }) => {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-2xl p-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
        📈 Activity Over Time
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
            labelStyle={{ color: '#f8fafc' }}
            itemStyle={{ color: '#facc15' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityLineGraph;

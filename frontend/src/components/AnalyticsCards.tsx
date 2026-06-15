// src/components/AnalyticsCards.tsx
import React from 'react';
import { FaChartBar, FaUserPlus, FaProcedures, FaVirus } from 'react-icons/fa';

const cards = [
  { title: 'Vaccination Coverage', value: '78%', icon: <FaChartBar className="text-3xl" />, bg: 'bg-primary' },
  { title: 'Active Cases', value: '124', icon: <FaVirus className="text-3xl" />, bg: 'bg-danger' },
  { title: 'High‑Risk Pregnancies', value: '34', icon: <FaUserPlus className="text-3xl" />, bg: 'bg-warning' },
  { title: 'Malnutrition Cases', value: '56', icon: <FaProcedures className="text-3xl" />, bg: 'bg-accent' },
];

const AnalyticsCards: React.FC = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.title} className={`flex items-center p-4 rounded-xl shadow glass ${c.bg} text-white`)}>
          <div className="mr-4">{c.icon}</div>
          <div>
            <h3 className="text-sm font-medium">{c.title}</h3>
            <p className="text-xl font-bold">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsCards;

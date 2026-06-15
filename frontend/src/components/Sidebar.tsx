// src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const items = [
  { name: 'Dashboard', path: '/district' },
  { name: 'Patients', path: '/district/patients' },
  { name: 'Outbreak Radar', path: '/district/outbreak' },
  { name: 'Emergency Center', path: '/district/emergency' },
  { name: 'Analytics', path: '/district/analytics' },
  { name: 'NGOs', path: '/district/ngos' },
  { name: 'Reports', path: '/district/reports' },
  { name: 'Settings', path: '/district/settings' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-6">SwasthAI Guardian</h2>
      <nav className="flex-1 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-3 py-2 rounded hover:bg-primary/20 ${isActive ? 'bg-primary/30' : ''}`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

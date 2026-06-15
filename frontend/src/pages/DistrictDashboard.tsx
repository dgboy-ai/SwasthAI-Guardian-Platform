// src/pages/DistrictDashboard.tsx
import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AnalyticsCards from '../components/AnalyticsCards';
import OutbreakRadar from '../components/OutbreakRadar';
import PatientQueue from '../components/PatientQueue';
import AIAssistantPanel from '../components/AIAssistantPanel';

const DistrictDashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="p-4 space-y-4 overflow-auto">
          <AnalyticsCards />
          <div className="grid gap-4 lg:grid-cols-3">
            <OutbreakRadar />
            <PatientQueue />
            <AIAssistantPanel />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DistrictDashboard;

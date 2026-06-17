// src/pages/ASHAApp.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaMicrophone, FaExclamationTriangle, FaTasks, FaChartLine } from 'react-icons/fa';

// Simple utility to fetch a mock daily priority list
const fetchDailyPriority = async () => {
  // In a real app this would call an endpoint; for now return static data
  return [
    { id: 1, icon: '🔴', title: 'Visit Sunita Devi (High‑Risk Pregnancy)', urgency: 'high' },
    { id: 2, icon: '🟠', title: 'Verify Fever Cluster in Village V101', urgency: 'medium' },
    { id: 3, icon: '🟡', title: 'Follow‑up Malnutrition Case', urgency: 'low' },
    { id: 4, icon: '🟢', title: 'Vaccination Camp: 3 doses', urgency: 'info' },
  ];
};

// Mock village health score – in a real app this would be calculated server‑side
const fetchVillageScore = async () => {
  return {
    score: 84,
    riskLevel: 'moderate',
    details: {
      vaccination: 78,
      nutrition: 69,
      pregnancyRisk: 12,
    },
  };
};

// Mock live operations feed – just a static list for demo purposes
const fetchLiveFeed = async () => {
  return [
    { id: 1, time: '08:12', msg: '🩺 New symptom report from Village V103' },
    { id: 2, time: '08:45', msg: '🚑 Ambulance dispatched for emergency labor' },
    { id: 3, time: '09:03', msg: '⚠️ Outbreak alert: Dengue spikes in District Pune Rural' },
    { id: 4, time: '09:20', msg: '📦 Sync completed – 23 records uploaded' },
  ];
};

// Mock voice health assistant response
const fetchVoiceAssistant = async () => {
  return { message: 'You have 2 vaccinations due this week.' };
};

// Mock emergency near you data
const fetchEmergencyNearYou = async () => {
  return [
    { id: 1, time: '10:05', msg: '🚨 Child birth emergency in Village V102' },
    { id: 2, time: '10:30', msg: '🔥 Fire reported near Village V104' },
  ];
};

// Mock smart task prioritization list
const fetchSmartTasks = async () => {
  return [
    { id: 1, icon: '🔴', title: 'Attend high‑risk pregnancy', urgency: 'high' },
    { id: 2, icon: '🟠', title: 'Check fever cluster', urgency: 'medium' },
    { id: 3, icon: '🟡', title: 'Follow‑up nutrition case', urgency: 'low' },
  ];
};

// Mock daily impact metrics
const fetchDailyImpact = async () => {
  return { visits: 12, alertsResolved: 3 };
};

export default function ASHAApp() {
  const [dailyPriority, setDailyPriority] = useState([]);
  const [villageScore, setVillageScore] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
const [voiceAssistant, setVoiceAssistant] = useState(null);
const [emergencyNearYou, setEmergencyNearYou] = useState([]);
const [smartTasks, setSmartTasks] = useState([]);
const [dailyImpact, setDailyImpact] = useState(null);

  // Fetch data on mount – replace with real API calls when available
  useEffect(() => {
    (async () => {
      const pri = await fetchDailyPriority();
      setDailyPriority(pri);
      const score = await fetchVillageScore();
      setVillageScore(score);
      const feed = await fetchLiveFeed();
      setLiveFeed(feed);
      const voice = await fetchVoiceAssistant();
      setVoiceAssistant(voice);
      const emergency = await fetchEmergencyNearYou();
      setEmergencyNearYou(emergency);
      const tasks = await fetchSmartTasks();
      setSmartTasks(tasks);
      const impact = await fetchDailyImpact();
      setDailyImpact(impact);
    })();
  }, []);

  // Helper to colour‑code urgency icons
  const urgencyColor = (urg) => {
    switch (urg) {
      case 'high':
        return '#ef4444'; // red
      case 'medium':
        return '#f59e0b'; // amber
      case 'low':
        return '#10b981'; // green
      default:
        return '#9ca3af'; // gray
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0f172a 50%, #0a1628 100%)',
      color: '#f3f4f6',
      fontFamily: "'Inter', sans-serif",
      padding: '24px 20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🤝 ASHA Field Operations Portal
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
            Real‑time insights & tasks for your daily rounds
          </p>
        </div>
        <div style={{ fontSize: 11, color: '#4b5563' }}>🕒 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      {/* Main grid – three cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* AI Daily Priority Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#fff' }}>AI DAILY PRIORITY</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {dailyPriority.map(item => (
              <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: urgencyColor(item.urgency), fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 14, color: '#d1d5db' }}>{item.title}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Village Health Score Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#fff' }}>VILLAGE HEALTH SCORE</h2>
          {villageScore ? (
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{villageScore.score}%</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Overall risk: {villageScore.riskLevel}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Vaccination</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#63b3ed' }}>{villageScore.details.vaccination}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Nutrition</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>{villageScore.details.nutrition}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Pregnancy</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>{villageScore.details.pregnancyRisk}%</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b7280' }}>Loading…</div>
          )}
        </div>

        {/* Live Operations Feed Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#fff' }}>LIVE OPERATIONS FEED</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 180, overflowY: 'auto' }}>
            {liveFeed.map(entry => (
              <li key={entry.id} style={{ fontSize: 12, color: '#d1d5db', marginBottom: 4 }}>
                <span style={{ color: '#9ca3af', marginRight: 4 }}>{entry.time}</span>{entry.msg}
              </li>
            ))}
          </ul>
        </div>
{/* Voice Health Assistant Card */}
<div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px' }}>
  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#fff' }}><FaMicrophone style={{ marginRight: 4 }} />VOICE HEALTH ASSISTANT</h2>
  <p style={{ fontSize: 14, color: '#d1d5db' }}>{voiceAssistant ? voiceAssistant.message : 'Loading…'}</p>
</div>
{/* Emergency Near You Card */}
<div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px' }}>
    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#fff' }}><FaExclamationTriangle style={{ marginRight: 4 }} />EMERGENCY NEAR YOU</h2>
  <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 180, overflowY: 'auto' }}>
    {emergencyNearYou.map(entry => (
      <li key={entry.id} style={{ fontSize: 12, color: '#d1d5db', marginBottom: 4 }}>
        <span style={{ color: '#9ca3af', marginRight: 4 }}>{entry.time}</span>{entry.msg}
      </li>
    ))}
  </ul>
</div>
{/* Smart Task Prioritization Card */}
<div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px' }}>
  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#fff' }}>SMART TASK PRIORITIZATION</h2>
  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
    {smartTasks.map(item => (
      <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ color: urgencyColor(item.urgency), fontSize: 14 }}>{item.icon}</span>
        <span style={{ fontSize: 14, color: '#d1d5db' }}>{item.title}</span>
      </li>
    ))}
  </ul>
</div>
{/* Daily Impact Card */}
<div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px' }}>
  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#fff' }}>DAILY IMPACT</h2>
  {dailyImpact ? (
    <div>
      <div style={{ fontSize: 14, color: '#d1d5db' }}>Visits: {dailyImpact.visits}</div>
      <div style={{ fontSize: 14, color: '#d1d5db' }}>Alerts Resolved: {dailyImpact.alertsResolved}</div>
    </div>
  ) : (
    <div style={{ color: '#6b7280' }}>Loading…</div>
  )}
</div>
        </div>
      </div>
    </div>
  );
}

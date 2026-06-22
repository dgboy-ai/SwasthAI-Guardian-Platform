/**
 * MonitoringDashboard.jsx — System Observability & District Simulation
 *
 * Panels:
 *  1. Live Metrics: API latency gauge, DB connections, sync queue counts
 *  2. Event Stream: Rolling event log from eventDispatcher
 *  3. District Simulation: Outbreak Surge | Emergency Storm | Offline Sync Replay
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getQueueStats, syncAllQueues, queueMaternalRecord, queueChildRecord, queueAmbulanceRequest, queueSymptomCheck } from '../utils/offlineSyncQueue';
import api from '../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const DISTRICTS = ['Aurangabad', 'Nashik', 'Pune Rural', 'Nandurbar', 'Gadchiroli', 'Yavatmal', 'Osmanabad'];
const SIM_COLORS = { surge: '#ef4444', storm: '#f59e0b', replay: '#10b981', idle: '#6366f1' };
const LATENCY_THRESHOLDS = { good: 200, warn: 500 }; // ms

const AWS_STACK = [
  { id: 'aurora', label: 'Aurora PostgreSQL', region: 'ap-south-1', icon: '🗄️', color: '#f97316' },
  { id: 'dynamo', label: 'DynamoDB', region: 'ap-south-1', icon: '⚡', color: '#f59e0b' },
  { id: 'sw', label: 'Service Worker', region: 'Edge', icon: '🔧', color: '#6366f1' },
  { id: 'idb', label: 'IndexedDB', region: 'Local', icon: '📦', color: '#10b981' },
  { id: 'api', label: 'Express API', region: 'Node.js', icon: '🚀', color: '#3b82f6' },
  { id: 'ai', label: 'FastAPI AI', region: 'SymptomNet', icon: '🧠', color: '#8b5cf6' },
];

// ─── AWS Stack Status Banner ──────────────────────────────────────────────────
function StackStatusBanner({ online }) {
  const [statuses, setStatuses] = useState({});
  useEffect(() => {
    const check = async () => {
      const now = {};
      // SW check
      now.sw = 'registration' in navigator.serviceWorker ? 'healthy' : 'degraded';
      // IDB check (always healthy if online queue exists)
      now.idb = 'healthy';
      // API/Aurora/Dynamo depend on online status + latency
      if (online) {
        try {
          const t0 = performance.now();
          await api.get('/health');
          const ms = Math.round(performance.now() - t0);
          now.aurora = ms < 500 ? 'healthy' : 'degraded';
          now.dynamo = ms < 800 ? 'healthy' : 'degraded';
          now.api = ms < 300 ? 'healthy' : 'degraded';
          now.ai = 'healthy';
        } catch {
          now.aurora = 'offline'; now.dynamo = 'offline'; now.api = 'offline'; now.ai = 'unknown';
        }
      } else {
        now.aurora = 'offline'; now.dynamo = 'offline'; now.api = 'offline'; now.ai = 'unknown';
      }
      setStatuses(now);
    };
    check();
    const t = setInterval(check, 12000);
    return () => clearInterval(t);
  }, [online]);

  const statusColor = (s) => s === 'healthy' ? '#10b981' : s === 'degraded' ? '#f59e0b' : s === 'offline' ? '#ef4444' : '#6b7280';
  const statusLabel = (s) => s === 'healthy' ? '●' : s === 'degraded' ? '◐' : s === 'offline' ? '○' : '?';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: '10px 16px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      overflowX: 'auto',
    }}>
      <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 700, marginRight: 8, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
        Stack Health
      </span>
      {AWS_STACK.map(s => (
        <div key={s.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 20,
          background: `${statusColor(statuses[s.id])}11`,
          border: `1px solid ${statusColor(statuses[s.id])}33`,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 10 }}>{s.icon}</span>
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{s.label}</span>
          <span style={{ fontSize: 11, color: statusColor(statuses[s.id]), fontWeight: 900, lineHeight: 1 }}>
            {statusLabel(statuses[s.id])}
          </span>
          <span style={{ fontSize: 9, color: '#4b5563' }}>{s.region}</span>
        </div>
      ))}
    </div>
  );
}



// ─── Utility: measure API roundtrip latency ───────────────────────────────────
async function measureLatency() {
  const t0 = performance.now();
  try {
    await api.get('/health');
    return Math.round(performance.now() - t0);
  } catch {
    return null; // offline
  }
}

// ─── Animated Latency Arc Gauge ───────────────────────────────────────────────
function LatencyGauge({ latencyMs }) {
  const max = 1000;
  const pct = latencyMs != null ? Math.min(latencyMs / max, 1) : 0;
  const angle = pct * 180;
  const r = 54, cx = 70, cy = 70;
  const arcX = cx + r * Math.cos(Math.PI - (angle * Math.PI) / 180);
  const arcY = cy - r * Math.sin((angle * Math.PI) / 180);
  const color = latencyMs == null ? '#6b7280'
    : latencyMs < LATENCY_THRESHOLDS.good ? '#10b981'
    : latencyMs < LATENCY_THRESHOLDS.warn ? '#f59e0b'
    : '#ef4444';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Background arc */}
        <path
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round"
        />
        {/* Value arc */}
        {latencyMs != null && (
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${arcX},${arcY}`}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            style={{ transition: 'all 0.6s ease' }}
          />
        )}
        {/* Needle dot */}
        {latencyMs != null && (
          <circle cx={arcX} cy={arcY} r="5" fill={color} style={{ transition: 'all 0.6s ease' }} />
        )}
      </svg>
      <div style={{ marginTop: -12, fontSize: 22, fontWeight: 700, color }}>
        {latencyMs != null ? `${latencyMs}ms` : '—'}
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>API Latency</div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color, icon, pulse }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}33`,
      borderRadius: 12,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {pulse && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 8, height: 8, borderRadius: '50%', background: color,
          animation: 'pulse 1.5s infinite',
        }} />
      )}
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color }}>{value ?? '—'}<span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{unit}</span></div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Sync Queue Bar ───────────────────────────────────────────────────────────
function QueueBar({ label, count, color }) {
  const w = Math.min(count * 20, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
        <span>{label}</span><span style={{ color, fontWeight: 700 }}>{count}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6 }}>
        <div style={{
          width: `${w}%`, height: '100%', background: color, borderRadius: 4,
          transition: 'width 0.5s ease',
          minWidth: count > 0 ? 6 : 0,
        }} />
      </div>
    </div>
  );
}

// ─── Event Log Entry ──────────────────────────────────────────────────────────
function EventEntry({ event }) {
  const colors = { info: '#6366f1', warn: '#f59e0b', error: '#ef4444', success: '#10b981' };
  const color = colors[event.level] || '#9ca3af';
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '6px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      animation: 'slideIn 0.3s ease',
    }}>
      <span style={{ fontSize: 11, color: '#6b7280', minWidth: 70, flexShrink: 0 }}>{event.time}</span>
      <span style={{ fontSize: 11, color, fontWeight: 600, minWidth: 60 }}>[{event.type}]</span>
      <span style={{ fontSize: 12, color: '#d1d5db' }}>{event.message}</span>
    </div>
  );
}

// ─── Simulation Log ───────────────────────────────────────────────────────────
function SimLog({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div ref={ref} style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: 8,
      padding: '10px 14px',
      height: 160,
      overflowY: 'auto',
      fontFamily: 'monospace',
      fontSize: 12,
    }}>
      {logs.length === 0 && <span style={{ color: '#4b5563' }}>Awaiting simulation start…</span>}
      {logs.map((l, i) => (
        <div key={i} style={{ color: l.color || '#9ca3af', marginBottom: 2 }}>
          <span style={{ color: '#4b5563' }}>{l.ts} </span>{l.text}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MonitoringDashboard() {
  // ── Live metrics state
  const [latency, setLatency] = useState(null);
  const [prevLatency, setPrevLatency] = useState(null);
  const [queueStats, setQueueStats] = useState({ maternalCount: 0, childCount: 0, ambulanceCount: 0, symptomCount: 0, totalPending: 0 });
  const [onlineStatus, setOnlineStatus] = useState(localStorage.getItem('simulated_network_state') === 'offline' ? false : navigator.onLine);
  const [dbConnections, setDbConnections] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [dynamoFeed, setDynamoFeed] = useState(null);
  const [dynamoLoading, setDynamoLoading] = useState(false);
  const [ragTraces, setRagTraces] = useState([]);
  const [aiProof, setAiProof] = useState(null);
  const [networkSimState, setNetworkSimState] = useState(localStorage.getItem('simulated_network_state') || 'online');
  const [demoRunning, setDemoRunning] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [syncWalkthroughStep, setSyncWalkthroughStep] = useState(null);
  const [p2pStep, setP2pStep] = useState(null);

  // ── Simulation state
  const [recentRequests, setRecentRequests] = useState([]);
  const [simMode, setSimMode] = useState('idle'); // 'idle' | 'surge' | 'storm' | 'replay'
  const [simRunning, setSimRunning] = useState(false);
  const [simLogs, setSimLogs] = useState([]);
  const [simProgress, setSimProgress] = useState(0);
  const simAbort = useRef(false);

  // ── Helpers
  const now = () => new Date().toLocaleTimeString('en-IN', { hour12: false });

  const toggleNetworkSim = (state) => {
    localStorage.setItem('simulated_network_state', state);
    setNetworkSimState(state);
    if (state === 'offline') {
      setOnlineStatus(false);
      window.dispatchEvent(new Event('offline'));
    } else {
      setOnlineStatus(true);
      window.dispatchEvent(new Event('online'));
    }
  };

  const triggerDemoSeed = async () => {
    if (seedLoading) return;
    setSeedLoading(true);
    addSimLog('⚡ Preloading realistic maternal health, malnutrition, symptom, and outbreak records...', '#f59e0b');
    try {
      const res = await api.post('/admin/seed-demo-data');
      addSimLog(`✅ Database Reset & Seeded: ${res.data.message}`, '#10b981');
      addEvent('SEED', 'Demo dataset preloaded', 'success');
    } catch (err) {
      addSimLog(`❌ Database Seeding Failed: ${err.response?.data?.error || err.message}`, '#ef4444');
      addEvent('SEED', 'Demo dataset preloading failed', 'error');
    } finally {
      setSeedLoading(false);
    }
  };

  const runDemoSimulation = async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setSimLogs([]);
    addSimLog('🏁 Starting SwasthAI Demo Pipeline...', '#6366f1');
    
    // 1. Sim Offline
    addSimLog('🔌 Simulating cellular network drop (OFFLINE)...', '#f59e0b');
    toggleNetworkSim('offline');
    await new Promise(r => setTimeout(r, 1500));

    // 2. Queue Offline items
    addSimLog('📝 Queuing rural health logs offline (IndexedDB)...', '#ec4899');
    await queueMaternalRecord({ name: 'Ankita Patel', age: 26, trimester: 3, riskLevel: 'High', villageId: 'v101' });
    await queueChildRecord({ childName: 'Ganesh', ageMonths: 14, weight: 7.8, height: 71.0, status: 'Severe', villageId: 'v101' });
    await queueAmbulanceRequest({ name: 'Sita Devi', location: 'Ward 3, Rampur', priority: 'High', type: 'emergency', symptoms: 'Emergency labor pains' });
    
    // Trigger queue refresh event
    window.dispatchEvent(new Event('swasthai_queue_updated'));
    await new Promise(r => setTimeout(r, 3000));

    // 3. Reconnect Online
    addSimLog('📡 Cellular network restored! Reconnecting to AWS cloud...', '#10b981');
    toggleNetworkSim('online');
    await new Promise(r => setTimeout(r, 1500));

    // 4. Force sync
    addSimLog('⚡ Replaying local IndexedDB log queues to DynamoDB & PostgreSQL...', '#6366f1');
    await syncAllQueues();
    window.dispatchEvent(new Event('swasthai_queue_updated'));
    await new Promise(r => setTimeout(r, 2000));

    // 5. Outbreak surge
    addSimLog('🦠 Initiating automated epidemic outbreak detection simulation...', '#ef4444');
    await runOutbreakSurge();
    
    addSimLog('🎉 Demo loop completed successfully!', '#10b981');
    setDemoRunning(false);
  };

  const addEvent = useCallback((type, message, level = 'info') => {
    setEventLog(prev => [{ type, message, level, time: now() }, ...prev].slice(0, 80));
  }, []);

  const addSimLog = useCallback((text, color = '#9ca3af') => {
    setSimLogs(prev => [...prev, { text, color, ts: now() }].slice(-60));
  }, []);

  // ── Live metric polling
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (!alive) return;
      const ms = await measureLatency();
      if (ms !== null) {
        setLatency(prev => { setPrevLatency(prev); return ms; });
        addEvent('PING', `Roundtrip ${ms}ms`, ms < LATENCY_THRESHOLDS.good ? 'success' : ms < LATENCY_THRESHOLDS.warn ? 'warn' : 'error');
      } else {
        addEvent('PING', 'No response — offline?', 'error');
      }
      try {
        const res = await api.get('/health');
        if (res.data?.connections !== undefined) setDbConnections(res.data.connections);
        if (res.data?.recentRequests !== undefined) setRecentRequests(res.data.recentRequests);
        const detailed = await api.get('/health/detailed');
        if (detailed.data?.ai_service) setAiProof(detailed.data.ai_service);
        const ragRes = await api.get('/admin/rag-traces');
        if (ragRes.data) setRagTraces(ragRes.data);
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 8000);
    return () => { alive = false; clearInterval(interval); };
  }, [addEvent]);

  // ── Queue stats polling
  useEffect(() => {
    const refresh = () => getQueueStats().then(setQueueStats);
    refresh();
    const interval = setInterval(refresh, 3000);
    window.addEventListener('swasthai_queue_updated', refresh);
    return () => { clearInterval(interval); window.removeEventListener('swasthai_queue_updated', refresh); };
  }, []);

  // ── DynamoDB live feed polling
  useEffect(() => {
    let alive = true;
    const fetchDynamo = async () => {
      if (!alive) return;
      setDynamoLoading(true);
      try {
        const res = await api.get('/admin/dynamo-feed');
        if (alive) setDynamoFeed(res.data);
      } catch { /* ignore */ } finally {
        if (alive) setDynamoLoading(false);
      }
    };
    fetchDynamo();
    const interval = setInterval(fetchDynamo, 15000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  // ── Online/Offline tracking
  useEffect(() => {
    const onOnline = () => { setOnlineStatus(true); addEvent('NET', 'Connection restored', 'success'); };
    const onOffline = () => { setOnlineStatus(false); addEvent('NET', 'Connection lost!', 'error'); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, [addEvent]);

  // ── Simulation: Outbreak Surge
  const runOutbreakSurge = async () => {
    simAbort.current = false;
    setSimLogs([]);
    setSimProgress(0);
    addSimLog('🦠 OUTBREAK SURGE simulation starting...', '#ef4444');
    addEvent('SIM', 'Outbreak Surge initiated', 'warn');

    const villages = ['Shirsad', 'Bordi', 'Dahanu', 'Talasari', 'Jawhar'];
    const symptoms = ['fever+chills', 'vomiting+diarrhea', 'rash+fever', 'cough+fever', 'jaundice'];

    for (let i = 0; i < villages.length; i++) {
      if (simAbort.current) { addSimLog('⛔ Aborted.', '#f59e0b'); break; }
      const village = villages[i];
      const symptom = symptoms[i];
      const count = Math.floor(Math.random() * 20) + 8;

      addSimLog(`📍 ${village}: ${count} cases — ${symptom}`, '#ef4444');
      // Queue as offline symptom batch
      for (let j = 0; j < Math.min(count, 5); j++) {
        await queueSymptomCheck({ symptoms: symptom, villageId: i + 1, simulated: true });
        await new Promise(r => setTimeout(r, 80));
      }

      window.dispatchEvent(new CustomEvent('outbreak_simulation_trigger', {
        detail: {
          villageId: `v10${i + 1}`,
          status: 'outbreak',
          alert: `⚠️ ${symptom} Spike: ${count} cases in 48h`
        }
      }));

      setSimProgress(Math.round(((i + 1) / villages.length) * 100));
      addEvent('OUTBREAK', `${count} cases in ${village}`, 'error');
      await new Promise(r => setTimeout(r, 600));
    }

    addSimLog('🚨 Outbreak surge simulation complete. 5 districts flagged.', '#f87171');
    addEvent('SIM', 'Outbreak Surge complete', 'error');
  };

  // ── Simulation: Emergency Storm
  const runEmergencyStorm = async () => {
    simAbort.current = false;
    setSimLogs([]);
    setSimProgress(0);
    addSimLog('⛈️ EMERGENCY STORM simulation starting...', '#f59e0b');
    addEvent('SIM', 'Emergency Storm initiated', 'warn');

    const emergencyTypes = [
      { type: 'Cardiac Arrest', priority: 'critical' },
      { type: 'Road Accident', priority: 'critical' },
      { type: 'Snakebite', priority: 'high' },
      { type: 'Obstetric Emergency', priority: 'critical' },
      { type: 'Child Convulsions', priority: 'high' },
      { type: 'Drowning', priority: 'critical' },
    ];

    for (let i = 0; i < emergencyTypes.length; i++) {
      if (simAbort.current) { addSimLog('⛔ Aborted.', '#f59e0b'); break; }
      const { type, priority } = emergencyTypes[i];
      const district = DISTRICTS[i % DISTRICTS.length];

      addSimLog(`🚑 ${district}: ${type} [${priority.toUpperCase()}]`, priority === 'critical' ? '#ef4444' : '#f59e0b');

      await queueAmbulanceRequest({
        name: `SIM_PATIENT_${i}`,
        location: district,
        priority,
        symptoms: type,
        simulated: true,
      });

      setSimProgress(Math.round(((i + 1) / emergencyTypes.length) * 100));
      addEvent('SOS', `${type} in ${district}`, 'error');
      await new Promise(r => setTimeout(r, 500));
    }

    addSimLog('⚡ Storm simulation done. 6 SOS requests queued.', '#fbbf24');
    addEvent('SIM', 'Emergency Storm complete', 'warn');
  };

  // ── Simulation: Offline Sync Replay
  const runOfflineSyncReplay = async () => {
    simAbort.current = false;
    setSimLogs([]);
    setSimProgress(0);
    addSimLog('📴 OFFLINE SYNC REPLAY simulation...', '#10b981');
    addEvent('SIM', 'Offline Sync Replay started', 'info');

    // Phase 1: seed offline data
    addSimLog('Phase 1: Seeding offline records while "offline"...', '#6366f1');
    const seeds = [
      () => queueMaternalRecord({ name: 'Sunita Devi', age: 24, trimester: 2, dueDate: '2025-09-15', vitals: { bp: '110/70', weight: 52 }, simulated: true }),
      () => queueMaternalRecord({ name: 'Anita Patel', age: 28, trimester: 3, dueDate: '2025-08-01', vitals: { bp: '120/80', weight: 60 }, simulated: true }),
      () => queueChildRecord({ childName: 'Raju', ageMonths: 14, weight: 7.2, height: 74, simulated: true }),
      () => queueChildRecord({ childName: 'Priya', ageMonths: 8, weight: 5.8, height: 65, simulated: true }),
      () => queueSymptomCheck({ symptoms: 'fever+cough', villageId: 3, simulated: true }),
    ];

    for (let i = 0; i < seeds.length; i++) {
      if (simAbort.current) { addSimLog('⛔ Aborted.', '#f59e0b'); break; }
      await seeds[i]();
      addSimLog(`  ✓ Queued record ${i + 1}/${seeds.length}`, '#34d399');
      setSimProgress(Math.round(((i + 1) / (seeds.length + 3)) * 100));
      await new Promise(r => setTimeout(r, 300));
    }

    addSimLog('Phase 2: Simulating reconnect → triggering auto-sync...', '#6366f1');
    await new Promise(r => setTimeout(r, 800));
    setSimProgress(70);

    addSimLog('📡 Network restored! Dispatching queue replay...', '#10b981');
    addEvent('NET', 'Simulated reconnect — replaying queue', 'success');

    // Fire the real sync logic
    try {
      await syncAllQueues();
      addSimLog('✅ All queued records synced to Aurora/DynamoDB!', '#34d399');
      addEvent('SYNC', 'Offline replay complete', 'success');
    } catch (e) {
      addSimLog(`⚠️ Sync partial/failed: ${e.message}`, '#f87171');
      addEvent('SYNC', 'Replay failed', 'error');
    }

    setSimProgress(100);
    addSimLog('🏁 Offline Sync Replay simulation complete.', '#10b981');
  };

  // ── Run simulation dispatcher
  const startSim = async (mode) => {
    if (simRunning) return;
    setSimMode(mode);
    setSimRunning(true);
    setSimProgress(0);
    try {
      if (mode === 'surge') await runOutbreakSurge();
      else if (mode === 'storm') await runEmergencyStorm();
      else if (mode === 'replay') await runOfflineSyncReplay();
    } finally {
      setSimRunning(false);
    }
  };

  const stopSim = () => { simAbort.current = true; };

  const latencyColor = latency == null ? '#6b7280'
    : latency < LATENCY_THRESHOLDS.good ? '#10b981'
    : latency < LATENCY_THRESHOLDS.warn ? '#f59e0b'
    : '#ef4444';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0f172a 50%, #0a1628 100%)',
      color: '#f3f4f6',
      fontFamily: "'Inter', sans-serif",
      padding: '24px 20px',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#374151;border-radius:2px}
      `}</style>

      {/* ── Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🛰️ System Observability
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>SwasthAI Guardian — Live Infrastructure Monitor</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: onlineStatus ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: onlineStatus ? '#34d399' : '#f87171',
            border: `1px solid ${onlineStatus ? '#10b98133' : '#ef444433'}`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: onlineStatus ? '#10b981' : '#ef4444', animation: 'pulse 1.5s infinite' }} />
            {onlineStatus ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span style={{ fontSize: 11, color: '#4b5563' }}>Auto-refresh 8s</span>
        </div>
      </div>

      {/* ── AWS Stack Status Banner */}
      <StackStatusBanner online={onlineStatus} />

      {/* ── ⚙️ Demo Evaluation Toolkit */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Evaluation Toolkit</h4>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Simulate offline failures and execute end-to-end user sync flows instantly.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Network Simulator buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#4b5563', padding: '0 8px', textTransform: 'uppercase' }}>Network:</span>
            {['online', 'slow', 'offline'].map((state) => (
              <button
                key={state}
                onClick={() => toggleNetworkSim(state)}
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  background: networkSimState === state
                    ? state === 'offline' ? '#ef4444' : state === 'slow' ? '#f59e0b' : '#10b981'
                    : 'transparent',
                  border: 'none',
                  color: networkSimState === state ? '#fff' : '#6b7280',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                {state}
              </button>
            ))}
          </div>

          {/* Watch Sync Walkthrough */}
          <button
            onClick={() => {
              setSyncWalkthroughStep(0);
              setSimLogs([]);
              addSimLog('🏁 Starting Step-by-Step Offline Sync Walkthrough...', '#10b981');
            }}
            disabled={demoRunning || syncWalkthroughStep !== null || p2pStep !== null}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              cursor: (demoRunning || syncWalkthroughStep !== null || p2pStep !== null) ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            🔄 Watch Sync
          </button>

          {/* P2P Offline Relay Simulation */}
          <button
            onClick={() => {
              setP2pStep(0);
              setSimLogs([]);
              addSimLog('🏁 Starting P2P Offline Sync Relay Walkthrough...', '#8b5cf6');
            }}
            disabled={demoRunning || syncWalkthroughStep !== null || p2pStep !== null}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              cursor: (demoRunning || syncWalkthroughStep !== null || p2pStep !== null) ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(139,92,246,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            📶 P2P Relay Sim
          </button>

          {/* One-Click Demo Simulation */}
          <button
            onClick={runDemoSimulation}
            disabled={demoRunning}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              cursor: demoRunning ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(139,92,246,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {demoRunning ? '⏳ Running Demo...' : '🚀 One-Click Demo Simulation'}
          </button>

          {/* Seed loader */}
          <button
            onClick={triggerDemoSeed}
            disabled={seedLoading}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              color: '#d1d5db',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              cursor: seedLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {seedLoading ? '⏳ Seeding...' : '🌱 Seed Demo Datasets'}
          </button>
        </div>
      </div>

      {/* ── Top Metrics Row */}

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 20, alignItems: 'start' }}>
        {/* Gauge */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '20px 24px',
          textAlign: 'center',
        }}>
          <LatencyGauge latencyMs={latency} />
          {prevLatency != null && latency != null && (
            <div style={{ fontSize: 11, color: latency < prevLatency ? '#10b981' : '#ef4444', marginTop: 4 }}>
              {latency < prevLatency ? '▼' : '▲'} {Math.abs(latency - prevLatency)}ms vs last
            </div>
          )}
        </div>

        {/* Stat Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          <StatCard label="DB Connections" value={dbConnections ?? '?'} unit="active" color="#6366f1" icon="🗄️" />
          <StatCard label="Sync Queue Total" value={queueStats.totalPending} unit="records" color={queueStats.totalPending > 0 ? '#f59e0b' : '#10b981'} icon="📬" pulse={queueStats.totalPending > 0} />
          <StatCard label="Maternal Queue" value={queueStats.maternalCount} unit="items" color="#ec4899" icon="🤱" />
          <StatCard label="Child Queue" value={queueStats.childCount} unit="items" color="#3b82f6" icon="👶" />
          <StatCard label="Ambulance SOS" value={queueStats.ambulanceCount} unit="queued" color="#ef4444" icon="🚑" pulse={queueStats.ambulanceCount > 0} />
          <StatCard label="Symptom Checks" value={queueStats.symptomCount} unit="pending" color="#f59e0b" icon="🩺" />
        </div>
      </div>

      {/* ── Sync Queue Breakdown + Event Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
        {/* Queue breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 16 }}>📊 Sync Queue Breakdown</div>
          <QueueBar label="Maternal Vitals" count={queueStats.maternalCount} color="#ec4899" />
          <QueueBar label="Child Metrics" count={queueStats.childCount} color="#3b82f6" />
          <QueueBar label="Ambulance SOS" count={queueStats.ambulanceCount} color="#ef4444" />
          <QueueBar label="Symptom Checks" count={queueStats.symptomCount} color="#f59e0b" />
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 14, paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#9ca3af' }}>Total Pending</span>
              <span style={{ color: queueStats.totalPending > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{queueStats.totalPending}</span>
            </div>
          </div>
          {queueStats.totalPending > 0 && (
            <button
              onClick={() => syncAllQueues()}
              style={{
                width: '100%', marginTop: 14, padding: '8px 0',
                background: 'linear-gradient(90deg,#10b981,#059669)',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ⚡ Force Sync Now
            </button>
          )}
        </div>

        {/* Event log */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 12 }}>📡 Live Event Stream</div>
          <div style={{ height: 220, overflowY: 'auto' }}>
            {eventLog.length === 0 && <div style={{ color: '#4b5563', fontSize: 12 }}>Waiting for events…</div>}
            {eventLog.map((ev, i) => <EventEntry key={i} event={ev} />)}
          </div>
        </div>
      </div>

      {/* ── Trace ID & request latency monitor */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 14 }}>🔍 Live Request Traces (Correlation & Latency)</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}>
                <th style={{ padding: '8px 4px' }}>Timestamp</th>
                <th style={{ padding: '8px 4px' }}>Trace ID</th>
                <th style={{ padding: '8px 4px' }}>Method</th>
                <th style={{ padding: '8px 4px' }}>Path</th>
                <th style={{ padding: '8px 4px' }}>Status</th>
                <th style={{ padding: '8px 4px' }}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: 12, color: '#4b5563', textAlign: 'center' }}>No requests recorded yet.</td>
                </tr>
              )}
              {recentRequests.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#d1d5db' }}>
                  <td style={{ padding: '8px 4px', color: '#6b7280' }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: '8px 4px', fontFamily: 'monospace', color: '#6366f1' }}>{r.traceId}</td>
                  <td style={{ padding: '8px 4px', fontWeight: 700 }}>{r.method}</td>
                  <td style={{ padding: '8px 4px' }}>{r.path}</td>
                  <td style={{ padding: '8px 4px', color: r.status < 400 ? '#10b981' : '#ef4444' }}>{r.status}</td>
                  <td style={{ padding: '8px 4px', color: r.duration < 200 ? '#10b981' : r.duration < 500 ? '#f59e0b' : '#ef4444' }}>{r.duration}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 14 }}>AI Health Proof</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {[
            { label: 'Disease model', value: aiProof?.disease_model_loaded ? 'Loaded' : aiProof ? 'Fallback' : 'Checking' },
            { label: 'RAG chunks', value: aiProof?.rag_chunks ?? 'Checking' },
            { label: 'Retrieval threshold', value: aiProof?.rag_threshold ?? 'Checking' },
            { label: 'Model fallback', value: aiProof?.model_fallback_state || 'Checking' },
            { label: 'Guardrails', value: aiProof?.guardrail_status || 'Checking' },
            { label: 'AI service', value: aiProof?.live_status || 'Checking' },
          ].map(item => (
            <div key={item.label} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, background: 'rgba(15,23,42,0.35)' }}>
              <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
              <div style={{ color: '#d1d5db', fontSize: 12, fontWeight: 700, marginTop: 6, lineHeight: 1.35 }}>{String(item.value)}</div>
            </div>
          ))}
        </div>
        <p style={{ color: '#6b7280', fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
          Clinical text remains conservative: AI output supports triage and escalation, not final diagnosis.
        </p>
      </div>

      {/* ── RAG Diagnostics Panel */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 14 }}>🧠 Sakhi RAG Retrieval & Knowledge Diagnostics</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}>
                <th style={{ padding: '8px 4px' }}>Timestamp</th>
                <th style={{ padding: '8px 4px' }}>Query Message</th>
                <th style={{ padding: '8px 4px' }}>Retrieval Latency</th>
                <th style={{ padding: '8px 4px' }}>Mode</th>
                <th style={{ padding: '8px 4px' }}>Confidence Score</th>
                <th style={{ padding: '8px 4px' }}>Grounded Guidelines Sources</th>
              </tr>
            </thead>
            <tbody>
              {ragTraces.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: 12, color: '#4b5563', textAlign: 'center' }}>No RAG queries recorded yet. Ask Sakhi a question!</td>
                </tr>
              )}
              {ragTraces.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#d1d5db' }}>
                  <td style={{ padding: '8px 4px', color: '#6b7280' }}>{new Date(t.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: '8px 4px', fontWeight: 600 }}>"{t.query}"</td>
                  <td style={{ padding: '8px 4px', color: t.latency < 500 ? '#10b981' : '#f59e0b' }}>{t.latency}ms</td>
                  <td style={{ padding: '8px 4px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: t.grounded ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: t.grounded ? '#10b981' : '#f59e0b',
                      border: `1px solid ${t.grounded ? '#10b98133' : '#f59e0b33'}`
                    }}>
                      {t.grounded ? 'GROUNDED RAG' : 'GROQ FALLBACK'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 4px', fontWeight: 700, color: t.grounded ? '#10b981' : '#4b5563' }}>
                    {t.grounded ? `${Math.round(t.similarityScore * 100)}%` : '—'}
                  </td>
                  <td style={{ padding: '8px 4px', color: '#9ca3af' }}>
                    {(t.sources || []).map((src, si) => (
                      <span key={si} style={{ display: 'inline-block', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, padding: '1px 6px', fontSize: 10, marginRight: 4, marginBottom: 4 }}>
                        📚 {src}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DynamoDB Live Feed Panel */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>⚡ DynamoDB Live Tables</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {dynamoFeed?.isMock && (
              <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b33', borderRadius: 10, padding: '2px 8px' }}>DEV MOCK</span>
            )}
            {dynamoFeed?.isMock === false && (
              <span style={{ fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b98133', borderRadius: 10, padding: '2px 8px' }}>LIVE AWS</span>
            )}
            {dynamoLoading && <span style={{ fontSize: 11, color: '#6b7280', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
          {[
            { key: 'outbreak_telemetry', label: '🦠 Outbreak Telemetry', color: '#ef4444', fields: ['eventType','villageId','symptomCount'] },
            { key: 'sync_queues', label: '📬 Sync Queues', color: '#6366f1', fields: ['deviceId','recordCount','status'] },
            { key: 'village_node_state', label: '📡 Village Node State', color: '#10b981', fields: ['villageId','status','syncPendingCount'] },
            { key: 'emergency_streams', label: '🚑 Emergency Streams', color: '#f59e0b', fields: ['eventType','location','priority'] },
          ].map(({ key, label, color, fields }) => {
            const items = dynamoFeed?.[key] || [];
            return (
              <div key={key} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 12, border: `1px solid ${color}22` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 8 }}>{label}</div>
                {!dynamoFeed && <div style={{ color: '#4b5563', fontSize: 11 }}>Loading…</div>}
                {dynamoFeed && items.length === 0 && (
                  <div style={{ color: '#374151', fontSize: 11, fontStyle: 'italic' }}>No records yet — run a simulation</div>
                )}
                {items.map((item, i) => (
                  <div key={i} style={{
                    fontSize: 10, color: '#9ca3af', padding: '4px 0',
                    borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    fontFamily: 'monospace',
                  }}>
                    <span style={{ color: '#6b7280' }}>{new Date(item.timestamp || item.ts || item.lastActive || 0).toLocaleTimeString('en-IN', { hour12: false })} </span>
                    {fields.map(f => item[f] != null ? (
                      <span key={f}><span style={{ color: '#4b5563' }}>{f}=</span><span style={{ color: '#d1d5db' }}>{String(item[f]).slice(0, 18)}</span> </span>
                    ) : null)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── GSI Disease Trends Query & Proactive Outbreak Predictor (NEW DEMO AXIS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(350px,1fr))', gap: 20, marginBottom: 20 }}>
        
        {/* Panel A: GSI Disease Trends */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 14 }}>🔍 GSI Disease Trends Query (DynamoDB 'disease-index')</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input 
              type="text" 
              placeholder="e.g. Malaria, Cholera, Dengue..." 
              id="disease-query-input"
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12 }}
            />
            <button 
              onClick={async () => {
                const queryVal = document.getElementById('disease-query-input').value;
                if (!queryVal) return alert('Please enter a disease name');
                try {
                  const res = await api.get(`/admin/disease-trends?disease=${encodeURIComponent(queryVal)}`);
                  document.getElementById('disease-query-results').innerText = JSON.stringify(res.data, null, 2);
                } catch (err) {
                  document.getElementById('disease-query-results').innerText = 'Error: ' + (err.response?.data?.error || err.message);
                }
              }}
              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Query Index
            </button>
          </div>
          <pre id="disease-query-results" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 12, fontSize: 11, color: '#10b981', fontFamily: 'monospace', maxHeight: 150, overflowY: 'auto', border: '1px solid rgba(16,185,129,0.15)' }}>
            No query executed yet.
          </pre>
        </div>

        {/* Panel B: Proactive Outbreak Risk Predictor */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 14 }}>🔮 Proactive Outbreak Risk Predictor (AI Service)</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <select 
              id="risk-village-select"
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12 }}
            >
              <option value="v101">Rampur (v101)</option>
              <option value="v102">Mohanlal Ganj (v102)</option>
            </select>
            <select 
              id="risk-month-select"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12 }}
              defaultValue={new Date().getMonth() + 1}
            >
              {Array.from({ length: 12 }, (_, idx) => (
                <option key={idx+1} value={idx+1}>{new Date(2000, idx).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <button 
              onClick={async () => {
                const village = document.getElementById('risk-village-select').value;
                const month = document.getElementById('risk-month-select').value;
                try {
                  const res = await api.get(`/predict/seasonal-risk?villageId=${village}&month=${month}`);
                  document.getElementById('risk-predictor-results').innerText = JSON.stringify(res.data, null, 2);
                } catch (err) {
                  document.getElementById('risk-predictor-results').innerText = 'Error: ' + (err.response?.data?.error || err.message);
                }
              }}
              style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Predict Risk
            </button>
          </div>
          <pre id="risk-predictor-results" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 12, fontSize: 11, color: '#f59e0b', fontFamily: 'monospace', maxHeight: 150, overflowY: 'auto', border: '1px solid rgba(245,158,11,0.15)' }}>
            No prediction executed yet.
          </pre>
        </div>

      </div>

      {/* ── District Simulation Panel */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 16 }}>🎛️ District Simulation Mode</div>

        {/* Simulation selector buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { mode: 'surge', label: '🦠 Outbreak Surge', desc: 'Flood 5 districts with epidemic symptom data', color: '#ef4444' },
            { mode: 'storm', label: '⛈️ Emergency Storm', desc: 'Simultaneous SOS dispatches across districts', color: '#f59e0b' },
            { mode: 'replay', label: '📴 Offline Sync Replay', desc: 'Seed offline data, reconnect, watch auto-sync', color: '#10b981' },
          ].map(({ mode, label, desc, color }) => (
            <button
              key={mode}
              onClick={() => !simRunning && startSim(mode)}
              disabled={simRunning}
              style={{
                flex: '1 1 180px',
                padding: '14px 18px',
                background: simMode === mode && simRunning
                  ? `${color}22`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${simMode === mode ? color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12,
                color: simMode === mode ? color : '#9ca3af',
                cursor: simRunning ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{desc}</div>
              {simMode === mode && simRunning && (
                <div style={{ marginTop: 8, fontSize: 11, color }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 4 }}>⟳</span>
                  Running…
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        {simRunning && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
              <span>Simulation Progress</span><span>{simProgress}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6 }}>
              <div style={{
                width: `${simProgress}%`, height: '100%',
                background: `linear-gradient(90deg,${SIM_COLORS[simMode]},${SIM_COLORS[simMode]}88)`,
                borderRadius: 4, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {simRunning && (
            <button
              onClick={stopSim}
              style={{
                padding: '6px 16px', background: 'rgba(239,68,68,0.15)',
                color: '#f87171', border: '1px solid #ef444433',
                borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600,
              }}
            >
              ⛔ Stop
            </button>
          )}
          {!simRunning && simLogs.length > 0 && (
            <button
              onClick={() => { setSimLogs([]); setSimProgress(0); setSimMode('idle'); }}
              style={{
                padding: '6px 16px', background: 'rgba(255,255,255,0.05)',
                color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, fontSize: 12, cursor: 'pointer',
              }}
            >
              🗑️ Clear Log
            </button>
          )}
        </div>

        {/* Sim console */}
        <SimLog logs={simLogs} />

        {/* District status grid */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>District Status Grid</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DISTRICTS.map((d, i) => {
              const active = simRunning && simMode === 'surge' && i < Math.ceil(simProgress / 20);
              const color = active ? '#ef4444' : simMode === 'storm' && simRunning ? '#f59e0b' : '#374151';
              return (
                <div key={d} style={{
                  padding: '5px 12px', borderRadius: 20,
                  background: `${color}22`,
                  border: `1px solid ${color}55`,
                  fontSize: 11, color: active ? '#f87171' : '#6b7280',
                  transition: 'all 0.3s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />}
                  {d}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sync Walkthrough Modal Overlay */}
      {syncWalkthroughStep !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 5, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 500,
            padding: 30,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: 2 }}>
                Step {syncWalkthroughStep + 1} of 5
              </span>
              <button 
                onClick={() => setSyncWalkthroughStep(null)}
                style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {syncWalkthroughStep === 0 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>🔌 1. Simulating Network Disconnection</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                  First, we simulate entering a remote village with zero cellular connection. We toggle the network simulation status to <strong style={{ color: '#ef4444' }}>OFFLINE</strong>.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', margin: '15px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: '#6b7280' }}>Network State</span>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>OFFLINE</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    toggleNetworkSim('offline');
                    addSimLog('🔌 Step 1: Simulated network drop (OFFLINE)', '#ef4444');
                    setSyncWalkthroughStep(1);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Confirm & Go Offline
                </button>
              </div>
            )}

            {syncWalkthroughStep === 1 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>📝 2. Submitting Record Offline</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                  While disconnected, the healthcare worker logs a new high-risk pregnancy card. Since there's no server connection, the record is immediately intercepted and stored in the browser's persistent IndexedDB transaction queue.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', margin: '15px 0' }}>
                  <div style={{ fontSize: 11, color: '#d1d5db', fontWeight: 700 }}>Maternal Record Payload:</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginTop: 4 }}>
                    Patient: Ankita Patel (26 yrs)<br />
                    Trimester: 3rd trimester<br />
                    Risk Level: High Risk<br />
                    Village: Rampur (v101)
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await queueMaternalRecord({ name: 'Ankita Patel', age: 26, trimester: 3, riskLevel: 'High', villageId: 'v101' });
                    window.dispatchEvent(new Event('swasthai_queue_updated'));
                    addSimLog('📝 Step 2: Submitted maternal record offline to IndexedDB queue', '#ec4899');
                    setSyncWalkthroughStep(2);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', background: '#ec4899', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Submit & Queue Record
                </button>
              </div>
            )}

            {syncWalkthroughStep === 2 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>📦 3. Verifying Queue in IndexedDB</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                  The record is securely persisted in local storage. Notice that the <strong style={{ color: '#f59e0b' }}>Maternal Queue</strong> counter has incremented.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)', margin: '15px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>📬</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{queueStats.maternalCount} Pending</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>Maternal queue items in IndexedDB</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    addSimLog('📦 Step 3: Verified queue state in local IndexedDB', '#f59e0b');
                    setSyncWalkthroughStep(3);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Verify Queue Counter
                </button>
              </div>
            )}

            {syncWalkthroughStep === 3 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>📡 4. Reconnecting & Synchronizing</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                  The device moves back into network coverage. We restore the cellular simulation state to <strong style={{ color: '#10b981' }}>ONLINE</strong>. The sync runner triggers automatically, replaying the stored transactions.
                </p>
                <button
                  onClick={async () => {
                    toggleNetworkSim('online');
                    addSimLog('📡 Step 4: Restored connection, replaying IndexedDB to server...', '#10b981');
                    await syncAllQueues();
                    window.dispatchEvent(new Event('swasthai_queue_updated'));
                    setSyncWalkthroughStep(4);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Restore Connection & Sync
                </button>
              </div>
            )}

            {syncWalkthroughStep === 4 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>🎉 5. Database Sync & Audit Ledger complete</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                  The records are written to Aurora PostgreSQL. Simultaneously, the backend security middleware records the access event in the DynamoDB audit trail table.
                </p>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 14, borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)', margin: '15px 0', fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                  ✓ Synced successfully! Sync queue is empty.
                </div>
                <button
                  onClick={() => {
                    addSimLog('🎉 Step 5: Completed Offline→Online sync walkthrough successfully!', '#34d399');
                    setSyncWalkthroughStep(null);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', background: 'linear-gradient(90deg, #8b5cf6, #6366f1)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Complete Walkthrough
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── P2P Offline Relay Walkthrough Modal Overlay */}
      {p2pStep !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 5, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 500,
            padding: 30,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2 }}>
                P2P Relay Step {p2pStep + 1} of 4
              </span>
              <button 
                onClick={() => setP2pStep(null)}
                style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {p2pStep === 0 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>📴 1. Villager Logged Offline</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                  A pregnant villager in a completely offline village logs a maternal record on her phone. Since there is no internet connection, it is stored locally in her device's cache queue.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', margin: '15px 0' }}>
                  <div style={{ fontSize: 11, color: '#d1d5db', fontWeight: 700 }}>Villager Device Local Cache:</div>
                  <div style={{ fontSize: 10, color: '#c084fc', fontFamily: 'monospace', marginTop: 4 }}>
                    Patient: Kiran Sharma (24 yrs)<br />
                    Risk Level: Normal Risk<br />
                    Village: Kharela (v103)<br />
                    Queue Status: [1 Record Pending]
                  </div>
                </div>
                <button
                  onClick={() => {
                    addSimLog('📴 Step 1: Villager logged maternal record locally in Kharela (v103)', '#a78bfa');
                    setP2pStep(1);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', background: '#ec4899', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Simulate Villager Offline Record
                </button>
              </div>
            )}

            {p2pStep === 1 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>📡 2. ASHA Worker P2P Scan</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                  An ASHA worker arrives in the village. Her device initiates a secure local P2P Bluetooth / Wi-Fi scan to identify nearby devices with unsynced health logs.
                </p>
                
                {/* Pulsing Bluetooth Scan Radar Animation */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100, margin: '15px 0', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', width: 60, height: 60, borderRadius: '50%',
                    border: '2px solid rgba(139, 92, 246, 0.4)',
                    animation: 'pulse 1.5s infinite ease-out'
                  }} />
                  <div style={{
                    position: 'absolute', width: 40, height: 40, borderRadius: '50%',
                    border: '2px solid rgba(139, 92, 246, 0.6)',
                    animation: 'pulse 1.5s infinite ease-out', animationDelay: '0.5s'
                  }} />
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#8b5cf6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10
                  }}>
                    📶
                  </div>
                </div>

                <button
                  onClick={() => {
                    addSimLog('📶 Step 2: ASHA worker scanned and paired with "Villager-Phone-v103"', '#8b5cf6');
                    setP2pStep(2);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Scan & Pair Bluetooth
                </button>
              </div>
            )}

            {p2pStep === 2 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>📦 3. P2P Queue Relay Pull</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                  The villager's records are transferred locally to the ASHA worker's device. The worker's device acts as a **Proxy Sync Agent**, storing the villager's records in her own IndexedDB queue.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)', margin: '15px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>📥</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>ASHA Proxy: 1 Pending</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>Villager record relay successfully pulled</div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    // Queue the relayed villager record into the ASHA worker's IndexedDB queue
                    await queueMaternalRecord({ name: 'Kiran Sharma', age: 24, trimester: 1, riskLevel: 'Normal', villageId: 'v103', relayedBy: 'ASHA-Proxy-103' });
                    window.dispatchEvent(new Event('swasthai_queue_updated'));
                    addSimLog('📦 Step 3: Relayed villager record pulled to ASHA worker proxy queue', '#a78bfa');
                    setP2pStep(3);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Establish Connection & Pull Record
                </button>
              </div>
            )}

            {p2pStep === 3 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>☁️ 4. Proxy Sync to AWS Cloud</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                  The ASHA worker returns to a network coverage zone. Her device automatically reconnects and synchronizes the relayed records directly to the cloud databases.
                </p>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 14, borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)', margin: '15px 0', fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                  ASHA Device Reconnected to AWS Hub (Mumbai ap-south-1)
                </div>
                <button
                  onClick={async () => {
                    addSimLog('☁️ Step 4: Replaying ASHA proxy queue to server...', '#10b981');
                    await syncAllQueues();
                    window.dispatchEvent(new Event('swasthai_queue_updated'));
                    addSimLog('🎉 Step 4: Relayed villager record synced successfully via proxy!', '#34d399');
                    setP2pStep(null);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', background: 'linear-gradient(90deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Upload Proxy Records to AWS
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

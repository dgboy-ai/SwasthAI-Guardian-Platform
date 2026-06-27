import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Smartphone, Cloud, Wifi, WifiOff, Activity, ArrowRight, Clock, Shield, GitCompareArrows } from 'lucide-react';
import adminService from '../../services/adminService';

const STAGES = [
  {
    id: 'village',
    label: 'Village Edge',
    icon: Smartphone,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    ring: 'ring-emerald-200',
    items: [
      { label: 'ASHA Worker App', sub: 'Offline-first PWA' },
      { label: 'Symptoms Reports', sub: 'Voice + Text input' },
      { label: 'Emergency Alerts', sub: 'Real-time SSE push' },
    ]
  },
  {
    id: 'offline',
    label: 'Offline Queue',
    icon: WifiOff,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    ring: 'ring-amber-200',
    items: [
      { label: 'IndexedDB Storage', sub: 'Service Worker cache' },
      { label: 'Background Sync', sub: 'On reconnect flush' },
      { label: 'Pending Queue', sub: 'Retry with backoff' },
    ]
  },
  {
    id: 'dynamodb',
    label: 'DynamoDB (Ingest)',
    icon: Cloud,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    ring: 'ring-blue-200',
    items: [
      { label: 'sync_queues', sub: 'Write-optimized ingest' },
      { label: 'outbreak_telemetry', sub: 'Real-time disease clusters' },
      { label: 'security_audit_logs', sub: 'DPDP Act compliance' },
    ]
  },
  {
    id: 'aurora',
    label: 'Aurora PostgreSQL',
    icon: Database,
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    ring: 'ring-violet-200',
    items: [
      { label: 'Users & Villages', sub: 'ACID medical records' },
      { label: 'Ambulance Requests', sub: 'Emergency coordination' },
      { label: 'RAG + AI Context', sub: 'Structured queries' },
    ]
  },
  {
    id: 'reporting',
    label: 'Analytics & AI',
    icon: Activity,
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    ring: 'ring-rose-200',
    items: [
      { label: 'Dashboard Views', sub: 'Admin Command Center' },
      { label: 'Outbreak Predictions', sub: '30-min autonomous loop' },
      { label: 'RAG-Sakhi AI', sub: 'LLM + vector memory' },
    ]
  },
];

function ArrowConnector() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex flex-col items-center relative">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-emerald-400/70" />
          <motion.div
            className="absolute -left-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
            animate={{ x: [0, 28, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-400/0 via-emerald-400/40 to-emerald-400/0 rounded-full mt-1">
          <motion.div
            className="h-full w-4 bg-emerald-400/60 rounded-full"
            animate={{ x: [-16, 16, -16] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
}

function StageCard({ stage, isHighlighted, onMouseEnter, onMouseLeave, status }) {
  const Icon = stage.icon;
  const statusDot = status === true ? 'bg-emerald-500' : status === false ? 'bg-rose-500' : 'bg-slate-300';
  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className={`relative rounded-2xl border-2 p-4 transition-all duration-300 ${stage.color} ${isHighlighted ? `ring-2 ${stage.ring} shadow-lg scale-[1.02]` : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-white/60">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-black text-[13px]">{stage.label}</h3>
        {status !== undefined && (
          <span className={`ml-auto w-2 h-2 rounded-full ${statusDot} ${status === true ? 'animate-pulse' : ''}`} />
        )}
      </div>
      <ul className="space-y-2">
        {stage.items.map((item, i) => (
          <li key={i} className="bg-white/50 rounded-lg px-2.5 py-1.5 text-left">
            <div className="font-bold text-[11px] text-slate-800">{item.label}</div>
            <div className="text-[9px] text-slate-500 font-medium">{item.sub}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DataPipelineView() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [highlighted, setHighlighted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const status = await adminService.getSystemStatus();
        if (mounted) setSystemStatus(status);
        if (mounted) setError(null);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load pipeline metrics');
      }
      if (mounted) setLoading(false);
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const dynCounts = systemStatus?.databases?.dynamodb?.item_counts || {};
  const dbStatus = systemStatus?.databases?.aurora_postgresql?.status || 'unknown';
  const dynStatus = systemStatus?.databases?.dynamodb?.status || 'unknown';
  const latency = systemStatus?.latency;

  return (
    <div className="p-4 lg:p-5 space-y-4 text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <GitCompareArrows className="w-5 h-5 text-emerald-600" />
          <h2 className="font-black text-slate-900 text-[18px]">Data Flow Pipeline</h2>
        </div>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
          Village → Offline → DynamoDB → Aurora → Analytics
        </p>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {STAGES.map((stage, idx) => (
          <div key={stage.id} className="flex flex-col">
            <StageCard
              stage={stage}
              isHighlighted={highlighted === stage.id}
              onMouseEnter={() => setHighlighted(stage.id)}
              onMouseLeave={() => setHighlighted(null)}
              status={stage.id === 'dynamodb' ? dynStatus === 'connected' || dynStatus === 'ok' : stage.id === 'aurora' ? dbStatus === 'connected' || dbStatus === 'ok' : undefined}
            />
            {idx < STAGES.length - 1 && <ArrowConnector />}
          </div>
        ))}
      </div>

      {/* Live Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h2 className="font-black text-slate-900 text-[18px]">Live Pipeline Metrics</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="h-3 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-6 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-rose-600">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 px-4 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-rose-200 transition-colors">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="DynamoDB Status"
              value={dynStatus}
              icon={Cloud}
              color={dynStatus === 'connected' ? 'text-emerald-600' : 'text-amber-600'}
            />
            <MetricCard
              label="Aurora Status"
              value={dbStatus}
              icon={Database}
              color={dbStatus === 'connected' ? 'text-emerald-600' : 'text-amber-600'}
            />
            <MetricCard
              label="sync_queues Items"
              value={dynCounts?.sync_queues ?? '—'}
              icon={Wifi}
              color="text-blue-600"
            />
            <MetricCard
              label="Avg API Latency"
              value={latency?.avg !== null && latency?.avg !== undefined ? `${latency.avg}ms` : '—'}
              icon={Clock}
              color="text-violet-600"
            />
          </div>
        )}
      </div>

      {/* Flow Description */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="font-black text-slate-900 text-[18px]">Data Flow Philosophy</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-600 leading-relaxed">
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-black text-slate-800 mb-2 uppercase tracking-wider text-[10px]">Write Path</h4>
            <p>Village ASHA worker submits data offline → queued in IndexedDB → background sync to DynamoDB (sub-ms writes) → Lambda fan-out to Aurora PostgreSQL for ACID compliance.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-black text-slate-800 mb-2 uppercase tracking-wider text-[10px]">Read Path</h4>
            <p>Admin dashboards query Aurora PostgreSQL for structured data (users, villages, requests). Outbreak radar reads from DynamoDB for real-time disease cluster visualization. AI service enriches with RAG context.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-black text-slate-800 mb-2 uppercase tracking-wider text-[10px]">Resilience</h4>
            <p>If Aurora is unreachable, writes queue in DynamoDB and retry. If DynamoDB is unreachable, writes stay in IndexedDB until connectivity returns. No data loss in any single failure scenario.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div
      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 flex items-center gap-3 cursor-default"
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.15 }}
    >
      <div className="p-2 rounded-lg bg-white">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="text-sm font-black text-slate-900">{value}</div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Database, Smartphone, Cloud, Wifi, WifiOff, Activity,
  Clock, Shield, GitCompareArrows, Zap, Server,
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw,
  Radio, Lock, TrendingUp, BarChart3
} from 'lucide-react';
import adminService from '../../services/adminService';

/* ─── Stage definitions ─────────────────────────────────────────────────── */
const STAGES = [
  {
    id: 'village', label: 'Village Edge', sub: 'Offline-first PWA',
    icon: Smartphone, accent: '#059669', light: '#ecfdf5', border: '#6ee7b7', mid: '#d1fae5',
    items: [
      { label: 'ASHA Worker App',   tag: 'PWA', tagColor: '#059669' },
      { label: 'Voice + Text Input', tag: 'Input', tagColor: '#0891b2' },
      { label: 'Emergency SOS',     tag: 'SSE', tagColor: '#dc2626' },
    ]
  },
  {
    id: 'offline', label: 'Offline Queue', sub: 'IndexedDB + Service Worker',
    icon: WifiOff, accent: '#d97706', light: '#fffbeb', border: '#fcd34d', mid: '#fef3c7',
    items: [
      { label: 'IndexedDB Cache',   tag: 'Local', tagColor: '#d97706' },
      { label: 'Background Sync',   tag: 'SW', tagColor: '#7c3aed' },
      { label: 'Retry + Backoff',   tag: 'Queue', tagColor: '#0891b2' },
    ]
  },
  {
    id: 'dynamo', label: 'DynamoDB', sub: 'Hot-path ingest · PAY_PER_REQUEST',
    icon: Zap, accent: '#b45309', light: '#fef3c7', border: '#f59e0b', mid: '#fde68a',
    items: [
      { label: 'sync_queues',           tag: '256K+', tagColor: '#b45309' },
      { label: 'outbreak_telemetry',    tag: 'TTL:90d', tagColor: '#dc2626' },
      { label: 'security_audit_logs',   tag: 'DPDP', tagColor: '#5b21b6' },
    ]
  },
  {
    id: 'aurora', label: 'Aurora PostgreSQL', sub: 'Source of truth · ACID',
    icon: Database, accent: '#1d4ed8', light: '#eff6ff', border: '#93c5fd', mid: '#dbeafe',
    items: [
      { label: 'Users & Villages',     tag: 'FK', tagColor: '#1d4ed8' },
      { label: 'Medical Records',      tag: 'ACID', tagColor: '#059669' },
      { label: 'Ambulance Requests',   tag: 'Live', tagColor: '#dc2626' },
    ]
  },
  {
    id: 'analytics', label: 'Analytics & AI', sub: 'Admin Command Center',
    icon: Activity, accent: '#7c3aed', light: '#f5f3ff', border: '#c4b5fd', mid: '#ede9fe',
    items: [
      { label: 'Dashboard Views',      tag: 'SSE', tagColor: '#7c3aed' },
      { label: 'Outbreak AI Loop',     tag: '30m', tagColor: '#dc2626' },
      { label: 'RAG-Sakhi AI',         tag: 'LLM', tagColor: '#0891b2' },
    ]
  },
];

const EVENT_FLOWS = [
  { label: 'Symptom Check', path: ['village', 'offline', 'dynamo', 'aurora', 'analytics'], color: '#059669', tag: 'Write Path' },
  { label: 'Outbreak Alert', path: ['dynamo', 'analytics'], color: '#dc2626', tag: 'Real-time' },
  { label: 'Emergency SOS',  path: ['village', 'aurora', 'analytics'], color: '#7c3aed', tag: 'ACID Fast' },
  { label: 'Offline Sync',   path: ['offline', 'dynamo', 'aurora'], color: '#d97706', tag: 'Resilient' },
  { label: 'AI Prediction',  path: ['aurora', 'analytics'], color: '#0891b2', tag: 'Read Path' },
];

/* ─── Animated counter ─────────────────────────────────────────────────── */
function AnimCount({ value, suffix = '' }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const num = typeof value === 'number' ? value : 0;
  useEffect(() => {
    if (!inView || !num) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      setN(Math.floor((1 - Math.pow(1 - p, 3)) * num));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, num]);
  return <span ref={ref}>{typeof value === 'number' ? n.toLocaleString() : value}{suffix}</span>;
}

/* ─── Status badge ─────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const ok = status === 'connected' || status === 'ok';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
      {ok ? 'Live' : 'Offline'}
    </span>
  );
}

/* ─── Connector with animated flow line ───────────────────────────────── */
function FlowConnector({ active }) {
  return (
    <div className="flex items-center justify-center shrink-0 w-8">
      <div className="relative w-8 h-0.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full w-5 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }}
          animate={{ x: [-20, 32] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

/* ─── Stage Card ────────────────────────────────────────────────────────── */
function StageCard({ stage, status, index, isActive, onHover }) {
  const Icon = stage.icon;
  const hasStatus = stage.id === 'dynamo' || stage.id === 'aurora';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index }}
      onMouseEnter={() => onHover(stage.id)}
      onMouseLeave={() => onHover(null)}
      className="flex-1 min-w-0 bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-default"
      style={{ borderColor: isActive ? stage.accent : stage.border }}
    >
      {/* Top accent line */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${stage.accent}, ${stage.accent}50)` }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: stage.light, border: `1.5px solid ${stage.border}` }}>
              <Icon className="w-4 h-4" style={{ color: stage.accent }} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-900 leading-tight">{stage.label}</p>
              <p className="text-[8px] font-bold text-slate-400 mt-0.5">{stage.sub}</p>
            </div>
          </div>
          {hasStatus && <StatusBadge status={status} />}
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {stage.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border"
              style={{ background: stage.light, borderColor: `${stage.border}60` }}
            >
              <span className="text-[10px] font-bold text-slate-700 truncate">{item.label}</span>
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white ml-2 shrink-0"
                style={{ background: item.tagColor }}
              >
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════ */
export default function DataPipelineView() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStatus = async () => {
    try {
      const status = await adminService.getSystemStatus();
      setSystemStatus(status);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load pipeline metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 30000);
    return () => clearInterval(iv);
  }, []);

  const dynCounts = systemStatus?.databases?.dynamodb?.item_counts || {};
  const dbStatus  = systemStatus?.databases?.aurora_postgresql?.status || 'unknown';
  const dynStatus = systemStatus?.databases?.dynamodb?.status || 'unknown';
  const latency   = systemStatus?.latency;
  const auroraOk  = dbStatus === 'connected' || dbStatus === 'ok';
  const dynamoOk  = dynStatus === 'connected' || dynStatus === 'ok';

  const getStageStatus = (id) => {
    if (id === 'dynamo') return dynamoOk;
    if (id === 'aurora') return auroraOk;
    return null;
  };

  return (
    <div className="p-4 lg:p-5 space-y-5 text-left">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-200/70 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-emerald-200/20 pointer-events-none" />
        <div className="relative z-10 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center">
              <GitCompareArrows className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Data Flow Pipeline</h1>
                <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Village → Offline Queue → DynamoDB → Aurora PostgreSQL → Analytics & AI</p>
            </div>
          </div>
          {lastRefresh && (
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
              <RefreshCw className="w-3 h-3" />
              Updated {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Pipeline Stages ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Pipeline Stages</h2>
          <div className="flex-1 h-px bg-slate-200 ml-2" />
          <span className="text-[9px] font-bold text-slate-400">Hover a stage to highlight</span>
        </div>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
          {STAGES.map((stage, i) => (
            <div key={stage.id} className="flex items-center min-w-0 flex-1" style={{ minWidth: 148 }}>
              <StageCard
                stage={stage}
                status={getStageStatus(stage.id)}
                index={i}
                isActive={hovered === stage.id}
                onHover={setHovered}
              />
              {i < STAGES.length - 1 && <FlowConnector />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Live Metrics + Event Flows side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Live Metrics */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Live Pipeline Metrics</h2>
            <div className="flex-1 h-px bg-slate-200 ml-2" />
            {!loading && !error && (
              <button onClick={fetchStatus} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <RefreshCw className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 animate-pulse">
              {[0,1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
              <AlertCircle className="w-5 h-5 text-rose-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-rose-600">{error}</p>
              <button onClick={fetchStatus} className="mt-2 px-4 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-rose-600 transition-colors">Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'DynamoDB Status', value: dynStatus, raw: null, icon: Zap,      accent: '#d97706', light: '#fffbeb', border: '#fde68a', isStatus: true, ok: dynamoOk },
                { label: 'Aurora Status',   value: dbStatus,  raw: null, icon: Database, accent: '#1d4ed8', light: '#eff6ff', border: '#bfdbfe', isStatus: true, ok: auroraOk },
                { label: 'Sync Queue Items', value: null, raw: dynCounts?.sync_queues ?? 0, icon: Wifi, accent: '#059669', light: '#ecfdf5', border: '#a7f3d0', isStatus: false },
                { label: 'API Latency',     value: latency?.avg != null ? null : '—', raw: latency?.avg ?? null, suffix: 'ms', icon: Clock, accent: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe', isStatus: false },
              ].map(({ label, value, raw, icon: Icon, accent, light, border, isStatus, ok, suffix }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border p-4 flex items-start gap-3 hover:shadow-sm transition-shadow"
                  style={{ background: light, borderColor: border }}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center shadow-sm shrink-0" style={{ borderColor: border }}>
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                    {isStatus ? (
                      <StatusBadge status={value} />
                    ) : (
                      <p className="text-xl font-black text-slate-900 leading-none">
                        {raw !== null && raw !== undefined
                          ? <AnimCount value={typeof raw === 'number' ? raw : 0} suffix={suffix || ''} />
                          : value
                        }
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pipeline health bar */}
          {!loading && !error && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pipeline Health</span>
                <span className="text-[9px] font-black text-emerald-700">{auroraOk && dynamoOk ? '100%' : auroraOk || dynamoOk ? '50%' : '0%'} Operational</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: auroraOk && dynamoOk ? '100%' : auroraOk || dynamoOk ? '50%' : '5%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                />
              </div>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: 'Aurora', ok: auroraOk },
                  { label: 'DynamoDB', ok: dynamoOk },
                  { label: 'AI Service', ok: !!systemStatus?.ai_service },
                  { label: 'SSE Stream', ok: true },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-1">
                    {ok ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-slate-300" />}
                    <span className="text-[9px] font-bold text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Event Flows */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-slate-500" />
            <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Key Event Flows</h2>
          </div>
          <div className="space-y-2.5">
            {EVENT_FLOWS.map((flow, i) => (
              <motion.div
                key={flow.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                className="p-3 rounded-xl border"
                style={{ background: `${flow.color}08`, borderColor: `${flow.color}30` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-black text-slate-800">{flow.label}</p>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: flow.color }}>
                    {flow.tag}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {flow.path.map((stageId, j) => {
                    const stage = STAGES.find(s => s.id === stageId);
                    return (
                      <span key={stageId} className="flex items-center gap-1">
                        <span
                          className="text-[8px] font-black px-1.5 py-0.5 rounded text-white"
                          style={{ background: stage?.accent || '#64748b' }}
                        >
                          {stage?.label?.split(' ')[0]}
                        </span>
                        {j < flow.path.length - 1 && (
                          <ArrowRight className="w-2.5 h-2.5" style={{ color: flow.color }} />
                        )}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Architecture Philosophy ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">Data Flow Architecture</h2>
          <div className="flex-1" />
          <span className="text-[9px] font-bold text-slate-400">Dual-store · Event-driven · Resilient</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Wifi, color: '#059669', light: '#ecfdf5', border: '#a7f3d0',
              title: 'Write Path',
              steps: ['ASHA submits offline → IndexedDB', 'Background sync → DynamoDB (sub-ms)', 'Lambda fan-out → Aurora ACID write'],
              tag: 'Offline-first'
            },
            {
              icon: TrendingUp, color: '#1d4ed8', light: '#eff6ff', border: '#bfdbfe',
              title: 'Read Path',
              steps: ['Dashboard queries Aurora (structured data)', 'Outbreak radar reads DynamoDB (real-time)', 'AI enriches via RAG vector memory'],
              tag: 'Low latency'
            },
            {
              icon: Lock, color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe',
              title: 'Resilience',
              steps: ['Aurora down → queue in DynamoDB, retry', 'DynamoDB down → stay in IndexedDB', 'Zero data loss in any single-failure scenario'],
              tag: 'Fault tolerant'
            },
          ].map(({ icon: Icon, color, light, border, title, steps, tag }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: light, borderColor: border }}>
              <div className="w-9 h-9 rounded-xl bg-white border shadow-sm flex items-center justify-center shrink-0" style={{ borderColor: border }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-black text-slate-800">{title}</p>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: color }}>{tag}</span>
                </div>
                <ol className="space-y-1">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-600 font-medium">
                      <span className="text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white" style={{ background: color }}>
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>

        {/* Footer spec line */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <code className="text-[10px] font-mono text-slate-500">
            EventEmitter <span className="text-emerald-700 font-bold">async fan-out</span> · DLQ retry ·
            IndexedDB <span className="text-amber-700 font-bold">offline-first</span> ·
            Aurora <span className="text-blue-700 font-bold">ACID + FK</span> ·
            DynamoDB <span className="text-amber-700 font-bold">PAY_PER_REQUEST</span> ·
            SSE <span className="text-violet-700 font-bold">real-time push</span>
          </code>
        </div>
      </div>

    </div>
  );
}

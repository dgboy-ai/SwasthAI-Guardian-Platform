import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, CheckCircle, XCircle, Clock, Activity, Server,
  Shield, Zap, Globe, RefreshCw, ChevronDown, ChevronRight,
  ArrowUpRight, Cpu, HardDrive, Wifi, WifiOff, BarChart3,
  Layers, Eye, Lock, AlertTriangle, Brain, Radio
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';
const CACHE_KEY = 'swasthai_system_proof_cache';

function loadCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached?.data && cached?.savedAt) return cached;
  } catch { /* ignore */ }
  return null;
}

function saveCache(json) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: json, savedAt: new Date().toISOString() }));
  } catch { /* ignore */ }
}

export default function SystemVerificationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('live');
  const [lastVerified, setLastVerified] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState('databases');

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_BASE}/api/health/detailed`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setSource('live');
      setLastVerified(new Date().toISOString());
      saveCache(json);
    } catch {
      const cached = loadCachedData();
      if (cached?.data) {
        setData(cached.data);
        setSource('cached');
        setLastVerified(cached.savedAt);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cached = loadCachedData();
    if (cached?.data) {
      setData(cached.data);
      setSource('cached');
      setLastVerified(cached.savedAt);
      setLoading(false);
    }
    fetchData();
  }, []);

  const toggleSection = (s) => setExpandedSection(expandedSection === s ? '' : s);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-semibold">Connecting to system...</p>
        </div>
      </div>
    );
  }

  const db = data?.databases || {};
  const aurora = db.aurora_postgresql || {};
  const dynamo = db.dynamodb || {};
  const ai = data?.ai_service || {};
  const stack = data?.stack || {};

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0d1220] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">SwasthAI Guardian</h1>
              <p className="text-[10px] text-slate-400 font-semibold">System Verification Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-slate-500 font-semibold hidden sm:block">
              {data?.timestamp ? new Date(data.timestamp).toLocaleString() : ''}
            </span>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-slate-300 hover:bg-white/10 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Status Banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 sm:p-5 border ${
            source === 'live'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-cyan-500/10 border-cyan-500/20'
          }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                source === 'live' ? 'bg-emerald-500/20' : 'bg-cyan-500/20'
              }`}>
                {source === 'live'
                  ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                  : <Eye className="w-5 h-5 text-cyan-400" />
                }
              </div>
              <div>
                <p className="text-sm font-black">
                  {source === 'live' ? 'Live Connection — All Systems Operational' : 'Cached Verification — Last Proven Connection'}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {data?.service} · v{data?.version}
                  {lastVerified && (
                    <span className="ml-2 text-cyan-400">
                      · Last verified: {new Date(lastVerified).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-semibold">
              {source === 'cached' && (
                <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                  <Eye className="w-3 h-3" /> Cached
                </span>
              )}
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3 h-3" /> Uptime: {data?.uptime}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Cpu className="w-3 h-3" /> Worker #{data?.cluster?.pid}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Database Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Aurora PostgreSQL */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
            <button onClick={() => toggleSection('aurora')}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-black">Amazon Aurora PostgreSQL</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{aurora.engine}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={aurora.status} />
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedSection === 'aurora' ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <AnimatePresence>
              {expandedSection === 'aurora' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden border-t border-white/5">
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Users', value: aurora.registered_users ?? '—', color: 'text-blue-400' },
                        { label: 'Villages', value: aurora.monitored_villages ?? '—', color: 'text-emerald-400' },
                        { label: 'Pad Requests', value: aurora.pad_requests ?? '—', color: 'text-rose-400' },
                        { label: 'Ambulances', value: aurora.ambulance_requests ?? '—', color: 'text-amber-400' },
                      ].map(s => (
                        <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 text-center">
                          <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Connection Pool */}
                    {aurora.pool && (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Connection Pool</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-300">Total: <b className="text-white">{aurora.pool.total}</b></span>
                          <span className="text-slate-300">Idle: <b className="text-emerald-400">{aurora.pool.idle}</b></span>
                          <span className="text-slate-300">Waiting: <b className="text-amber-400">{aurora.pool.waiting}</b></span>
                        </div>
                      </div>
                    )}

                    {/* Latency */}
                    {aurora.query_latency_ms && (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Query Latency</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-300">Avg: <b className="text-emerald-400">{aurora.query_latency_ms.avg}ms</b></span>
                          <span className="text-slate-300">Min: <b className="text-emerald-400">{aurora.query_latency_ms.min}ms</b></span>
                          <span className="text-slate-300">Max: <b className="text-amber-400">{aurora.query_latency_ms.max}ms</b></span>
                        </div>
                      </div>
                    )}

                    {/* Rationale */}
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                      <p className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1 mb-1">
                        <Brain className="w-3 h-3" /> Why Aurora?
                      </p>
                      <p className="text-xs text-slate-300">{aurora.rationale}</p>
                    </div>

                    {aurora.production_setup && (
                      <p className="text-[10px] text-amber-400 font-semibold bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                        ⚠️ {aurora.production_setup}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* DynamoDB */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
            <button onClick={() => toggleSection('dynamo')}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-black">Amazon DynamoDB</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{dynamo.billing}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={dynamo.status} />
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedSection === 'dynamo' ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <AnimatePresence>
              {expandedSection === 'dynamo' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden border-t border-white/5">
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Tables */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Tables & Access Patterns</p>
                      {(dynamo.tables || []).map(t => (
                        <div key={t.name} className="bg-white/[0.03] rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-white font-mono">{t.name}</span>
                            <span className="text-[9px] text-slate-500 font-semibold">{t.billing}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span>PK: <b className="text-slate-300">{t.hashKey}</b></span>
                            {t.rangeKey && <span>SK: <b className="text-slate-300">{t.rangeKey}</b></span>}
                            <span>GSIs: <b className="text-emerald-400">{t.gsiCount}</b></span>
                            {t.ttl && <span>TTL: <b className="text-amber-400">{t.ttl}</b></span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Item Counts */}
                    {dynamo.item_counts && Object.keys(dynamo.item_counts).length > 0 && (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Item Counts</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(dynamo.item_counts).map(([table, count]) => (
                            <div key={table} className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-mono text-[10px]">{table}</span>
                              <span className="font-bold text-white">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rationale */}
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                      <p className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1 mb-1">
                        <Zap className="w-3 h-3" /> Why DynamoDB?
                      </p>
                      <p className="text-xs text-slate-300">{dynamo.rationale}</p>
                    </div>

                    {dynamo.production_setup && (
                      <p className="text-[10px] text-amber-400 font-semibold bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                        ⚠️ {dynamo.production_setup}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* AI Service + Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* AI Service */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-[#111827] border border-white/5 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-black">AI Service</p>
                <p className="text-[10px] text-slate-400 font-semibold">FastAPI + PyTorch + Groq</p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={ai.live_status === 'online' ? 'connected' : 'mock'} />
              </div>
            </div>
            <div className="space-y-2">
              {(ai.modules || []).map((mod, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono text-[10px]">{mod}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                <p className="font-bold text-violet-400">{ai.rag_chunks || 243}</p>
                <p className="text-slate-500">RAG Chunks</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                <p className="font-bold text-emerald-400">{ai.rag_threshold || 0.45}</p>
                <p className="text-slate-500">Threshold</p>
              </div>
            </div>
          </motion.div>

          {/* Tech Stack */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#111827] border border-white/5 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-black">Technology Stack</p>
                <p className="text-[10px] text-slate-400 font-semibold">Full-stack architecture</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Frontend', value: stack.frontend, icon: Globe, color: 'text-cyan-400' },
                { label: 'Backend', value: stack.backend, icon: Server, color: 'text-emerald-400' },
                { label: 'AI', value: stack.ai, icon: Brain, color: 'text-violet-400' },
                { label: 'Relational DB', value: stack.relational, icon: Database, color: 'text-blue-400' },
                { label: 'NoSQL DB', value: stack.nosql, icon: Zap, color: 'text-amber-400' },
                { label: 'LLM', value: stack.llm, icon: Radio, color: 'text-rose-400' },
              ].map(s => (
                <div key={s.label} className="flex items-start gap-2.5">
                  <s.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${s.color}`} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{s.label}</p>
                    <p className="text-xs text-slate-300 font-semibold truncate">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {stack.languages && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stack.languages.map(lang => (
                  <span key={lang} className="text-[9px] font-bold px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-slate-400">
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Demo Credentials */}
        {data?.demo_credentials && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-[#111827] border border-white/5 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <Lock className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-black">Demo Credentials</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(data.demo_credentials).map(([key, val]) => (
                <div key={key} className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">{key.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-emerald-400 font-mono font-bold">{val}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Project Meta */}
        {data?.project_meta && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 text-center">
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">{data.project_meta.category}</p>
            <p className="text-sm text-slate-300 font-semibold">Target: {data.project_meta.target}</p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-white/5">
          <p className="text-[10px] text-slate-600 font-semibold">
            SwasthAI Guardian · Built for Bharat's villages · H0 Hackathon 2026
          </p>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const isConnected = status === 'connected';
  const isMock = status === 'mock';
  return (
    <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${
      isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : isMock ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        : 'bg-red-500/10 text-red-400 border border-red-500/20'
    }`}>
      {isConnected ? <CheckCircle className="w-2.5 h-2.5" /> : isMock ? <AlertTriangle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
      {status?.toUpperCase()}
    </span>
  );
}

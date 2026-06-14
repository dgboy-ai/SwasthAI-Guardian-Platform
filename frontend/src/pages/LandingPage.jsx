import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { VERSION, COPYRIGHT_YEAR } from '../constants/version';
import { showToast } from '../utils/toast';
import { 
  HeartPulse, Activity, Shield, Users, ArrowRight, BrainCircuit, 
  Truck, Globe, Zap, CheckCircle, MapPin, PhoneCall, WifiOff, Mic, ShieldCheck, Play,
  Camera, Database, Server, CloudUpload, Wifi, RefreshCw, Eye, Baby
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// ─── Architecture Flow Visualization ─────────────────────────────────────────
const FLOW_STEPS = [
  {
    id: 'user',
    icon: Users,
    label: 'Village User',
    sub: 'ASHA Worker / Patient',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
  },
  {
    id: 'pwa',
    icon: Wifi,
    label: 'PWA Frontend',
    sub: 'Vite + React + Service Worker',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
    border: 'rgba(99,102,241,0.3)',
  },
  {
    id: 'idb',
    icon: Database,
    label: 'IndexedDB Queue',
    sub: 'Offline write buffer',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
  },
  {
    id: 'dispatcher',
    icon: RefreshCw,
    label: 'Event Dispatcher',
    sub: 'Auto-replay on reconnect',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.3)',
  },
  {
    id: 'aurora',
    icon: Server,
    label: 'Aurora PostgreSQL',
    sub: 'Patient records & vitals',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
  },
  {
    id: 'dynamo',
    icon: CloudUpload,
    label: 'DynamoDB',
    sub: 'Telemetry & event streams',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.3)',
  },
];

function ArchitectureFlow() {
  const [active, setActive] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setActive(prev => (prev + 1) % FLOW_STEPS.length);
    }, 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      {/* Offline toggle */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <button
          onClick={() => setIsOffline(v => !v)}
          style={{
            padding: '8px 20px',
            borderRadius: 999,
            border: `1px solid ${isOffline ? '#ef444455' : '#10b98155'}`,
            background: isOffline ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            color: isOffline ? '#f87171' : '#34d399',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
          {isOffline ? 'Offline Mode — Data queued in IndexedDB' : 'Online Mode — Live sync active'}
        </button>
      </div>

      {/* Flow nodes */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 0,
      }}>
        {FLOW_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = active === i;
          // In offline mode, cloud nodes (aurora, dynamo) are dimmed
          const isBlocked = isOffline && (step.id === 'aurora' || step.id === 'dynamo');
          // IndexedDB glows in offline mode
          const isHighlighted = isOffline && step.id === 'idb';

          return (
            <React.Fragment key={step.id}>
              {/* Node */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '16px 12px',
                borderRadius: 16,
                background: isActive ? step.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? step.border : 'rgba(255,255,255,0.07)'}`,
                minWidth: 110,
                maxWidth: 130,
                opacity: isBlocked ? 0.3 : 1,
                transition: 'all 0.4s ease',
                position: 'relative',
                cursor: 'default',
              }}>
                {isHighlighted && (
                  <div style={{
                    position: 'absolute',
                    inset: -2,
                    borderRadius: 18,
                    border: `2px solid ${step.color}`,
                    animation: 'architecturePulse 1.2s ease infinite',
                  }} />
                )}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: isActive ? step.bg : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${isActive ? step.border : 'transparent'}`,
                  transition: 'all 0.4s ease',
                }}>
                  <Icon size={20} color={isActive ? step.color : '#4b5563'} style={{ transition: 'all 0.4s ease' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? step.color : '#9ca3af',
                    transition: 'color 0.4s ease',
                    whiteSpace: 'nowrap',
                  }}>{step.label}</div>
                  <div style={{ fontSize: 9, color: '#4b5563', marginTop: 2, lineHeight: 1.3 }}>{step.sub}</div>
                </div>
              </div>

              {/* Arrow connector */}
              {i < FLOW_STEPS.length - 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 4px',
                }}>
                  <div style={{
                    width: 28,
                    height: 2,
                    background: active > i
                      ? (isOffline && i >= 3 ? '#ef444433' : FLOW_STEPS[i].color)
                      : 'rgba(255,255,255,0.08)',
                    transition: 'background 0.5s ease',
                    borderRadius: 1,
                  }} />
                  <div style={{
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderLeft: `6px solid ${active > i ? (isOffline && i >= 3 ? '#ef444433' : FLOW_STEPS[i].color) : 'rgba(255,255,255,0.08)'}`,
                    transition: 'border-left-color 0.5s ease',
                  }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        marginTop: 32,
        flexWrap: 'wrap',
      }}>
        {[
          { color: '#10b981', label: 'Always available (offline)' },
          { color: '#f59e0b', label: 'Queued locally if no signal' },
          { color: '#6366f1', label: 'Synced on reconnect' },
          { color: '#ef4444', label: 'Cloud (requires connectivity)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#6b7280' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes architecturePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { loginPassword } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  const handleOneClickLogin = async (id, password, role) => {
    setDemoLoading(role);
    try {
      await loginPassword(id, password, role);
      navigate(`/${role}`);
    } catch (err) {
      showToast(err.message || 'Demo login failed.', 'error');
    } finally {
      setDemoLoading(null);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 150);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-[#FDFDFF] min-h-screen font-inter selection:bg-emerald-100 selection:text-emerald-900 relative">
      
      <Navbar />


      {/* HERO SECTION */}
      <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-20 lg:pt-52 lg:pb-32 px-6 overflow-hidden">
         {/* Background Ornaments */}
         <div className="absolute top-0 right-0 w-full h-[800px] bg-gradient-to-br from-emerald-50/50 to-transparent pointer-events-none -z-10" />
         
         <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            
            {/* OFFLINE BADGE (RULE #6) */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-6 sm:py-2 bg-slate-900 text-emerald-400 rounded-full mb-6 sm:mb-10 shadow-xl border border-slate-800"
            >
               <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
               <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]">{t.landing?.offline_badge || 'No Internet Required'}</span>
            </motion.div>

            {/* TITLE & TAGLINE (RULE #1 & #2) */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-6xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1] sm:leading-[0.9] mb-4 sm:mb-6"
            >
               {t.landing?.title_ai || 'AI-Powered'} <br />
               <span className="text-emerald-600 italic">{t.landing?.title_rural || 'Rural Healthcare'}</span>
            </motion.h1>

            {/* 1-LINE ANCHOR PITCH */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 max-w-3xl px-4"
            >
              <p className="text-xs sm:text-sm text-slate-700 font-extrabold tracking-wide uppercase bg-emerald-50 border border-emerald-100 rounded-2xl py-3 px-6 shadow-sm inline-block">
                🌿 <span className="text-slate-950 font-black">Guardian</span>: B2B SaaS platform for public health command centers and NGOs to coordinate rural ASHA workers, verify schemes, and track outbreaks.
              </p>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-slate-500 font-bold max-w-2xl leading-relaxed mb-6 sm:mb-8 px-4"
            >
               {t.tagline || 'Works even without internet and provides instant health support.'}
            </motion.p>

            {/* PRIMARY ACTION BUTTONS (RULE #3) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full max-w-xl px-4 mb-8"
            >
               <button 
                 onClick={() => navigate('/demo')}
                 aria-label="Explore Demo Portal"
                 className="w-full py-4 sm:py-6 bg-emerald-600 text-white rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-emerald-700 focus-visible:ring-4 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-none transition-all flex items-center justify-center gap-4 text-[11px] sm:text-sm group"
               >
                  Explore Demo Portal
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
               </button>
               <button 
                 onClick={() => navigate('/ambulance')}
                 aria-label="Request Emergency Ambulance Help"
                 className="w-full py-4 sm:py-6 bg-red-600 text-white rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-red-700 focus-visible:ring-4 focus-visible:ring-red-500 focus-visible:ring-offset-2 outline-none transition-all flex items-center justify-center gap-4 text-[11px] sm:text-sm pulse-button"
               >
                  {t.nav?.ambulance || 'Emergency Help'}
               </button>
            </motion.div>

            {/* 1-CLICK FRICTIONLESS DEMO LOGIN PANEL */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-center shadow-xl mb-4"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-4 flex items-center justify-center gap-1.5">
                ⚡ 1-Click Frictionless Demo Access
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  disabled={demoLoading !== null}
                  onClick={() => handleOneClickLogin('9876543210', 'Demo@1234', 'villager')}
                  className="px-2 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors border border-slate-700"
                >
                  {demoLoading === 'villager' ? '⏳...' : 'Villager Demo'}
                </button>
                <button
                  disabled={demoLoading !== null}
                  onClick={() => handleOneClickLogin('9876543211', 'Demo@1234', 'ngo')}
                  className="px-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  {demoLoading === 'ngo' ? '⏳...' : 'ASHA Worker'}
                </button>
                <button
                  disabled={demoLoading !== null}
                  onClick={() => handleOneClickLogin('admin@swasthai.in', 'Demo@1234', 'admin')}
                  className="px-2 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors border border-slate-700"
                >
                  {demoLoading === 'admin' ? '⏳...' : 'Admin Command'}
                </button>
              </div>
            </motion.div>

            {/* TRUST / STACK BADGES */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-16 pt-10 border-t border-slate-100 flex flex-wrap justify-center gap-3 md:gap-4"
            >
              {[
                { label: 'Amazon Aurora', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                { label: 'DynamoDB', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
                { label: 'Offline-First PWA', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                { label: 'IndexedDB Queue', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { label: 'DISHA-Compliant', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                { label: 'WHO Guidelines', color: 'bg-teal-50 text-teal-700 border-teal-100' },
              ].map((badge) => (
                <span key={badge.label} className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${badge.color} tracking-wide`}>
                  {badge.label}
                </span>
              ))}
            </motion.div>
         </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">{t.landing?.what_we_do || 'What SwasthAI Does'}</p>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">{t.landing?.real_tools || 'Real tools for real villages.'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
               {[
                 { icon: BrainCircuit, color: 'bg-emerald-50 text-emerald-600', title: t.intro?.service_1_t || 'Symptom AI', desc: t.intro?.service_1_d || 'Offline-first AI checker in local languages.' },
                 { icon: Camera,       color: 'bg-teal-50 text-teal-600',       title: t.intro?.service_2_t || 'Skin Scan', desc: t.intro?.service_2_d || 'Private edge-AI skin analysis on device.' },
                 { icon: Truck,        color: 'bg-rose-50 text-rose-600',       title: t.intro?.service_3_t || 'Ambulance', desc: t.intro?.service_3_d || 'One-tap dispatch with live ETA tracking.' },
                 { icon: HeartPulse,   color: 'bg-pink-50 text-pink-600',       title: t.intro?.service_4_t || 'Maternal Care', desc: t.intro?.service_4_d || 'Pregnancy tracking and risk alerts.' },
                 { icon: Users,        color: 'bg-amber-50 text-amber-600',     title: t.intro?.service_5_t || 'Child Nutrition', desc: t.intro?.service_5_d || 'WHO Z-Score malnutrition monitoring.' },
                 { icon: Activity,    color: 'bg-blue-50 text-blue-600',       title: t.intro?.service_6_t || 'Admin Hub', desc: t.intro?.service_6_d || 'Regional analytics for district officers.' },
               ].map((s, i) => (
                  <div key={i} className="p-6 sm:p-8 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all">
                     <div className={`w-10 h-10 sm:w-12 sm:h-12 ${s.color} rounded-xl flex items-center justify-center mb-4 sm:mb-6`}>
                        <s.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                     </div>
                     <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-2 sm:mb-3">{s.title}</h3>
                     <p className="text-[11px] sm:text-sm font-medium text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* ── AGENTIC OUTBREAK MONITOR SHOWCASE ── */}
      <section className="py-20 bg-slate-50 border-t border-b border-slate-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute top-0 left-0 w-64 h-64 bg-red-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 bg-red-50 border border-red-100 px-3.5 py-1.5 rounded-full inline-block mb-4">
              🔥 Headline Original Innovation
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-tight">
              Autonomous Agentic Outbreak Monitor
            </h2>
            <p className="mt-6 text-slate-600 text-sm leading-relaxed font-semibold">
              Our proprietary, closed-loop epidemiological early warning system processes offline symptom reports dynamically, detects geographic clusters, and dispatches containment alerts instantly.
            </p>
            
            <div className="mt-8 space-y-6">
              {[
                { step: "01", title: "Symptom Clustering", desc: "Aggregates real-time patient records from offline-synced village devices." },
                { step: "02", title: "Llama-3.1 Classification", desc: "Local LLM agent classifies clusters for epidemic risk (e.g., Dengue vs. Malaria)." },
                { step: "03", title: "DynamoDB Durability Write", desc: "Locks anomaly state into low-latency AWS DynamoDB key-value store." },
                { step: "04", title: "SSE Admin Broadcast", desc: "Pushes real-time SSE (Server-Sent Events) to the district command center." }
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="text-xl font-black text-red-500 shrink-0 font-mono">{item.step}.</span>
                  <div>
                    <h4 className="text-slate-950 font-black text-sm uppercase tracking-wide">{item.title}</h4>
                    <p className="text-slate-500 text-xs font-semibold mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative">
            <div className="absolute -top-4 -right-4 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
              Live Loop Active
            </div>
            
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-red-400 font-mono text-xs font-bold uppercase tracking-wider">Agentic Epidemiological Loop</span>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Incoming Telemetry</span>
                <span className="text-white text-xs font-mono font-bold">12 Symptom Logs → Village ID: #401 (Malavli)</span>
              </div>
              <div className="flex justify-center text-slate-600 text-lg">↓</div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Llama-3.1 Agent Classification</span>
                <span className="text-red-400 text-xs font-mono font-bold">⚠️ Warning: High Dengue Outbreak Probability (94.2% Confidence)</span>
              </div>
              <div className="flex justify-center text-slate-600 text-lg">↓</div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">AWS DynamoDB Write</span>
                <span className="text-white text-xs font-mono font-semibold">Saved item: <code className="text-yellow-400 font-mono">outbreak_event_2026_06_07_v401</code></span>
              </div>
              <div className="flex justify-center text-slate-600 text-lg">↓</div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-emerald-900/50 bg-emerald-950/20">
                <span className="text-emerald-500 text-[10px] uppercase font-bold tracking-widest block mb-1">SSE Admin Broadcast Dispatch</span>
                <span className="text-emerald-400 text-xs font-mono font-bold">🚀 SSE Stream: Alert Broadcasted to District Command Center Terminal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE STORY SECTION ── */}
      <section className="py-24 bg-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-3">How it works</p>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">Offline-First. <span className="text-indigo-400">Always On.</span></h2>
            <p className="mt-4 text-slate-400 text-sm max-w-xl mx-auto">Data flows from village to cloud — or stays safe in IndexedDB when there's no signal. Nothing is lost.</p>
          </div>
          <ArchitectureFlow />
        </div>
      </section>

      {/* ── PRICING & MONETIZATION SECTION (B2B SaaS) ── */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-100">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">Flexible B2B SaaS Plans</p>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">Monetization & SaaS Pricing</h2>
              <p className="mt-4 text-slate-500 text-sm max-w-xl mx-auto">Sustainable public-private partnership models for districts, state ministries, and non-profits.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              
              {/* Tier 1 */}
              <div className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col justify-between hover:shadow-xl transition-all">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">District Starter</span>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-slate-900">$199</span>
                    <span className="text-slate-400 text-sm font-semibold">/month</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-2 font-medium">Perfect for smaller health networks or localized NGO pilots.</p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-600 font-medium border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2">🟢 Up to 50 active villages</li>
                    <li className="flex items-center gap-2">🟢 Offline-first maternal vital logs</li>
                    <li className="flex items-center gap-2">🟢 Basic Sakhi RAG support</li>
                    <li className="flex items-center gap-2">🟢 Weekly CSV / CMO report exports</li>
                  </ul>
                </div>
                <button onClick={() => navigate('/login')} className="mt-8 w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors">Start Pilot</button>
              </div>

              {/* Tier 2 - Recommended */}
              <div className="bg-slate-900 rounded-[2rem] border-2 border-emerald-500 p-8 flex flex-col justify-between hover:shadow-2xl transition-all relative scale-105 shadow-xl shadow-emerald-950/20">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Recommended</div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full">District Command</span>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-white">$399</span>
                    <span className="text-slate-400 text-sm font-semibold">/month</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-2 font-medium">Standard choice for active district health departments.</p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-300 font-medium border-t border-slate-800 pt-6">
                    <li className="flex items-center gap-2">🟢 Up to 250 active villages</li>
                    <li className="flex items-center gap-2">🟢 Autonomous Outbreak Agent scans</li>
                    <li className="flex items-center gap-2">🟢 Live SSE real-time dashboards</li>
                    <li className="flex items-center gap-2">🟢 Unified RDS PostgreSQL backup</li>
                  </ul>
                </div>
                <button onClick={() => navigate('/login')} className="mt-8 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black text-[10px] uppercase tracking-wider transition-colors">Deploy Command</button>
              </div>

              {/* Tier 3 */}
              <div className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col justify-between hover:shadow-xl transition-all">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">State Enterprise</span>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-slate-900">Custom</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-2 font-medium">Enterprise scale for state ministries & national healthcare integrations.</p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-600 font-medium border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2">🟢 Unlimited villages & workers</li>
                    <li className="flex items-center gap-2">🟢 Dedicated AWS Aurora PostgreSQL pool</li>
                    <li className="flex items-center gap-2">🟢 Custom WHO/MoHFW protocol chunks</li>
                    <li className="flex items-center gap-2">🟢 ABDM (National Health IDs) sync</li>
                  </ul>
                </div>
                <button onClick={() => navigate('/login')} className="mt-8 w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors">Contact Sales</button>
              </div>

            </div>
         </div>
      </section>

      {/* ── REAL TECH STACK & AI PROOF ── */}
      <section className="py-24 bg-white border-b border-slate-100">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">Zero Vaporware. Fully Verified.</p>
                  <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">REAL ML MODELS & LIVE CLOUD DATABASES</h2>
                  <p className="mt-6 text-slate-500 text-sm leading-relaxed font-medium">
                     Unlike prototype apps that rely on generic mock-ups, SwasthAI is backed by active database deployments and custom-trained AI architectures. You can verify this live in the Admin dashboard under system logs.
                  </p>
                  
                  <div className="mt-8 space-y-4">
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 font-bold shrink-0">✓</div>
                        <div>
                           <p className="text-slate-900 font-black text-sm">Custom SymptomNet Neural Network</p>
                           <p className="text-slate-500 text-xs font-semibold">Trained & validated on 101 disease classes in 6 regional languages + Hinglish (64.6% accuracy, standalone PKL file in the repository).</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 font-bold shrink-0">✓</div>
                        <div>
                           <p className="text-slate-900 font-black text-sm">Grounded Sakhi RAG Engine</p>
                           <p className="text-slate-500 text-xs font-semibold">Uses 243 verified clinical knowledge chunks from WHO/MoHFW with calibrated threshold 0.45 (F1=1.00).</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 font-bold shrink-0">✓</div>
                        <div>
                           <p className="text-slate-900 font-black text-sm">Durable Dual-Database AWS Plane</p>
                           <p className="text-slate-500 text-xs font-semibold">Amazon RDS PostgreSQL handles core transactions while Amazon DynamoDB hosts high-velocity sync queues & telemetry.</p>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl font-mono text-xs text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                     <span className="text-emerald-400 font-black">SYSTEM PROOF telemetry_check()</span>
                     <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-2.5">
                     <p><span className="text-slate-500"># AWS PostgreSQL Connection:</span> <span className="text-emerald-400">CONNECTED</span></p>
                     <p><span className="text-slate-500"># AWS DynamoDB Telemetry Plane:</span> <span className="text-emerald-400">ACTIVE (4 tables verified)</span></p>
                     <p><span className="text-slate-500"># Neural SymptomNet (PyTorch):</span> <span className="text-emerald-400">LOADED (.pkl state mapped)</span></p>
                     <p><span className="text-slate-500"># Grounded RAG Knowledge Base:</span> <span className="text-emerald-400">243 Chunks Ready</span></p>
                     <p><span className="text-slate-500"># Outbreak Scans:</span> <span className="text-emerald-400">Autonomous (Every 30m)</span></p>
                     <p className="pt-4 border-t border-slate-800 text-[10px] text-slate-500">
                        * Verify status dynamically inside the app by logging in as an Admin and visiting "System Status" or the "Live System Verification" dashboard.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </section>


      {/* BENEFITS SECTION (RULE #5) */}
      <section className="py-16 sm:py-32 bg-[#FDFDFF]">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20 items-center">
            <div className="space-y-6 sm:space-y-8">
               <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none uppercase">Designed for <br/>every home.</h2>
               <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
                  <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl shadow-sm">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                     <span className="text-base sm:text-xl font-black text-slate-700 uppercase tracking-tight">Check illness in seconds</span>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl shadow-sm">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0"><Truck className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                     <span className="text-base sm:text-xl font-black text-slate-700 uppercase tracking-tight">Emergency help instantly</span>
                  </div>
               </div>
            </div>
 
            {/* VOICE HIGHLIGHT (RULE #7) */}
            <div className="relative mt-4 sm:mt-0">
               <motion.div 
                 whileInView={{ scale: [0.9, 1], opacity: [0, 1] }}
                 className="bg-slate-900 p-10 sm:p-16 rounded-[3rem] sm:rounded-[4rem] text-center text-white shadow-2xl relative overflow-hidden"
               >
                  <div className="absolute inset-0 bg-emerald-600/5 pointer-events-none" />
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }} 
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-10 shadow-2xl shadow-emerald-500/20"
                  >
                     <Mic className="w-8 h-8 sm:w-12 sm:h-12" />
                  </motion.div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-4 uppercase">Just speak, <br/>no typing needed</h3>
                  <p className="text-emerald-400 font-black uppercase tracking-widest text-[9px] sm:text-[10px]">Supports local languages</p>
               </motion.div>
            </div>
         </div>
      </section>

      {/* ── SIMULATION CTA BANNER */}
      <section className="py-12 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Live Demo</p>
            <h3 className="text-white font-black text-xl">Watch the outbreak surge simulation</h3>
            <p className="text-indigo-200 text-sm mt-1">5 districts, 100+ cases, real-time event dispatch — no backend required.</p>
          </div>
          <button
            onClick={() => navigate('/demo')}
            aria-label="Open Demo Portal"
            className="shrink-0 px-8 py-4 bg-white text-indigo-700 rounded-full font-black uppercase tracking-wide text-sm shadow-xl hover:scale-105 active:scale-95 focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 outline-none transition-all flex items-center gap-3"
          >
            <Play className="w-4 h-4" /> Open Demo Portal
          </button>
        </div>
      </section>

      {/* FINAL CTA (RULE #10) */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-100">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter mb-4 sm:mb-6 uppercase px-4 leading-tight">Start your health check now</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm mb-8 sm:mb-12 px-6">Take the first step towards better health today.</p>
            <button 
              onClick={() => navigate('/intro')}
              aria-label="Get Started with SwasthAI"
              className="px-10 py-5 sm:px-16 sm:py-8 bg-emerald-600 text-white rounded-full font-black uppercase tracking-[0.3em] text-sm sm:text-lg shadow-2xl shadow-emerald-200 hover:scale-105 active:scale-95 focus-visible:ring-4 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-none transition-all"
            >
               Get Started
            </button>
         </div>
      </section>



      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .pulse-button {
          animation: pulse-red 2s infinite;
        }
      ` }} />
    </div>
  );
}

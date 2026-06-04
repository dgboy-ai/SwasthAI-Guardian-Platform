import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { VERSION, COPYRIGHT_YEAR } from '../constants/version';
import { 
  HeartPulse, Activity, Shield, Users, ArrowRight, BrainCircuit, 
  Truck, Globe, Zap, CheckCircle, MapPin, PhoneCall, WifiOff, Mic, ShieldCheck, Play,
  Camera, Database, Server, CloudUpload, Wifi, RefreshCw, Eye, Baby
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

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
  const [scrolled, setScrolled] = useState(false);

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
              className="text-4xl sm:text-6xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1] sm:leading-[0.9] mb-6 sm:mb-8"
            >
               {t.landing?.title_ai || 'AI-Powered'} <br />
               <span className="text-emerald-600 italic">{t.landing?.title_rural || 'Rural Healthcare'}</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-xl lg:text-2xl text-slate-500 font-bold max-w-2xl leading-relaxed mb-8 sm:mb-12 px-4"
            >
               {t.tagline || 'Works even without internet and provides instant health support.'}
            </motion.p>

            {/* PRIMARY ACTION BUTTONS (RULE #3) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full max-w-xl px-4"
            >
               <button 
                 onClick={() => navigate('/symptoms')}
                 aria-label="Start Symptoms Health Check"
                 className="w-full py-4 sm:py-6 bg-emerald-600 text-white rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-emerald-700 focus-visible:ring-4 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-none transition-all flex items-center justify-center gap-4 text-[11px] sm:text-sm group"
               >
                  {t.nav?.check_symptoms || 'Start Health Check'}
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
            onClick={() => navigate('/monitor')}
            aria-label="Open Observability Dashboard"
            className="shrink-0 px-8 py-4 bg-white text-indigo-700 rounded-full font-black uppercase tracking-wide text-sm shadow-xl hover:scale-105 active:scale-95 focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 outline-none transition-all flex items-center gap-3"
          >
            <Play className="w-4 h-4" /> Open Dashboard
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

      {/* FOOTER */}
      <footer className="bg-slate-50 py-12 border-t border-slate-100 text-center font-black uppercase text-[10px] text-slate-300 tracking-[0.4em]">
         <p>© {COPYRIGHT_YEAR} SwasthAI Guardian {VERSION} · Rural Health Sovereignty</p>
      </footer>

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

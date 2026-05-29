import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
  Baby, Heart, Shield, Plus,
  MapPin, Activity, Stethoscope, ChevronRight,
  Truck, Package,
  CheckCircle, Clock, AlertTriangle, X,
  Loader, PhoneCall, RefreshCw, WifiOff, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ngoService from '../services/ngoService';
import PregnancyTracker from './PregnancyTracker';
import MalnutritionForm from './MalnutritionForm';

/* ─── AI Urgency Classifier (Tristha Track: Ticket Classification) ─────── */
// Classifies incoming health requests into P1-P4 urgency levels
// based on clinical keyword analysis of symptom descriptions.
// Source: MoHFW Emergency Triage Guidelines 2023 + WHO IMCI Protocol
const P1_KEYWORDS = ['unconscious','not breathing','seizure','heavy bleeding','chest pain','stroke','convulsion','no pulse','eclampsia'];
const P2_KEYWORDS = ['high fever','severe pain','difficulty breathing','vomiting blood','accident','fracture','preterm','labour','labor'];
const P3_KEYWORDS = ['fever','pain','diarrhea','vomiting','swelling','rash','cough','weakness'];

// ── Static color maps — avoids Tailwind purging dynamic class strings ─────
const URGENCY_TEXT  = { red: 'text-red-400',    orange: 'text-orange-400', amber: 'text-amber-400', slate: 'text-slate-400' };
const URGENCY_BORDER = { red: 'border-l-red-500', orange: 'border-l-orange-500', amber: 'border-l-amber-500', slate: 'border-l-slate-300' };

// ── P1 Alert Sound — Web Audio API (no external file needed) ─────────────
function playP1Alert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.3, 0.6].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
  } catch (_) { /* silently ignore if AudioContext unavailable */ }
}

export function classifyUrgency(req) {
  const text = `${req.symptoms || ''} ${req.problem || ''} ${req.priority || ''}`.toLowerCase();
  if (P1_KEYWORDS.some(kw => text.includes(kw))) return { level: 'P1', label: 'CRITICAL', color: 'red',    bg: 'bg-red-600',    badge: 'bg-red-100 text-red-800 border-red-300' };
  if (P2_KEYWORDS.some(kw => text.includes(kw))) return { level: 'P2', label: 'HIGH',     color: 'orange', bg: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800 border-orange-300' };
  if (P3_KEYWORDS.some(kw => text.includes(kw))) return { level: 'P3', label: 'MODERATE', color: 'amber',  bg: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-800 border-amber-300' };
  return                                                { level: 'P4', label: 'LOW',      color: 'slate',  bg: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600 border-slate-300' };
}

/* ─── Shared Request Card ─────────────────────────────────── */
function RequestCard({ req, onUpdate, type }) {
  const statusStyle = {
    pending:     'bg-yellow-100 text-yellow-700 border-yellow-200',
    assigned:    'bg-blue-100 text-blue-700 border-blue-200',
    in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
    completed:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  const isPad = type === 'pad';

  const urgency = isPad ? null : classifyUrgency(req);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 ${
        urgency ? `${URGENCY_BORDER[urgency.color]} border border-slate-100` : 'border border-slate-100'
      }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPad ? 'bg-rose-50' : 'bg-red-50'}`}>
        {isPad ? <Package className="w-5 h-5 text-rose-600" /> : <PhoneCall className="w-5 h-5 text-red-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {/* AI Urgency Badge — Tristha Track: Ticket Classification */}
          {urgency && (
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${urgency.badge}`}>
              <Zap className="w-2.5 h-2.5" />{urgency.level} · {urgency.label}
            </span>
          )}
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isPad ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {isPad ? 'Pad Request' : (req.priority || 'Emergency')}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyle[req.status] || 'bg-slate-100 text-slate-500'}`}>
            {req.status}
          </span>
        </div>
        <p className="text-sm font-black text-slate-900">{req.name || 'Unknown Villager'}</p>
        {req.location && <p className="text-xs text-slate-400 font-medium mt-0.5"><MapPin className="w-3 h-3 inline mr-1" />{req.location}</p>}
        {req.symptoms && <p className="text-xs text-slate-500 font-medium mt-1 italic">"{req.symptoms}"</p>}
        <p className="text-[10px] text-slate-300 font-medium mt-1">
          <Clock className="w-3 h-3 inline mr-1" />
          {req.created_at ? new Date(req.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {req.status === 'pending'     && <button onClick={() => onUpdate(req.id, 'assigned')}    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors">Accept</button>}
        {req.status === 'assigned'    && <button onClick={() => onUpdate(req.id, 'in_progress')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">Start</button>}
        {req.status === 'in_progress' && <button onClick={() => onUpdate(req.id, 'completed')}   className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">Complete</button>}
      </div>
    </motion.div>
  );
}

/* ─── Error Banner ────────────────────────────────────────── */
function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-4">
      <WifiOff className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-black text-red-800">Failed to load data</p>
        <p className="text-xs text-red-600 mt-0.5">{message}</p>
        <p className="text-[10px] text-red-400 mt-1">Make sure the backend server is running on port 5000 and you are logged in as an NGO/ASHA account.</p>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────── */
export default function NGODashboard() {
  const [activeTab, setActiveTab]       = useState('summary');
  const [showModal, setShowModal]       = useState(null);

  const [ambulances, setAmbulances]     = useState([]);
  const [pads, setPads]                 = useState([]);
  const [outbreaks, setOutbreaks]       = useState([]);
  const [ambulanceErr, setAmbulanceErr] = useState(null);
  const [padErr, setPadErr]             = useState(null);
  const [loadingAmb, setLoadingAmb]     = useState(false);
  const [loadingPad, setLoadingPad]     = useState(false);
  const [loadingOutbreaks, setLoadingOutbreaks] = useState(false);

  /* Fetch both on mount so overview counts are available */
  useEffect(() => {
    fetchAmbulances();
    fetchPads();
    fetchOutbreaks();
  }, []);

  /* Also re-fetch when switching into a tab */
  useEffect(() => {
    if (activeTab === 'ambulances') fetchAmbulances();
    if (activeTab === 'pads')       fetchPads();
  }, [activeTab]);

  /* Auto-refresh every 15 s while on that tab */
  useEffect(() => {
    if (activeTab !== 'ambulances') return;
    const t = setInterval(fetchAmbulances, 15000);
    return () => clearInterval(t);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'pads') return;
    const t = setInterval(fetchPads, 15000);
    return () => clearInterval(t);
  }, [activeTab]);

  const fetchOutbreaks = async () => {
    setLoadingOutbreaks(true);
    try {
      const res = await api.get('/admin/outbreaks');
      const allOutbreaks = res.data.outbreaks || [];
      
      // PROFESSIONAL FILTER: Only show alerts relevant to this ASHA worker's village
      const myVillageAlerts = allOutbreaks.filter(ob => ob.villageId === user?.villageId);
      setOutbreaks(myVillageAlerts);
    } catch (e) {
      console.error('Failed to fetch outbreak alerts:', e);
    } finally {
      setLoadingOutbreaks(false);
    }
  };

  const fetchAmbulances = async () => {
    setLoadingAmb(true);
    setAmbulanceErr(null);
    try {
      const data = await ngoService.getRequests();
      const list = Array.isArray(data) ? data : [];
      // ── Play P1 alert if any new critical requests arrived ─────────────────
      const hadP1Before = ambulances.some(r => classifyUrgency(r).level === 'P1' && r.status === 'pending');
      const hasP1Now    = list.some(r => classifyUrgency(r).level === 'P1' && r.status === 'pending');
      if (hasP1Now && !hadP1Before) playP1Alert();
      setAmbulances(list);
    } catch (e) {
      setAmbulanceErr(typeof e === 'string' ? e : e?.message || 'Network error — check if backend is running.');
    } finally { setLoadingAmb(false); }
  };

  const fetchPads = async () => {
    setLoadingPad(true);
    setPadErr(null);
    try {
      const data = await ngoService.getPadRequests();
      setPads(Array.isArray(data) ? data : []);
    } catch (e) {
      setPadErr(typeof e === 'string' ? e : e?.message || 'Network error — check if backend is running.');
    } finally { setLoadingPad(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await ngoService.updateRequestStatus(id, status);
      fetchAmbulances();
      fetchPads();
    } catch (e) { alert('Failed to update status: ' + (typeof e === 'string' ? e : e?.message)); }
  };

  const tabs = [
    { id: 'summary',    label: 'Overview',        icon: Activity },
    { id: 'ambulances', label: 'Ambulance Alerts', icon: Truck,   count: ambulances.filter(r => r.status === 'pending').length },
    { id: 'pads',       label: 'Pad Requests',     icon: Package, count: pads.filter(r => r.status === 'pending').length },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-inter antialiased">
      <Navbar role="ngo" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-24">

        {/* 🚨 AI OUTBREAK ALERT BANNER 🚨 */}
        <AnimatePresence>
          {outbreaks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 bg-red-600 rounded-[2rem] text-white shadow-2xl shadow-red-600/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                <AlertTriangle className="w-40 h-40" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center animate-pulse">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">Neural Outbreak Detected</h2>
                    <p className="text-red-100 text-xs font-bold">The AI Agent has detected a disease cluster in your village area.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {outbreaks.map((ob, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-200">Alert #{idx+1}</p>
                      <p className="text-sm font-black">{ob.classification}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">ASHA Field Worker Portal</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            NGO <span className="text-emerald-600">Command</span>
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-base max-w-xl leading-relaxed">
            Handle village ambulance emergencies and sanitary pad requests in real-time.
          </p>
        </header>

        {/* Tab Nav */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
              }`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-black ${
                  activeTab === tab.id ? 'bg-white text-emerald-600' : 'bg-red-500 text-white'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in duration-700">

            {/* Live counts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Pending Ambulance', val: ambulances.filter(r=>r.status==='pending').length,    icon: Truck,         color: 'red'   },
                { label: 'Pending Pad Reqs',  val: pads.filter(r=>r.status==='pending').length,          icon: Package,       color: 'rose'  },
                { label: 'Ambulance Total',   val: ambulances.length,                                    icon: Activity,      color: 'amber' },
                { label: 'Pad Reqs Total',    val: pads.length,                                          icon: Stethoscope,   color: 'purple'},
              ].map(item => (
                <div key={item.label} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 bg-${item.color}-50 text-${item.color}-500`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <p className="text-3xl font-black text-slate-900">{item.val}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            {/* ── AI URGENCY MATRIX (Tristha Track: Intelligent Ticket Classification) ── */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-yellow-400/20 rounded-xl"><Zap className="w-5 h-5 text-yellow-400" /></div>
                <div>
                  <h3 className="text-base font-black">AI Urgency Matrix</h3>
                  <p className="text-slate-400 text-[10px] font-medium">Auto-classified · Source: MoHFW Emergency Triage Guidelines 2023</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { level: 'P1', label: 'CRITICAL', color: 'red',    count: ambulances.filter(r => classifyUrgency(r).level === 'P1').length },
                  { level: 'P2', label: 'HIGH',     color: 'orange', count: ambulances.filter(r => classifyUrgency(r).level === 'P2').length },
                  { level: 'P3', label: 'MODERATE', color: 'amber',  count: ambulances.filter(r => classifyUrgency(r).level === 'P3').length },
                  { level: 'P4', label: 'LOW',      color: 'slate',  count: ambulances.filter(r => classifyUrgency(r).level === 'P4').length },
                ].map(p => (
                  <div key={p.level} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-all">
                    {/* Use static lookup map — avoids Tailwind purge of dynamic classes */}
                    <p className={`text-4xl font-black mb-1 ${URGENCY_TEXT[p.color]}`}>{p.count}</p>
                    <p className="text-white font-black text-xs">{p.level}</p>
                    <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">{p.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ambulance shortcut */}
              <div onClick={() => setActiveTab('ambulances')}
                className="bg-red-600 rounded-[2rem] p-8 text-white relative overflow-hidden group hover:scale-[1.01] transition-all cursor-pointer">
                <div className="absolute right-[-5%] top-[-10%] opacity-10"><Truck className="w-48 h-48" /></div>
                <Truck className="w-8 h-8 text-red-300 mb-4" />
                <h3 className="text-2xl font-black mb-2">Ambulance Alerts</h3>
                <p className="text-red-100/80 text-sm font-medium leading-relaxed mb-6 max-w-xs">
                  Real-time SOS calls and ambulance requests from villagers. Accept and dispatch.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white text-red-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest w-fit shadow-lg">
                    View Alerts <ChevronRight className="w-4 h-4" />
                  </div>
                  {ambulances.filter(r=>r.status==='pending').length > 0 && (
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1.5 rounded-xl">
                      {ambulances.filter(r=>r.status==='pending').length} Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Pads shortcut */}
              <div onClick={() => setActiveTab('pads')}
                className="bg-rose-600 rounded-[2rem] p-8 text-white relative overflow-hidden group hover:scale-[1.01] transition-all cursor-pointer">
                <div className="absolute right-[-5%] top-[-10%] opacity-10"><Package className="w-48 h-48" /></div>
                <Package className="w-8 h-8 text-rose-300 mb-4" />
                <h3 className="text-2xl font-black mb-2">Pad Requests</h3>
                <p className="text-rose-100/80 text-sm font-medium leading-relaxed mb-6 max-w-xs">
                  Village women requesting sanitary pad delivery from ASHA workers.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white text-rose-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest w-fit shadow-lg">
                    View Requests <ChevronRight className="w-4 h-4" />
                  </div>
                  {pads.filter(r=>r.status==='pending').length > 0 && (
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1.5 rounded-xl">
                      {pads.filter(r=>r.status==='pending').length} Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => setShowModal('pregnancy')}
                className="bg-emerald-600 rounded-[2rem] p-8 text-white relative overflow-hidden group hover:scale-[1.01] transition-all cursor-pointer">
                <div className="absolute right-[-5%] top-[-10%] opacity-10"><Shield className="w-48 h-48" /></div>
                <Heart className="w-8 h-8 text-emerald-300 mb-4" />
                <h3 className="text-2xl font-black mb-2">Pregnancy Tracker</h3>
                <p className="text-emerald-100/80 text-sm font-medium leading-relaxed mb-6 max-w-xs">
                  Log trimester data and flag high-risk pregnancies for urgent attention.
                </p>
                <div className="flex items-center gap-2 bg-white text-emerald-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest w-fit shadow-lg">
                  Open Tracker <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setShowModal('malnutrition')}
                className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group hover:scale-[1.01] transition-all cursor-pointer">
                <div className="absolute right-[-5%] top-[-10%] opacity-5"><Baby className="w-48 h-48" /></div>
                <Activity className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="text-2xl font-black mb-2">Child Malnutrition</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6 max-w-xs">
                  AI classifies nutritional status using WHO Z-score standards from height/weight data.
                </p>
                <div className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest w-fit shadow-lg">
                  Assess Child <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AMBULANCE ALERTS ── */}
        {activeTab === 'ambulances' && (
          <div className="animate-in fade-in duration-700">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-10">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Truck className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Ambulance / SOS Alerts</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Auto-refreshes every 15 seconds · Real-time</p>
                  </div>
                </div>
                <button onClick={fetchAmbulances} disabled={loadingAmb}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-700 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAmb ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {ambulanceErr && <ErrorBanner message={ambulanceErr} />}

              {loadingAmb ? (
                <div className="flex items-center justify-center py-16">
                  <Loader className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : ambulances.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-black text-slate-400 text-sm">No active ambulance requests</p>
                  <p className="text-xs text-slate-300 font-medium mt-1">New SOS alerts will appear here automatically</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ambulances.map(req => (
                    <RequestCard key={req.id} req={req} onUpdate={updateStatus} type="ambulance" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PAD REQUESTS ── */}
        {activeTab === 'pads' && (
          <div className="animate-in fade-in duration-700">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-10">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Package className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Sanitary Pad Requests</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Confidential · Auto-refreshes every 15 seconds</p>
                  </div>
                </div>
                <button onClick={fetchPads} disabled={loadingPad}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPad ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-6 flex items-start gap-3">
                <Shield className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-rose-800">These are private requests from village women. Handle with care and discretion.</p>
              </div>

              {padErr && <ErrorBanner message={padErr} />}

              {loadingPad ? (
                <div className="flex items-center justify-center py-16">
                  <Loader className="w-6 h-6 animate-spin text-rose-500" />
                </div>
              ) : pads.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-black text-slate-400 text-sm">No pad requests yet</p>
                  <p className="text-xs text-slate-300 font-medium mt-1">New requests from village women will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pads.map(req => (
                    <RequestCard key={req.id} req={req} onUpdate={updateStatus} type="pad" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-lg">
                  {showModal === 'pregnancy' ? 'Pregnancy Tracker' : 'Child Malnutrition Assessment'}
                </h3>
                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6">
                {showModal === 'pregnancy'    && <PregnancyTracker />}
                {showModal === 'malnutrition' && <MalnutritionForm />}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, PlusCircle, X, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Activity, Scale, TrendingDown, ShieldCheck, FlaskConical, Camera } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { queueChildRecord, getPendingChild, syncAllQueues } from '../utils/offlineSyncQueue';

// ── Evaluation / Demo seed data — shown when DB returns empty ────────────────────────
// Real-world representative data using WHO WHZ-score classification.
const DEMO_CHILD_RECORDS = [
  {
    id: 'demo-child-001', childName: 'Raju Kumar', ageMonths: 18,
    weight: 7.2, height: 78, bmi: 11.83,
    status: 'Severe Acute Malnutrition',
    action: 'Urgent: Immediate referral to Nutrition Rehabilitation Centre (NRC). WHZ < -3 SD.',
    villageId: 'V-047 (Berasia)', isDemo: true,
  },
  {
    id: 'demo-child-002', childName: 'Priya Bai', ageMonths: 36,
    weight: 10.8, height: 92, bmi: 12.74,
    status: 'Moderate Acute Malnutrition',
    action: 'Refer to Supplementary Nutrition Programme (ASHA follow-up). WHZ < -2 SD.',
    villageId: 'V-012 (Ichhawar)', isDemo: true,
  },
  {
    id: 'demo-child-003', childName: 'Arjun Singh', ageMonths: 48,
    weight: 13.5, height: 100, bmi: 13.50,
    status: 'Mild Underweight',
    action: 'Provide energy-dense nutrition advice. Follow up in 14 days. WHZ < -1 SD.',
    villageId: 'V-033 (Nasrullaganj)', isDemo: true,
  },
  {
    id: 'demo-child-004', childName: 'Sita Devi', ageMonths: 24,
    weight: 11.2, height: 85, bmi: 15.51,
    status: 'Normal',
    action: 'Healthy growth. Continue optimal feeding practices.',
    villageId: 'V-008 (Sehore)', isDemo: true,
  },
  {
    id: 'demo-child-005', childName: 'Mohan Yadav', ageMonths: 12,
    weight: 6.8, height: 70, bmi: 13.88,
    status: 'Severe Acute Malnutrition',
    action: 'Urgent: Immediate referral to Nutrition Rehabilitation Centre (NRC). WHZ < -3 SD.',
    villageId: 'V-021 (Ashta)', isDemo: true,
  },
  {
    id: 'demo-child-006', childName: 'Lakshmi Tiwari', ageMonths: 54,
    weight: 15.1, height: 108, bmi: 12.94,
    status: 'Normal',
    action: 'Healthy growth. Continue optimal feeding practices.',
    villageId: 'V-062 (Budhni)', isDemo: true,
  },
];

const STATUS_CONFIG = {
  'Severe Acute Malnutrition': { 
    color: 'bg-rose-50 text-rose-700 border-rose-200', 
    dot: 'bg-rose-500', 
    bar: 'w-full bg-rose-500', 
    borderL: 'border-l-rose-500', 
    icon: AlertTriangle,
    avatar: 'bg-rose-100 text-rose-600',
    actionBox: 'bg-rose-50/70 border-rose-100 text-rose-800'
  },
  'Moderate Acute Malnutrition': { 
    color: 'bg-orange-50 text-orange-700 border-orange-200', 
    dot: 'bg-orange-500', 
    bar: 'w-3/4 bg-orange-500', 
    borderL: 'border-l-orange-500', 
    icon: TrendingDown,
    avatar: 'bg-orange-100 text-orange-600',
    actionBox: 'bg-orange-50/70 border-orange-100 text-orange-800'
  },
  'Mild Underweight': { 
    color: 'bg-amber-50 text-amber-700 border-amber-200', 
    dot: 'bg-amber-500', 
    bar: 'w-1/2 bg-amber-500', 
    borderL: 'border-l-amber-500', 
    icon: Activity,
    avatar: 'bg-amber-100 text-amber-600',
    actionBox: 'bg-amber-50/70 border-amber-100 text-amber-800'
  },
  'Normal': { 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    dot: 'bg-emerald-500', 
    bar: 'w-1/4 bg-emerald-500', 
    borderL: 'border-l-emerald-500', 
    icon: CheckCircle,
    avatar: 'bg-emerald-100 text-emerald-600',
    actionBox: 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
  },
};
const getStatus = (s) => STATUS_CONFIG[s] || STATUS_CONFIG['Normal'];

// LocalStorage helpers removed — migrated to centralized IndexedDB queue in offlineSyncQueue.js

function NutritionForm({ onSave, onClose }) {
  const [form, setForm] = useState({ childName: '', ageMonths: '', weight: '', height: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const payload = {
      name: form.childName,
      age: Number(form.ageMonths),
      weight: Number(form.weight),
      height: Number(form.height),
    };
    try {
      const res = await api.post('/ngo/malnutrition', payload);
      onSave({ ...form, status: res.data.status, bmi: res.data.bmi, action: res.data.action });
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'Validation error');
        setLoading(false);
        return;
      }

      // ── WHO Weight-for-Height Z-score (WHZ) — Offline Fallback ────────────────
      // Source: WHO Child Growth Standards (2006), combined sex reference.
      // WHZ = (observed_weight - median_weight_at_height) / SD_at_height
      // SAM: WHZ < -3 | MAM: -3 ≤ WHZ < -2 | At-Risk: -2 ≤ WHZ < -1 | Normal: ≥ -1
      const WHO_WHZ_TABLE = [
        { h: 45,  median: 2.44,  sd: 0.29 },
        { h: 50,  median: 3.35,  sd: 0.39 },
        { h: 55,  median: 4.58,  sd: 0.50 },
        { h: 60,  median: 5.98,  sd: 0.61 },
        { h: 65,  median: 7.28,  sd: 0.69 },
        { h: 70,  median: 8.38,  sd: 0.77 },
        { h: 75,  median: 9.19,  sd: 0.83 },
        { h: 80,  median: 9.95,  sd: 0.91 },
        { h: 85,  median: 10.61, sd: 0.97 },
        { h: 90,  median: 11.24, sd: 1.03 },
        { h: 95,  median: 11.89, sd: 1.10 },
        { h: 100, median: 12.62, sd: 1.18 },
        { h: 105, median: 13.48, sd: 1.30 },
        { h: 110, median: 14.47, sd: 1.44 },
        { h: 115, median: 15.57, sd: 1.60 },
        { h: 120, median: 16.67, sd: 1.76 },
      ];

      const w = Number(form.weight);
      const h = Number(form.height);
      const hClamped = Math.max(45, Math.min(120, h));

      // Linear interpolation for heights between table entries
      let lower = WHO_WHZ_TABLE[0], upper = WHO_WHZ_TABLE[WHO_WHZ_TABLE.length - 1];
      for (let i = 0; i < WHO_WHZ_TABLE.length - 1; i++) {
        if (hClamped >= WHO_WHZ_TABLE[i].h && hClamped <= WHO_WHZ_TABLE[i + 1].h) {
          lower = WHO_WHZ_TABLE[i];
          upper = WHO_WHZ_TABLE[i + 1];
          break;
        }
      }
      const frac      = lower.h === upper.h ? 0 : (hClamped - lower.h) / (upper.h - lower.h);
      const median    = lower.median + frac * (upper.median - lower.median);
      const sd        = lower.sd    + frac * (upper.sd    - lower.sd);
      const whz       = (w - median) / sd;
      const bmiVal    = Number((w / ((h / 100) * (h / 100))).toFixed(2)); // display only

      let localStatus = 'Normal';
      let localAction = 'Healthy growth. Continue optimal feeding practices.';

      if (whz < -3) {
        localStatus = 'Severe Acute Malnutrition';
        localAction = 'Urgent: Immediate referral to Nutrition Rehabilitation Centre (NRC). WHZ < -3 SD.';
      } else if (whz < -2) {
        localStatus = 'Moderate Acute Malnutrition';
        localAction = 'Refer to Supplementary Nutrition Programme (ASHA follow-up). WHZ < -2 SD.';
      } else if (whz < -1) {
        localStatus = 'Mild Underweight';
        localAction = 'Provide energy-dense nutrition advice. Follow up in 14 days. WHZ < -1 SD.';
      }

      const offlineRecord = {
        id: `offline-${Date.now()}`,
        childName: form.childName,
        ageMonths: Number(form.ageMonths),
        weight: w,
        height: h,
        status: localStatus,
        bmi: bmiVal,
        action: localAction,
        isOffline: true
      };

      try {
        await queueChildRecord(offlineRecord);
      } catch (storageErr) {
        console.error('Queue write error:', storageErr);
      }

      onSave(offlineRecord);
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-xl p-6 sm:p-8 relative">
        <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-600 transition-all">
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl sm:rounded-2xl"><Users className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Check Nutrition</h2>
            <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enter details to check growth status</p>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs font-bold text-rose-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Child's Name</label>
              <input className="input-field py-2.5 sm:py-3 text-sm" placeholder="e.g. Raju Kumar" value={form.childName} onChange={e => set('childName', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Age (Months)</label>
              <input type="number" className="input-field py-2.5 sm:py-3 text-sm" placeholder="0–60" value={form.ageMonths} onChange={e => set('ageMonths', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Weight (KG)</label>
              <input type="number" step="0.1" className="input-field py-2.5 sm:py-3 text-sm" placeholder="e.g. 12.5" value={form.weight} onChange={e => set('weight', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Height (CM)</label>
              <input type="number" className="input-field py-2.5 sm:py-3 text-sm" placeholder="e.g. 90" value={form.height} onChange={e => set('height', e.target.value)} required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3">
            {loading ? <><RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> Checking...</> : <><Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Check Growth</>}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function ChildNutritionPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try { 
      setError(''); 
      // Silently try to sync offline records in background first
      await syncAllQueues();

      const res = await api.get('/ngo/malnutrition'); 
      const serverRecords = res.data || [];
      localStorage.setItem('cached_child_records', JSON.stringify(serverRecords));

      const offlineRecords = await getPendingChild();
      const combined = [...offlineRecords, ...serverRecords];

      // ── Demo fallback: if DB is empty, show demo seed data ──
      if (combined.length === 0) {
        setRecords(DEMO_CHILD_RECORDS);
        setIsDemoMode(true);
      } else {
        setRecords(combined);
        setIsDemoMode(false);
      }
    } catch (err) { 
      // Load from cached server records + merge with offline pending queue
      const cached = localStorage.getItem('cached_child_records');
      const serverRecords = cached ? JSON.parse(cached) : [];
      const offlineRecords = await getPendingChild();
      const combined = [...offlineRecords, ...serverRecords];

      // ── Demo fallback: show rich demo data so the page is never blank ──
      if (combined.length === 0) {
        setRecords(DEMO_CHILD_RECORDS);
        setIsDemoMode(true);
      } else {
        setRecords(combined);
        setIsDemoMode(false);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchRecords(); 

    const handleOnline = () => {
      console.log('Browser back online. Synchronizing child records...');
      fetchRecords();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleSave = (r) => { 
    // When a real record is submitted, clear demo records and show live data
    setRecords(prev => [{ childName: r.childName, ageMonths: r.ageMonths, weight: r.weight, height: r.height, status: r.status, bmi: r.bmi, action: r.action, id: r.id || Date.now(), isOffline: r.isOffline }, ...prev.filter(x => !x.isDemo)]); 
    setIsDemoMode(false);
    setShowForm(false); 
  };

  const filtered = records.filter(r => {
    const matchesFilter = filter === 'All' ? true : r.status === filter;
    const matchesSearch = (r.childName || r.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: records.length,
    severe: records.filter(r => r.status === 'Severe Acute Malnutrition').length,
    moderate: records.filter(r => r.status === 'Moderate Acute Malnutrition').length,
    normal: records.filter(r => r.status === 'Normal').length,
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-inter pb-24 sm:pb-8">
      <Navbar role="ngo" />
      <main className="max-w-[1600px] mx-auto p-4 sm:p-8 lg:p-10 pt-28 overflow-y-auto">

        {/* HEADER */}
        <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 pb-5 sm:pb-8 border-b border-slate-200">
          <div className="space-y-1 w-full md:w-auto">
            <button onClick={() => navigate('/ngo')} className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors mb-2">
              <ArrowLeft className="w-2.5 h-2.5" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-1.5 text-amber-600 font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[8px] sm:text-[10px] mb-0.5 sm:mb-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" /> Nutrition Module
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
              Child <span className="text-amber-500 italic">Nutrition.</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs sm:text-sm mt-0.5 sm:mt-2">WHO Z-Score assessment · Under-5 children</p>
            {isDemoMode && (
              <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full w-fit">
                <FlaskConical className="w-3 h-3 text-violet-500" />
                <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">Demo Mode — Representative Data · Sehore District</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={fetchRecords} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-amber-600 transition-all shadow-sm flex items-center justify-center">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={() => navigate('/skin-disease?childMode=true')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-lg shadow-teal-500/10">
              <Camera className="w-3.5 h-3.5" /> Rash Scanner
            </button>
            <button onClick={() => setShowForm(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10">
              <PlusCircle className="w-3.5 h-3.5" /> New Child
            </button>
          </div>
        </motion.header>

        {/* STATS */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total Assessed', val: stats.total, cls: 'bg-indigo-50 text-indigo-600 border-indigo-100', cardBg: 'bg-gradient-to-br from-indigo-50/50 to-white border-slate-200 text-slate-900', icon: Users },
            { label: 'Severe Malnutrition', val: stats.severe, cls: 'bg-rose-50 text-rose-600 border-rose-100', cardBg: 'bg-gradient-to-br from-rose-50/50 to-white border-rose-200 text-rose-900', icon: AlertTriangle },
            { label: 'Moderate Malnutrition', val: stats.moderate, cls: 'bg-orange-50 text-orange-600 border-orange-100', cardBg: 'bg-gradient-to-br from-orange-50/50 to-white border-orange-200 text-orange-900', icon: TrendingDown },
            { label: 'Normal Growth', val: stats.normal, cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', cardBg: 'bg-gradient-to-br from-emerald-50/50 to-white border-emerald-200 text-emerald-950', icon: CheckCircle },
          ].map(s => {
            const Icon = s.icon;
            return (
              <motion.div 
                whileHover={{ y: -4, scale: 1.01 }}
                key={s.label} 
                className={`rounded-[1.5rem] p-4 sm:p-6 border shadow-sm transition-all duration-350 cursor-default ${s.cardBg}`}
              >
                <div className={`p-2 rounded-xl w-fit mb-2 sm:mb-4 border ${s.cls}`}><Icon className="w-4.5 h-4.5" /></div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">{s.label}</p>
                <p className="text-2xl sm:text-4xl font-black tracking-tight leading-none">{s.val}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* FILTERS & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Severe', 'Moderate', 'Normal'].map(f => {
                const label = f === 'Severe' ? 'Severe Acute Malnutrition' : f === 'Moderate' ? 'Moderate Acute Malnutrition' : f;
                return (
              <button key={f} onClick={() => setFilter(label)}
                className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${filter === label ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-200'}`}>
                {f}
              </button>
            )})}
          </div>
          <div className="relative flex-1 md:max-w-xs">
            <input
              type="text"
              placeholder="Search children..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all shadow-sm"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>
        </div>

        {/* RECORDS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="space-y-1.5">
                      <div className="w-24 h-4 bg-slate-100 rounded" />
                      <div className="w-16 h-3 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-slate-100 rounded-full" />
                </div>
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between"><div className="w-16 h-3 bg-slate-100 rounded" /><div className="w-20 h-3 bg-slate-100 rounded" /></div>
                  <div className="flex justify-between"><div className="w-16 h-3 bg-slate-100 rounded" /><div className="w-20 h-3 bg-slate-100 rounded" /></div>
                  <div className="flex justify-between"><div className="w-16 h-3 bg-slate-100 rounded" /><div className="w-20 h-3 bg-slate-100 rounded" /></div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50">
                  <div className="flex justify-between mb-1.5"><div className="w-12 h-2 bg-slate-100 rounded" /><div className="w-3 h-3 bg-slate-100 rounded" /></div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" /><p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4"><Users className="w-10 h-10 text-amber-200" /></div>
            <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No Records Found</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all">
              + Add First Child
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((r, i) => {
                const s = getStatus(r.status);
                const SIcon = s.icon;
                return (
                  <motion.div 
                    key={r.id || i} 
                    layout 
                    initial={{ opacity: 0, y: 16 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} 
                    transition={{ delay: i * 0.04 }}
                    className={`bg-white rounded-3xl p-5 border-l-[6px] ${s.borderL} border-y-slate-100 border-r-slate-100 border shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden group`}
                  >
                    {/* Decorative Background Icon */}
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-500 pointer-events-none text-slate-900">
                      <SIcon className="w-24 h-24" />
                    </div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${s.avatar}`}>
                          {(r.childName || r.name || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{r.childName || r.name || 'Unknown'}</p>
                            {r.isOffline ? (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md text-[7px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-0.5 shrink-0">
                                <RefreshCw className="w-2 h-2 animate-spin shrink-0" /> Sync Pending
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-[7px] font-bold uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                                <ShieldCheck className="w-2 h-2 shrink-0" /> Synced to AWS
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">{r.ageMonths || r.ageMonths === 0 ? `${r.ageMonths} months` : 'Age N/A'}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{r.status || 'Assessed'}
                      </span>
                    </div>

                    {/* Quick Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 my-4 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100/50 relative z-10">
                      <div className="text-center p-1">
                        <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Weight</span>
                        <span className="font-black text-slate-855 text-xs sm:text-sm">{r.weight ? `${r.weight} kg` : 'N/A'}</span>
                      </div>
                      <div className="text-center p-1 border-x border-slate-200/50">
                        <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Height</span>
                        <span className="font-black text-slate-855 text-xs sm:text-sm">{r.height ? `${r.height} cm` : 'N/A'}</span>
                      </div>
                      <div className="text-center p-1">
                        <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">BMI</span>
                        <span className="font-black text-slate-855 text-xs sm:text-sm">{r.bmi || 'N/A'}</span>
                      </div>
                    </div>

                    {r.action && (
                      <div className={`mt-3 p-3.5 rounded-2xl border text-[11px] font-bold relative z-10 ${s.actionBox}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <SIcon className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Guideline Action</span>
                        </div>
                        <p className="leading-relaxed">{r.action}</p>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-50 relative z-10">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Risk Level</span>
                        <SIcon className={`w-3 h-3 ${r.status === 'Normal' ? 'text-emerald-500' : r.status?.includes('Severe') ? 'text-rose-500' : 'text-amber-500'}`} />
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${s.bar}`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* FLOATING ACTION PANEL FOR MOBILE SUSHAS / ASHA WORKERS */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-lg border border-slate-200 shadow-2xl rounded-2xl px-4 py-3 flex gap-3 items-center w-[90%] justify-between">
        <button onClick={() => navigate('/skin-disease?childMode=true')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all">
          <Camera className="w-3.5 h-3.5" /> Scanner
        </button>
        <button onClick={() => setShowForm(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all">
          <PlusCircle className="w-3.5 h-3.5" /> New Child
        </button>
      </div>

      <AnimatePresence>{showForm && <NutritionForm onSave={handleSave} onClose={() => setShowForm(false)} />}</AnimatePresence>
    </div>
  );
}

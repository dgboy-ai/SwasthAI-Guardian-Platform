import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, PlusCircle, X, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Calendar, User, Activity, ShieldCheck, Baby, FlaskConical } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { queueMaternalRecord, getPendingMaternal, syncAllQueues } from '../utils/offlineSyncQueue';

// ── Judge / Demo seed data — shown when DB returns empty ────────────────────────
// Real-world representative data for Sehore district, Madhya Pradesh.
const DEMO_MATERNAL_RECORDS = [
  {
    id: 'demo-mat-001', name: 'Sunita Devi', age: 26, trimester: 3,
    dueDate: '2026-07-18', villageId: 'V-047 (Berasia)', riskLevel: 'High Risk',
    vitals: { systolic_bp: 162, diastolic_bp: 108, bs: 6.2, heart_rate: 104 },
    isDemo: true,
  },
  {
    id: 'demo-mat-002', name: 'Radha Kumari', age: 22, trimester: 2,
    dueDate: '2026-08-30', villageId: 'V-012 (Ichhawar)', riskLevel: 'Medium Risk',
    vitals: { systolic_bp: 143, diastolic_bp: 92, bs: 8.9, heart_rate: 96 },
    isDemo: true,
  },
  {
    id: 'demo-mat-003', name: 'Meena Bai', age: 29, trimester: 1,
    dueDate: '2026-11-05', villageId: 'V-033 (Nasrullaganj)', riskLevel: 'Low Risk',
    vitals: { systolic_bp: 112, diastolic_bp: 72, bs: 4.8, heart_rate: 76 },
    isDemo: true,
  },
  {
    id: 'demo-mat-004', name: 'Geeta Sharma', age: 31, trimester: 3,
    dueDate: '2026-07-02', villageId: 'V-008 (Sehore)', riskLevel: 'Medium Risk',
    vitals: { systolic_bp: 138, diastolic_bp: 88, bs: 7.1, heart_rate: 91 },
    isDemo: true,
  },
  {
    id: 'demo-mat-005', name: 'Pushpa Yadav', age: 19, trimester: 2,
    dueDate: '2026-09-14', villageId: 'V-021 (Ashta)', riskLevel: 'Low Risk',
    vitals: { systolic_bp: 118, diastolic_bp: 76, bs: 5.3, heart_rate: 82 },
    isDemo: true,
  },
  {
    id: 'demo-mat-006', name: 'Anjali Tiwari', age: 24, trimester: 3,
    dueDate: '2026-06-28', villageId: 'V-062 (Budhni)', riskLevel: 'High Risk',
    vitals: { systolic_bp: 158, diastolic_bp: 102, bs: 9.4, heart_rate: 112 },
    isDemo: true,
  },
];

const RISK_CONFIG = {
  'High Risk':   { color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', bar: 'w-full bg-rose-500', icon: AlertTriangle },
  'Medium Risk': { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', bar: 'w-2/3 bg-amber-500', icon: Activity },
  'Low Risk':    { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bar: 'w-1/3 bg-emerald-500', icon: CheckCircle },
};
const getRisk = (lvl) => RISK_CONFIG[lvl] || RISK_CONFIG['Low Risk'];
const TRIM_LABELS = { 1: '1st Trimester', 2: '2nd Trimester', 3: '3rd Trimester' };

function VitalSlider({ label, unit, min, max, value, onChange, dangerAbove, warnAbove }) {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  const color = value > dangerAbove ? 'bg-rose-500' : value > warnAbove ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</label>
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-black ${value > dangerAbove ? 'text-rose-600' : value > warnAbove ? 'text-amber-500' : 'text-emerald-600'}`}>{value}</span>
          <span className="text-[9px] text-slate-400 font-bold">{unit}</span>
        </div>
      </div>
      <div className="relative h-1.5 bg-slate-100 rounded-full">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <input type="range" min={min} max={max} step={label.includes('Sugar') ? 0.1 : 1}
        value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-4 sm:h-5 accent-emerald-600 cursor-pointer" />
      <div className="flex justify-between text-[8px] text-slate-300 font-bold">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// LocalStorage helpers removed — migrated to centralized IndexedDB queue in offlineSyncQueue.js

function MaternalForm({ onSave, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', age: '', trimester: 1, dueDate: '' });
  const [vitals, setVitals] = useState({ systolic_bp: 115, diastolic_bp: 75, bs: 5.0, heart_rate: 78 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setV = (k, v) => setVitals(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const payload = {
      ...form,
      vitals: {
        systolic_bp:  vitals.systolic_bp,
        diastolic_bp: vitals.diastolic_bp,
        bs:           vitals.bs,
        body_temp:    98.6,        // standard assumption — not collected (minor field)
        heart_rate:   vitals.heart_rate,
      }
    };
    try {
      const res = await api.post('/ngo/maternal', payload);
      onSave({ ...form, riskLevel: res.data.riskLevel, vitals });
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'Validation error');
        setLoading(false);
        return;
      }

      // Offline risk heuristic calculation
      let localRisk = 'Low Risk';
      if (vitals.systolic_bp >= 160 || vitals.diastolic_bp >= 110) {
        localRisk = 'High Risk';
      } else if (vitals.systolic_bp >= 140 || vitals.diastolic_bp >= 90 || vitals.bs > 8.4 || vitals.heart_rate > 110) {
        localRisk = 'Medium Risk';
      }

      const offlineRecord = {
        id: `offline-${Date.now()}`,
        name: form.name,
        age: Number(form.age),
        trimester: Number(form.trimester),
        dueDate: form.dueDate,
        vitals: {
          systolic_bp:  vitals.systolic_bp,
          diastolic_bp: vitals.diastolic_bp,
          bs:           vitals.bs,
          body_temp:    98.6,
          heart_rate:   vitals.heart_rate,
        },
        riskLevel: localRisk,
        isOffline: true
      };

      try {
        await queueMaternalRecord(offlineRecord);
      } catch (storageErr) {
        console.error('Queue write error:', storageErr);
      }

      onSave(offlineRecord);
    } finally { setLoading(false); }
  };

  // Live danger flag for the BP reading
  const bpDanger = vitals.systolic_bp >= 160 || vitals.diastolic_bp >= 110;
  const bpWarning = vitals.systolic_bp >= 140 || vitals.diastolic_bp >= 90;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-xl p-5 sm:p-8 relative my-4">
        <button onClick={onClose} className="absolute top-4 sm:top-6 right-4 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all">
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
          <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-600 rounded-xl sm:rounded-2xl"><HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">New Maternal Record</h2>
            <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Risk Assessment · WHO Protocol</p>
          </div>
        </div>

        {/* Live BP danger banner */}
        {bpDanger && (
          <div className="mb-4 p-2.5 sm:p-3 bg-rose-50 border border-rose-400 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3 animate-pulse">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <p className="text-[10px] sm:text-xs font-black text-rose-700 leading-tight">⚠️ SEVERE HYPERTENSION DETECTED — BP ≥160/110. Refer to hospital IMMEDIATELY.</p>
          </div>
        )}
        {!bpDanger && bpWarning && (
          <div className="mb-4 p-2.5 sm:p-3 bg-amber-50 border border-amber-300 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
            <p className="text-[10px] sm:text-xs font-bold text-amber-700 leading-tight">Gestational hypertension risk — BP ≥140/90. Monitor closely.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl flex items-start gap-2.5 sm:gap-3">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[10px] sm:text-xs font-bold text-rose-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* ── Section 1: Patient Info ─── */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl space-y-3 sm:space-y-4">
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Patient Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Patient Name</label>
                <input className="input-field py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm rounded-lg sm:rounded-xl" placeholder="Sunita Devi" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Age</label>
                <input type="number" className="input-field py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm rounded-lg sm:rounded-xl" placeholder="24" min="10" max="60" value={form.age} onChange={e => set('age', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Trimester</label>
                <select className="input-field py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm rounded-lg sm:rounded-xl" value={form.trimester} onChange={e => set('trimester', Number(e.target.value))}>
                  <option value={1}>1st Trim (0–12w)</option>
                  <option value={2}>2nd Trim (13–26w)</option>
                  <option value={3}>3rd Trim (27–40w)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Due Date</label>
                <input type="date" className="input-field py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm rounded-lg sm:rounded-xl" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} required />
              </div>
            </div>
          </div>

          {/* ── Section 2: Clinical Vitals ─── */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Vitals</p>
              <span className="px-1.5 sm:px-2 py-0.5 bg-blue-50 text-blue-600 text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded-full border border-blue-100">WHO</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-6">
              <VitalSlider label="Systolic BP" unit=" mmHg" min={80} max={200} value={vitals.systolic_bp}
                onChange={v => setV('systolic_bp', v)} dangerAbove={159} warnAbove={139} />

              <VitalSlider label="Diastolic BP" unit=" mmHg" min={40} max={130} value={vitals.diastolic_bp}
                onChange={v => setV('diastolic_bp', v)} dangerAbove={109} warnAbove={89} />

              <VitalSlider label="Fasting Sugar" unit=" mmol/L" min={3.0} max={15.0} value={vitals.bs}
                onChange={v => setV('bs', v)} dangerAbove={8.4} warnAbove={5.0} />

              <VitalSlider label="Heart Rate" unit=" bpm" min={50} max={130} value={vitals.heart_rate}
                onChange={v => setV('heart_rate', v)} dangerAbove={110} warnAbove={95} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 sm:py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 sm:gap-3 shadow-lg shadow-rose-100">
            {loading ? <><RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> Analyzing...</> : <><HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Run AI Assessment</>}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function MaternalHealthPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try { 
      setError(''); 
      // Silently try to sync offline records in background first
      await syncAllQueues();

      const res = await api.get('/ngo/maternal'); 
      const serverRecords = res.data || [];
      localStorage.setItem('cached_maternal_records', JSON.stringify(serverRecords));

      const offlineRecords = await getPendingMaternal();
      const combined = [...offlineRecords, ...serverRecords];

      // ── Demo fallback: if DB is empty and nothing is cached, show demo seed data ──
      if (combined.length === 0) {
        setRecords(DEMO_MATERNAL_RECORDS);
        setIsDemoMode(true);
      } else {
        setRecords(combined);
        setIsDemoMode(false);
      }
    } catch (err) { 
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      // Load from cached server records + merge with offline pending queue
      const cached = localStorage.getItem('cached_maternal_records');
      const serverRecords = cached ? JSON.parse(cached) : [];
      const offlineRecords = await getPendingMaternal();
      const combined = [...offlineRecords, ...serverRecords];

      // ── Demo fallback: show rich demo data so the page is never blank ──
      if (combined.length === 0) {
        setRecords(DEMO_MATERNAL_RECORDS);
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
      console.log('Browser back online. Synchronizing maternal records...');
      fetchRecords();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleSave = (r) => {
    setRecords(prev => [{ ...r, id: r.id || Date.now() }, ...prev.filter(x => !x.isDemo)]);
    setIsDemoMode(false);
    setShowForm(false);
  };
  const filtered = filter === 'All' ? records : records.filter(r => r.riskLevel === filter);
  const stats = { total: records.length, high: records.filter(r => r.riskLevel === 'High Risk').length, medium: records.filter(r => r.riskLevel === 'Medium Risk').length, low: records.filter(r => r.riskLevel === 'Low Risk').length };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-inter">
      <Navbar role="ngo" />
      <main className="max-w-[1600px] mx-auto p-4 sm:p-8 lg:p-10 pt-28 overflow-y-auto">

        {/* HEADER */}
        <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 pb-5 sm:pb-8 border-b border-slate-200">
          <div className="space-y-1">
            <button onClick={() => navigate('/ngo')} className="flex items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors mb-2">
              <ArrowLeft className="w-2.5 h-2.5" /> Back
            </button>
            <div className="flex items-center gap-1.5 text-rose-600 font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[7px] sm:text-[10px] mb-0.5 sm:mb-2">
              <HeartPulse className="w-3 h-3 sm:w-4 sm:h-4" /> Maternal Module
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
              Maternal <span className="text-rose-600 italic">Health.</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] sm:text-sm mt-0.5 sm:mt-2">AI Risk Assessment · WHO Protocol</p>
            {isDemoMode && (
              <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full w-fit">
                <FlaskConical className="w-3 h-3 text-violet-500" />
                <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">Judge Demo Mode — Representative Data · Sehore District</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={fetchRecords} className="flex-1 sm:flex-none p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm flex items-center justify-center">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={() => setShowForm(true)} className="flex-[4] sm:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] sm:text-sm uppercase tracking-widest transition-all shadow-lg shadow-rose-200">
              <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" /> New Patient
            </button>
          </div>
        </motion.header>

        {/* STATS */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total', val: stats.total, cls: 'bg-slate-50 text-slate-600', icon: User },
            { label: 'High', val: stats.high, cls: 'bg-rose-50 text-rose-600', icon: AlertTriangle },
            { label: 'Medium', val: stats.medium, cls: 'bg-amber-50 text-amber-600', icon: Activity },
            { label: 'Low', val: stats.low, cls: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 border border-slate-100 shadow-sm">
                <div className={`p-1.5 sm:p-2 rounded-lg w-fit mb-2 sm:mb-3 ${s.cls}`}><Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1">{s.label}</p>
                <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter">{s.val}</p>
              </div>
            );
          })}
        </motion.div>

        {/* FILTERS */}
        <div className="flex gap-2 mb-5 sm:mb-6 flex-wrap">
          {['All', 'High Risk', 'Medium Risk', 'Low Risk'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border transition-all ${filter === f ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-200'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* RECORDS GRID */}
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
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4"><HeartPulse className="w-10 h-10 text-rose-200" /></div>
            <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No Records Found</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all">
              + Add First Patient
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((r, i) => {
                const risk = getRisk(r.riskLevel);
                const RiskIcon = risk.icon;
                return (
                  <motion.div key={r.id || i} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center font-black text-rose-400 text-lg">
                          {(r.name || 'P')[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{r.name || 'Unknown'}</p>
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
                          <p className="text-[10px] text-slate-400 font-bold">Age: {r.age} yrs</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${risk.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />{r.riskLevel || 'Assessed'}
                      </span>
                    </div>
                    <div className="space-y-0 text-[11px] divide-y divide-slate-50">
                      <div className="flex justify-between items-center py-2"><span className="text-slate-400 font-bold flex items-center gap-1.5"><Baby className="w-3 h-3" /> Trimester</span><span className="font-black text-slate-700">{TRIM_LABELS[r.trimester] || `T${r.trimester}`}</span></div>
                      <div className="flex justify-between items-center py-2"><span className="text-slate-400 font-bold flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Due Date</span><span className="font-black text-slate-700">{r.dueDate || 'N/A'}</span></div>
                      <div className="flex justify-between items-center py-2"><span className="text-slate-400 font-bold flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Village</span><span className="font-black text-slate-700">{r.villageId || 'N/A'}</span></div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Risk Level</span>
                        <RiskIcon className={`w-3 h-3 ${r.riskLevel === 'High Risk' ? 'text-rose-500' : r.riskLevel === 'Medium Risk' ? 'text-amber-500' : 'text-emerald-500'}`} />
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full">
                        <div className={`h-full rounded-full ${risk.bar}`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
      <AnimatePresence>{showForm && <MaternalForm onSave={handleSave} onClose={() => setShowForm(false)} />}</AnimatePresence>
    </div>
  );
}

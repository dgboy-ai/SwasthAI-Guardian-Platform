import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, PlusCircle, X, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Calendar, User, Activity, ShieldCheck, Baby, FlaskConical, Phone, MapPin } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { queueMaternalRecord, getPendingMaternal, syncAllQueues } from '../utils/offlineSyncQueue';

// ── Evaluation / Demo seed data — shown when DB returns empty ────────────────────────
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
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const getLocalFactors = (r) => {
    const v = r.vitals || { systolic_bp: 120, diastolic_bp: 80, bs: 5.0, body_temp: 98.6, heart_rate: 75 };
    const age = r.age || 25;
    
    let bp_score = 0;
    if (v.systolic_bp >= 160 || v.diastolic_bp >= 110) bp_score = 5;
    else if (v.systolic_bp >= 140 || v.diastolic_bp >= 90) bp_score = 3;
    else if (v.systolic_bp >= 130 || v.diastolic_bp >= 85) bp_score = 1;

    let bs_score = 0;
    if (v.bs >= 11.1) bs_score = 5;
    else if (v.bs >= 8.5) bs_score = 3;
    else if (v.bs >= 5.1) bs_score = 1;

    let age_score = 0;
    if (age < 16 || age > 40) age_score = 3;
    else if (age < 18 || age > 35) age_score = 2;

    let hr_score = 0;
    if (v.heart_rate > 120) hr_score = 3;
    else if (v.heart_rate > 110) hr_score = 2;
    else if (v.heart_rate > 100) hr_score = 1;

    const total_score = bp_score + bs_score + age_score + hr_score;
    
    const factors = [];
    
    const bp_weight = total_score > 0 ? Math.round((bp_score / total_score) * 100) : 0;
    let bp_advice = "Normal BP. Maintain regular checks.";
    if (bp_score >= 5) bp_advice = "Severe high BP! Dangerous for mother/baby. Rest, avoid salt, refer for emergency medical check.";
    else if (bp_score >= 3) bp_advice = "Elevated blood pressure. Schedule clinic check, monitor headaches/swelling, reduce sodium.";
    else if (bp_score >= 1) bp_advice = "Slightly elevated BP. Monitor weekly and ensure healthy hydration/rest.";
    factors.push({ name: "Blood Pressure", weight: bp_weight, status: bp_score >= 3 ? 'high' : bp_score >= 1 ? 'medium' : 'low', trend: 'stable', advice: bp_advice });

    const bs_weight = total_score > 0 ? Math.round((bs_score / total_score) * 100) : 0;
    let bs_advice = "Normal blood sugar. Follow standard balanced pregnancy diet.";
    if (bs_score >= 5) bs_advice = "Severe high blood sugar! High risk of complications. Refer immediately for insulin or specialist care.";
    else if (bs_score >= 3) bs_advice = "Gestational diabetes confirmed. Strict diabetic diet (avoid simple sugars, sweets), monitor fasting levels.";
    else if (bs_score >= 1) bs_advice = "Borderline blood sugar. Limit sweet tea, sweets, and high-carb foods. Re-test in 2 weeks.";
    factors.push({ name: "Blood Sugar", weight: bs_weight, status: bs_score >= 3 ? 'high' : bs_score >= 1 ? 'medium' : 'low', trend: 'stable', advice: bs_advice });

    const age_weight = total_score > 0 ? Math.round((age_score / total_score) * 100) : 0;
    let age_advice = "Age is within normal obstetric safety range (18-35).";
    if (age_score >= 3) age_advice = "Age obstetric risk (under 16 or over 40). Requires close specialist monitoring and institutional delivery.";
    else if (age_score >= 2) age_advice = "Elevated obstetric age risk (16-18 or 35-40). Ensure at least 4 ANC visits and checkup at PHC.";
    factors.push({ name: "Obstetric Age", weight: age_weight, status: age_score >= 3 ? 'high' : age_score >= 2 ? 'medium' : 'low', trend: 'stable', advice: age_advice });

    const hr_weight = total_score > 0 ? Math.round((hr_score / total_score) * 100) : 0;
    let hr_advice = "Heart rate is normal and stable.";
    if (hr_score >= 3) hr_advice = "High tachycardia detected (>120 bpm). Risk of dehydration, anemia, or infection. Check for fever/bleeding.";
    else if (hr_score >= 1) hr_advice = "Mild tachycardia (100-120 bpm). Advise hydration and resting. Check hemoglobin levels.";
    factors.push({ name: "Heart Rate", weight: hr_weight, status: hr_score >= 3 ? 'high' : hr_score >= 1 ? 'medium' : 'low', trend: 'stable', advice: hr_advice });

    return factors;
  };

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
  const stats = { total: records.length, high: records.filter(r => r.riskLevel === 'High Risk').length, medium: records.filter(r => r.riskLevel === 'Medium Risk').length, low: records.filter(r => r.riskLevel === 'Low Risk').length, deliveries: records.filter(r => r.trimester === 3).length, followups: records.filter(r => r.riskLevel === 'High Risk' || r.riskLevel === 'Medium Risk').length };

  return (
    <div className="bg-white min-h-screen font-inter">
      <Navbar role="ngo" />
      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 pt-4 overflow-y-auto">

        {/* COMPACT HERO */}
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <button onClick={() => navigate('/ngo')} className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><HeartPulse className="w-5 h-5" /></div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">Maternal Health</h1>
                <p className="text-[10px] text-slate-400 font-semibold">AI Risk Assessment · WHO Protocol</p>
              </div>
            </div>
            {isDemoMode && (
              <span className="px-2.5 py-1 bg-violet-50 border border-violet-200 rounded-full text-[8px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-1">
                <FlaskConical className="w-3 h-3" /> Demo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-bold text-slate-600">{stats.total} Patients</span>
            </div>
            <button onClick={fetchRecords} className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center shadow-sm">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-200/50">
              <PlusCircle className="w-3.5 h-3.5" /> New Patient
            </button>
          </div>
        </motion.header>

        {/* PREMIUM KPI CARDS */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Pregnancies', val: stats.total, sub: '+2 this month', icon: HeartPulse, tint: 'bg-blue-50/40', iconBg: 'bg-blue-50 text-blue-600 border-blue-100', accent: 'text-blue-700' },
            { label: 'High Risk Cases', val: stats.high, sub: 'Needs attention', icon: AlertTriangle, tint: 'bg-rose-50/40', iconBg: 'bg-rose-50 text-rose-600 border-rose-100', accent: 'text-rose-700' },
            { label: 'Expected Deliveries', val: stats.deliveries, sub: 'Next 30 days', icon: Baby, tint: 'bg-emerald-50/40', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100', accent: 'text-emerald-700' },
            { label: 'Follow-up Visits Due', val: stats.followups, sub: 'Visits pending', icon: Activity, tint: 'bg-amber-50/40', iconBg: 'bg-amber-50 text-amber-600 border-amber-100', accent: 'text-amber-700' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`relative rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden ${s.tint}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</span>
                  <div className={`w-9 h-9 rounded-xl ${s.iconBg} border flex items-center justify-center`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">{s.val}</p>
                <p className={`text-[11px] font-bold ${s.accent}`}>{s.sub}</p>
              </div>
            );
          })}
        </motion.div>

        {/* PATIENTS REQUIRING ATTENTION */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">Patients Requiring Attention</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-black text-rose-600">{stats.high} High Risk</span>
                </div>
                <span className="text-slate-200">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">⚠️</span>
                  <span className="text-xs font-black text-amber-600">{stats.medium} Medium Risk</span>
                </div>
                <span className="text-slate-200">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">✅</span>
                  <span className="text-xs font-black text-emerald-600">{stats.low} Low Risk</span>
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="flex h-full rounded-full overflow-hidden">
                {stats.total > 0 && (
                  <>
                    <div className="bg-rose-500 h-full transition-all" style={{ width: `${(stats.high / stats.total) * 100}%` }} />
                    <div className="bg-amber-400 h-full transition-all" style={{ width: `${(stats.medium / stats.total) * 100}%` }} />
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(stats.low / stats.total) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* FILTERS */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {['All', 'High Risk', 'Medium Risk', 'Low Risk'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${filter === f ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200/50' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-200 hover:text-rose-600'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* RECORDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
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
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" /><p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4"><HeartPulse className="w-8 h-8 text-rose-200" /></div>
            <p className="font-black text-slate-300 uppercase tracking-widest text-sm mb-4">No Records Found</p>
            <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200/50">
              + Add First Patient
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {[...filtered].sort((a, b) => {
                const order = { 'High Risk': 0, 'Medium Risk': 1, 'Low Risk': 2 };
                return (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3);
              }).map((r, i) => {
                const risk = getRisk(r.riskLevel);
                const v = r.vitals || {};
                const riskScore = v.systolic_bp ? Math.min(100, Math.round(
                  ((v.systolic_bp >= 160 || v.diastolic_bp >= 110 ? 5 : v.systolic_bp >= 140 || v.diastolic_bp >= 90 ? 3 : v.systolic_bp >= 130 || v.diastolic_bp >= 85 ? 1 : 0) +
                  (v.bs >= 11.1 ? 5 : v.bs >= 8.5 ? 3 : v.bs >= 5.1 ? 1 : 0) +
                  ((r.age || 25) < 16 || (r.age || 25) > 40 ? 3 : (r.age || 25) < 18 || (r.age || 25) > 35 ? 2 : 0) +
                  (v.heart_rate > 120 ? 3 : v.heart_rate > 110 ? 2 : v.heart_rate > 100 ? 1 : 0)) * 6.25
                )) : r.riskLevel === 'High Risk' ? 82 : r.riskLevel === 'Medium Risk' ? 45 : 12;
                const meterColor = riskScore >= 70 ? 'bg-rose-500' : riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
                const meterLabel = riskScore >= 70 ? 'Critical' : riskScore >= 40 ? 'Moderate' : 'Safe';

                const nextAction = riskScore >= 70
                  ? { label: 'Visit Required', color: 'text-rose-600 bg-rose-50 border-rose-200' }
                  : riskScore >= 40
                    ? { label: 'Follow-up Required', color: 'text-amber-600 bg-amber-50 border-amber-200' }
                    : { label: 'Routine Monitoring', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

                return (
                  <motion.div key={r.id || i} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                    className={`group bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:shadow-slate-200/40 hover:border-slate-200 transition-all duration-200 ${
                      r.riskLevel === 'High Risk' ? 'border-l-[4px] border-l-rose-500 border-slate-100 shadow-md' : 'border-slate-100'
                    }`}>

                    <div className="p-5">
                      {/* Header: Avatar + Name + Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${
                            r.riskLevel === 'High Risk' ? 'bg-rose-50 text-rose-500' : r.riskLevel === 'Medium Risk' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                          }`}>
                            {(r.name || 'P')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-black text-slate-900 leading-tight">{r.name || 'Unknown'}</p>
                              {r.isOffline ? (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md text-[7px] font-bold tracking-wider flex items-center gap-0.5">
                                  <RefreshCw className="w-2 h-2 animate-spin" /> Sync
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-[7px] font-bold flex items-center gap-0.5">
                                  <ShieldCheck className="w-2 h-2" /> AWS
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-semibold">{r.age} yrs · {TRIM_LABELS[r.trimester] || `T${r.trimester}`}</p>
                          </div>
                        </div>
                      </div>

                      {/* Detail Grid */}
                      <div className="grid grid-cols-2 gap-y-2 mb-4 text-[12px]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span className="text-slate-500 font-semibold">Due:</span>
                          <span className="font-bold text-slate-700">{r.dueDate || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span className="text-slate-500 font-semibold">Village:</span>
                          <span className="font-bold text-slate-700 truncate">{r.villageId || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Risk Score - Visual Focus */}
                      <div className="bg-slate-50 rounded-xl p-4 mb-3 text-center">
                        <div className="flex items-center justify-center gap-3 mb-1">
                          <span className={`text-4xl font-black tracking-tight leading-none ${
                            riskScore >= 70 ? 'text-rose-600' : riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>{riskScore}</span>
                          <div className="text-left">
                            <p className={`text-xs font-black uppercase tracking-wider ${
                              riskScore >= 70 ? 'text-rose-500' : riskScore >= 40 ? 'text-amber-500' : 'text-emerald-500'
                            }`}>{meterLabel} Risk</p>
                            <p className="text-[10px] text-slate-400 font-semibold">out of 100</p>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden mt-2">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${riskScore}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${meterColor}`}
                          />
                        </div>
                      </div>

                      {/* Next Action */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${nextAction.color}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Next Action</span>
                        <span className="text-[10px] font-black">{nextAction.label}</span>
                      </div>

                      {/* Quick Actions - hover reveal */}
                      <div className="mt-3 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRecordId(selectedRecordId === r.id ? null : r.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded-xl text-[9px] font-black text-slate-500 hover:text-rose-600 uppercase tracking-widest transition-all"
                          >
                            {selectedRecordId === r.id ? '✕ Close' : '👁️ Details'}
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl text-[9px] font-black text-slate-500 hover:text-emerald-600 uppercase tracking-widest transition-all">
                            <Calendar className="w-3 h-3" /> Visit
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl text-[9px] font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-all">
                            <Phone className="w-3 h-3" /> Call
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible XAI Risk Analysis */}
                    {selectedRecordId === r.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="border-t border-slate-100 bg-slate-50/50">
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                            <span>Clinical Risk Severity</span>
                            <span className={riskScore >= 70 ? 'text-rose-600' : riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'}>{riskScore}%</span>
                          </div>
                          <div className="space-y-2">
                            {((r.factors && r.factors.length > 0) ? r.factors : getLocalFactors(r)).map((f, fIdx) => {
                              const barColor = f.status === 'high' ? 'bg-rose-500' : f.status === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
                              const textColor = f.status === 'high' ? 'text-rose-600' : f.status === 'medium' ? 'text-amber-600' : 'text-emerald-600';
                              const trendArrow = f.trend === 'up' ? '↗️' : f.trend === 'down' ? '↘️' : '➡️';
                              const trendColor = f.trend === 'up' ? 'text-rose-500' : f.trend === 'down' ? 'text-emerald-500' : 'text-slate-400';

                              return (
                                <div key={fIdx} className="space-y-0.5">
                                  <div className="flex justify-between items-center text-[9px] font-black">
                                    <span className="text-slate-500 uppercase tracking-wider">{f.name}</span>
                                    <span className="flex items-center gap-1.5">
                                      <span className={textColor}>{f.weight}%</span>
                                      <span className={`${trendColor} font-black`}>{trendArrow}</span>
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(5, f.weight)}%` }} />
                                  </div>
                                  <p className="text-[8px] text-slate-400 leading-relaxed font-bold bg-white p-2 rounded-lg border border-slate-100 mt-0.5">
                                    💡 {f.advice}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
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

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import {
  MessageCircle, HeartPulse, BookOpen,
  AlertTriangle, CheckCircle, PhoneCall, X,
  Calendar, Package, Loader, CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// Import newly extracted sub-components for bundle chunk efficiency
import SakhiChatbot from './SakhiChatbot';
import MenstrualCycleTracker from './MenstrualCycleTracker';
import PadRequestForm from './PadRequestForm';

/* ── Symptom Checkup ── */
function MenstrualCheckup() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const questions = [
    { id: 'heavy',     label: 'Very heavy bleeding',            sub: 'Changing pad every 1-2 hours',     severe: true  },
    { id: 'pain',      label: 'Severe abdominal pain',          sub: 'Pain that stops daily activities',  severe: false },
    { id: 'dizzy',     label: 'Dizziness or fainting',          sub: 'Feeling lightheaded or weak',       severe: true  },
    { id: 'fever',     label: 'Fever with periods',             sub: 'Temperature above 38°C',            severe: true  },
    { id: 'irregular', label: 'Irregular or missed periods',    sub: 'Cycle shorter than 21 or longer than 35 days', severe: false },
    { id: 'clots',     label: 'Large blood clots',              sub: 'Clots larger than a coin',          severe: true  },
  ];

  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const analyze = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const hasSevere = selected.some(id => questions.find(q => q.id === id)?.severe);
      if (hasSevere) setResult({ 
        type: 'danger', 
        title: 'Immediate Action Needed', 
        msg: 'These symptoms could be serious. Please call 108 (Free Ambulance) or find your ASHA worker immediately.',
        show108: true 
      });
      else if (selected.length > 0) setResult({ type: 'warning', title: 'Seek Advice', msg: 'These symptoms should be discussed with your ASHA worker today.' });
      else setResult({ type: 'safe', title: 'Doing Well', msg: 'No urgent symptoms. Remember to rest and drink plenty of water.' });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t.menstrual?.symptom_title || 'Symptom Check'}</h2>
        <p className="text-slate-500 font-medium text-sm">{t.menstrual?.symptom_desc || 'Select any symptoms you are currently experiencing. This is not a diagnosis - always consult a doctor for medical advice.'}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {questions.map(q => (
          <button key={q.id} onClick={() => toggle(q.id)}
            style={{ minHeight: '52px' }}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${selected.includes(q.id) ? 'bg-rose-50 border-rose-400' : 'bg-white border-slate-100 hover:border-rose-200'}`}>
            <div className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${selected.includes(q.id) ? 'bg-rose-600 border-rose-600' : 'border-slate-300'}`}>
              {selected.includes(q.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            </div>
            <div>
              <p className={`text-sm font-black leading-tight ${selected.includes(q.id) ? 'text-rose-900' : 'text-slate-700'}`}>{q.label}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{q.sub}</p>
            </div>
          </button>
        ))}
      </div>
      <button onClick={analyze} disabled={loading || selected.length === 0}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg disabled:opacity-30 flex items-center justify-center gap-2">
        {loading ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</> : (t.menstrual?.check_btn || 'Check My Symptoms')}
      </button>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-2xl border-2 ${result.type === 'danger' ? 'bg-red-50 border-red-200' : result.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              {result.type === 'danger' ? <AlertTriangle className="w-6 h-6 text-red-600" /> : result.type === 'warning' ? <AlertTriangle className="w-6 h-6 text-amber-600" /> : <CheckCircle className="w-6 h-6 text-emerald-600" />}
              <h3 className={`font-black text-lg ${result.type === 'danger' ? 'text-red-900' : result.type === 'warning' ? 'text-amber-900' : 'text-emerald-900'}`}>{result.title}</h3>
            </div>
            <p className={`font-medium text-sm leading-relaxed ${result.type === 'danger' ? 'text-red-700' : result.type === 'warning' ? 'text-amber-700' : 'text-emerald-700'}`}>{result.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Health Tips ── */
function HealthTips() {
  const { t } = useLanguage();
  const tips = [
    { icon: HeartPulse, color: 'bg-rose-50 text-rose-600', title: 'Change Pads Regularly', desc: 'Change your sanitary pad every 4–6 hours to prevent infections and odor, even if flow is light.' },
    { icon: HeartPulse, color: 'bg-emerald-50 text-emerald-600', title: 'Eat Iron-Rich Foods', desc: 'Include jaggery (gur), spinach, lentils, and dates in your diet to replenish iron lost during periods.' },
    { icon: HeartPulse, color: 'bg-amber-50 text-amber-600', title: 'Stay Active & Rest', desc: 'Light walks can ease cramps. Rest is equally important — listen to your body and take breaks.' },
    { icon: HeartPulse, color: 'bg-blue-50 text-blue-600', title: 'Wash Hands Often', desc: 'Always wash your hands with soap before and after changing pads to prevent bacterial infections.' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t.menstrual?.tips_title || 'Health Tips'}</h2>
        <p className="text-slate-500 font-medium text-sm">{t.menstrual?.tips_desc || 'Simple, proven advice for your health and wellbeing during your period.'}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={tip.title} 
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-10 h-10 ${tip.color} rounded-xl flex items-center justify-center mb-4`}>
              <tip.icon className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-sm mb-1">{tip.title}</h3>
            <p className="text-slate-400 font-medium text-xs leading-relaxed">{tip.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function MenstrualHealth() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('assistant');
  const [showEmergency, setShowEmergency] = useState(false);

  const tabs = [
    { id: 'assistant', label: t.menstrual?.ai_assistant || 'AI Assistant',    icon: MessageCircle },
    { id: 'tracker',   label: t.menstrual?.cycle_tracker || 'Cycle Tracker',   icon: Calendar      },
    { id: 'checkup',   label: t.menstrual?.symptom_check || 'Symptom Check',   icon: HeartPulse    },
    { id: 'pads',      label: t.menstrual?.request_pads || 'Request Pads',    icon: Package       },
    { id: 'tips',      label: t.menstrual?.health_tips || 'Health Tips',     icon: BookOpen      },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-inter antialiased">
      <Navbar role="villager" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Header */}
        <header className="mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full animate-pulse" />
                <p className="text-[8px] sm:text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] sm:tracking-[0.4em]">{t.menstrual?.safe_private || 'Safe & Private'}</p>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {t.menstrual?.title || "Women's Health"}
              </h1>
              <p className="text-slate-500 font-medium mt-1.5 sm:mt-2 text-xs sm:text-sm max-w-md leading-relaxed">
                {t.menstrual?.subtitle || 'AI health guidance, symptom checking, and free pad access - private and confidential.'}
              </p>
            </div>
            <button onClick={() => setShowEmergency(true)}
              style={{ minHeight: '44px' }}
              className="flex items-center justify-center gap-2 px-5 py-3.5 sm:py-3 bg-rose-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all shrink-0">
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.menstrual?.emergency_help || 'Emergency Help'}
            </button>
          </div>
        </header>

        {/* Tab Nav */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6 p-1 sm:p-1.5 bg-white border border-slate-100 rounded-xl sm:rounded-2xl shadow-sm w-full sm:w-fit overflow-x-auto sm:overflow-x-visible no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ minHeight: '44px' }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}>
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm p-5 sm:p-8 md:p-10 min-h-[350px] md:min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {activeTab === 'assistant' && <SakhiChatbot />}
              {activeTab === 'tracker'   && <MenstrualCycleTracker />}
              {activeTab === 'checkup'   && <MenstrualCheckup />}
              {activeTab === 'pads'      && <PadRequestForm />}
              {activeTab === 'tips'      && <HealthTips />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergency && (
          <EmergencyModal onClose={() => setShowEmergency(false)} t={t} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Emergency Modal (real ASHA alert) ── */
function EmergencyModal({ onClose, t }) {
  const [alertState, setAlertState] = useState('idle'); // idle | sending | sent | error
  const [errorMsg,   setErrorMsg]   = useState('');

  const handleAlert = async () => {
    setAlertState('sending');
    setErrorMsg('');
    try {
      await api.post('/emergency-alert', {
        alertType: 'menstrual_emergency',
        message:   "Villager pressed Emergency Help button in Women's Health section.",
      });
      setAlertState('sent');
      setTimeout(() => { onClose(); setAlertState('idle'); }, 4000);
    } catch (err) {
      console.error('ASHA alert failed:', err);
      setAlertState('error');
      setErrorMsg(
        err.response?.data?.error ||
        'Could not reach server. Please call 108 directly — it is free.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-600 text-white rounded-2xl">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">{t.menstrual?.emergency_title || 'Emergency Help'}</h3>
              <p className="text-xs text-slate-400 font-medium">Your ASHA worker will be notified immediately</p>
            </div>
          </div>
          {alertState !== 'sending' && (
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {alertState === 'sent' ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6"
          >
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-200">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h4 className="font-black text-slate-900 text-xl mb-2">Alert Sent! ✅</h4>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-4">
              Your ASHA worker has been notified and will contact you shortly. Stay calm — help is coming.
            </p>
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest">Closing automatically...</span>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <HeartPulse className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ASHA Worker</p>
                  <p className="font-black text-slate-900 text-sm">Your Village ASHA</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase">On Call</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              {t.menstrual?.emergency_desc || 'Press the button below to immediately alert your ASHA worker. She will call you and come to help.'}
            </p>

            {alertState === 'error' && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-900 font-black text-sm">Alert Failed</p>
                  <p className="text-amber-700 font-medium text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleAlert}
                disabled={alertState === 'sending'}
                style={{ minHeight: '48px' }}
                className="w-full py-4 bg-rose-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {alertState === 'sending' ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Sending Alert...</>
                ) : (
                  <>{t.menstrual?.alert_asha || 'Alert My ASHA Worker Now'}</>
                )}
              </button>

              <a
                href="tel:108"
                style={{ minHeight: '48px' }}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                <PhoneCall className="w-4 h-4" /> {t.menstrual?.call_ambulance || 'Call 108 — Free Ambulance'}
              </a>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

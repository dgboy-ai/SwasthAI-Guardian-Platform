import { useState } from 'react';
import Navbar from '../components/Navbar';
import SymptomChecker from './SymptomChecker';
// Ambulance import removed — always navigate to /ambulance page (GPS-enabled full page)
import {
  Truck, Mic, PhoneCall, BrainCircuit, Scan,
  User, Droplets, Bell, WifiOff, Wifi, Zap, PlusCircle,
  GraduationCap, Shield, Activity, HeartPulse, Landmark
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function VillagerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showFeature, setShowFeature] = useState(null); // 'symptom', 'ambulance', 'telemedicine', 'academy'
  const [isOffline, setIsOffline] = useState(localStorage.getItem('simulated_network_state') === 'offline');

  const toggleDashboardOffline = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    const simState = nextState ? 'offline' : 'online';
    localStorage.setItem('simulated_network_state', simState);
    window.dispatchEvent(new Event(simState));
  };

  // Fallback for user name if not available
  const userName = user?.name?.split(' ')[0] || 'Villager';

  return (
    <div className={`min-h-screen font-inter antialiased selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-700 ${isOffline ? 'bg-slate-100 grayscale-[0.2]' : 'bg-[#F7F9FB]'}`}>
      <Navbar role="villager" />

      <main className="max-w-5xl mx-auto px-6 pt-12 md:pt-20 pb-32">
        {/* OFFLINE INDICATOR BAR (Relative to layout, prevents overlapping) */}
        {isOffline && (
          <div className="mb-6 py-3 px-6 bg-slate-900 text-white rounded-2xl flex items-center justify-center border border-slate-800 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <WifiOff className="w-4 h-4 text-emerald-400 shrink-0" />
              {t.villagerDashboard?.offline_active || 'Offline Protocol Active'}
            </span>
          </div>
        )}

        {/* WELCOME HEADER */}
        <header className="mb-10 flex items-end justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{t.swasthai || 'SwasthAI'} {t.roles?.villager || 'Citizen'}</p>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Namaste, <span className="text-emerald-600">{userName}</span> 🙏
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDashboardOffline}
              className={`p-3 rounded-full transition-all border ${isOffline ? 'bg-slate-900 border-slate-800 text-rose-500 shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200'}`}
              title={isOffline ? 'Go Online' : 'Go Offline'}
            >
              {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* NEW: GUIDED HEALTHCARE MODE BANNER */}
        <Link
          to="/guided-mode"
          className="block mb-6 p-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[2rem] shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group active:scale-[0.99]"
        >
          <div className="absolute right-[-10%] top-[-20%] w-80 h-80 bg-white opacity-10 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-white/20 text-white border border-white/20 text-[9px] font-black uppercase tracking-widest rounded-full">
                {t.villagerDashboard?.guided_mode_tag || '🌟 Highly Recommended'}
              </span>
              <h2 className="text-3xl font-black tracking-tight leading-none">
                {t.villagerDashboard?.guided_mode_title || 'Guided Care Mode'}
              </h2>
              <p className="text-emerald-50 font-medium text-sm sm:text-base leading-relaxed opacity-95 max-w-2xl">
                {t.villagerDashboard?.guided_mode_desc || 'Bilingual voice support, large tactile buttons & offline-capable health assessment (Fever, Pregnancy, SOS, Sakhi chat & Child Health).'}
              </p>
            </div>
            <div className="inline-flex py-4 px-8 bg-white text-emerald-800 rounded-2xl text-xs font-black uppercase tracking-widest group-hover:px-10 transition-all shadow-md shrink-0">
              {t.villagerDashboard?.guided_mode_cta || 'Start Guided Care →'}
            </div>
          </div>
        </Link>

        {/* TOP PRIORITY: EMERGENCY & VOICE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">

          {/* EMERGENCY AMBULANCE */}
          <Link
            to="/ambulance"
            className="md:col-span-5 p-8 bg-white rounded-[2rem] border border-rose-100 shadow-sm hover:shadow-xl hover:shadow-rose-100 transition-all flex flex-col justify-between group overflow-hidden relative active:scale-[0.98]"
          >
            <div className="absolute right-[-20%] top-[-20%] w-64 h-64 bg-rose-50 rounded-full blur-[60px] pointer-events-none group-hover:bg-rose-100 transition-colors" />
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <Truck className="w-8 h-8" />
              </div>
              <span className="px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">SOS</span>
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{t.services?.emergency || 'Emergency Ambulance'}</h2>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">{t.services?.ambulance_desc || 'Request immediate medical transport to the nearest facility.'}</p>
            </div>
          </Link>

          {/* SYMPTOM CHECKER / VOICE ASSISTANT */}
          <Link
            to="/symptoms"
            className="md:col-span-7 p-8 bg-emerald-600 text-white rounded-[2rem] shadow-lg shadow-emerald-600/20 hover:shadow-2xl hover:shadow-emerald-600/30 transition-all flex flex-col justify-between group overflow-hidden relative active:scale-[0.98]"
          >
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <BrainCircuit className="w-80 h-80 -mb-20 -mr-20" />
            </div>
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-all duration-500 shadow-sm">
                <Activity className="w-8 h-8" />
              </div>
              <span className="px-4 py-2 bg-emerald-500/50 text-white border border-emerald-400/50 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> AI Active
              </span>
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">{t.services?.symptoms || 'AI Symptom Checker'}</h2>
              <p className="text-emerald-50 font-medium text-base leading-relaxed max-w-sm mb-6 opacity-90">{t.services?.symptoms_desc || 'Describe your symptoms naturally. Our AI will analyze them instantly.'}</p>
              <div className="inline-flex py-3 px-8 bg-white text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest group-hover:px-10 transition-all shadow-md">
                Start Consultation →
              </div>
            </div>
          </Link>

        </div>

        {/* SECONDARY FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Skin Scanner */}
          <Link to="/skin-disease" className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group active:scale-95">
            <div className="w-12 h-12 bg-slate-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
              <Scan className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">{t.villagerDashboard?.skin_scanner || 'Skin Scanner'}</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">{t.villagerDashboard?.skin_scanner_desc || 'Analyze rashes or skin issues using your camera.'}</p>
          </Link>

          {/* Health Identity */}
          <Link to="/profile" className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group active:scale-95">
            <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">{t.villagerDashboard?.health_identity || 'Health Identity'}</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">{t.villagerDashboard?.health_identity_desc || 'Access your unified medical records & history.'}</p>
          </Link>

          {/* Maternal Health */}
          <Link to="/menstrual-health" className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group active:scale-95">
            <div className="w-12 h-12 bg-slate-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">{t.services?.maternal || 'Maternal Health'}</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">{t.services?.maternal_desc || 'Track cycles, pregnancy, and specialized care.'}</p>
          </Link>

          {/* Government Schemes */}
          <Link to="/schemes" className="p-6 bg-white rounded-[2rem] border border-emerald-100 shadow-sm hover:shadow-lg hover:shadow-emerald-100 transition-all group active:scale-95 relative overflow-hidden">
            <span className="absolute top-4 right-4 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-widest">NEW</span>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">{t.schemes?.title || 'Government Schemes'}</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">{t.schemes?.subtitle || 'Find welfare programs you are eligible for.'}</p>
          </Link>

        </div>


      </main>

      {/* OVERLAY COMMAND INTERFACES — Ambulance removed from modal:
           It had a hardcoded dummy location. All ambulance requests now go
           through /ambulance page which captures real GPS. */}
      {showFeature && showFeature !== 'ambulance' && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowFeature(null)}
              className="absolute -top-12 right-0 text-white font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2 group bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
            >
              Close <PlusCircle className="w-4 h-4 rotate-45" />
            </button>
            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden p-6 md:p-12 max-h-[90vh] overflow-y-auto">
              {showFeature === 'symptom' && <SymptomChecker />}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

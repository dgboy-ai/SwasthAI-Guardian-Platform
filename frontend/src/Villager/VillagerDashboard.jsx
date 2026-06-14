import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Mic, Phone, Scan, User, Droplets, Bell, WifiOff, Globe, Zap,
  Landmark, HeartPulse, Activity, Shield, ChevronRight,
  AlertCircle, Sparkles, CheckCircle2, ArrowRight, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

/* ─── Animated counter hook ─────────────────────────────────────────── */
function useCountUp(target, duration = 1400, startDelay = 400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const steps = 40;
      const inc = target / steps;
      let cur = 0;
      const id = setInterval(() => {
        cur += inc;
        if (cur >= target) { setValue(target); clearInterval(id); }
        else setValue(Math.round(cur));
      }, duration / steps);
      return () => clearInterval(id);
    }, startDelay);
    return () => clearTimeout(t);
  }, [target, duration, startDelay]);
  return value;
}

/* ─── Daily Wellness Checklist ──────────────────────────────────────── */
const HABITS = [
  { id: 'water', icon: '💧', hi: 'Paani piya?', en: 'Drank water today' },
  { id: 'medicine', icon: '💊', hi: 'Dawai li?', en: 'Took medicine' },
  { id: 'food', icon: '🍽️', hi: 'Khana khaya?', en: 'Had proper meals' },
  { id: 'sleep', icon: '🛌', hi: 'Neend poori hui?', en: 'Slept well' },
];

function WellnessCard() {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wellness_today') || '[]'); }
    catch { return []; }
  });

  const toggle = (id) => setDone(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    localStorage.setItem('wellness_today', JSON.stringify(next));
    return next;
  });

  const count = done.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Status banner */}
      <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 border ${count === 4 ? 'bg-emerald-50 border-emerald-200' :
          count >= 2 ? 'bg-amber-50 border-amber-200' :
            'bg-slate-50 border-slate-200'
        }`}>
        <span className="text-3xl shrink-0">
          {count === 4 ? '😊' : count >= 2 ? '🙂' : '😐'}
        </span>
        <div>
          <p className={`text-base font-black ${count === 4 ? 'text-emerald-700' : count >= 2 ? 'text-amber-700' : 'text-slate-600'
            }`}>
            {count === 4 ? 'Bahut badhiya! Aap swasth hain.' :
              count >= 2 ? 'Theek hain! Thoda aur dhyan dein.' :
                'Aaj kuch kaam baaki hai.'}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Aaj ka check: {count}/4 complete</p>
        </div>
      </div>

      {/* Tappable checklist */}
      {HABITS.map((h, i) => (
        <motion.button
          key={h.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          onClick={() => toggle(h.id)}
          className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-all text-left hover:scale-[1.01] ${done.includes(h.id)
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-white border-slate-150 hover:border-slate-200'
            }`}
        >
          <span className="text-xl shrink-0">{h.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-800">{h.hi}</p>
            <p className="text-[10px] text-slate-400">{h.en}</p>
          </div>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done.includes(h.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'
            }`}>
            {done.includes(h.id) && <span className="text-white text-xs font-black">✓</span>}
          </div>
        </motion.button>
      ))}

      {/* Last visit strip */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
        <span className="text-xl shrink-0">🏥</span>
        <div>
          <p className="text-[12px] font-black text-blue-800">Aakhri Doctor Visit</p>
          <p className="text-[11px] text-blue-500 font-medium">3 din pahle · PHC Rampur</p>
        </div>
        <Link to="/profile" className="ml-auto text-[11px] font-black text-blue-600 hover:underline shrink-0">
          Record dekhein →
        </Link>
      </div>
    </div>
  );
}

/* ─── Mobile Wellness strip ─────────────────────────────────────────── */
function WellnessMini() {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wellness_today') || '[]'); }
    catch { return []; }
  });
  const toggle = (id) => setDone(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    localStorage.setItem('wellness_today', JSON.stringify(next));
    return next;
  });
  const count = done.length;
  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${count === 4 ? 'bg-emerald-50 border-emerald-200' :
        count >= 2 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
      }`}>
      <span className="text-3xl shrink-0">{count === 4 ? '😊' : count >= 2 ? '🙂' : '😐'}</span>
      <div className="flex-1">
        <p className={`text-sm font-black ${count === 4 ? 'text-emerald-700' : count >= 2 ? 'text-amber-700' : 'text-slate-700'}`}>
          {count === 4 ? 'Aap swasth hain!' : count >= 2 ? 'Theek hain!' : 'Dhyan dein'}
        </p>
        <div className="flex gap-2 mt-1.5">
          {HABITS.map(h => (
            <button key={h.id} onClick={() => toggle(h.id)}
              title={h.hi}
              className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition-all border ${done.includes(h.id)
                  ? 'bg-emerald-100 border-emerald-300 scale-110'
                  : 'bg-white border-slate-200 opacity-50'
                }`}>
              {h.icon}
            </button>
          ))}
        </div>
      </div>
      <div className={`text-center px-3 py-2 rounded-xl border ${count === 4 ? 'bg-emerald-100 border-emerald-200 text-emerald-700' :
          count >= 2 ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}>
        <p className="text-lg font-black leading-none">{count}/4</p>
        <p className="text-[9px] font-bold uppercase tracking-wide">Aaj</p>
      </div>
    </div>
  );
}

/* ─── Health Tips Carousel ──────────────────────────────────────────── */
const TIPS = [
  { icon: '💧', title: 'Paani piyen', text: 'Din mein kam se kam 8 gilas saaf paani piyen.', color: 'from-blue-500 to-cyan-500' },
  { icon: '🥗', title: 'Sabjiyaan khayen', text: 'Mausami sabjiyan khaayen — saste aur poshtik hote hain.', color: 'from-emerald-500 to-teal-500' },
  { icon: '🛌', title: 'Neend zaroori hai', text: 'Raat ko 7-8 ghante ki neend lena bahut zaroori hai.', color: 'from-violet-500 to-indigo-500' },
  { icon: '🚶', title: 'Chalte rahein', text: 'Roz 30 minute paidal chalein — diabetes aur BP mein faida.', color: 'from-amber-500 to-orange-500' },
  { icon: '🤲', title: 'Haath dhoyein', text: 'Khana khane se pehle aur toilet ke baad saabun se haath dhoyein.', color: 'from-rose-500 to-pink-500' },
];

function TipsCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(p => (p + 1) % TIPS.length), 4500);
    return () => clearInterval(id);
  }, []);
  const tip = TIPS[idx];
  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }}
          className={`bg-gradient-to-r ${tip.color} p-5 rounded-2xl text-white flex items-center gap-4`}
        >
          <span className="text-3xl shrink-0">{tip.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-0.5">Swasth Tip</p>
            <p className="text-sm font-bold leading-snug">{tip.text}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-center gap-1.5 mt-3">
        {TIPS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-5 bg-emerald-500' : 'w-1.5 bg-slate-200'}`} />
        ))}
      </div>
    </div>
  );
}

/* ─── Local Alerts ──────────────────────────────────────────────────── */
const ALERTS = [
  { icon: '🌡️', text: 'Dengue ka khatara — aapke gaon mein', time: '2 min pehle', urgent: true },
  { icon: '💉', text: 'Kal subah 9 baje free vaccination camp', time: '15 min pehle', urgent: false },
  { icon: '🚑', text: 'Village 3 mein ambulance bheji gayi', time: '22 min pehle', urgent: true },
  { icon: '📋', text: 'PM Jan Arogya yojana: nayi suvidha uplabdh', time: '1 ghanta pehle', urgent: false },
];

function AlertFeed() {
  const [show, setShow] = useState(2);
  return (
    <div className="space-y-2">
      {ALERTS.slice(0, show).map((a, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`flex items-start gap-3 p-3.5 rounded-2xl border ${a.urgent ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'
            }`}
        >
          <span className="text-xl shrink-0 mt-0.5">{a.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold leading-snug ${a.urgent ? 'text-rose-800' : 'text-slate-700'}`}>{a.text}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
          </div>
          {a.urgent && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0 mt-1.5" />}
        </motion.div>
      ))}
      {show < ALERTS.length && (
        <button onClick={() => setShow(ALERTS.length)}
          className="w-full text-center text-[11px] font-black text-emerald-600 py-2 hover:text-emerald-700">
          {ALERTS.length - show} aur alerts dekhein →
        </button>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────── */
export default function VillagerDashboard() {
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(localStorage.getItem('simulated_network_state') === 'offline');
  const [currentTime, setCurrentTime] = useState('');

  const activeCases = useCountUp(12, 1200, 400);
  const checkups = useCountUp(43, 1500, 500);
  const alertCount = useCountUp(2, 800, 600);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 60000);
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { clearInterval(id); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const toggleOffline = () => {
    const next = !isOffline;
    setIsOffline(next);
    localStorage.setItem('simulated_network_state', next ? 'offline' : 'online');
    window.dispatchEvent(new Event(next ? 'offline' : 'online'));
  };

  const userName = user?.name || 'Ramesh Kumar';

  const cV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
  const iV = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 18 } } };

  return (
    <div className="min-h-screen font-inter antialiased relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 40%, #f0f9ff 100%)' }}>

      {/* Subtle animated background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div animate={{ x: [0, 40, -20, 0], y: [0, -30, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-5%] left-[5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)' }} />
        <motion.div animate={{ x: [0, -40, 30, 0], y: [0, 50, -30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 right-[5%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #065f46 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <div className="relative z-20"><Navbar role="villager" /></div>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="hidden lg:block max-w-[88rem] mx-auto px-10 py-10 relative z-10">
        <motion.div variants={cV} initial="hidden" animate="show" className="space-y-9">

          {/* Header */}
          <motion.div variants={iV} className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur border border-emerald-200 text-emerald-800 text-[11px] font-black uppercase tracking-widest rounded-full shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SwasthAI Guardian
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 border border-slate-200 text-slate-500 text-[11px] font-medium rounded-full">
                  <Clock className="w-3.5 h-3.5" /> {currentTime}
                </span>
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
                🙏 Namaste,{' '}
                <span style={{ background: 'linear-gradient(135deg, #047857, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {userName}
                </span>
              </h1>
              <p className="text-base text-slate-500 font-medium max-w-lg">
                Aapka swasth dashboard tayaar hai. Offline bhi kaam karta hai.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button onClick={toggleOffline}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-sm ${isOffline ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white/80 border-emerald-200 text-emerald-700'
                  }`}>
                <Globe className="w-5 h-5" />
                {isOffline ? 'Offline Chal Raha Hai' : 'Internet Se Juda Hai'}
              </button>
              <div className="relative p-3.5 bg-white/80 backdrop-blur border border-slate-200 rounded-2xl cursor-pointer shadow-sm hover:scale-105 transition-all">
                <Bell className="w-6 h-6 text-slate-500" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
              </div>
            </div>
          </motion.div>

          {/* Hero cards */}
          <motion.div variants={cV} className="grid grid-cols-2 gap-7">

            {/* Emergency */}
            <motion.div variants={iV} whileHover={{ y: -6, scale: 1.01 }} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-[3rem] opacity-0 group-hover:opacity-25 blur-md transition-opacity duration-500" />
              <div className="relative bg-white/90 backdrop-blur-xl border border-rose-100 rounded-[2.8rem] p-10 flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)]">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 4 }}
                  className="absolute -top-16 -right-16 w-56 h-56 bg-rose-100 rounded-full blur-3xl pointer-events-none" />

                {/* SOS pulse badge */}
                <div className="absolute top-9 right-9">
                  <motion.div animate={{ scale: [1, 2.8], opacity: [0.35, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute w-9 h-9 bg-rose-400 rounded-full" />
                  <div className="w-9 h-9 bg-rose-600 rounded-full flex items-center justify-center relative">
                    <span className="text-white text-[8px] font-black tracking-wider">SOS</span>
                  </div>
                </div>

                <div className="space-y-5 relative z-10">
                  <div className="w-18 h-18 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl flex items-center justify-center shadow-[0_12px_28px_rgba(220,38,38,0.35)] group-hover:rotate-6 group-hover:scale-110 transition-all duration-500"
                    style={{ width: 72, height: 72 }}>
                    <Truck className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">Ambulance Bulayein</h3>
                    <p className="text-base text-rose-700/80 font-medium leading-relaxed mt-2 max-w-sm">
                      ASHA worker ya ambulance se turant madad payen — sirf <strong>15 second</strong> mein.
                    </p>
                  </div>
                  <div className="flex gap-5 pt-1">
                    {[{ l: 'Response', v: '12s' }, { l: 'Units Ready', v: '4' }, { l: 'Success', v: '98%' }].map(s => (
                      <div key={s.l}>
                        <p className="text-xl font-black text-slate-900">{s.v}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Link to="/ambulance"
                  className="mt-8 w-full py-5 bg-gradient-to-r from-rose-600 to-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.18em] flex items-center justify-center gap-3 shadow-[0_12px_28px_rgba(220,38,38,0.3)] hover:brightness-110 active:scale-[0.98] transition-all relative z-10 overflow-hidden group/btn">
                  <motion.div className="absolute inset-0 bg-white/15" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.45 }} />
                  <Phone className="w-5 h-5 fill-white relative" />
                  <span className="relative">Abhi Madad Maangein</span>
                </Link>
              </div>
            </motion.div>

            {/* Guided Care */}
            <motion.div variants={iV} whileHover={{ y: -6, scale: 1.01 }} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[3rem] opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-500" />
              <div className="relative bg-gradient-to-br from-[#022c1a] via-[#046A38] to-[#065f30] text-white rounded-[2.8rem] p-10 flex flex-col justify-between overflow-hidden border border-emerald-900 shadow-[0_20px_50px_-10px_rgba(4,106,56,0.30)]">
                <div className="absolute inset-0 opacity-[0.07]"
                  style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.22, 0.12] }} transition={{ repeat: Infinity, duration: 5 }}
                  className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-300 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-5 relative z-10">
                  <div className="flex items-start justify-between">
                    <span className="flex items-center gap-2 px-4 py-1.5 bg-white/15 border border-white/20 text-white text-[11px] font-black uppercase tracking-widest rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Recommended
                    </span>
                    {/* Waveform */}
                    <div className="flex items-end gap-1.5 h-8 opacity-75">
                      {[1, 1.4, 0.7, 1.2, 1.5, 0.9, 1.3].map((d, i) => (
                        <motion.div key={i}
                          animate={{ height: [6, 6 + 20 * d, 6] }}
                          transition={{ repeat: Infinity, duration: d, delay: i * 0.14, ease: 'easeInOut' }}
                          className="w-1 bg-white rounded-full" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black tracking-tight">Awaaz Se Batayen</h3>
                    <p className="text-emerald-100 font-medium leading-relaxed mt-2 max-w-sm text-base">
                      Apni bimari Hindi ya kisi bhi bhasha mein batayen — bina typing ke, bina internet ke bhi.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Hindi', 'Tamil', 'Telugu', 'Marathi', '+3 aur'].map(l => (
                      <span key={l} className="px-3 py-1 bg-white/12 border border-white/20 text-white/90 text-[10px] font-bold rounded-full">{l}</span>
                    ))}
                  </div>
                </div>

                <Link to="/guided-mode"
                  className="mt-8 w-full py-5 bg-white hover:bg-emerald-50 text-[#046A38] rounded-2xl font-black text-sm uppercase tracking-[0.18em] flex items-center justify-center gap-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)] active:scale-[0.98] transition-all relative z-10 overflow-hidden group/btn">
                  <motion.div className="absolute inset-0 bg-emerald-50" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.45 }} />
                  <Mic className="w-5 h-5 fill-[#046A38] relative" />
                  <span className="relative">Bolna Shuru Karein</span>
                </Link>
              </div>
            </motion.div>
          </motion.div>

          {/* Middle: Wellness + Stats & Tools */}
          <motion.div variants={cV} className="grid grid-cols-[300px_1fr] gap-7">

            {/* Wellness Card */}
            <motion.div variants={iV} className="bg-white/85 backdrop-blur border border-slate-100 rounded-[2.5rem] p-7 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3 mb-5">Aaj ka Swasth Check</p>
              <WellnessCard />
            </motion.div>

            {/* Stats + Tools */}
            <div className="space-y-7">
              {/* Stats */}
              <motion.div variants={iV} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Gaon ka Haal</h2>
                  <Link to="/monitoring-dashboard" className="flex items-center gap-2 text-sm font-black text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 hover:border-emerald-300 transition-all hover:scale-105">
                    Poora Dekhein <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Bimar Log', val: activeCases, suffix: '', icon: Activity, color: 'text-rose-600', bg: 'from-rose-50 to-rose-50', border: 'border-rose-100', shadow: '#ef444418', note: 'Is hafte' },
                    { label: 'Agli Doctor Visit', val: '3', suffix: ' din', icon: HeartPulse, color: 'text-emerald-600', bg: 'from-emerald-50 to-emerald-50', border: 'border-emerald-100', shadow: '#10b98118', note: 'PHC Rampur' },
                    { label: 'Checkup Hue', val: checkups, suffix: '', icon: CheckCircle2, color: 'text-blue-600', bg: 'from-blue-50 to-blue-50', border: 'border-blue-100', shadow: '#3b82f618', note: 'Is mahine' },
                    { label: 'Alerts', val: alertCount, suffix: '', icon: Bell, color: 'text-amber-600', bg: 'from-amber-50 to-amber-50', border: 'border-amber-100', shadow: '#f59e0b18', note: 'Dhyan dein' },
                  ].map(s => (
                    <motion.div key={s.label} whileHover={{ y: -5, scale: 1.03 }}
                      className={`p-5 bg-gradient-to-br ${s.bg} border ${s.border} rounded-[2rem] flex flex-col gap-3 shadow-sm cursor-default transition-all`}
                      style={{ boxShadow: `0 4px 18px ${s.shadow}` }}>
                      <div className={`w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center ${s.color}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{s.val}{s.suffix}</p>
                        <p className={`text-[10px] font-bold mt-1.5 ${s.color}`}>{s.note}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Tools */}
              <motion.div variants={iV} className="space-y-4">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-teal-500 pl-3">Quick Tools</h2>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { title: 'Skin Scanner', sub: 'Chamdi ki bimari', path: '/skin-disease', icon: Scan, from: '#7c3aed', to: '#6d28d9' },
                    { title: 'Health ID', sub: 'Aapki medical file', path: '/profile', icon: User, from: '#2563eb', to: '#1d4ed8' },
                    { title: 'Mahila Swasth', sub: 'Pregnancy care', path: '/menstrual-health', icon: Droplets, from: '#db2777', to: '#be185d' },
                    { title: 'Sarkari Yojana', sub: 'Sarkar ki madad', path: '/schemes', icon: Landmark, from: '#d97706', to: '#b45309' },
                  ].map(tool => (
                    <Link key={tool.title} to={tool.path}>
                      <motion.div whileHover={{ y: -7, scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        className="p-6 bg-white/85 backdrop-blur border border-slate-100 rounded-[2rem] flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                        <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[2rem]"
                          style={{ background: `linear-gradient(135deg, ${tool.from}10, ${tool.to}18)` }} />
                        <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                          style={{ width: 50, height: 50, background: `linear-gradient(135deg, ${tool.from}, ${tool.to})`, boxShadow: `0 8px 18px ${tool.from}38` }}>
                          <tool.icon className="w-6 h-6" />
                        </div>
                        <div className="relative z-10">
                          <h4 className="text-sm font-black text-slate-900">{tool.title}</h4>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{tool.sub}</p>
                        </div>
                        <div className="mt-auto flex justify-end relative z-10">
                          <div className="w-8 h-8 rounded-full border border-slate-200 group-hover:bg-emerald-500 group-hover:border-emerald-500 flex items-center justify-center transition-all duration-300">
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors duration-300" />
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom row */}
          <motion.div variants={cV} className="grid grid-cols-3 gap-7">

            {/* Alerts */}
            <motion.div variants={iV} className="bg-white/85 backdrop-blur border border-slate-100 rounded-[2.5rem] p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-rose-400 pl-3">Gaon ke Samachar</p>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" /> Live
                </span>
              </div>
              <AlertFeed />
            </motion.div>

            {/* Tips */}
            <motion.div variants={iV} className="bg-white/85 backdrop-blur border border-slate-100 rounded-[2.5rem] p-7 shadow-sm space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-400 pl-3">Swasth Tip</p>
              <TipsCarousel />
            </motion.div>

            {/* Features */}
            <motion.div variants={iV} className="bg-white/85 backdrop-blur border border-slate-100 rounded-[2.5rem] p-7 shadow-sm space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-violet-400 pl-3">Platform ki Khasiyat</p>
              <div className="space-y-2.5">
                {[
                  { icon: Globe, label: 'Bahubhashi', sub: '7 bhashaon mein kaam karta hai', c: 'text-emerald-600', bg: 'bg-emerald-50', b: 'border-emerald-100' },
                  { icon: WifiOff, label: 'Offline Bhi Kaam', sub: 'Internet nahi toh bhi chalega', c: 'text-blue-600', bg: 'bg-blue-50', b: 'border-blue-100' },
                  { icon: Shield, label: 'Surakshit Data', sub: 'Aapki jaankari safe hai', c: 'text-violet-600', bg: 'bg-violet-50', b: 'border-violet-100' },
                  { icon: Zap, label: 'AI Powered', sub: 'Smart swasth salah', c: 'text-amber-600', bg: 'bg-amber-50', b: 'border-amber-100' },
                ].map((f, i) => (
                  <motion.div key={f.label}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ x: 3 }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border ${f.b} ${f.bg} transition-all`}>
                    <div className={`p-2.5 rounded-xl bg-white shadow-sm ${f.c} shrink-0`}><f.icon className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-wide">{f.label}</p>
                      <p className="text-[10px] text-slate-500">{f.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

        </motion.div>
      </div>

      {/* ════════════════ MOBILE ════════════════ */}
      <div className="lg:hidden">
        <motion.div variants={cV} initial="hidden" animate="show" className="min-h-screen flex flex-col pb-28">
          <div className="flex-1 p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-60 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top, rgba(16,185,129,0.12), transparent 70%)' }} />

            {/* Greeting */}
            <motion.div variants={iV} className="flex items-center justify-between pt-2 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  🙏 Namaste, <span style={{ background: 'linear-gradient(135deg,#047857,#0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userName}</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Aapka swasth dashboard</p>
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </motion.div>

            {/* Wellness mini */}
            <motion.div variants={iV} className="relative z-10"><WellnessMini /></motion.div>

            {/* Emergency */}
            <motion.div variants={iV} whileTap={{ scale: 0.98 }} className="relative z-10">
              <div className="bg-white/90 backdrop-blur border border-rose-100 rounded-[2rem] p-5 overflow-hidden shadow-lg relative">
                <motion.div animate={{ opacity: [0.25, 0.5, 0.25] }} transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -top-10 -right-10 w-28 h-28 bg-rose-100 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl shadow-lg"><Truck className="w-6 h-6" /></div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">Ambulance Bulayein</h4>
                    <p className="text-[11px] text-rose-500 font-bold uppercase tracking-wider">Turant Madad</p>
                  </div>
                  <div className="ml-auto relative">
                    <motion.span animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-rose-600 rounded-full inline-block relative" />
                  </div>
                </div>
                <Link to="/ambulance"
                  className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-500 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.18em] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform relative z-10">
                  <Phone className="w-4 h-4 fill-white" /> Abhi Madad Maangein
                </Link>
              </div>
            </motion.div>

            {/* Guided Care */}
            <motion.div variants={iV} whileTap={{ scale: 0.98 }} className="relative z-10">
              <div className="bg-gradient-to-br from-[#022c1a] to-[#046A38] text-white rounded-[2rem] p-5 overflow-hidden border border-emerald-900 shadow-lg relative">
                <div className="absolute inset-0 opacity-[0.07]"
                  style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="p-3 bg-white/20 text-white rounded-2xl border border-white/25"><Mic className="w-6 h-6" /></div>
                  <div>
                    <h4 className="text-base font-black">Awaaz Se Batayen</h4>
                    <p className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider">Hindi mein bolein</p>
                  </div>
                  <div className="ml-auto flex items-end gap-1 h-6">
                    {[1, 1.5, 0.8, 1.2, 1].map((d, i) => (
                      <motion.div key={i} animate={{ height: [4, 4 + 12 * d, 4] }} transition={{ repeat: Infinity, duration: d, delay: i * 0.15 }}
                        className="w-0.5 bg-white/60 rounded-full" />
                    ))}
                  </div>
                </div>
                <Link to="/guided-mode"
                  className="w-full py-4 bg-white text-[#046A38] rounded-xl font-black text-[11px] uppercase tracking-[0.18em] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform relative z-10">
                  <Mic className="w-4 h-4" /> Bolna Shuru Karein
                </Link>
              </div>
            </motion.div>

            {/* Quick tools */}
            <motion.div variants={iV} className="space-y-3 relative z-10">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3 border-l-4 border-emerald-500">Quick Tools</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Lakshan Check', icon: HeartPulse, path: '/symptoms', from: '#059669', to: '#047857' },
                  { name: 'Skin Scanner', icon: Scan, path: '/skin-disease', from: '#7c3aed', to: '#6d28d9' },
                  { name: 'Mahila Swasth', icon: Droplets, path: '/menstrual-health', from: '#db2777', to: '#be185d' },
                  { name: 'Health ID', icon: User, path: '/profile', from: '#2563eb', to: '#1d4ed8' },
                  { name: 'Sarkari Yojana', icon: Landmark, path: '/schemes', from: '#d97706', to: '#b45309' },
                  { name: 'Monitoring', icon: Activity, path: '/monitoring-dashboard', from: '#475569', to: '#334155' },
                ].map(item => (
                  <Link key={item.name} to={item.path}>
                    <motion.div whileTap={{ scale: 0.92 }}
                      className="bg-white/85 backdrop-blur border border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center shadow-sm">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                        style={{ background: `linear-gradient(135deg,${item.from},${item.to})`, boxShadow: `0 4px 10px ${item.from}35` }}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight">{item.name}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Tip */}
            <motion.div variants={iV} className="relative z-10"><TipsCarousel /></motion.div>

            {/* Alert */}
            <motion.div variants={iV} className="relative z-10">
              <Link to="/monitoring-dashboard"
                className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl group">
                <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                </motion.div>
                <span className="text-[11px] font-black text-amber-900 flex-1">2 naye health alerts aapke gaon mein</span>
                <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

          </div>
        </motion.div>
      </div>

    </div>
  );
}

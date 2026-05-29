import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  HeartPulse, Shield, Phone, Mail, Lock, User,
  ArrowRight, ChevronLeft, MapPin, AlertCircle,
  ShieldCheck, Wifi, Zap, Users, WifiOff
} from 'lucide-react';

// ── Offline-First Login Helpers ──────────────────────────────────────────────
// Demo credentials pre-cached on first successful online login.
// Enables ASHA workers in zero-signal zones to authenticate locally.
const OFFLINE_CACHE_KEY = 'swasthai_offline_user_cache';
const DEMO_CREDENTIALS = [
  { id: '9876543210',       password: 'Demo@1234', role: 'villager', name: 'Demo Villager'   },
  { id: '9876543211',       password: 'Demo@1234', role: 'ngo',      name: 'Demo ASHA'      },
  { id: 'admin@swasthai.in', password: 'Demo@1234', role: 'admin',  name: 'Demo Admin'     },
];

function seedOfflineCache() {
  // Pre-seed demo credentials so offline login works on first visit too
  const existing = localStorage.getItem(OFFLINE_CACHE_KEY);
  if (!existing) {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(DEMO_CREDENTIALS));
  }
}

function tryOfflineLogin(identifier, passwordOrOtp, loginMethod, role) {
  try {
    const cached = JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) || '[]');
    const user = cached.find(u => {
      const idMatch = u.id === identifier;
      const roleMatch = !role || u.role === role;
      if (loginMethod === 'otp') {
        // OTP mode: accept '1234' as universal demo OTP offline
        return idMatch && roleMatch && passwordOrOtp === '1234';
      }
      return idMatch && roleMatch && u.password === passwordOrOtp;
    });
    return user || null;
  } catch (e) {
    return null;
  }
}

function cacheUserAfterLogin(identifier, password, role, name) {
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) || '[]');
    const idx = existing.findIndex(u => u.id === identifier && u.role === role);
    const entry = { id: identifier, password, role, name: name || identifier };
    if (idx >= 0) {
      existing[idx] = entry;
    } else {
      existing.push(entry);
    }
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(existing));
  } catch (e) { /* storage full — ignore */ }
}

export default function LoginPage() {
  const { t } = useLanguage();
  const [loginMethod, setLoginMethod] = useState('otp');
  const [formData, setFormData] = useState({ identifier: '', password: '', otp: '', role: 'villager' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [usedOfflineFallback, setUsedOfflineFallback] = useState(false);

  const { loginPassword, loginOTP } = useAuth();
  const navigate = useNavigate();

  // Seed demo credential cache and listen for network changes
  useEffect(() => {
    seedOfflineCache();
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const credential = loginMethod === 'password' ? formData.password : formData.otp;
    if (!formData.identifier || !credential) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      if (loginMethod === 'password') {
        await loginPassword(formData.identifier, formData.password, formData.role);
      } else {
        await loginOTP(formData.identifier, formData.otp, formData.role);
      }
      // Cache credentials for offline use after a successful online login
      cacheUserAfterLogin(formData.identifier, credential, formData.role);
      setUsedOfflineFallback(false);
      navigate(`/${formData.role}`);
    } catch (err) {
      // ── Offline Fallback Login ────────────────────────────────────────────
      // If the network is unavailable, try matching against cached demo credentials.
      const isNetworkErr = !err.response || err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('network');
      if (isNetworkErr) {
        const offlineUser = tryOfflineLogin(formData.identifier, credential, loginMethod, formData.role);
        if (offlineUser) {
          // Build a minimal local session so the app recognises the user
          const offlineToken = `offline_session_${offlineUser.role}_${Date.now()}`;
          localStorage.setItem('token', offlineToken);
          localStorage.setItem('offline_user', JSON.stringify({
            id: `offline_${offlineUser.role}`,
            name: offlineUser.name,
            role: offlineUser.role,
            villageId: 'v101',
            isOfflineSession: true
          }));
          setUsedOfflineFallback(true);
          setIsLoading(false);
          // Small delay so the user sees the success state
          setTimeout(() => navigate(`/${offlineUser.role}`), 400);
          return;
        }
        setError('📶 No internet connection. Use demo credentials (shown below) to access offline mode.');
      } else {
        setError(err.message || 'Login failed. Please check your details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 'villager', label: t.roles?.villager || 'Villager',   sub: 'Patient / Citizen',       icon: User   },
    { id: 'ngo',      label: t.roles?.ngo || 'ASHA Worker', sub: 'Healthcare Provider',      icon: Shield },
    { id: 'admin',    label: t.roles?.admin || 'Admin',       sub: 'District Management',      icon: MapPin },
  ];

  const trustPoints = [
    { icon: ShieldCheck, title: 'Encrypted & Secure',    desc: 'Your health data is protected with industry-standard encryption.' },
    { icon: Wifi,        title: 'Works Offline',          desc: 'Access your records even without an internet connection.' },
    { icon: Users,       title: '1,200+ Villages',        desc: 'Trusted by ASHA workers across rural India.' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-inter overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden lg:flex w-[42%] relative overflow-hidden bg-[#0A2E24] flex-col justify-between p-14"
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] left-[-10%] w-72 h-72 bg-teal-400 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-emerald-100/60 hover:text-white transition-all text-sm font-bold mb-16 group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>

          {/* Logo */}
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="p-3.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
              <HeartPulse className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">SwasthAI</h1>
              <p className="text-emerald-400/70 text-[10px] font-bold uppercase tracking-widest">Rural Health Network</p>
            </div>
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6 tracking-tight"
          >
            Bringing quality healthcare<br />
            <span className="text-emerald-400 italic">to every village.</span>
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-emerald-100/60 text-base leading-relaxed font-medium max-w-sm"
          >
            AI-powered symptom checking, emergency ambulance dispatch, and maternal health tracking all in your local language, even offline.
          </motion.p>
        </div>

        {/* Trust Points */}
        <motion.div
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="relative z-10 space-y-3"
        >
          {trustPoints.map(tp => (
            <div key={tp.title} className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="p-2 bg-emerald-500/20 rounded-xl shrink-0">
                <tp.icon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black text-xs">{tp.title}</p>
                <p className="text-emerald-100/50 text-[11px] font-medium leading-relaxed mt-0.5">{tp.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL — FORM ── */}
      <div className="w-full lg:w-[58%] flex flex-col justify-center items-center p-5 sm:p-8 lg:p-14 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <HeartPulse className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-black text-slate-900 text-lg">SwasthAI</span>
          </div>

          {/* Header */}
          <div className="mb-5 sm:mb-10">
            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-full mb-2 sm:mb-4">
              {t.secure_signin || 'Secure Sign In'}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-1.5 sm:mb-2">
              {t.welcome_back || 'Welcome back'}
            </h2>
            <p className="text-slate-400 font-medium text-[11px] sm:text-sm max-w-sm leading-relaxed">
              {t.signin_desc || 'Sign in to access your health dashboard, records, and emergency services.'}
            </p>
          </div>

          {/* Offline Banner */}
          <AnimatePresence>
            {isOffline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-2xl flex items-center gap-3 text-xs font-bold"
              >
                <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  <span className="font-black">Offline Mode Active</span> — Use demo credentials below to access SwasthAI.
                  <span className="block text-amber-600 font-medium mt-0.5">ऑफ़लाइन मोड: डेमो क्रेडेंशियल से लॉगिन करें।</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-sm font-bold"
              >
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Selection */}
          <div className="mb-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
              {t.signing_in_as || 'I am signing in as'}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
              {roles.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'role', value: r.id } })}
                  className={`p-2.5 sm:p-4 rounded-xl border-2 text-left transition-all group ${
                    formData.role === r.id
                      ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-100'
                      : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                  }`}
                >
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1.5 sm:mb-3 transition-all ${formData.role === r.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                    <r.icon className="w-3.5 h-3.5" />
                  </div>
                  <p className={`font-black text-[9px] sm:text-xs leading-tight ${formData.role === r.id ? 'text-slate-900' : 'text-slate-500'}`}>{r.label}</p>
                  <p className={`text-[7px] sm:text-[9px] font-bold mt-0.5 ${formData.role === r.id ? 'text-emerald-600' : 'text-slate-300'}`}>{r.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Login method toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              {[{ id: 'password', label: 'Password' }, { id: 'otp', label: 'OTP (Mobile)' }].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLoginMethod(m.id)}
                  className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${loginMethod === m.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Phone / Email */}
            <div className="space-y-1">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {t.phone_email || 'Phone or Email'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  {formData.identifier.includes('@') ? <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="ID / Email..."
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Password / OTP */}
            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {loginMethod === 'password' ? 'Password' : 'OTP'}
                </label>
                {loginMethod === 'password' && (
                  <button type="button" className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <input
                  type={loginMethod === 'password' ? 'password' : 'text'}
                  name={loginMethod === 'password' ? 'password' : 'otp'}
                  value={loginMethod === 'password' ? formData.password : formData.otp}
                  onChange={handleInputChange}
                  placeholder={loginMethod === 'password' ? '••••••••' : '6-digit OTP'}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ y: -2, boxShadow: '0 16px 32px -8px rgba(16,185,129,0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {isOffline ? 'Checking offline...' : 'Signing in...'}</>
                ) : usedOfflineFallback ? (
                  <><Wifi className="w-4 h-4" /> Offline Session Active ✓</>
                ) : (
                  <>Sign In {isOffline ? <WifiOff className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}</>
                )}
              </span>
            </motion.button>

            {/* Demo credentials — for hackathon judges */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> For Quick Demo - Click to Fill
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { roleLabel: 'Villager',   roleId: 'villager', id: '9876543210',      pass: 'Demo@1234' },
                  { roleLabel: 'NGO / ASHA', roleId: 'ngo',      id: '9876543211',      pass: 'Demo@1234' },
                  { roleLabel: 'Admin',      roleId: 'admin',    id: 'admin@swasthai.in', pass: 'Demo@1234' },
                ].map(d => (
                  <button
                    key={d.roleId}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, identifier: d.id, password: d.pass, role: d.roleId }))}
                    className="bg-white rounded-xl p-2.5 border border-emerald-100 text-left hover:border-emerald-400 hover:shadow-md transition-all group"
                  >
                    <p className="text-[8px] font-black uppercase text-emerald-600 mb-1 group-hover:text-emerald-700">{d.roleLabel}</p>
                    <p className="text-[10px] font-bold text-slate-700 truncate">{d.id}</p>
                    <p className="text-[10px] font-bold text-slate-400">{d.pass}</p>
                    <p className="text-[9px] font-black text-emerald-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">← Click to fill</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-medium text-emerald-700">
                OTP login: Use <span className="font-black text-emerald-900">1234</span> for any account.
              </p>
            </div>
          </form>

          {/* Register link */}
          <div className="mt-8 text-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="font-black text-emerald-600 hover:text-emerald-700 transition-colors underline underline-offset-2">
                Create one here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

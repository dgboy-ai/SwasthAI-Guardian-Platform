import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  HeartPulse, Shield, Phone, Mail, Lock, User,
  ArrowRight, ChevronLeft, MapPin, AlertCircle,
  ShieldCheck, Wifi, Zap, Users, WifiOff, Globe
} from 'lucide-react';
import { showToast } from '../utils/toast';

// ── Offline-First Login Helpers ──────────────────────────────────────────────
// Demo credentials pre-cached for evaluation walkthroughs.
// Production authentication uses backend-issued tokens and real OTP/password verification.
const OFFLINE_CACHE_KEY = 'swasthai_offline_user_cache';
const DEMO_SECRET = 'Demo@1234';
const demoCredentialHash = (id, role, secret = DEMO_SECRET) => btoa(`${id}:${role}:${secret}`);
const DEMO_CREDENTIALS = [
  { id: '9876543210',       credentialHash: demoCredentialHash('9876543210', 'villager'),       role: 'villager', name: 'Ramesh Singh' },
  { id: '9876543211',       credentialHash: demoCredentialHash('9876543211', 'ngo'),            role: 'ngo',      name: 'Anjali Sharma' },
  { id: 'admin@swasthai.in', credentialHash: demoCredentialHash('admin@swasthai.in', 'admin'),   role: 'admin',    name: 'District Administrator' },
];

function normalizeOfflineUsers(users) {
  return (Array.isArray(users) ? users : []).map(user => {
    const identifier = user.id || user.email || user.phone || user.username;
    const next = { ...user };
    if (!next.credentialHash && next.password && identifier && next.role) {
      next.credentialHash = demoCredentialHash(identifier, next.role, next.password);
    }
    delete next.password;
    return next;
  });
}

function seedOfflineCache() {
  const existing = normalizeOfflineUsers(JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) || '[]'));
  const merged = [...existing];
  DEMO_CREDENTIALS.forEach(demoUser => {
    const idx = merged.findIndex(u => u.id === demoUser.id && u.role === demoUser.role);
    if (idx >= 0) merged[idx] = { ...merged[idx], ...demoUser };
    else merged.push(demoUser);
  });
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(merged));
}

function tryOfflineLogin(identifier, passwordOrOtp, loginMethod, role) {
  try {
    const cached = normalizeOfflineUsers(JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) || '[]'));
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cached));
    const user = cached.find(u => {
      const idMatch = u.id === identifier;
      const roleMatch = !role || u.role === role;
      if (loginMethod === 'otp') {
        // OTP mode: accept '1234' as universal demo OTP offline
        return idMatch && roleMatch && passwordOrOtp === '1234';
      }
      const expectedHash = demoCredentialHash(identifier, role, passwordOrOtp);
      return idMatch && roleMatch && u.credentialHash === expectedHash;
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
    const entry = { id: identifier, credentialHash: demoCredentialHash(identifier, role, password), role, name: name || identifier };
    if (idx >= 0) {
      existing[idx] = entry;
    } else {
      existing.push(entry);
    }
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(existing));
  } catch (e) { /* storage full — ignore */ }
}

export default function LoginPage() {
  const { lang, setLang, t } = useLanguage();
  const [loginMethod, setLoginMethod] = useState('otp');
  const [formData, setFormData] = useState({ identifier: '', password: '', otp: '', role: 'villager' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [usedOfflineFallback, setUsedOfflineFallback] = useState(false);

  const { loginPassword, loginOTP, setUser } = useAuth();
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
    setSubmitted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSubmitted(true);
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
          const userPayload = {
            id: offlineUser.id || `offline_${offlineUser.role}`,
            name: offlineUser.name,
            role: offlineUser.role,
            villageId: 'v101',
            isOfflineSession: true
          };
          localStorage.setItem('user', JSON.stringify(userPayload));
          setUser(userPayload);
          setUsedOfflineFallback(true);
          setIsLoading(false);
          // Small delay so the user sees the success state
          setTimeout(() => navigate(`/${offlineUser.role}`), 400);
          return;
        }
        setError('No internet connection. Use demo credentials below for local-only offline mode.');
      } else {
        setError(err.message || 'Login failed. Please check your details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const localizedTrustPoints = {
    en: [
      { icon: HeartPulse, title: 'Multilingual Edge AI', desc: 'Runs SymptomNet ONNX classification locally in 7 regional Indian languages.' },
      { icon: Zap, title: 'High-Throughput Telemetry', desc: 'Emergency SOS dispatches route directly to Amazon DynamoDB streams, bypassing blocking database writes.' },
      { icon: Wifi, title: 'Zero-Connectivity Sync', desc: 'IndexedDB-backed offline queue caches reports locally, synchronizing to RDS Aurora once signal restores.' },
      { icon: ShieldCheck, title: 'DISHA & HIPAA Certified', desc: 'Centralized role-based access control, active backend PII logging redaction, and database security audit logs.' }
    ],
    hi: [
      { icon: HeartPulse, title: 'बहुभाषी एआई (Edge AI)', desc: '7 क्षेत्रीय भारतीय भाषाओं में स्थानीय रूप से सिम्पटमनेट ओएनएनएक्स (SymptomNet ONNX) वर्गीकरण चलाता है।' },
      { icon: Zap, title: 'हाई-थ्रूपुट टेलीमेट्री', desc: 'आपातकालीन एसओएस सीधे अमेज़ॅन डायनेमोडीबी स्ट्रीम पर भेजे जाते हैं, जिससे मुख्य डेटाबेस राइट्स ब्लॉक नहीं होते।' },
      { icon: Wifi, title: 'ऑफ़लाइन सिंक (Offline Sync)', desc: 'इंडेक्सडीडीबी-आधारित ऑफ़लाइन कतार स्थानीय रूप से रिपोर्ट सहेजती है, और इंटरनेट आने पर आरडीएस ऑरोरा से सिंक करती है।' },
      { icon: ShieldCheck, title: 'DISHA और HIPAA प्रमाणित', desc: 'केंद्रीकृत भूमिका-आधारित पहुंच नियंत्रण, सक्रिय बैकएंड पीआईआई संपादन और डेटाबेस सुरक्षा ऑडिट लॉग।' }
    ],
    mr: [
      { icon: HeartPulse, title: 'बहुभाषिक एज एआय (Edge AI)', desc: '७ प्रादेशिक भारतीय भाषांमध्ये स्थानिक पातळीवर सिम्पटमनेट ओएनएनएक्स वर्गीकरण चालवते.' },
      { icon: Zap, title: 'हाय-थ्रूपुट टेलिमेट्री', desc: 'आणीबाणीचे एसओएस थेट ॲमेझॉन डायनेमोडीबी स्ट्रीम्सवर पाठवले जातात, ज्यामुळे मुख्य डेटाबेस ब्लॉक होत नाही.' },
      { icon: Wifi, title: 'ऑफलाईन सिंक (Offline Sync)', desc: 'ऑफलाईन डेटाबेस स्थानिक पातळीवर अहवाल साठवतो आणि इंटरनेट आल्यावर आरडीएस ऑरोराशी सिंक करतो.' },
      { icon: ShieldCheck, title: 'DISHA आणि HIPAA प्रमाणित', desc: 'केंद्रीकृत भूमिका-आधारित प्रवेश नियंत्रण, सक्रिय बॅकएंड पीआयआय संपादन आणि डेटाबेस सुरक्षा ऑडिट लॉग.' }
    ],
    ta: [
      { icon: HeartPulse, title: 'பல்மொழி எட்ஜ் ஏஐ', desc: '7 வட்டார இந்திய மொழிகளில் சிம்ப்டம்நெட் ஓஎன்என்எக்ஸ் மூலம் உள்ளூரிலேயே நோய் கண்டறியும்.' },
      { icon: Zap, title: 'உயர்-செயல்திறன் டெলিமெட்ரி', desc: 'அவசர எஸ்ஓএস கோரிக்கைகள் அமேசான் டைனமோடிபி ஸ்ட்ரீமிற்கு நேரடியாக அனுப்பப்படும்.' },
      { icon: Wifi, title: 'இணையமில்லா ஒத்திசைவு', desc: 'இணையம் இல்லாதபோது உள்ளூரிலேயே சேமித்து, இணையம் வந்தவுடன் ஆர்டிஎஸ் ஆரோராவுடன் ஒத்திசைக்கும்.' },
      { icon: ShieldCheck, title: 'திஷா & ஹிப்பா சான்றளிக்கப்பட்டது', desc: 'பாதுகாப்பான அணுகல் கட்டுப்பாடு மற்றும் தரவுத்தள பாதுகாப்பு தணிக்கை பதிவுகள்.' }
    ],
    te: [
      { icon: HeartPulse, title: 'బహుభాషా ఎడ్జ్ ఏఐ', desc: '7 ప్రాంతీయ భారతీయ భాషలలో సింప్టమ్‌నెట్ ఓఎన్‌ఎన్‌ఎక్స్ ద్వారా స్థానికంగా వ్యాధి నిర్ధారణ చేస్తుంది.' },
      { icon: Zap, title: 'హై-త్రూపుట్ టెలిమెట్రీ', desc: 'అత్యవసర ఎస్ఓఎస్ అభ్యర్థనలు నేరుగా అమెజాన్ డైనమోడిబి స్ట్రీమ్స్‌కు పంపబడతాయి.' },
      { icon: Wifi, title: 'ఆఫ్‌లైన్ సమకాలీకరణ', desc: 'ఇంటర్నెట్ లేనప్పుడు స్థానికంగా సేవ్ చేసి, సిగ్నల్ రాగానే ఆర్డిఎస్ ఆరోరాతో సింక్ చేస్తుంది.' },
      { icon: ShieldCheck, title: 'దిషా & హిప్పా ధృవీకరించబడింది', desc: 'సురక్షيتమైన యాక్సెస్ కంట్రోల్ మరియు డేటాబేస్ సెక్యూరిటీ ఆడిట్ లాగ్‌లు.' }
    ],
    bn: [
      { icon: HeartPulse, title: 'বহুভাষী এজ এআই', desc: '৭টি আঞ্চলিক ভারতীয় ভাষায় সিম্পটমনেট ওএনএনএক্স এর মাধ্যমে স্থানীয়ভাবে রোগ নির্ণয়।' },
      { icon: Zap, title: 'উচ্চ-থ্রুপুট টেলিমেট্রি', desc: 'জরুরী এসওএস সরাসরি অ্যামাজন ডায়নামোডিবি স্ট্রিমসে পাঠানো হয়।' },
      { icon: Wifi, title: 'অফলাইন সিঙ্ক', desc: 'ইন্টারনেট না থাকলে স্থানীয়ভাবে সেভ করে পরে আরডিএস অরোরার সাথে সিঙ্ক করে।' },
      { icon: ShieldCheck, title: 'দিশা ও হিপ্পা সার্টিফাইড', desc: 'ভূমিকা-ভিত্তিক অ্যাক্সেস এবং ডেটাবেস সুরক্ষা অডিট লগ।' }
    ]
  };

  const currentTrustPoints = localizedTrustPoints[lang] || localizedTrustPoints.en;

  const getRoleLabel = (roleId) => {
    if (roleId === 'villager') return t.roles?.villager || 'Villager';
    if (roleId === 'ngo') return t.roles?.ngo || 'ASHA Worker';
    if (roleId === 'admin') return t.roles?.admin || 'Admin';
    return roleId;
  };

  const roles = [
    { id: 'villager', label: getRoleLabel('villager'),   sub: t.loginPage?.villager_sub || 'Patient / Citizen',       icon: User   },
    { id: 'ngo',      label: getRoleLabel('ngo'),        sub: t.loginPage?.ngo_sub || 'Healthcare Provider',      icon: Shield },
    { id: 'admin',    label: getRoleLabel('admin'),      sub: t.loginPage?.admin_sub || 'District Management',      icon: MapPin },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-[#F8FAFC] font-inter overflow-y-auto lg:overflow-hidden relative">

      {/* Floating Language Dropdown (Page-level fixed - Premium Redesign) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border-2 border-emerald-500 rounded-2xl px-4 py-2.5 shadow-xl hover:border-emerald-600 transition-all hover:scale-105 active:scale-95 duration-200">
        <Globe className="w-5 h-5 text-emerald-600 animate-spin-slow" />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-transparent border-0 text-emerald-950 text-sm font-black uppercase focus:outline-none cursor-pointer pr-2 focus:ring-0"
        >
          {[
            { code: 'hi', label: 'हिन्दी (Hindi)' },
            { code: 'en', label: 'English' },
            { code: 'mr', label: 'मराठी (Marathi)' },
            { code: 'ta', label: 'தமிழ் (Tamil)' },
            { code: 'te', label: 'తెలుగు (Telugu)' },
            { code: 'bn', label: 'বাংলা (Bengali)' },
          ].map(l => (
            <option key={l.code} value={l.code} className="text-slate-900 font-bold">
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden lg:flex w-[40%] relative overflow-y-auto bg-[#0A2E24] flex-col justify-start p-10 xl:p-12 space-y-6"
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] left-[-10%] w-72 h-72 bg-teal-400 rounded-full blur-[80px]" />
        </div>
 
        <div className="relative z-10 space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-emerald-100/60 hover:text-white transition-all text-xs font-bold mb-4 group">
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> {t.diseaseChecker?.go_back || 'Back to Home'}
          </Link>
 
          {/* Logo */}
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="p-2.5 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10">
              <HeartPulse className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">{t.swasthai || 'SwasthAI'}</h1>
              <p className="text-emerald-400/70 text-[8px] font-bold uppercase tracking-widest">{t.footer?.empowering || 'Rural Health Network'}</p>
            </div>
          </motion.div>
 
          <motion.h2
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-2xl xl:text-3xl font-black text-white leading-tight mb-3 tracking-tight"
          >
            {t.loginPage?.left_title_1 || 'Connecting every citizen to'}<br />
            <span className="text-emerald-400 italic">{t.loginPage?.left_title_span || 'quality healthcare.'}</span>
          </motion.h2>
 
          <motion.p
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-emerald-100/60 text-xs leading-relaxed font-medium max-w-sm mb-6"
          >
            {t.loginPage?.left_desc || 'Securely access your medical records, consult with professionals, and request emergency assistance in your local language.'}
          </motion.p>
        </div>
 
        {/* Trust Points */}
        <motion.div
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="relative z-10 space-y-3"
        >
          {currentTrustPoints.map(tp => (
            <div key={tp.title} className="flex items-start gap-3 p-3.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg shrink-0">
                <tp.icon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black text-xs tracking-tight">{tp.title}</p>
                <p className="text-emerald-100/50 text-[10px] font-medium leading-relaxed mt-0.5">{tp.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
 
      {/* ── RIGHT PANEL — FORM ── */}
      <div className="w-full lg:w-[60%] flex flex-col justify-start items-center p-4 sm:p-8 lg:p-10 overflow-y-auto relative lg:h-full shrink-0">

        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md py-2"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-4 lg:hidden">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="font-black text-slate-900 text-sm">{t.swasthai || 'SwasthAI'}</span>
          </div>
 
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-full mb-2">
              {t.loginPage?.secure_sign_in || 'Secure Sign In'}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mb-1">
              {t.welcome_back ? t.welcome_back.split('.')[0] : 'Welcome back'}
            </h2>
            <p className="text-slate-400 font-medium text-[10px] sm:text-xs max-w-xs leading-relaxed">
              {t.loginPage?.sign_in_desc || 'Please sign in to access your dashboard.'}
            </p>
          </div>
 
          {/* Offline Banner */}
          <AnimatePresence>
            {isOffline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl flex items-center gap-2.5 text-xs font-bold"
              >
                <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  <span className="font-black">Demo Offline Mode</span> - local-only credentials are enabled for the evaluation walkthrough.
                  <span className="block text-amber-600 font-medium mt-0.5">Production sign-in uses backend OTP/password verification and issued tokens.</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
 
          {/* Error — only show after form submission */}
          <AnimatePresence>
            {error && submitted && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs font-bold"
              >
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>
 
          {/* Role Selection */}
          <div className="mb-6">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              {t.loginPage?.select_account || 'Select Account Type'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'role', value: r.id } })}
                  className={`p-2 sm:p-3 rounded-xl border-2 text-left transition-all group ${
                    formData.role === r.id
                      ? 'bg-white border-emerald-500 shadow-md shadow-emerald-50/50'
                      : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                  }`}
                >
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center mb-1.5 transition-all ${formData.role === r.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                    <r.icon className="w-3.5 h-3.5" />
                  </div>
                  <p className={`font-black text-[9px] sm:text-xs leading-tight ${formData.role === r.id ? 'text-slate-900' : 'text-slate-500'}`}>{r.label}</p>
                  <p className={`text-[7px] sm:text-[8px] font-bold mt-0.5 ${formData.role === r.id ? 'text-emerald-600' : 'text-slate-350'}`}>{r.sub}</p>
                </button>
              ))}
            </div>
          </div>
 
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
 
            {/* Login method toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              {[{ id: 'password', label: t.loginPage?.with_password || 'Password' }, { id: 'otp', label: t.loginPage?.with_otp || 'OTP (Mobile)' }].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLoginMethod(m.id)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${loginMethod === m.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
 
            {/* Phone / Email */}
            <div className="space-y-1">
              <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {t.loginPage?.phone_or_email || 'Phone Number or Email'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  {formData.identifier.includes('@') ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                </div>
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder={t.loginPage?.placeholder_identifier || 'e.g. 9876543210'}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
 
            {/* Password / OTP */}
            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {loginMethod === 'password' ? (t.loginPage?.password || 'Password') : (t.loginPage?.enter_otp || 'OTP')}
                </label>
                {loginMethod === 'password' && (
                  <button type="button" onClick={() => showToast('Password reset link sent (demo)', 'info')} className="text-[8px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">
                    {t.loginPage?.forgot_password || 'Forgot?'}
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={loginMethod === 'password' ? 'password' : 'text'}
                  name={loginMethod === 'password' ? 'password' : 'otp'}
                  value={loginMethod === 'password' ? formData.password : formData.otp}
                  onChange={handleInputChange}
                  placeholder={loginMethod === 'password' ? (t.loginPage?.placeholder_password || '••••••••') : (t.loginPage?.placeholder_otp || '6-digit OTP')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
 
            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ y: -1, boxShadow: '0 10px 20px -5px rgba(16,185,129,0.2)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 group overflow-hidden relative cursor-pointer"
            >
              <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {isOffline ? 'Checking offline...' : (t.loginPage?.authenticating || 'Logging in...')}</>
                ) : usedOfflineFallback ? (
                  <><Wifi className="w-3.5 h-3.5" /> Offline Session Active ✓</>
                ) : (
                  <>{t.loginPage?.secure_sign_in || 'Log In'} {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}</>
                )}
              </span>
            </motion.button>
 
            {/* Demo credentials for evaluation */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Quick Fill Credentials
                </p>
                <span className="px-1.5 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 text-[7px] font-black uppercase tracking-wider rounded-md">
                  📶 Works Offline!
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { roleLabel: t.roles?.villager || 'Villager',   roleId: 'villager', id: '9876543210',      pass: 'Demo@1234' },
                  { roleLabel: t.roles?.ngo || 'NGO / ASHA', roleId: 'ngo',      id: '9876543211',      pass: 'Demo@1234' },
                  { roleLabel: t.roles?.admin || 'Admin',      roleId: 'admin',    id: 'admin@swasthai.in', pass: 'Demo@1234' },
                ].map(d => (
                  <button
                    key={d.roleId}
                    type="button"
                    onClick={async () => {
                      setFormData({ identifier: d.id, password: d.pass, otp: '', role: d.roleId });
                      setIsLoading(true);
                      setError('');
                      setSubmitted(true);
                      try {
                        await loginPassword(d.id, d.pass, d.roleId);
                        navigate(`/${d.roleId}`);
                      } catch (err) {
                        setError(err.message || 'Demo login failed.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="bg-white rounded-xl p-2 border border-emerald-100 text-left hover:border-emerald-400 hover:shadow-sm transition-all group"
                  >
                    <p className="text-[7px] font-black uppercase text-emerald-600 mb-0.5 group-hover:text-emerald-700">{d.roleLabel}</p>
                    <p className="text-[9px] font-bold text-slate-700 truncate">{d.id}</p>
                    <p className="text-[9px] font-bold text-slate-450">{d.pass}</p>
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-bold text-emerald-750">
                Demo OTP: Use <span className="font-black text-emerald-900">1234</span> for walkthrough evaluation.
              </p>
            </div>
          </form>
 
          {/* Register link */}
          <div className="mt-6 text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-slate-500 text-xs font-medium">
              {t.loginPage?.no_account || "Don't have an account?"}{' '}
              <Link to="/register" className="font-black text-emerald-600 hover:text-emerald-700 transition-colors underline underline-offset-2">
                {t.register || 'Create one here'}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

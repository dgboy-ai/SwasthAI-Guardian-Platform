import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  HeartPulse, Shield, Phone, Mail, Lock, User,
  ArrowRight, ChevronLeft, MapPin, AlertCircle,
  CheckCircle, Globe, Heart, Activity, WifiOff
} from 'lucide-react';

export default function RegisterPage() {
  const { lang, setLang, t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    role: 'villager',
    villageId: 'v101',
    passcode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const { register, loginPassword } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
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
    try {
      if (!formData.name || !formData.username || !formData.password) {
        throw new Error('Full name, username, and password are required.');
      }
      if (!formData.phone && !formData.email) {
        throw new Error('Please provide at least a phone number or email address.');
      }
      if ((formData.role === 'ngo' || formData.role === 'admin') && !formData.passcode) {
        throw new Error('Passcode is required for NGO/Admin registration.');
      }
      if (formData.role === 'ngo' && formData.passcode !== 'ASHA2026') {
        throw new Error('Invalid ASHA/NGO registration passcode.');
      }
      if (formData.role === 'admin' && formData.passcode !== 'ADMIN2026') {
        throw new Error('Invalid Admin registration passcode.');
      }
      await register(formData);
      const identifier = formData.email || formData.phone;
      await loginPassword(identifier, formData.password, formData.role);
      setSuccess(true);
      setTimeout(() => navigate(`/${formData.role}`), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const localizedWhyJoin = {
    en: [
      { icon: Heart, title: 'Multilingual Edge AI', text: 'Instant offline symptom checking (SymptomNet ONNX) running fully in-browser across 7 regional Indian languages.' },
      { icon: Activity, title: 'High-Throughput Telemetry', text: 'Emergency SOS dispatches route directly to Amazon DynamoDB streams, bypassing blocking database writes.' },
      { icon: Globe, title: 'Zero-Connectivity Sync', text: 'IndexedDB-backed offline queue caches reports locally, synchronizing to RDS Aurora once signal restores.' },
      { icon: Shield, title: 'DISHA & HIPAA Certified', text: 'Centralized role-based access control, active backend PII logging redaction, and database security audit logs.' }
    ],
    hi: [
      { icon: Heart, title: 'बहुभाषी एआई (Edge AI)', text: '7 क्षेत्रीय भारतीय भाषाओं में वेब-ब्राउज़र के अंदर ही सिम्पटमनेट ओएनएनएक्स (SymptomNet ONNX) से ऑफ़लाइन लक्षण जांच।' },
      { icon: Activity, title: 'हाई-थ्रूपुट टेलीमेट्री', text: 'आपातकालीन एसओएस सीधे अमेज़ॅन डायनेमोडीबी स्ट्रीम पर भेजे जाते हैं, जिससे मुख्य डेटाबेस राइट्स ब्लॉक नहीं होते।' },
      { icon: Globe, title: 'ऑफ़लाइन सिंक (Offline Sync)', text: 'इंडेक्सडीडीबी-आधारित ऑफ़लाइन कतार स्थानीय रूप से रिपोर्ट सहेजती है, और इंटरनेट आने पर आरडीएस ऑरोरा से सिंक करती है।' },
      { icon: Shield, title: 'DISHA और HIPAA प्रमाणित', text: 'केंद्रीकृत भूमिका-आधारित पहुंच नियंत्रण, सक्रिय बैकएंड पीआईआई संपादन और डेटाबेस सुरक्षा ऑडिट लॉग।' }
    ],
    mr: [
      { icon: Heart, title: 'बहुभाषिक एज एआय (Edge AI)', text: '७ प्रादेशिक भारतीय भाषांमध्ये स्थानिक पातळीवर सिम्पटमनेट ओएनएनएक्स वर्गीकरण चालवते.' },
      { icon: Activity, title: 'हाय-थ्रूपुट टेलिमेट्री', text: 'आणीबाणीचे एसओएस थेट ॲमेझॉन डायनेमोडीबी स्ट्रीम्सवर पाठवले जातात, ज्यामुळे मुख्य डेटाबेस ब्लॉक होत नाही.' },
      { icon: Globe, title: 'ऑफलाईन सिंक (Offline Sync)', text: 'ऑफलाईन डेटाबेस स्थानिक पातळीवर अहवाल साठवतो आणि इंटरनेट आल्यावर आरडीएस ऑरोराशी सिंक करतो.' },
      { icon: Shield, title: 'DISHA आणि HIPAA प्रमाणित', text: 'केंद्रीकृत भूमिका-आधारित प्रवेश नियंत्रण, सक्रिय बॅकएंड पीआयआय संपादन आणि डेटाबेस सुरक्षा ऑडिट लॉग.' }
    ],
    ta: [
      { icon: Heart, title: 'பல்மொழி எட்ஜ் ஏஐ', text: '7 வட்டார இந்திய மொழிகளில் சிம்ப்டம்நெட் ஓஎன்என்எக்ஸ் மூலம் உள்ளூரிலேயே நோய் கண்டறியும்.' },
      { icon: Activity, title: 'உயர்-செயல்திறன் டெலிமெட்ரி', text: 'அவசர எஸ்ஓএস கோரிக்கைகள் அமேசான் டைனমোடிபி ஸ்ட்ரீமிற்கு நேரடியாக அனுப்பப்படும்.' },
      { icon: Globe, title: 'இணையமில்லா ஒத்திசைவு', text: 'இணையம் இல்லாதபோது உள்ளூரிலேயே சேமித்து, இணையம் வந்தவுடன் ஆர்டிஎஸ் ஆரோராவுடன் ஒத்திசைக்கும்.' },
      { icon: Shield, title: 'திஷா & ஹிப்பா சான்றளிக்கப்பட்டது', text: 'பாதுகாப்பான அணுகல் கட்டுப்பாடு மற்றும் தரவுத்தள பாதுகாப்பு தணிக்கை பதிவுகள்.' }
    ],
    te: [
      { icon: Heart, title: 'బహుభాషా ఎడ్జ్ ఏఐ', text: '7 ప్రాంతీయ భారతీయ భాషలలో సింప్టమ్‌నెట్ ఓఎన్‌ఎన్‌ఎక్స్ ద్వారా స్థానికంగా వ్యాధి నిర్ధారణ చేస్తుంది.' },
      { icon: Activity, title: 'హై-త్రూపుట్ టెలిమెట్రీ', text: 'అత్యవసర ఎస్ఓఎస్ అభ్యర్థనలు నేరుగా అమెజాన్ డైనమోడిబి స్ట్రీమ్స్‌కు పంపబడతాయి.' },
      { icon: Globe, title: 'ఆఫ్‌లైన్ సమకాలీకరణ', text: 'ఇంటర్నెట్ లేనప్పుడు స్థానికంగా సేవ్ చేసి, సిగ్నల్ రాగానే ఆర్డిఎస్ ఆరోరాతో సింక్ చేస్తుంది.' },
      { icon: Shield, title: 'దిషా & హిప్పా ధృవీకరించబడింది', text: 'సురక్షితమైన యాక్సెస్ కంట్రోల్ మరియు డేటాబేస్ సెక్యూరిటీ ఆడిట్ లాగ్‌లు.' }
    ],
    bn: [
      { icon: Heart, title: 'বহুভাষী এজ এআই', text: '৭টি আঞ্চলিক ভারতীয় ভাষায় সিম্পটমনেট ওএনএনএক্স এর মাধ্যমে স্থানীয়ভাবে রোগ নির্ণয়।' },
      { icon: Activity, title: 'উচ্চ-থ্রুপুট টেলিমেট্রি', text: 'জরুরী এসওএস সরাসরি অ্যামাজন ডায়নামোডিবি স্ট্রিমসে পাঠানো হয়।' },
      { icon: Globe, title: 'অফলাইন সিঙ্ক', text: 'ইন্টারনেট না থাকলে স্থানীয়ভাবে সেভ করে পরে আরডিএস অরোরার সাথে সিঙ্ক করে।' },
      { icon: Shield, title: 'দিশা ও হিপ্পা সার্টিফাইড', desc: 'ভূমিকা-ভিত্তিক অ্যাক্সেস এবং ডেটাবেস সুরক্ষা অডিট লগ।' }
    ]
  };

  const currentWhyJoin = localizedWhyJoin[lang] || localizedWhyJoin.en;

  const getRoleLabel = (roleId) => {
    if (roleId === 'villager') return t.roles?.villager || 'Villager';
    if (roleId === 'ngo') return t.roles?.ngo || 'ASHA Worker';
    if (roleId === 'admin') return t.roles?.admin || 'Admin';
    return roleId;
  };

  const roles = [
    { id: 'villager', label: getRoleLabel('villager'),   sub: t.loginPage?.villager_sub || 'Patient / Citizen',       icon: User,   desc: 'Check symptoms, request ambulance, track health.'   },
    { id: 'ngo',      label: getRoleLabel('ngo'),        sub: t.loginPage?.ngo_sub || 'Healthcare Provider',      icon: Shield, desc: 'Manage village health, pregnancies, child nutrition.' },
    { id: 'admin',    label: getRoleLabel('admin'),      sub: t.loginPage?.admin_sub || 'District Management',      icon: MapPin, desc: 'Analytics, outbreak alerts, dispatch oversight.' },
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
        className="hidden lg:flex w-[40%] relative overflow-y-auto bg-[#0A2E24] flex-col justify-start p-8 xl:p-10 space-y-5"
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-emerald-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] left-[-10%] w-64 h-64 bg-teal-400 rounded-full blur-[70px]" />
        </div>

        <div className="relative z-10 space-y-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-emerald-100/60 hover:text-white transition-all text-xs font-bold mb-2 group">
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> {t.diseaseChecker?.go_back || 'Back to Home'}
          </Link>

          {/* Logo */}
          <motion.div
            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-2.5 mb-3"
          >
            <div className="p-2 bg-white/10 backdrop-blur-xl rounded-lg border border-white/10">
              <HeartPulse className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight">{t.swasthai || 'SwasthAI'}</h1>
              <p className="text-emerald-400/70 text-[7px] font-bold uppercase tracking-widest">{t.footer?.empowering || 'Rural Health Network'}</p>
            </div>
          </motion.div>

          <motion.h2
            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-xl xl:text-2xl font-black text-white leading-tight mb-2 tracking-tight"
          >
            {lang === 'hi' ? 'हमारे भरोसेमंद स्वास्थ्य नेटवर्क से जुड़ें।' : 'Join our trusted healthcare network.'}
          </motion.h2>

          <motion.p
            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-emerald-100/60 text-[11px] leading-relaxed font-medium max-w-sm mb-4"
          >
            {lang === 'hi'
              ? 'सुरक्षित रूप से अपॉइंटमेंट बुक करने, विशेषज्ञों से चैट करने और वास्तविक समय में अपने परिवार के महत्वपूर्ण रिकॉर्ड ट्रैक करने के लिए एक खाता बनाएं।'
              : 'Create an account to securely book appointments, chat with specialists, and track your family\'s vital records in real-time.'}
          </motion.p>
        </div>

        {/* Why Join Points */}
        <motion.div
          initial={{ y: 25, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="relative z-10 space-y-2.5"
        >
          {currentWhyJoin.map(tp => (
            <div key={tp.title} className="flex items-start gap-2.5 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <div className="p-1 bg-emerald-500/20 rounded-md shrink-0">
                <tp.icon className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black text-xs tracking-tight">{tp.title}</p>
                <p className="text-emerald-100/50 text-[9px] font-medium leading-relaxed mt-0.5">{tp.text || tp.desc}</p>
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
              {t.registerPage?.set_up_account ? 'Free Account' : 'Free Account - Under 60s'}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mb-1">
              {t.register || 'Create Account'}
            </h2>
            <p className="text-slate-400 font-medium text-[10px] sm:text-xs max-w-xs leading-relaxed">
              {t.registerPage?.set_up_account || 'Join thousands in rural India who use SwasthAI to stay healthy and get help fast.'}
            </p>
          </div>
 
          {/* Offline Banner */}
          <AnimatePresence>
            {isOffline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold"
              >
                <Globe className="w-4 h-4 shrink-0 text-emerald-600 animate-spin-slow" />
                <span>
                  <span className="font-black">📶 Offline Registration Mode Active</span> - Your credentials will be cached locally in your browser.
                  <span className="block text-emerald-600 font-medium mt-0.5">You can register and log in now. Your profile will sync automatically when your internet connection is restored.</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
 
          {/* Error / Success */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs font-bold"
              >
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="mb-4 p-4 bg-emerald-600 text-white rounded-xl flex items-center gap-2.5 text-xs font-black shadow-lg shadow-emerald-100"
              >
                <CheckCircle className="w-4 h-4 shrink-0" /> {t.registerPage?.account_created || 'Account created! Taking you to your dashboard...'}
              </motion.div>
            )}
          </AnimatePresence>
 
          {/* Step 1 — Role */}
          <div className="mb-6">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              {t.registerPage?.step1_role || 'Step 1 - I am registering as a...'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'role', value: r.id } })}
                  className={`p-2 sm:p-3 rounded-xl border-2 text-left transition-all ${
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
            {/* Role description */}
            <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                {roles.find(r => r.id === formData.role)?.desc}
              </p>
            </div>
          </div>
 
          {/* Step 2 — Details */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.registerPage?.step2_personal || 'Step 2 - Your Details'}</p>
 
            {/* Name + Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'name',     label: t.registerPage?.full_name || 'Full Name',  icon: User,   placeholder: 'Name...',    type: 'text', required: true  },
                { name: 'username', label: t.registerPage?.choose_username || 'Username',   icon: User,   placeholder: 'Username...',    type: 'text', required: true  },
              ].map(field => (
                <div key={field.name} className="space-y-1">
                  <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                      <field.icon className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
 
            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.registerPage?.phone_number || 'Phone Number'}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Mobile..."
                    maxLength={10}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
  
              <div className="space-y-1">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.registerPage?.email_address || 'Email'} <span className="normal-case font-medium text-slate-300">(opt)</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>
 
            {/* Village ID */}
            <div className="space-y-1">
              <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.registerPage?.village_id || 'Village / Area Code'}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="villageId"
                  value={formData.villageId}
                  onChange={handleInputChange}
                  placeholder="e.g. v101"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <p className="text-[9px] text-slate-400 font-medium ml-1">Links to village health database. Use default "v101" for demo.</p>
            </div>
 
            {/* Password */}
            <div className="space-y-1">
              <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.registerPage?.create_password || 'Create a Password'}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min. 8 characters recommended"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
 
            {/* Passcode (conditionally shown for NGO and Admin) */}
            {(formData.role === 'ngo' || formData.role === 'admin') && (
              <div className="space-y-1">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {formData.role === 'ngo' ? 'ASHA Worker Passcode' : 'Admin Passcode'}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    name="passcode"
                    value={formData.passcode}
                    onChange={handleInputChange}
                    placeholder={formData.role === 'ngo' ? 'e.g. ASHA2026' : 'e.g. ADMIN2026'}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            )}
 
            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || success}
              whileHover={{ y: -1, boxShadow: '0 10px 20px -5px rgba(16,185,129,0.2)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 group overflow-hidden relative cursor-pointer"
            >
              <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating your account...</>
                ) : success ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Account Created!</>
                ) : (
                  <>{t.register || 'Create Account'} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </span>
            </motion.button>
          </form>
 
          {/* Login link */}
          <div className="mt-6 text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-slate-500 text-xs font-medium">
              {t.registerPage?.already_have_account || 'Already have an account?'}{' '}
              <Link to="/login" className="font-black text-emerald-600 hover:text-emerald-700 transition-colors underline underline-offset-2">
                {t.registerPage?.sign_in_here || 'Log in here'}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

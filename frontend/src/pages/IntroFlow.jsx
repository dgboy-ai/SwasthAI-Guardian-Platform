import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse, ArrowRight, BrainCircuit, Users, Truck,
  Globe, Shield, PhoneCall, Zap, MapPin, Droplets, Camera, Check,
  Activity, ShieldCheck, Database, Layout
} from 'lucide-react';

export default function IntroFlow() {
  const [step, setStep] = useState(0); // 0: Loading/Splash, 1: Language, 2: Services
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      navigate('/register');
    }
  };

  const languages = [
    { code: 'hi', label: 'हिन्दी', sub: 'Hindi', icon: <Globe className="w-5 h-5" /> },
    { code: 'en', label: 'English', sub: 'English', icon: <Globe className="w-5 h-5" /> },
    { code: 'bn', label: 'বাংলা', sub: 'Bengali', icon: <Globe className="w-5 h-5" /> },
    { code: 'mr', label: 'मराठी', sub: 'Marathi', icon: <MapPin className="w-5 h-5" /> },
    { code: 'ta', label: 'தமிழ்', sub: 'Tamil', icon: <MapPin className="w-5 h-5" /> },
    { code: 'te', label: 'తెలుగు', sub: 'Telugu', icon: <MapPin className="w-5 h-5" /> },
  ];

  useEffect(() => {
    let timer;
    if (step === 0) timer = setTimeout(() => setStep(1), 3500);
    return () => clearTimeout(timer);
  }, [step]);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { staggerChildren: 0.15, duration: 0.8, ease: "easeOut" }
    },
    exit: { opacity: 0, scale: 1.05, transition: { duration: 0.5 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="flex bg-[#FAFBFD] min-h-screen items-center justify-center font-inter p-6 sm:p-12 overflow-hidden selection:bg-emerald-100 selection:text-emerald-900 relative">

      {/* Dynamic Glowing Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-emerald-400/20 to-teal-300/15 rounded-full blur-[100px] opacity-75"
        />
        <motion.div
          animate={{
            x: [0, -30, 40, 0],
            y: [0, 40, -50, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-blue-400/20 to-indigo-500/15 rounded-full blur-[120px] opacity-70"
        />
        <motion.div
          animate={{
            x: [0, 30, -30, 0],
            y: [0, 30, -30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[10%] w-[500px] h-[500px] bg-gradient-to-br from-violet-400/15 to-purple-500/15 rounded-full blur-[110px] opacity-60"
        />
        <motion.div
          animate={{
            x: [0, -45, 25, 0],
            y: [0, -30, 45, 0],
            scale: [1, 0.95, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[5%] w-[550px] h-[550px] bg-gradient-to-tl from-cyan-400/20 to-emerald-300/15 rounded-full blur-[90px] opacity-65"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-[0.04]" />
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 0: Splash / Protocol Initialization */}
          {step === 0 && (
            <motion.div
              key="splash"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center max-w-lg z-10 px-4"
            >
              <motion.div
                className="relative mb-6 sm:mb-10 flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="relative mb-8 sm:mb-12">
                  {/* Soft Inner Glow */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-emerald-400/40 rounded-full blur-2xl pointer-events-none"
                  />
 
                  {/* Outer Pulse */}
                  <motion.div
                    animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 border-2 border-emerald-400/60 rounded-full pointer-events-none"
                  />
 
                  {/* Central Logo Container */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.02, 1.01, 1.04, 1.01, 1],
                      boxShadow: [
                        "0 15px 30px -5px rgba(16, 185, 129, 0.2)",
                        "0 20px 40px -5px rgba(16, 185, 129, 0.3)",
                        "0 15px 32px -5px rgba(16, 185, 129, 0.25)",
                        "0 22px 45px -5px rgba(16, 185, 129, 0.35)",
                        "0 15px 32px -5px rgba(16, 185, 129, 0.25)",
                        "0 15px 30px -5px rgba(16, 185, 129, 0.2)"
                      ]
                    }}
                    transition={{ 
                      duration: 2.8, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      times: [0, 0.15, 0.28, 0.45, 0.65, 1]
                    }}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-white/95 backdrop-blur-xl rounded-[1.8rem] flex items-center justify-center relative z-10 border border-emerald-300 shadow-xl overflow-hidden group"
                  >
                    {/* Animated shine line */}
                    <motion.div
                      animate={{ x: [-100, 200] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                      className="absolute top-0 left-0 w-8 h-full bg-emerald-500/5 skew-x-[25deg] blur-sm"
                    />
                    <HeartPulse 
                      className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" 
                      style={{ 
                        filter: "drop-shadow(0 4px 10px rgba(16, 185, 129, 0.4))" 
                      }}
                    />
                  </motion.div>
 
                  {/* Concentric Radiating Healing Waves (Aura) */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: [0.8, 2.5], opacity: [0.4, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 1,
                        ease: "easeOut",
                       }}
                      className="absolute inset-0 border-2 border-emerald-400/25 rounded-full pointer-events-none"
                    />
                  ))}
 
                  {/* Floating Healing Spores / Droplets */}
                  {[
                    { delay: 0, x: [10, -20, 20, 10], y: [-50, -80, -60, -50], color: "bg-emerald-400" },
                    { delay: 0.5, x: [-40, -10, -30, -40], y: [40, 70, 50, 40], color: "bg-teal-400" },
                    { delay: 1, x: [50, 80, 60, 50], y: [20, -10, 10, 20], color: "bg-emerald-300" },
                    { delay: 1.5, x: [-60, -40, -70, -60], y: [-30, -10, -20, -30], color: "bg-cyan-300" }
                  ].map((particle, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        x: particle.x,
                        y: particle.y,
                        opacity: [0, 0.8, 0.4, 0.8, 0],
                        scale: [0.8, 1.2, 1, 1.2, 0.8]
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: "easeInOut"
                      }}
                      className={`absolute w-2.5 h-2.5 rounded-full ${particle.color} blur-[1px] shadow-[0_0_8px_rgba(52,211,153,0.8)] pointer-events-none`}
                    />
                  ))}
                </div>
 
                <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6 flex flex-col items-center">
                  <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-emerald-800 to-indigo-950 tracking-tighter leading-none pb-1">
                    {t.intro?.welcome_title || 'Welcome to SwasthAI'}
                  </h1>
                  
                  <div className="flex items-center justify-center gap-2 text-emerald-700 font-extrabold bg-emerald-50/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-emerald-250/50 shadow-md mx-auto max-w-max relative overflow-hidden group">
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Activity className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
                    <span className="text-xs uppercase tracking-widest font-black bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                      {t.intro?.welcome_sub || 'Smart Healthcare For Every Village'}
                    </span>
                  </div>
 
                  <div className="flex items-center justify-center gap-4 sm:gap-8 pt-2">
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/60 shadow-sm">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                      <span className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-widest">Offline-First</span>
                    </div>
                    <div className="w-6 sm:w-10 h-[1.5px] bg-slate-250" />
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/60 shadow-sm">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shrink-0" />
                      <span className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-widest">Secure AI</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 1: Language Localization Selection */}
          {step === 1 && (

    <motion.div
      key="language"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center w-full max-w-4xl z-10"
    >
      <div className="mb-6 sm:mb-12 text-center space-y-3 sm:space-y-4">
        <motion.div 
          variants={itemVariants} 
          className="w-20 h-20 sm:w-24 sm:h-24 bg-white/90 backdrop-blur-xl rounded-[1.8rem] flex items-center justify-center mb-6 mx-auto border border-emerald-200 shadow-xl overflow-hidden group relative"
        >
          {/* Shine line */}
          <motion.div
            animate={{ x: [-100, 200] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            className="absolute top-0 left-0 w-8 h-full bg-emerald-500/5 skew-x-[25deg] blur-sm"
          />
          <Globe 
            className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500"
            style={{ 
              filter: "drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4))" 
            }}
          />
        </motion.div>
        
        <motion.h2 variants={itemVariants} className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 tracking-tighter leading-none pb-1">
          {t.intro?.select_title || 'Choose Your Language'}
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl mb-8 sm:mb-12 px-2 sm:px-4">
        {languages.map((l) => (
          <motion.div
            key={l.code}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLang(l.code)}
            className={`relative cursor-pointer p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 flex items-center text-left gap-4 ${
              lang === l.code 
                ? 'bg-white border-emerald-500 shadow-[0_12px_24px_-8px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/10' 
                : 'bg-white/85 backdrop-blur-md border-slate-100 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center transition-all ${
              lang === l.code ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rotate-6 shadow-md shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'
            }`}>
              <span className="w-5 h-5 sm:w-6 sm:h-6">{l.icon}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className={`text-base sm:text-xl font-black tracking-tighter truncate ${lang === l.code ? 'text-slate-900' : 'text-slate-550'}`}>
                {l.label}
              </h3>
              <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate ${lang === l.code ? 'text-emerald-600' : 'text-slate-400'}`}>
                {l.sub}
              </p>
            </div>
            {lang === l.code && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md border border-white"
              >
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleNext}
        className="group w-full sm:w-auto px-14 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-500/35 mx-4 sm:mx-0 cursor-pointer"
      >
        {t.intro?.establish_sync || 'Continue'}
        <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition-transform duration-300" />
      </motion.button>
    </motion.div>
  )}

          {/* STEP 2: Strategic Services Brief */}
          {step === 2 && (

    <motion.div
      key="services"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center w-full max-w-5xl z-10"
    >
      <div className="mb-4 sm:mb-6 flex flex-col items-center text-center space-y-1">
        <motion.span variants={itemVariants} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] sm:text-[9px] font-black tracking-widest uppercase rounded-full">
          {t.intro?.assets_title || 'Key Services'}
        </motion.span>
        <motion.h2 variants={itemVariants} className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter max-w-3xl leading-tight">
          {t.intro?.strategic_title || 'Complete Health Support'}
        </motion.h2>
        <motion.p variants={itemVariants} className="text-slate-500 font-bold text-[9px] sm:text-xs max-w-md px-4">
          {t.intro?.strategic_desc || 'Doctor advice and emergency help for every village.'}
        </motion.p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full mb-6 sm:mb-8 px-2">
        {[
          {
            title: 'Guided Healthcare Mode',
            desc: 'Voice-guided, tactile interface designed specifically for low-literacy users in remote regions.',
            icon: <Activity className="w-4 h-4 sm:w-5 h-5" />,
            tag: 'Accessibility',
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white'
          },
          {
            title: 'AI Symptom Checker',
            desc: 'Bilingual screening tool available in 6 regional languages with clinical fallbacks.',
            icon: <BrainCircuit className="w-4 h-4 sm:w-5 h-5" />,
            tag: 'Diagnostics',
            color: 'bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white'
          },
          {
            title: 'Skin AI Diagnostician',
            desc: 'Scan and detect skin conditions instantly by uploading photos for automated analysis.',
            icon: <Camera className="w-4 h-4 sm:w-5 h-5" />,
            tag: 'Dermatology AI',
            color: 'bg-rose-50 text-rose-700 border-rose-200 group-hover:bg-rose-600 group-hover:text-white'
          },
          {
            title: 'Maternal & Child Nutrition',
            desc: 'Track pregnancy vitals, gestational risk factors, and infant nutrition metrics.',
            icon: <Users className="w-4 h-4 sm:w-5 h-5" />,
            tag: 'NGO & ASHA Support',
            color: 'bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-600 group-hover:text-white'
          },
          {
            title: 'Government Schemes Locator',
            desc: 'Search state and central welfare schemes to verify eligibility requirements instantly.',
            icon: <ShieldCheck className="w-4 h-4 sm:w-5 h-5" />,
            tag: 'Social Welfare',
            color: 'bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-600 group-hover:text-white'
          },
          {
            title: 'District Outbreak Simulation',
            desc: 'Predict, track, and simulate epidemiological outbreaks using live telemetric inputs.',
            icon: <Layout className="w-4 h-4 sm:w-5 h-5" />,
            tag: 'Observability',
            color: 'bg-teal-50 text-teal-700 border-teal-200 group-hover:bg-teal-600 group-hover:text-white'
          },
        ].map((srv, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -2, boxShadow: "0 10px 20px -5px rgba(16,185,129,0.04)" }}
            className="group bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-[1.5rem] border border-slate-100 hover:border-emerald-250 transition-all duration-350 flex flex-col gap-3 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 p-2 opacity-[0.02] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
              {srv.icon}
            </div>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500 ${srv.color} group-hover:rotate-6`}>
              {srv.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`px-1.5 py-0.5 border text-[6px] sm:text-[8px] font-black uppercase tracking-[0.1em] rounded-md transition-all ${srv.color}`}>
                  {srv.tag}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-800 group-hover:text-emerald-700 transition-colors duration-300 mb-0.5 tracking-tight uppercase leading-snug">{srv.title}</h4>
              <p className="text-slate-500 font-bold text-[10px] sm:text-xs leading-relaxed">{srv.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Subtle Details */}
      <motion.p
        variants={itemVariants}
        className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 sm:mb-8 text-center px-4"
      >
        And many more features including Multi-User Profiles, Offline Synchronization, and Emergency Dispatch routing.
      </motion.p>

      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleNext}
        className="group w-full sm:w-auto px-14 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-4 mx-4 sm:mx-0 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-500/35 mb-12 sm:mb-0 cursor-pointer"
      >
        {t.intro?.protocol_awareness || 'Get Started'}
        <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition-transform duration-300" />
      </motion.button>
    </motion.div>
  )}
        </AnimatePresence>

        {/* Strategic Progress Indicator */}
        <div className="fixed bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-4 z-50">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-700 ${step === i ? 'w-8 sm:w-12 bg-slate-900' : 'w-3 sm:w-4 bg-slate-200'}`}
            />
          ))}
        </div>
      </div>
    );
}

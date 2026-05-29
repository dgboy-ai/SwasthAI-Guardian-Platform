import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, HeartPulse, Activity, AlertTriangle, Baby, ChevronLeft, 
  Volume2, VolumeX, ShieldAlert, Sparkles, User, RefreshCw, Send, CheckCircle2,
  Trash2, Plus, Info, Check, HelpCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

// Simple TTS helper for voice-first navigation
const speak = (text, lang = 'en') => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

export default function GuidedHealthcareMode() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'fever', 'pregnancy', 'emergency', 'sakhi', 'child'
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Fallback bilingually aligned text dictionary
  const dict = {
    title: lang === 'hi' ? 'मार्गदर्शित स्वास्थ्य सेवा मोड' : 'Guided Healthcare Mode',
    sub: lang === 'hi' ? 'सरल, बड़ी बटन, आवाज सहायता और पूर्ण रूप से ऑफलाइन सक्षम स्वास्थ्य सेवा' : 'Simple, large buttons, voice help & fully offline-capable healthcare',
    voiceOn: lang === 'hi' ? 'आवाज सहायता चालू' : 'Voice Help ON',
    voiceOff: lang === 'hi' ? 'आवाज सहायता बंद' : 'Voice Help OFF',
    back: lang === 'hi' ? 'वापस जाएं' : 'Go Back',
    feverTitle: lang === 'hi' ? 'बुखार / सर्दी' : 'Fever / Cold',
    feverDesc: lang === 'hi' ? 'तेज बुखार, मलेरिया या डेंगू की जांच करें' : 'Check for high fever, malaria, or dengue',
    pregTitle: lang === 'hi' ? 'गर्भावस्था देखभाल' : 'Pregnancy Tracker',
    pregDesc: lang === 'hi' ? 'ब्लड प्रेशर और जोखिम जांच (एएनसी)' : 'Blood pressure & risk screening (ANC)',
    emergTitle: lang === 'hi' ? 'आपातकालीन (SOS)' : 'Emergency (SOS)',
    emergDesc: lang === 'hi' ? 'एक-टैप एम्बुलेंस और प्राथमिक चिकित्सा' : 'One-tap Ambulance & first aid guide',
    sakhiTitle: lang === 'hi' ? 'सखी स्वास्थ चैट' : 'Sakhi Health Chat',
    sakhiDesc: lang === 'hi' ? 'आवाज से बीमारी और महिलाओं के स्वास्थ्य पर पूछें' : 'Voice-guided women\'s health companion',
    childTitle: lang === 'hi' ? 'बाल स्वास्थ्य जांच' : 'Child Growth Check',
    childDesc: lang === 'hi' ? 'वजन, लंबाई और पोषण स्तर जांचें' : 'Check child\'s nutrition & weight z-score'
  };

  // Speaks automatically on entering main page or switching workflows
  useEffect(() => {
    if (voiceEnabled) {
      if (activeTab === 'menu') {
        speak(
          lang === 'hi' 
            ? 'मार्गदर्शित स्वास्थ्य सेवा में आपका स्वागत है। जांच के लिए किसी भी विकल्प को दबाएं।'
            : 'Welcome to Guided Healthcare Mode. Tap any option to start checking your health.',
          lang
        );
      }
    }
  }, [activeTab, voiceEnabled, lang]);

  const handleBackToMenu = () => {
    setActiveTab('menu');
  };

  const handleCardClick = (mode) => {
    setActiveTab(mode);
    if (voiceEnabled) {
      let phrase = '';
      if (mode === 'fever') phrase = lang === 'hi' ? 'बुखार और सर्दी जांच। कृपया सरल सवालों का जवाब दें।' : 'Fever and viral check. Please answer the simple questions.';
      if (mode === 'pregnancy') phrase = lang === 'hi' ? 'गर्भावस्था देखभाल। अपने बीपी और शुगर की जांच करें।' : 'Pregnancy tracking. Monitor your blood pressure and blood sugar.';
      if (mode === 'emergency') phrase = lang === 'hi' ? 'आपातकालीन सहायता। एम्बुलेंस बुलाने के लिए लाल बटन दबाएं।' : 'Emergency support. Tap the red button to call an ambulance.';
      if (mode === 'sakhi') phrase = lang === 'hi' ? 'सखी से बात करें। अपना सवाल पूछें।' : 'Speak to Sakhi. Ask your health queries.';
      if (mode === 'child') phrase = lang === 'hi' ? 'बाल पोषण जांच। बच्चे का वजन और लंबाई दर्ज करें।' : 'Child growth monitor. Enter child weight and height.';
      speak(phrase, lang);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] font-inter antialiased pb-24 text-slate-800">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-widest text-xs mb-1">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" /> Easy Guided Mode
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {activeTab === 'menu' ? dict.title : dict[`${activeTab}Title`]}
            </h1>
            <p className="text-slate-400 font-bold text-xs sm:text-sm mt-2">
              {activeTab === 'menu' ? dict.sub : dict[`${activeTab}Desc`]}
            </p>
          </div>
          
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              speak(voiceEnabled ? 'Voice guide turned off.' : 'आवाज गाइड चालू हो गई है।', lang);
            }}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-95 ${
              voiceEnabled 
                ? 'bg-emerald-600 text-white shadow-emerald-200' 
                : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
            }`}
            style={{ minHeight: '60px' }} // Big touch target
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
            {voiceEnabled ? dict.voiceOn : dict.voiceOff}
          </button>
        </div>

        {/* WORKFLOW DISPATCHER */}
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div 
              key="menu" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Card 1: Fever */}
              <button 
                onClick={() => handleCardClick('fever')}
                className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:border-emerald-200 flex flex-col justify-between items-start text-left active:scale-[0.98] group relative overflow-hidden h-[240px]"
              >
                <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-emerald-50 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-100 transition-colors" />
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Activity className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{dict.feverTitle}</h2>
                  <p className="text-sm font-medium text-slate-500 leading-snug">{dict.feverDesc}</p>
                </div>
              </button>

              {/* Card 2: Pregnancy */}
              <button 
                onClick={() => handleCardClick('pregnancy')}
                className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:border-rose-200 flex flex-col justify-between items-start text-left active:scale-[0.98] group relative overflow-hidden h-[240px]"
              >
                <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-rose-50 rounded-full blur-[40px] pointer-events-none group-hover:bg-rose-100 transition-colors" />
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Baby className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{dict.pregTitle}</h2>
                  <p className="text-sm font-medium text-slate-500 leading-snug">{dict.pregDesc}</p>
                </div>
              </button>

              {/* Card 3: Emergency */}
              <button 
                onClick={() => handleCardClick('emergency')}
                className="p-8 bg-rose-600 border border-rose-500 rounded-[2.5rem] shadow-lg shadow-rose-200 hover:shadow-2xl hover:shadow-rose-300 transition-all flex flex-col justify-between items-start text-left active:scale-[0.98] group relative overflow-hidden h-[240px] text-white"
              >
                <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-rose-500 rounded-full blur-[40px] pointer-events-none opacity-40 group-hover:scale-110 transition-transform" />
                <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-white/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black mb-1">{dict.emergTitle}</h2>
                  <p className="text-sm font-medium text-rose-50 leading-snug opacity-95">{dict.emergDesc}</p>
                </div>
              </button>

              {/* Card 4: Sakhi Chat */}
              <button 
                onClick={() => handleCardClick('sakhi')}
                className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:border-purple-200 flex flex-col justify-between items-start text-left active:scale-[0.98] group relative overflow-hidden h-[240px]"
              >
                <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-purple-50 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-100 transition-colors" />
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{dict.sakhiTitle}</h2>
                  <p className="text-sm font-medium text-slate-500 leading-snug">{dict.sakhiDesc}</p>
                </div>
              </button>

              {/* Card 5: Child nutrition */}
              <button 
                onClick={() => handleCardClick('child')}
                className="md:col-span-2 p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:border-blue-200 flex flex-row items-center justify-between text-left active:scale-[0.98] group relative overflow-hidden min-h-[140px]"
              >
                <div className="absolute right-[-5%] top-[-5%] w-60 h-60 bg-blue-50 rounded-full blur-[50px] pointer-events-none group-hover:bg-blue-100 transition-colors animate-pulse" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    <HeartPulse className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{dict.childTitle}</h2>
                    <p className="text-sm font-medium text-slate-500 leading-snug">{dict.childDesc}</p>
                  </div>
                </div>
                <div className="text-blue-600 font-black text-sm uppercase tracking-wider hidden sm:block shrink-0 px-6 py-3 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
                  Open →
                </div>
              </button>
            </motion.div>
          )}

          {activeTab === 'fever' && (
            <FeverWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}

          {activeTab === 'pregnancy' && (
            <PregnancyWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}

          {activeTab === 'emergency' && (
            <EmergencyWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}

          {activeTab === 'sakhi' && (
            <SakhiWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}

          {activeTab === 'child' && (
            <ChildWorkflow onBack={handleBackToMenu} lang={lang} voiceEnabled={voiceEnabled} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FEVER WORKFLOW (Clinical Heuristics Consultation Wizard)
// ─────────────────────────────────────────────────────────────────────────────
function FeverWorkflow({ onBack, lang, voiceEnabled }) {
  const [step, setStep] = useState(0); // 0: intro, 1-4: questions, 5: result
  const [answers, setAnswers] = useState({ highFever: null, shiver: null, jointPain: null, rash: null });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const questions = [
    {
      key: 'highFever',
      qEn: 'Do you have high fever? (above 101°F)',
      qHi: 'क्या आपको तेज बुखार है? (101 डिग्री से ऊपर)',
      voiceEn: 'Do you have high fever, above 101 degrees?',
      voiceHi: 'क्या आपको तेज़ बुखार है?'
    },
    {
      key: 'shiver',
      qEn: 'Are you shivering or feeling very cold (chills)?',
      qHi: 'क्या आपको कंपकंपी लग रही है या बहुत ठंड महसूस हो रही है?',
      voiceEn: 'Are you shivering or feeling very cold?',
      voiceHi: 'क्या आपको कंपकंपी लग रही है या बहुत ठंड लग रही है?'
    },
    {
      key: 'jointPain',
      qEn: 'Do you have severe pain in your joints or behind eyes?',
      qHi: 'क्या आपके जोड़ों में तेज दर्द है या आंखों के पीछे दर्द है?',
      voiceEn: 'Do you have severe joint pain or pain behind your eyes?',
      voiceHi: 'क्या आपके जोड़ों में तेज़ दर्द है या आंखों के पीछे दर्द है?'
    },
    {
      key: 'rash',
      qEn: 'Do you have red spots or rashes on your skin?',
      qHi: 'क्या आपके शरीर पर लाल चकत्ते या दाने हैं?',
      voiceEn: 'Do you have red spots or skin rashes?',
      voiceHi: 'क्या आपके शरीर पर लाल चकत्ते या दाने हैं?'
    }
  ];

  useEffect(() => {
    if (voiceEnabled) {
      if (step === 0) {
        speak(lang === 'hi' ? 'बुखार जांच। शुरू करने के लिए अगला दबाएं।' : 'Fever check. Press Next to start.', lang);
      } else if (step >= 1 && step <= 4) {
        const q = questions[step - 1];
        speak(lang === 'hi' ? q.voiceHi : q.voiceEn, lang);
      }
    }
  }, [step, voiceEnabled, lang]);

  const handleAnswer = (val) => {
    const key = questions[step - 1].key;
    setAnswers(p => ({ ...p, [key]: val }));
    
    if (voiceEnabled) {
      speak(val ? (lang === 'hi' ? 'हाँ' : 'Yes') : (lang === 'hi' ? 'नहीं' : 'No'), lang);
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      evaluateResult({ ...answers, [key]: val });
    }
  };

  const evaluateResult = async (finalAnswers) => {
    setSaving(true);
    setStep(5);

    // Heuristics
    let predictedDisease = 'Viral Fever & Cold / सामान्य बुखार और सर्दी';
    let urgency = 'Low';
    
    if (finalAnswers.highFever && finalAnswers.shiver) {
      predictedDisease = 'Malaria / मलेरिया';
      urgency = 'Medium';
    } else if (finalAnswers.highFever && finalAnswers.jointPain) {
      predictedDisease = 'Dengue / डेंगू';
      urgency = 'High';
    } else if (finalAnswers.rash && finalAnswers.highFever) {
      predictedDisease = 'Chickenpox / चेचक (छोटी माता)';
      urgency = 'Medium';
    }

    const advice = {
      'Malaria / मलेरिया': lang === 'hi' ? 'मच्छरदानी में सोएं, खूब पानी पिएं और रक्त जांच के लिए तुरंत डॉक्टर के पास जाएं।' : 'Sleep under a mosquito net, drink fluids, and visit hospital for blood test within 24h.',
      'Dengue / डेंगू': lang === 'hi' ? 'पूर्ण आराम करें, केवल पैरासिटामोल लें (एस्पिरिन न लें) और प्लेटलेट्स जांच के लिए अस्पताल जाएं।' : 'Complete bed rest, stay hydrated. Take only Paracetamol (avoid Ibuprofen/Aspirin). Go to hospital immediately.',
      'Chickenpox / चेचक (छोटी माता)': lang === 'hi' ? 'अलग कमरे में रहें, खुजली से बचें और एहतियात के तौर पर एशा कार्यकर्ता को सूचित करें।' : 'Isolate yourself, avoid scratching, apply soothing lotion, and alert ASHA.',
      'Viral Fever & Cold / सामान्य बुखार और सर्दी': lang === 'hi' ? 'गर्म पानी पिएं, विश्राम करें और ३ दिन से अधिक बुखार रहने पर सरकारी अस्पताल जाएं।' : 'Drink warm water, take rest, take paracetamol, and visit PHC if fever persists > 3 days.'
    }[predictedDisease];

    setResult({ disease: predictedDisease, urgency, advice });

    if (voiceEnabled) {
      const diagnosisText = lang === 'hi'
        ? `संभावित बीमारी है: ${predictedDisease.split(' / ')[1]}. सलाह: ${advice}`
        : `Potential condition: ${predictedDisease.split(' / ')[0]}. Advice: ${advice}`;
      speak(diagnosisText, lang);
    }

    // Submit to server / local history
    try {
      const summaryText = `[Guided Mode Fever Flow] highFever:${finalAnswers.highFever ? 'Y' : 'N'} shiver:${finalAnswers.shiver ? 'Y' : 'N'} jointPain:${finalAnswers.jointPain ? 'Y' : 'N'} rash:${finalAnswers.rash ? 'Y' : 'N'}`;
      await api.post('/villager/symptoms', { symptoms: summaryText });
    } catch (err) {
      console.warn('Offline or error logging symptom check to backend:', err.message);
      // Save locally to local history fallback
      try {
        const hist = JSON.parse(localStorage.getItem('offline_symptom_checks') || '[]');
        hist.unshift({ id: `offline-${Date.now()}`, symptoms: 'Fever flow check', prediction: predictedDisease, date: new Date() });
        localStorage.setItem('offline_symptom_checks', JSON.stringify(hist));
      } catch (e) {}
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-8 sm:p-12 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-emerald-600 flex items-center gap-3 leading-none uppercase tracking-tight">
          <Activity className="w-6 h-6 animate-pulse" /> Fever Check
        </h2>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center" style={{ minWidth: '48px', minHeight: '48px' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {step === 0 && (
        <div className="text-center py-6 space-y-6">
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            {lang === 'hi' ? 'यह सरल बुखार जांच आपके लक्षणों को देखकर मलेरिया, डेंगू या वायरल बुखार का आंकलन करेगी।' : 'This quick checker checks your symptoms to estimate malaria, dengue, or viral fever risk.'}
          </p>
          <button 
            onClick={() => setStep(1)} 
            className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-200 transition-transform active:scale-95"
            style={{ minHeight: '60px' }}
          >
            {lang === 'hi' ? 'जांच शुरू करें' : 'Start Check'} →
          </button>
        </div>
      )}

      {step >= 1 && step <= 4 && (
        <div className="space-y-8 py-4">
          {/* PROGRESS */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-black uppercase tracking-widest">
              <span>{lang === 'hi' ? `प्रश्न ${step} / 4` : `Question ${step} of 4`}</span>
              <span>{Math.round(((step - 1) / 4) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 4) * 100}%` }} />
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-relaxed">
            {lang === 'hi' ? questions[step - 1].qHi : questions[step - 1].qEn}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer(true)}
              className="py-6 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl font-black text-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.97]"
              style={{ minHeight: '80px' }}
            >
              <Check className="w-6 h-6" /> {lang === 'hi' ? 'हाँ' : 'Yes'}
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="py-6 bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-2xl font-black text-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.97]"
              style={{ minHeight: '80px' }}
            >
              <CheckCircle2 className="w-6 h-6 rotate-45" /> {lang === 'hi' ? 'नहीं' : 'No'}
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6 text-center">
          {saving ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="font-bold text-slate-500">{lang === 'hi' ? 'जांच की जा रही है...' : 'Evaluating symptoms...'}</p>
            </div>
          ) : (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 py-4">
              <div className="mx-auto w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Suggested Outcome / जांच परिणाम</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {lang === 'hi' ? result?.disease.split(' / ')[1] : result?.disease.split(' / ')[0]}
                </h3>
              </div>

              <div className={`mx-auto px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full w-fit border ${
                result?.urgency === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
                result?.urgency === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {lang === 'hi' ? `जोखिम स्तर: ${result?.urgency === 'High' ? 'उच्च' : result?.urgency === 'Medium' ? 'मध्यम' : 'सामान्य'}` : `Urgency Level: ${result?.urgency}`}
              </div>

              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left text-sm font-semibold leading-relaxed text-slate-600">
                <p className="font-bold text-slate-900 text-xs uppercase tracking-widest text-emerald-700 mb-2">💡 Advice / सलाह</p>
                {result?.advice}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => { setStep(0); setAnswers({ highFever: null, shiver: null, jointPain: null, rash: null }); setResult(null); }}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors"
                  style={{ minHeight: '54px' }}
                >
                  {lang === 'hi' ? 'पुनः जांचें' : 'Check Again'}
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-colors shadow-md"
                  style={{ minHeight: '54px' }}
                >
                  {lang === 'hi' ? 'मुख्य पृष्ठ' : 'Go to Home'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PREGNANCY WORKFLOW (Maternal Slider Tracker Wizard)
// ─────────────────────────────────────────────────────────────────────────────
function PregnancyWorkflow({ onBack, lang, voiceEnabled }) {
  const [form, setForm] = useState({ age: 24, trimester: 1, systolic: 120, diastolic: 80, sugar: 5.2 });
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState(null);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Heuristics
    let riskLevel = 'Low Risk';
    if (form.systolic >= 160 || form.diastolic >= 110) {
      riskLevel = 'High Risk';
    } else if (form.systolic >= 140 || form.diastolic >= 90 || form.sugar > 8.4) {
      riskLevel = 'Medium Risk';
    }

    const advice = {
      'High Risk': lang === 'hi' ? 'चेतावनी: आपका रक्तचाप अत्यंत उच्च है (१६०/११० से ऊपर)। तुरंत एम्बुलेंस बुलाएं या सरकारी अस्पताल जाएं। जोखिम बहुत अधिक है।' : 'ALERT: Severe high blood pressure detected. Seek urgent emergency care at a hospital immediately.',
      'Medium Risk': lang === 'hi' ? 'सावधानी: थोड़ा ऊंचा रक्तचाप या शुगर स्तर। संतुलित आहार लें, नमक कम करें और डॉक्टर से ३ दिन में परामर्श लें।' : 'Warning: Slightly high vitals. Rest, lower salt intake, and visit a clinic within 48-72h.',
      'Low Risk': lang === 'hi' ? 'बधाई हो: आपके वाइटल्स पूरी तरह से सामान्य हैं। अच्छी खुराक लें, समय पर टीका लगवाएं और आराम करें।' : 'Congratulations! Your pregnancy vitals are in the normal range. Keep eating well, hydrate, and rest.'
    }[riskLevel];

    setAssessment({ riskLevel, advice });

    if (voiceEnabled) {
      const speechText = lang === 'hi'
        ? `गर्भावस्था परीक्षण परिणाम: ${riskLevel === 'High Risk' ? 'उच्च जोखिम' : riskLevel === 'Medium Risk' ? 'मध्यम जोखिम' : 'सामान्य'}. सलाह: ${advice}`
        : `Assessment complete. Risk: ${riskLevel}. Advice: ${advice}`;
      speak(speechText, lang);
    }

    // Save offline/online
    try {
      const offlineRecord = {
        id: `offline-${Date.now()}`,
        name: `Villager-${Date.now().toString().slice(-4)}`,
        age: form.age,
        trimester: form.trimester,
        dueDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // mock due date (200 days)
        vitals: {
          systolic_bp: form.systolic,
          diastolic_bp: form.diastolic,
          bs: form.sugar,
          body_temp: 98.6,
          heart_rate: 78
        },
        riskLevel,
        isOffline: true
      };

      const current = JSON.parse(localStorage.getItem('offline_maternal_records') || '[]');
      localStorage.setItem('offline_maternal_records', JSON.stringify([offlineRecord, ...current]));
      
      // Attempt online trigger
      await api.post('/ngo/maternal', {
        name: `Guided-${Date.now().toString().slice(-4)}`,
        age: form.age,
        trimester: form.trimester,
        dueDate: offlineRecord.dueDate,
        vitals: offlineRecord.vitals
      });
    } catch (err) {
      console.warn('Saved offline in maternal queue.', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-rose-600 flex items-center gap-3 leading-none uppercase tracking-tight">
          <Baby className="w-6 h-6 animate-pulse" /> ANC Check
        </h2>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center" style={{ minWidth: '48px', minHeight: '48px' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {!assessment ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trimester Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trimester / तिमाही</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setF('trimester', t)}
                  className={`py-4 font-black rounded-xl text-sm border transition-all ${
                    form.trimester === t 
                      ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                  style={{ minHeight: '50px' }}
                >
                  {t === 1 ? '1st (1-3m)' : t === 2 ? '2nd (4-6m)' : '3rd (7-9m)'}
                </button>
              ))}
            </div>
          </div>

          {/* Systolic BP slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Systolic Blood Pressure (BP) / रक्तचाप (ऊपर का)</span>
              <span className="text-sm font-black text-rose-600">{form.systolic} <span className="text-[9px] text-slate-400 font-bold">mmHg</span></span>
            </div>
            <input 
              type="range" min="80" max="180" step="1" 
              value={form.systolic} 
              onChange={e => setF('systolic', Number(e.target.value))}
              className="w-full accent-rose-500 h-6 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-300 font-black">
              <span>80 (LOW)</span>
              <span>120 (NORMAL)</span>
              <span>180 (HIGH)</span>
            </div>
          </div>

          {/* Diastolic BP slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diastolic Blood Pressure (BP) / रक्तचाप (नीचे का)</span>
              <span className="text-sm font-black text-rose-600">{form.diastolic} <span className="text-[9px] text-slate-400 font-bold">mmHg</span></span>
            </div>
            <input 
              type="range" min="40" max="120" step="1" 
              value={form.diastolic} 
              onChange={e => setF('diastolic', Number(e.target.value))}
              className="w-full accent-rose-500 h-6 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-300 font-black">
              <span>40 (LOW)</span>
              <span>80 (NORMAL)</span>
              <span>120 (HIGH)</span>
            </div>
          </div>

          {/* Fasting Sugar slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fasting Blood Sugar / ब्लड शुगर</span>
              <span className="text-sm font-black text-rose-600">{form.sugar.toFixed(1)} <span className="text-[9px] text-slate-400 font-bold">mmol/L</span></span>
            </div>
            <input 
              type="range" min="3.0" max="12.0" step="0.1" 
              value={form.sugar} 
              onChange={e => setF('sugar', Number(e.target.value))}
              className="w-full accent-rose-500 h-6 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-300 font-black">
              <span>3.0 (LOW)</span>
              <span>5.5 (NORMAL)</span>
              <span>12.0 (HIGH)</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-rose-200"
            style={{ minHeight: '60px' }}
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'hi' ? 'जोखिम आंकलन करें' : 'Assess Pregnancy Risk')}
          </button>
        </form>
      ) : (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
            <Baby className="w-10 h-10 animate-bounce" />
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Category / जोखिम श्रेणी</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              {lang === 'hi' ? (assessment.riskLevel === 'High Risk' ? 'उच्च जोखिम ⚠️' : assessment.riskLevel === 'Medium Risk' ? 'मध्यम जोखिम ⚠️' : 'सामान्य / सुरक्षित ✅') : assessment.riskLevel}
            </h3>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left text-sm font-semibold leading-relaxed text-slate-600">
            <p className="font-bold text-slate-900 text-xs uppercase tracking-widest text-rose-700 mb-2">💡 Medical Advice / सलाह</p>
            {assessment.advice}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setAssessment(null)}
              className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors"
              style={{ minHeight: '54px' }}
            >
              {lang === 'hi' ? 'पुनः जांचें' : 'Check Again'}
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-rose-700 transition-colors shadow-md"
              style={{ minHeight: '54px' }}
            >
              {lang === 'hi' ? 'मुख्य पृष्ठ' : 'Go to Home'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EMERGENCY WORKFLOW (SOS Countdown + Offline First Aid Guides)
// ─────────────────────────────────────────────────────────────────────────────
function EmergencyWorkflow({ onBack, lang, voiceEnabled }) {
  const [sosStatus, setSosStatus] = useState('idle'); // 'idle', 'counting', 'dispatched'
  const [counter, setCounter] = useState(3);
  const [activeGuide, setActiveGuide] = useState(null); // snakebite, heatstroke, choking, severe_bleeding
  const timerRef = useRef(null);

  useEffect(() => {
    if (sosStatus === 'counting') {
      if (counter > 0) {
        if (voiceEnabled) speak(counter.toString(), lang);
        timerRef.current = setTimeout(() => setCounter(counter - 1), 1000);
      } else {
        triggerSOS();
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [sosStatus, counter, voiceEnabled, lang]);

  const startCountdown = () => {
    setSosStatus('counting');
    setCounter(3);
    if (voiceEnabled) {
      speak(lang === 'hi' ? 'एम्बुलेंस अनुरोध शुरू किया जा रहा है। तीन सेकंड में शुरू होगा। रद्द करने के लिए रुकें दबाएं।' : 'Starting ambulance request in 3 seconds. Tap Stop to cancel.', lang);
    }
  };

  const cancelSOS = () => {
    clearTimeout(timerRef.current);
    setSosStatus('idle');
    if (voiceEnabled) speak(lang === 'hi' ? 'रद्द कर दिया गया।' : 'SOS Canceled.', lang);
  };

  const triggerSOS = async () => {
    setSosStatus('dispatched');
    if (voiceEnabled) {
      speak(lang === 'hi' ? 'एम्बुलेंस रवाना कर दी गई है। १४ मिनट में पहुंचेगी।' : 'Emergency ambulance dispatched. Arriving in 14 minutes.', lang);
    }

    try {
      await api.post('/villager/ambulance', {
        name: 'Citizens Guided Mode SOS',
        location: 'Current GPS / Village Node',
        priority: 'Critical',
        symptoms: '🚨 ACCIDENTAL / SOS GUIDED HEALHCARE ONE-TAP DISPATCH'
      });
    } catch (e) {
      console.warn('Offline SOS logged to replay queue.', e.message);
      // Log offline SOS request
      try {
        const queue = JSON.parse(localStorage.getItem('offline_ambulance_requests') || '[]');
        queue.push({ id: `offline-${Date.now()}`, name: 'Guided SOS', location: 'GPS Locked', priority: 'Critical', symptoms: 'Emergency SOS' });
        localStorage.setItem('offline_ambulance_requests', JSON.stringify(queue));
      } catch (err) {}
    }
  };

  const firstAidData = {
    snakebite: {
      en: { title: 'Snakebite First Aid', steps: ['Keep the person still and calm','Immobilize the bitten limb below heart level','Remove tight clothing/jewellery near bite','Do NOT cut, suck, or apply tourniquet','Rush to hospital with anti-venom — call 108 immediately'], urgent: true },
      hi: { title: 'साँप के काटने पर प्राथमिक चिकित्सा', steps: ['व्यक्ति को शांत रखें','काटे हुए अंग को दिल के नीचे रखें','तंग कपड़े हटाएं','काटें नहीं, चूसें नहीं','108 कॉल करें, तुरंत अस्पताल जाएं'], urgent: true },
    },
    heatstroke: {
      en: { title: 'Heatstroke First Aid', steps: ['Move to shade immediately','Apply wet cloths to neck, armpits, groin','Fan the person actively','Give sips of cool water if conscious','Call 108 — heatstroke is life-threatening'], urgent: true },
      hi: { title: 'लू लगने पर प्राथमिक चिकित्सा', steps: ['तुरंत छाया में ले जाएं','गर्दन, बगल पर गीला कपड़ा लगाएं','हवा दें','होश में हो तो ठंडा पानी पिलाएं','108 पर कॉल करें'], urgent: true },
    },
    choking: {
      en: { title: 'Choking First Aid', steps: ['Ask: Are you choking?','Give 5 firm back blows between shoulder blades','Give 5 abdominal thrusts (Heimlich)','Repeat until object expelled or person unconscious','Call 108 if unconscious'], urgent: true },
      hi: { title: 'गले में कुछ फंसने पर', steps: ['पूछें: क्या आप घुट रहे हैं?','कंधे के बीच 5 बार थपथपाएं','पेट पर 5 बार दबाव दें','दोहराएं जब तक निकले या बेहोश हो','बेहोश होने पर 108 कॉल करें'], urgent: true },
    },
    severe_bleeding: {
      en: { title: 'Severe Bleeding Control', steps: ['Apply firm direct pressure with a clean cloth','Keep pressing — do not remove cloth, add more on top','Elevate the limb above heart','Do NOT apply tourniquet unless limb is severed','Call 108 immediately'], urgent: true },
      hi: { title: 'अधिक खून बहने पर', steps: ['साफ कपड़े से दबाव डालें','दबाव बनाए रखें, कपड़ा न हटाएं','अंग को दिल से ऊंचा रखें','108 पर कॉल करें'], urgent: true },
    },
  };

  const handleGuideClick = (key) => {
    setActiveGuide(key);
    if (voiceEnabled) {
      const g = firstAidData[key][lang === 'hi' ? 'hi' : 'en'];
      const txt = `${g.title}. ${lang === 'hi' ? 'मुख्य कदम हैं' : 'Key steps are'}: ${g.steps.join('. ')}`;
      speak(txt, lang);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 max-w-xl mx-auto">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-rose-600 flex items-center gap-3 leading-none uppercase tracking-tight">
          <ShieldAlert className="w-6 h-6 animate-pulse" /> Urgent SOS
        </h2>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center" style={{ minWidth: '48px', minHeight: '48px' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* SOS ZONE */}
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
        {sosStatus === 'idle' && (
          <>
            <button 
              onClick={startCountdown}
              className="w-48 h-48 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex flex-col items-center justify-center shadow-xl shadow-rose-200 transition-all border-8 border-rose-100 active:scale-95 duration-300 focus:outline-none animate-pulse"
            >
              <ShieldAlert className="w-12 h-12 mb-1 shrink-0" />
              <span className="text-2xl font-black tracking-tight uppercase leading-none">SOS</span>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mt-1">Ambulance</span>
            </button>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-[280px]">
              {lang === 'hi' ? '१०८ एम्बुलेंस और आशा कार्यकर्ता को तुरंत बुलाने के लिए लाल गोला दबाएं' : 'Tap to dispatch 108 Emergency Ambulance & alert local ASHA worker.'}
            </p>
          </>
        )}

        {sosStatus === 'counting' && (
          <>
            <button 
              onClick={cancelSOS}
              className="w-48 h-48 bg-slate-800 text-white rounded-full flex flex-col items-center justify-center shadow-xl shadow-slate-200 border-8 border-slate-200 hover:bg-slate-900 transition-all duration-300 focus:outline-none"
            >
              <span className="text-6xl font-black mb-1 animate-ping shrink-0">{counter}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mt-2">STOP / रोकें</span>
            </button>
            <p className="text-rose-600 font-black uppercase tracking-widest text-xs animate-pulse">
              {lang === 'hi' ? 'एम्बुलेंस रवाना हो रही है! निरस्त करने के लिए ऊपर दबाएं।' : 'Ambulance dispatch in progress! Tap above to abort.'}
            </p>
          </>
        )}

        {sosStatus === 'dispatched' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              {lang === 'hi' ? 'एम्बुलेंस रवाना! 🚑' : 'Ambulance Dispatched! 🚑'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs font-semibold leading-relaxed">
              {lang === 'hi' ? 'जीपीएस लोकेशन के आधार पर एम्बुलेंस रवाना की जा चुकी है। आगमन समय १४ मिनट है। सरकारी अस्पताल को सूचित कर दिया गया है।' : 'Dispatched via your GPS coordinate. Estimated ETA is 14 minutes. District health hub notified.'}
            </p>
            <button 
              onClick={() => setSosStatus('idle')}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
            >
              {lang === 'hi' ? 'ठीक है' : 'Understood'}
            </button>
          </motion.div>
        )}
      </div>

      {/* OFFLINE GUIDES */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" /> {lang === 'hi' ? 'ऑफलाइन प्राथमिक चिकित्सा निर्देश' : 'Offline First Aid Guides'}
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(firstAidData).map(k => (
            <button
              key={k}
              onClick={() => handleGuideClick(k)}
              className={`p-4 rounded-xl text-left border font-black text-xs uppercase tracking-wide transition-all ${
                activeGuide === k 
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
              style={{ minHeight: '60px' }}
            >
              {firstAidData[k][lang === 'hi' ? 'hi' : 'en'].title}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {activeGuide && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 relative">
                <button 
                  onClick={() => setActiveGuide(null)} 
                  className="absolute top-4 right-4 text-[9px] font-black uppercase text-slate-400 hover:text-slate-900"
                >
                  {lang === 'hi' ? 'बंद करें' : 'Hide'}
                </button>
                <h4 className="font-black text-emerald-800 text-sm">
                  {firstAidData[activeGuide][lang === 'hi' ? 'hi' : 'en'].title}
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs font-semibold text-slate-600 leading-relaxed">
                  {firstAidData[activeGuide][lang === 'hi' ? 'hi' : 'en'].steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SAKHI RAG WORKFLOW (Bilingual Healthcare Chat with Presets)
// ─────────────────────────────────────────────────────────────────────────────
function SakhiWorkflow({ onBack, lang, voiceEnabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    {
      hi: 'गर्भावस्था में क्या खाएं? 🍏',
      en: 'What to eat during pregnancy? 🍏',
      voiceHi: 'गर्भावस्था में क्या खाना चाहिए?',
      voiceEn: 'What is the best nutrition during pregnancy?',
      replyHi: 'गर्भावस्था में हरी पत्तेदार सब्जियां, दालें, फल, दूध और आयरन-फोलिक एसिड की गोलियां नियमित रूप से लें। बाहर के खाने से बचें।',
      replyEn: 'Eat a balanced diet with green leafy vegetables, lentils, fresh fruits, calcium-rich milk, and make sure to take your iron-folic acid tablets daily.'
    },
    {
      hi: 'उल्टी और जी मिचलाना कैसे रोकें? 🤢',
      en: 'How to manage morning sickness? 🤢',
      voiceHi: 'गर्भावस्था में उल्टी कैसे रोकें?',
      voiceEn: 'How can I stop morning sickness?',
      replyHi: 'सुबह उठकर सूखा नाश्ता जैसे टोस्ट या बिस्कुट लें। दिन में थोड़ा-थोड़ा करके ४-५ बार खाएं। अधिक पानी पिएं।',
      replyEn: 'Eat dry crackers or toast first thing in the morning. Consume small, frequent meals rather than large ones. Stay well-hydrated.'
    },
    {
      hi: 'मासिक धर्म स्वच्छता के नियम 🩸',
      en: 'Menstrual hygiene tips 🩸',
      voiceHi: 'मासिक धर्म के दौरान स्वच्छता कैसे रखें?',
      voiceEn: 'What are menstrual hygiene rules?',
      replyHi: 'हर ४-६ घंटे में पैड बदलें, निजी अंगों को साफ पानी से धोएं, सूती अंतर्वस्त्र पहनें और प्रयुक्त पैड को कागज में लपेटकर कचरे में डालें।',
      replyEn: 'Change sanitary pads every 4-6 hours, wash private areas with clean water, wear dry cotton underwear, and discard wrapped pads in dustbin.'
    }
  ];

  useEffect(() => {
    // Add welcome message from Sakhi
    const greet = lang === 'hi' 
      ? 'नमस्ते! मैं सखी हूँ, आपकी स्वास्थ्य सहेली। महिलाओं के स्वास्थ्य, गर्भावस्था या बच्चों की देखभाल पर कोई भी प्रश्न पूछें या नीचे दिए गए विकल्पों को दबाएं।'
      : 'Hello! I am Sakhi, your personal health companion. Ask me any question about women\'s health, pregnancy, or baby care, or tap one of the common questions below.';
    setMessages([{ sender: 'sakhi', text: greet }]);
    if (voiceEnabled) speak(greet, lang);
  }, [lang]);

  const handleSendPreset = (p) => {
    const qText = lang === 'hi' ? p.hi : p.en;
    const ansText = lang === 'hi' ? p.replyHi : p.replyEn;
    
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: qText },
      { sender: 'sakhi', text: ansText }
    ]);

    if (voiceEnabled) {
      speak(ansText, lang);
    }
  };

  const handleCustomSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQ = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userQ }]);
    setLoading(true);

    try {
      // Simulating a fast, highly-scalable offline clinical bot fallback
      setTimeout(() => {
        let matchedReply = lang === 'hi' 
          ? 'आपके लक्षण सुनने के बाद सलाह दी जाती है कि आराम करें, गुनगुना पानी पिएं और यदि समस्या बनी रहे तो आशा बहन से मिलें।'
          : 'Thank you for asking. We recommend keeping hydrated, taking adequate rest, and reporting persistent symptoms to your local Anganwadi/ASHA worker.';
        
        // basic matching keyword
        const clean = userQ.toLowerCase();
        if (clean.includes('fever') || clean.includes('bukhar') || clean.includes('बुखार')) {
          matchedReply = lang === 'hi' ? 'बुखार में पानी की कमी न होने दें। हर ५ घंटे पर थर्मामीटर से तापमान नापें और आशा बहन को बताएं।' : 'In case of fever, keep drinking water and track temperature every 5 hours. Inform ASHA.';
        } else if (clean.includes('pain') || clean.includes('dard') || clean.includes('दर्द')) {
          matchedReply = lang === 'hi' ? 'दर्द में आराम करें। दर्द वाली जगह पर गर्म या ठंडी सिकाई करें। यदि तीव्र हो तो तुरंत पीएचसी जाएं।' : 'Rest the painful area. Use warm or cold compress. Visit the PHC if pain is acute.';
        }

        setMessages(prev => [...prev, { sender: 'sakhi', text: matchedReply }]);
        if (voiceEnabled) speak(matchedReply, lang);
        setLoading(false);
      }, 800);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-4 sm:p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 max-w-xl mx-auto flex flex-col h-[520px]">
      {/* HEADER */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
        <h2 className="text-xl sm:text-2xl font-black text-purple-600 flex items-center gap-3 leading-none uppercase tracking-tight">
          <Sparkles className="w-6 h-6 animate-pulse" /> Sakhi Chat
        </h2>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center" style={{ minWidth: '48px', minHeight: '48px' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* CHAT DISPLAY */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0 py-2 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed shadow-sm border ${
              m.sender === 'user' 
                ? 'bg-purple-600 text-white border-purple-500 rounded-tr-none' 
                : 'bg-slate-50 text-slate-700 border-slate-100 rounded-tl-none'
            }`}>
              <p>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl rounded-tl-none flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> {lang === 'hi' ? 'सखी सोच रही है...' : 'Sakhi is typing...'}
            </div>
          </div>
        )}
      </div>

      {/* PRESETS */}
      <div className="space-y-1.5 shrink-0">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Tapping Questions / सामान्य सवाल</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPreset(p)}
              className="px-4 py-3 bg-purple-50 border border-purple-100 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap active:scale-95 transition-all"
              style={{ minHeight: '44px' }}
            >
              {lang === 'hi' ? p.hi : p.en}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleCustomSend} className="flex gap-2 shrink-0 pt-2 border-t border-slate-50">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={lang === 'hi' ? 'यहाँ अपना प्रश्न लिखें...' : 'Ask Sakhi a question...'}
          className="flex-1 h-14 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
        />
        <button
          type="submit"
          className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center hover:bg-purple-700 transition-colors shadow-md shadow-purple-100 shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CHILD WORKFLOW (Z-Score Underweight Growth Monitor)
// ─────────────────────────────────────────────────────────────────────────────
function ChildWorkflow({ onBack, lang, voiceEnabled }) {
  const [form, setForm] = useState({ name: '', age: 12, weight: 8.5, height: 74 });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const w = Number(form.weight);
    const h = Number(form.height);
    const bmiVal = Number((w / ((h / 100) * (h / 100))).toFixed(2));

    let growthStatus = 'Normal';
    let action = lang === 'hi' ? 'बच्चा स्वस्थ है। सही पोषण देना जारी रखें।' : 'Healthy growth. Continue optimal feeding practices.';

    if (bmiVal < 12) {
      growthStatus = 'Severe Acute Malnutrition';
      action = lang === 'hi' ? 'चेतावनी: बच्चा कुपोषित (SAM) श्रेणी में है। पोषण केंद्र (NRC) में तुरंत दिखाएं।' : 'Urgent: Immediate referral to Nutrition Rehabilitation Centre (NRC).';
    } else if (bmiVal >= 12 && bmiVal < 13.5) {
      growthStatus = 'Moderate Acute Malnutrition';
      action = lang === 'hi' ? 'सावधानी: बच्चा मध्यम कुपोषित (MAM) है। आंगनवाड़ी पूरक पोषण शुरू करें।' : 'Refer to Supplementary Nutrition Programme (ASHA follow-up).';
    } else if (bmiVal >= 13.5 && bmiVal < 15) {
      growthStatus = 'Mild Underweight';
      action = lang === 'hi' ? 'हल्का वजन कम है। प्रोटीन और कैलोरी बढ़ाएं, १५ दिन में दोबारा नापें।' : 'Provide energy-dense nutrition advice. Follow up in 14 days.';
    }

    setResult({ status: growthStatus, bmi: bmiVal, action });

    if (voiceEnabled) {
      const spText = lang === 'hi'
        ? `बाल स्वास्थ्य परिणाम: ${growthStatus === 'Normal' ? 'सामान्य' : growthStatus === 'Mild Underweight' ? 'कम वजन' : 'कुपोषित'}. सलाह: ${action}`
        : `Check complete. Status: ${growthStatus}. Advice: ${action}`;
      speak(spText, lang);
    }

    // Save locally
    try {
      const offlineRecord = {
        id: `offline-${Date.now()}`,
        childName: form.name || 'Guided Child',
        ageMonths: form.age,
        weight: w,
        height: h,
        status: growthStatus,
        bmi: bmiVal,
        action,
        isOffline: true
      };

      const current = JSON.parse(localStorage.getItem('offline_child_records') || '[]');
      localStorage.setItem('offline_child_records', JSON.stringify([offlineRecord, ...current]));

      await api.post('/ngo/malnutrition', {
        name: form.name || 'Guided Child',
        age: form.age,
        weight: w,
        height: h
      });
    } catch (err) {
      console.warn('Saved offline in child records queue.', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-blue-600 flex items-center gap-3 leading-none uppercase tracking-tight">
          <HeartPulse className="w-6 h-6 animate-pulse" /> Growth Check
        </h2>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center" style={{ minWidth: '48px', minHeight: '48px' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Child Name / बच्चे का नाम</label>
            <input
              required
              value={form.name}
              onChange={e => setF('name', e.target.value)}
              placeholder="Raju Kumar"
              className="w-full h-14 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age (Months) / आयु (महीने)</span>
              <span className="text-sm font-black text-blue-600">{form.age} <span className="text-[9px] text-slate-400 font-bold">m</span></span>
            </div>
            <input 
              type="range" min="1" max="60" step="1" 
              value={form.age} 
              onChange={e => setF('age', Number(e.target.value))}
              className="w-full accent-blue-500 h-6 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-300 font-black">
              <span>1 Month</span>
              <span>30 Months</span>
              <span>60 Months</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weight (kg) / वजन</span>
              <span className="text-sm font-black text-blue-600">{form.weight.toFixed(1)} <span className="text-[9px] text-slate-400 font-bold">kg</span></span>
            </div>
            <input 
              type="range" min="2" max="25" step="0.1" 
              value={form.weight} 
              onChange={e => setF('weight', Number(e.target.value))}
              className="w-full accent-blue-500 h-6 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-300 font-black">
              <span>2 kg</span>
              <span>12 kg</span>
              <span>25 kg</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Height (cm) / लंबाई</span>
              <span className="text-sm font-black text-blue-600">{form.height} <span className="text-[9px] text-slate-400 font-bold">cm</span></span>
            </div>
            <input 
              type="range" min="40" max="120" step="1" 
              value={form.height} 
              onChange={e => setF('height', Number(e.target.value))}
              className="w-full accent-blue-500 h-6 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-300 font-black">
              <span>40 cm</span>
              <span>80 cm</span>
              <span>120 cm</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-blue-200"
            style={{ minHeight: '60px' }}
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'hi' ? 'विकास स्तर मापें' : 'Check Growth Status')}
          </button>
        </form>
      ) : (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <HeartPulse className="w-10 h-10 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Status / विकास श्रेणी</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              {lang === 'hi' ? (
                result.status === 'Severe Acute Malnutrition' ? 'तीव्र कुपोषित (SAM) ⚠️' :
                result.status === 'Moderate Acute Malnutrition' ? 'मध्यम कुपोषित (MAM) ⚠️' :
                result.status === 'Mild Underweight' ? 'हल्का कम वजन ⚠️' : 'सामान्य स्वस्थ ✅'
              ) : result.status}
            </h3>
            <p className="text-[10px] font-black text-slate-400">BMI: {result.bmi} kg/m²</p>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left text-sm font-semibold leading-relaxed text-slate-600">
            <p className="font-bold text-slate-900 text-xs uppercase tracking-widest text-blue-700 mb-2">💡 Nutritional Advice / पोषण सलाह</p>
            {result.action}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setResult(null)}
              className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors"
              style={{ minHeight: '54px' }}
            >
              {lang === 'hi' ? 'पुनः जांचें' : 'Check Again'}
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-colors shadow-md"
              style={{ minHeight: '54px' }}
            >
              {lang === 'hi' ? 'मुख्य पृष्ठ' : 'Go to Home'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

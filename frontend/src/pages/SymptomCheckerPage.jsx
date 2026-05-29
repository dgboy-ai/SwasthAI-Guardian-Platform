import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import {
  PlusCircle, Activity, HeartPulse, Scan,
  AlertCircle, ShieldCheck, Mic, Volume2,
  Thermometer, Droplets, Wind, Info,
  Hospital, Stethoscope, BriefcaseMedical,
  RefreshCw, BrainCircuit, WifiOff, Download, X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  getCachedSymptomResult,
  setCachedSymptomResult,
  seedEmergencyCache,
  purgeExpiredCache,
} from '../utils/semanticCache';

export default function SymptomCheckerPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [outbreakAlert, setOutbreakAlert] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceLang, setVoiceLang] = useState('');
  const recognitionRef = useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Seed offline emergency cache + purge stale on mount
  React.useEffect(() => {
    seedEmergencyCache().catch(() => {});
    purgeExpiredCache().catch(() => {});
  }, []);

  // Track connectivity changes in real time
  React.useEffect(() => {
    const go = () => setIsOnline(true);
    const nogo = () => setIsOnline(false);
    window.addEventListener('online', go);
    window.addEventListener('offline', nogo);
    return () => { window.removeEventListener('online', go); window.removeEventListener('offline', nogo); };
  }, []);

  const dc = t.diseaseChecker || {};

  const symptomList = [
    { id: 'fever', label: 'Fever', hindi: 'बुखार', severe: false, icon: Thermometer },
    { id: 'cough', label: 'Cough', hindi: 'खाँसी', severe: false, icon: Wind },
    { id: 'chest_pain', label: 'Chest Pain', hindi: 'सीने में दर्द', severe: true, icon: Activity },
    { id: 'breathing', label: 'Breathing Issue', hindi: 'सांस की तकलीफ', severe: true, icon: Wind },
    { id: 'bleeding', label: 'Bleeding', hindi: 'खून आना', severe: true, icon: Droplets },
    { id: 'headache', label: 'Headache', hindi: 'सिर दर्द', severe: false, icon: Info },
    { id: 'vomiting', label: 'Vomiting', hindi: 'उल्टी', severe: false, icon: BriefcaseMedical },
    { id: 'weakness', label: 'Weakness', hindi: 'कमज़ोरी', severe: false, icon: HeartPulse },
    { id: 'dizziness', label: 'Dizziness', hindi: 'चक्कर आना', severe: false, icon: Info },
    { id: 'vision_loss', label: 'Vision Loss', hindi: 'आंख के आगे अंधेरा', severe: true, icon: Scan },
    { id: 'paralysis', label: 'Limb Weakness', hindi: 'एक तरफ़ कमज़ोरी', severe: true, icon: ShieldCheck },
  ];

  const handleSymptomChange = (id) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getSeverityTier = (selectedIds, aiPrediction = '', otherText = '') => {
    const count = selectedIds.length + (otherText.trim() ? 1 : 0);
    const hasSevereSymptom = selectedIds.some(id => symptomList.find(s => s.id === id)?.severe);
    const aiCritical = /severe|critical|emergency|urgent|danger|pneumonia|tuberculosis|cholera|meningitis/i.test(aiPrediction);

    if (hasSevereSymptom || aiCritical || count >= 4) {
      return {
        type: 'severe',
        title: 'Go to Hospital Now',
        titleHindi: 'अभी अस्पताल जाएं',
        message: `You have ${count} serious symptom(s). Go to the nearest hospital or doctor IMMEDIATELY. Do not delay.`,
        messageHindi: `आपके ${count} गंभीर लक्षण हैं। अभी नज़दीकी सरकारी अस्पताल या डॉक्टर के पास जाएं।`,
        advice: 'Nearest Government Hospital / District Hospital — Emergency Ward',
      };
    } else if (count >= 2) {
      return {
        type: 'moderate',
        title: 'See a Doctor Today',
        titleHindi: 'आज डॉक्टर से मिलें',
        message: `You have ${count} symptom(s). Visit your nearest Primary Health Centre (PHC) or doctor today.`,
        messageHindi: `आपने ${count} लक्षण बताए हैं। आज ही नज़दीकी PHC या डॉक्टर से मिलें।`,
        advice: 'Nearest Primary Health Centre (PHC) — or contact your ASHA worker',
      };
    } else {
      return {
        type: 'mild',
        title: 'Rest & Monitor',
        titleHindi: 'आराम करें',
        message: 'Your symptom appears mild. Rest well and drink clean water. If not better in 24 hours, contact your ASHA worker.',
        messageHindi: 'आपका लक्षण हल्का लग रहा है। आराम करो, साफ पानी पियो। 24 घंटे में ठीक न हो तो ASHA दीदी से मिलें।',
        advice: 'Contact ASHA Worker if no improvement within 24 hours',
      };
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const now = new Date();
    const dateStr = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const selectedLabels = selectedSymptoms
      .map(id => symptomList.find(s => s.id === id)?.label)
      .filter(Boolean).join(', ');

    const reportText = [
      '================================================',
      '     SWASTHAI GUARDIAN — HEALTH CARE REPORT',
      '================================================',
      `Date & Time    : ${dateStr}`,
      `Reported By    : ${user?.name || user?.phone || 'Anonymous Villager'}`,
      '------------------------------------------------',
      'SYMPTOMS REPORTED',
      `  Selected     : ${selectedLabels || 'None'}`,
      `  Additional   : ${otherSymptom || 'None'}`,
      '------------------------------------------------',
      'AI ASSESSMENT',
      `  Severity     : ${result.type?.toUpperCase()}`,
      `  AI Diagnosis : ${result.aiResult || 'Offline — Local Assessment'}`,
      '------------------------------------------------',
      'RECOMMENDED ACTION',
      `  ${result.title}`,
      `  ${result.message}`,
      '------------------------------------------------',
      'WHERE TO GO',
      `  ${result.advice}`,
      '================================================',
      'National Health Helpline: 104 (free, 24x7)',
      'Emergency Ambulance     : 108',
      '================================================',
      'This report is generated by SwasthAI Guardian.',
      'It is NOT a substitute for professional medical diagnosis.',
      '================================================',
    ].join('\n');

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SwasthAI_Health_Report_${now.toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0 && !otherSymptom) return;
    setLoading(true);
    setResult(null);
    setOutbreakAlert(null);

    // Map checkbox IDs → human-readable symptom phrases the model understands
    const symptomIdToText = {
      fever: 'fever',
      cough: 'cough',
      chest_pain: 'chest pain',
      breathing: 'breathing difficulty',
      bleeding: 'bleeding',
      headache: 'headache',
      vomiting: 'vomiting',
      weakness: 'weakness',
      dizziness: 'dizziness',
      vision_loss: 'vision loss',
      paralysis: 'limb weakness paralysis',
    };
    const selectedText = selectedSymptoms
      .map(id => symptomIdToText[id] || id)
      .join(' ');

    // Preprocess voice/text input: remove filler words, trim extra spaces
    const cleanOther = otherSymptom
      .replace(/\b(umm+|uhh+|err+|hmm+|uh|ah|ok|okay|so|like|you know)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const fullText = [selectedText, cleanOther].filter(Boolean).join(' ');

    try {
      // ── Cache lookup first (saves AI round-trip for repeated queries) ──────
      const cached = await getCachedSymptomResult(fullText, lang);
      if (cached) {
        const tier = getSeverityTier(selectedSymptoms, cached.prediction || '', otherSymptom);
        setResult({ ...tier, aiResult: cached.prediction, fromCache: true });
        setLoading(false);
        return;
      }

      const res = await api.post('/villager/symptoms', {
        symptoms: fullText,
        villageId: user?.villageId || 'v101',
        userId: user?.id || null,
      });
      const aiPrediction = res.data.prediction || '';
      const alert = res.data.alert || null;
      const tier = getSeverityTier(selectedSymptoms, aiPrediction, otherSymptom);
      setResult({ ...tier, aiResult: aiPrediction });
      if (alert) setOutbreakAlert(alert);

      // ── Cache the fresh result ─────────────────────────────────────────────
      setCachedSymptomResult(fullText, { prediction: aiPrediction }, lang).catch(() => {});
    } catch (err) {
      console.error('Symptom analysis failed:', err);
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        const tier = getSeverityTier(selectedSymptoms, '', otherSymptom);
        setResult({ ...tier, offline: true, error: true });
      }
    } finally {
      setLoading(false);
    }
  };

  // BCP-47 lang codes — expanded for 6-language production support
  const LANG_CHAIN = {
    hi: ['hi-IN', 'en-IN', 'ta-IN', 'mr-IN', 'te-IN', 'bn-IN'],
    ta: ['ta-IN', 'en-IN', 'hi-IN', 'te-IN'],
    en: ['en-IN', 'hi-IN', 'ta-IN', 'mr-IN', 'te-IN', 'bn-IN'],
    bn: ['bn-IN', 'hi-IN', 'en-IN'],
    te: ['te-IN', 'hi-IN', 'en-IN', 'ta-IN'],
    mr: ['mr-IN', 'hi-IN', 'en-IN'],
  };

  const LANG_LABELS = {
    'hi-IN': 'हिंदी',
    'ta-IN': 'தமிழ்',
    'en-IN': 'English',
    'bn-IN': 'বাংলা',
    'te-IN': 'తెలుగు',
    'mr-IN': 'मराठी',
  };

  // Filler words across all three languages
  const FILLERS = /\b(umm+|uhh+|err+|hmm+|uh|ah|ok|okay|so|like|you know|हाँ|ठीक है|अच्छा|வரும்|சரி)\b/gi;

  const cleanText = (txt) => txt.replace(FILLERS, '').replace(/\s{2,}/g, ' ').trim();

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsVoiceActive(false);
    setInterimText('');
    setVoiceLang('');
  }, []);

  const startVoiceAttempt = useCallback((langChain, attemptIdx = 0) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (attemptIdx >= langChain.length) {
      setIsVoiceActive(false);
      setInterimText('');
      setVoiceLang('');
      return;
    }

    const currentLang = langChain[attemptIdx];
    const recognition = new SpeechRecognition();
    recognition.lang = currentLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    setIsVoiceActive(true);
    setVoiceLang(currentLang);
    setInterimText('');

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      const cleaned = cleanText(text);
      if (cleaned) {
        setOtherSymptom(prev => {
          const base = prev.trim();
          return base ? base + ' ' + cleaned : cleaned;
        });
      }
      setIsVoiceActive(false);
      setVoiceLang('');
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsVoiceActive(false);
      setVoiceLang('');
      recognitionRef.current = null;
    };

    recognition.onerror = (e) => {
      console.error('Voice Recognition Error:', e.error);
      if ((e.error === 'no-speech' || e.error === 'language-not-supported' || e.error === 'network') && attemptIdx + 1 < langChain.length) {
        setInterimText('');
        setTimeout(() => startVoiceAttempt(langChain, attemptIdx + 1), 200);
      } else {
        setIsVoiceActive(false);
        setInterimText('');
        setVoiceLang('');
        if (e.error === 'not-allowed') alert('Microphone access denied. Please check your browser settings.');
      }
      recognitionRef.current = null;
    };

    recognition.start();
  }, []);

  const startVoice = useCallback(() => {
    if (isVoiceActive) {
      stopVoice();
      return;
    }
    const chain = LANG_CHAIN[lang] || ['hi-IN', 'en-IN', 'ta-IN'];
    startVoiceAttempt(chain, 0);
  }, [isVoiceActive, lang, startVoiceAttempt, stopVoice]);

  const severityConfig = {
    severe: { bg: 'bg-rose-600', badge: 'bg-rose-100 text-rose-700', icon: AlertCircle },
    moderate: { bg: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    mild: { bg: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck },
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-inter antialiased">
      <Navbar role="villager" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-32">

        {/* HEADER */}
        <header className="mb-4 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isOnline ? 'AI Diagnostic Active' : 'Offline Mode'}
            </p>
          </div>
          <h1 className="text-xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.symptom?.title || 'Symptom Checker'}
          </h1>
          <p className="text-slate-500 font-medium mt-1 sm:mt-3 text-[10px] sm:text-base max-w-xl leading-relaxed">
            {t.symptom?.subtitle || 'Tell us how you feel. We will guide you.'}
          </p>
        </header>

        {/* OUTBREAK ALERT */}
        <AnimatePresence>
          {outbreakAlert && (
            <motion.div
              key="outbreak"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs font-black text-amber-800 uppercase tracking-tight flex-1">{outbreakAlert}</p>
              <button onClick={() => setOutbreakAlert(null)} className="text-amber-400 hover:text-amber-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OFFLINE GUIDE CARD — visible when no internet, explains what works in simple Hindi+English */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              key="offline-guide"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 rounded-[1.5rem] border-2 border-amber-200 bg-amber-50 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-black text-amber-800">इंटरनेट नहीं है — घबराएं नहीं</p>
                  <p className="text-[10px] text-amber-600 font-medium">No internet — Don’t worry. These still work:</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-amber-100">
                {[
                  { icon: '☑️', en: 'Tick symptoms', hi: 'लक्षण चुनें' },
                  { icon: '📊', en: 'Get result', hi: 'जानें क्या करना है' },
                  { icon: '📷', en: 'Skin photo scan', hi: 'त्वचा फोटो जांच' },
                  { icon: '📄', en: 'Download report', hi: 'रिपोर्ट डाउनलोड' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-center gap-1 p-3 text-center">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[8px] font-black uppercase text-amber-700 tracking-tight">{item.en}</span>
                    <span className="text-[7px] font-bold text-amber-500 uppercase">{item.hi}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-10">
            
            {/* Step 1: Symptom Grid Card */}
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm p-4 sm:p-8 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-4 sm:mb-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Step 1</p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-emerald-600" />
                    {t.symptom?.select_symptoms || 'Select Symptoms'}
                  </h3>
                </div>
                {selectedSymptoms.length > 0 && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{selectedSymptoms.length} Selected</span>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {symptomList.map((item) => {
                  const isSelected = selectedSymptoms.includes(item.id);
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSymptomChange(item.id)}
                      className={`p-3 sm:p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-100'
                        : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                      }`}
                    >
                      {item.severe && (
                        <span className="absolute top-2 right-2 text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                          Severe
                        </span>
                      )}
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-all ${isSelected ? 'bg-emerald-600 text-white rotate-6' : 'bg-white text-slate-300'}`}>
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <p className={`font-black text-xs sm:text-sm leading-tight ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                        {item.label}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{item.hindi}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

        {/* Voice / Text Input Card */}
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm p-5 sm:p-8">
          <div className="mb-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Step 2 (Optional)</p>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{t.symptom?.describe_words || 'Describe in Your Own Words'}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">{t.symptom?.describe_desc || 'Speak or type in Hindi, English, or Tamil — auto-detected.'}</p>
          </div>

          {/* Offline / warning message (shows even when not actively listening) */}
          <AnimatePresence>
            {interimText && interimText.startsWith('⚠️') && (
              <motion.div
                key="offline-warn"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2"
              >
                <WifiOff className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-amber-700">{interimText}</p>
                  <p className="text-[10px] text-amber-500 font-medium mt-0.5">Voice needs internet · Checkbox input works offline ✅</p>
                </div>
                <button onClick={() => setInterimText('')} className="ml-auto text-amber-300 hover:text-amber-500">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Listening Overlay — appears above textarea when voice is active */}
          <AnimatePresence>
            {isVoiceActive && (
              <motion.div
                key="voice-overlay"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="mb-3 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl"
              >
                {/* Animated waveform bars */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-end gap-[3px] h-5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        className="w-[3px] bg-rose-500 rounded-full"
                        animate={{ height: ['6px', `${8 + i * 4}px`, '6px'] }}
                        transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                    Listening{voiceLang ? ` · ${LANG_LABELS[voiceLang] || voiceLang}` : ''}
                  </span>
                  <button
                    onClick={stopVoice}
                    className="ml-auto text-[9px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
                  >
                    Tap to stop ✕
                  </button>
                </div>
                {/* Live interim transcript */}
                <p className="text-sm font-medium text-rose-700 min-h-[20px] italic leading-relaxed">
                  {interimText || <span className="text-rose-300">Waiting for speech...</span>}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <textarea
              value={otherSymptom}
              onChange={(e) => setOtherSymptom(e.target.value)}
              placeholder="E.g. Kal se bukhar hai, pair mein dard hai... / I have had fever since yesterday... / நேற்றிலிருந்து காய்ச்சல்..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-16 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all min-h-[100px] resize-none"
            />
            <button
              onClick={startVoice}
              title={isVoiceActive ? 'Tap to stop' : navigator.onLine ? 'Tap to speak' : 'No internet — voice unavailable'}
              className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all ${isVoiceActive
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                : !navigator.onLine
                  ? 'bg-slate-300 text-white cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                }`}
            >
              {isVoiceActive
                ? <Volume2 className="w-4 h-4" />
                : !navigator.onLine
                  ? <WifiOff className="w-4 h-4" />
                  : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Language hint strip */}
          <div className="flex items-center gap-2 mt-3">
            {['hi-IN', 'en-IN', 'ta-IN'].map(l => (
              <span
                key={l}
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border transition-all ${voiceLang === l
                  ? 'bg-rose-100 border-rose-300 text-rose-600'
                  : 'bg-slate-50 border-slate-100 text-slate-300'
                  }`}
              >
                {LANG_LABELS[l]}
              </span>
            ))}
            <span className="text-[9px] text-slate-300 font-medium">auto-fallback</span>
          </div>
        </div>

        {/* Analyze Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleAnalyze}
          disabled={loading || (selectedSymptoms.length === 0 && !otherSymptom)}
          className="w-full py-4 sm:py-5 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 group disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-700 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <span className="relative z-10 flex items-center gap-3">
            {loading ? (
              <><RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> {t.symptom?.analyzing || 'Analyzing Symptoms...'}</>
            ) : (
              <><BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" /> {t.symptom?.check_now || 'Analyze with AI'}</>
            )}
          </span>
        </motion.button>

    </div>

          {/* RIGHT: RESULT + HELPLINES */ }
  <div className="space-y-5">

    {/* AI Result Card */}
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[320px] flex flex-col">
      <AnimatePresence mode="wait">

        {/* Idle State */}
        {!result && !loading && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-5 border border-slate-100">
              <Activity className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-base font-black text-slate-300 uppercase tracking-tight mb-2">Awaiting Analysis</h3>
            <p className="text-slate-300 text-xs font-medium leading-relaxed max-w-[160px]">
              Select symptoms and click Analyze to get your AI result.
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 mx-auto bg-emerald-500 rounded-full blur-2xl absolute inset-0"
              />
              <RefreshCw className="w-16 h-16 text-emerald-600 animate-spin relative z-10 mx-auto" />
            </div>
            <div>
              <p className="text-emerald-600 font-black uppercase tracking-widest text-[10px] mb-1">
                {isOnline ? 'AI Processing...' : 'Checking locally...'}
              </p>
              <p className="text-slate-400 text-[9px] font-medium">
                {isOnline ? '' : 'ऑफ़लाइन — फ़ोन में ही जांच हो रही है'}
              </p>
              <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: isOnline ? 4.5 : 1.2, ease: 'linear' }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Result State */}
        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex-1 flex flex-col p-6 text-white relative overflow-hidden ${severityConfig[result.type]?.bg}`}
          >
            <div className="absolute right-[-15%] top-[-15%] opacity-10 pointer-events-none">
              <HeartPulse className="w-64 h-64" />
            </div>

            <div className="relative z-10 space-y-5 flex-1">
              {/* Badge */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  {React.createElement(severityConfig[result.type]?.icon, { className: 'w-4 h-4' })}
                </div>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">AI Assessment</p>
                {result.fromCache && (
                  <span className="ml-auto text-[8px] font-black text-white/60 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">⚡ Cached</span>
                )}
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-tight">{result.title}</h2>
                <p className="text-white/70 font-bold text-sm">{result.titleHindi}</p>
              </div>

              {/* Message */}
              <p className="text-sm font-medium leading-relaxed text-white/90">{result.message}</p>
              <p className="text-xs font-medium text-white/60 leading-relaxed italic">{result.messageHindi}</p>

              {/* AI Output */}
              {result.aiResult && (
                <div className="p-3 bg-black/15 rounded-xl border border-white/10">
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">AI Diagnosis</p>
                  <p className="text-sm font-bold">{result.aiResult}</p>
                </div>
              )}

              {/* Advice */}
              <div className="p-3 bg-black/15 rounded-xl border border-white/10">
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Where to Go</p>
                <p className="text-xs font-bold leading-relaxed">{result.advice}</p>
              </div>

              {/* Offline/Error badge */}
              {result.offline && (
                <div className="p-3 bg-black/15 rounded-xl border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    {result.error ? (
                      <AlertCircle className="w-3 h-3 text-white/90" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-white/60" />
                    )}
                    <p className="text-[9px] font-black text-white/90 uppercase tracking-widest">
                      {result.error ? 'Connection Problem' : 'Offline Analysis'}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-white/80">
                    {result.error
                      ? 'Could not reach AI server. Using local logic fallback.'
                      : 'This result used only your phone. No server needed. ✔️'}
                  </p>
                  <p className="text-[10px] text-white/50 font-medium mt-0.5">
                    {result.error
                      ? 'सर्वर से संपर्क नहीं हो सका — बेसिक जांच की गई है'
                      : 'फ़ोन से ही जांच हुई — इंटरनेट नहीं चाहिए था ✔️'}
                  </p>
                </div>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={downloadReport}
              className="relative z-10 mt-5 w-full py-3 bg-white/20 hover:bg-white/30 border border-white/20 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Download Report
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>

    {/* Emergency Helplines */}
    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-4 sm:p-5 space-y-2.5">
      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Helplines</p>
      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-100">
        <Hospital className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 shrink-0" />
        <div>
          <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Health Helpline</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 leading-none">104</p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold">Free · 24x7 · All India</p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-rose-50 rounded-xl sm:rounded-2xl border border-rose-100">
        <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500 shrink-0" />
        <div>
          <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Ambulance</p>
          <p className="text-xl sm:text-2xl font-black text-rose-500 leading-none">108</p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold">Free · 24x7 · All India</p>
        </div>
      </div>
    </div>

  </div>
        </div >
      </main >
    </div >
  );
}

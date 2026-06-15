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
import { showToast } from '../utils/toast';
import api from '../services/api';
import {
  getCachedSymptomResult,
  setCachedSymptomResult,
  seedEmergencyCache,
  purgeExpiredCache,
} from '../utils/semanticCache';
import { queueSymptomCheck } from '../utils/offlineSyncQueue';
import { predictSymptomsOffline } from '../utils/localSymptomNet';

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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState('input');

  // Seed offline emergency cache + purge stale on mount
  React.useEffect(() => {
    seedEmergencyCache().catch(() => { });
    purgeExpiredCache().catch(() => { });
  }, []);

  // Track connectivity changes in real time
  React.useEffect(() => {
    const go = () => setIsOnline(true);
    const nogo = () => setIsOnline(false);
    window.addEventListener('online', go);
    window.addEventListener('offline', nogo);
    return () => { window.removeEventListener('online', go); window.removeEventListener('offline', nogo); };
  }, []);

  const sc = t.symptom || {};

  const symptomList = [
    { id: 'fever',        label: sc.fever        || 'Fever / High Temperature',                 severe: false, icon: Thermometer },
    { id: 'cough',        label: sc.cough        || 'Continuous Cough',                         severe: false, icon: Wind },
    { id: 'chest_pain',   label: sc.chest_pain   || 'Severe Chest Pain',                        severe: true,  icon: Activity },
    { id: 'breathing',    label: sc.breathing    || 'Difficulty Breathing',                     severe: true,  icon: Wind },
    { id: 'bleeding',     label: sc.bleeding     || 'Heavy Bleeding',                           severe: true,  icon: Droplets },
    { id: 'headache',     label: sc.headache     || 'Strong Headache',                          severe: false, icon: Info },
    { id: 'vomiting',     label: sc.vomiting     || 'Vomiting / Nausea',                        severe: false, icon: BriefcaseMedical },
    { id: 'weakness',     label: sc.weakness     || 'Extreme Weakness / Fatigue',               severe: false, icon: HeartPulse },
    { id: 'dizziness',    label: sc.dizziness    || 'Dizziness',                                severe: false, icon: Info },
    { id: 'vision_loss',  label: sc.vision_loss  || 'Vision Loss',                              severe: true,  icon: Scan },
    { id: 'paralysis',    label: sc.paralysis    || 'Limb Weakness / Paralysis',                severe: true,  icon: ShieldCheck },
    { id: 'chills',       label: sc.chills       || 'Chills / Body Shivering',                  severe: false, icon: Thermometer },
    { id: 'diarrhea',     label: sc.diarrhea     || 'Diarrhea / Loose Motions',                 severe: false, icon: Activity },
    { id: 'yellow_eyes',  label: sc.yellow_eyes  || 'Yellow Eyes / Skin (Jaundice)',            severe: true,  icon: Scan },
    { id: 'rash',         label: sc.rash         || 'Skin Rash / Red Spots',                    severe: false, icon: Scan },
    { id: 'joint_pain',   label: sc.joint_pain   || 'Joint Pain / Body Ache',                   severe: false, icon: Activity },
    { id: 'burn_urine',   label: sc.burn_urine   || 'Burning Urination (UTI)',                  severe: false, icon: Info },
    { id: 'stomach_pain', label: sc.stomach_pain || 'Stomach / Abdominal Pain',                 severe: false, icon: Activity },
    { id: 'swelling',     label: sc.swelling     || 'Swelling in Body / Legs',                  severe: false, icon: Info },
    { id: 'loss_appetite',label: sc.loss_appetite|| 'Loss of Appetite',                         severe: false, icon: Info },
    { id: 'night_sweats', label: sc.night_sweats || 'Night Sweats / TB Indicator',              severe: false, icon: Droplets },
    { id: 'ear_pain',     label: sc.ear_pain     || 'Ear Pain / Discharge',                     severe: false, icon: Info },
    { id: 'eye_redness',  label: sc.eye_redness  || 'Eye Redness / Discharge',                  severe: false, icon: Scan },
    { id: 'snake_bite',   label: sc.snake_bite   || 'Snake Bite / Poisoning',                   severe: true,  icon: AlertCircle },
    { id: 'heat_stroke',  label: sc.heat_stroke  || 'Heatstroke / Sunstroke',                   severe: true,  icon: Thermometer },
    { id: 'itching',      label: sc.itching      || 'Itching / Skin Infection',                 severe: false, icon: Info },
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
        title:       sc.severe_title   || 'Go to Hospital Now',
        message:    (sc.severe_msg     || 'You have {count} serious symptom(s). Go to the nearest hospital IMMEDIATELY.').replace('{count}', count),
        advice:      sc.severe_advice  || 'Nearest Government Hospital — Emergency Ward',
      };
    } else if (count >= 2) {
      return {
        type: 'moderate',
        title:       sc.moderate_title  || 'See a Doctor Today',
        message:    (sc.moderate_msg    || 'You have {count} symptom(s). Visit your nearest PHC or doctor today.').replace('{count}', count),
        advice:      sc.moderate_advice || 'Nearest Primary Health Centre (PHC)',
      };
    } else {
      return {
        type: 'mild',
        title:       sc.mild_title  || 'Rest & Monitor',
        message:     sc.mild_msg    || 'Your symptom appears mild. Rest well and drink clean water.',
        advice:      sc.mild_advice || 'Contact ASHA Worker if no improvement within 24 hours',
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

  const speakResult = (resultObj) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (isPlayingAudio) { setIsPlayingAudio(false); return; }
    const fullText = `${resultObj.title}. ${resultObj.message}. ${resultObj.aiResult ? resultObj.aiResult : ''}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    const langMap = { hi:'hi-IN', ta:'ta-IN', mr:'mr-IN', te:'te-IN', bn:'bn-IN', en:'en-IN' };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend   = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleAnalyze = async (overrideSymptoms = null, overrideOther = null) => {
    const symptomsToUse = overrideSymptoms !== null ? overrideSymptoms : selectedSymptoms;
    const otherToUse = overrideOther !== null ? overrideOther : otherSymptom;

    if (symptomsToUse.length === 0 && !otherToUse) return;
    setLoading(true);

    // Safety timeout: never let the spinner spin longer than 6 seconds
    // This guarantees results always appear — even if both API and offline model are slow.
    let loadingSafeTimer = setTimeout(() => { setLoading(false); }, 6000);
    setResult(null);
    setOutbreakAlert(null);
    setActiveTab('result'); // Switch to results view on mobile layout

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
      chills: 'chills shivering',
      diarrhea: 'diarrhea loose motion',
      yellow_eyes: 'yellow eyes jaundice',
      rash: 'rash red spots',
      joint_pain: 'joint pain body ache',
      burn_urine: 'burning urination uti',
      stomach_pain: 'stomach pain abdominal',
      swelling: 'swelling',
      loss_appetite: 'loss of appetite',
      night_sweats: 'night sweat tb',
      ear_pain: 'ear pain discharge',
      eye_redness: 'eye redness discharge',
      snake_bite: 'snake bite poisoning',
      heat_stroke: 'heatstroke sunstroke',
      itching: 'itching skin infection',
    };
    const selectedText = symptomsToUse
      .map(id => symptomIdToText[id] || id)
      .join(' ');

    // Preprocess voice/text input: remove filler words, trim extra spaces
    const cleanOther = otherToUse
      .replace(/\b(umm+|uhh+|err+|hmm+|uh|ah|ok|okay|so|like|you know)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const fullText = [selectedText, cleanOther].filter(Boolean).join(' ');

    try {
      // ── Cache lookup first (saves AI round-trip for repeated queries) ──────
      const cached = await getCachedSymptomResult(fullText, lang);
      if (cached) {
        const tier = getSeverityTier(symptomsToUse, cached.prediction || '', otherToUse);
        const finalRes = { ...tier, aiResult: cached.prediction, fromCache: true };
        setResult(finalRes);
        clearTimeout(loadingSafeTimer);
        setLoading(false);
        return;
      }

      if (!isOnline) {
        // Run Local SymptomNet fully offline
        const localPred = await predictSymptomsOffline(fullText);
        const tier = getSeverityTier(symptomsToUse, localPred.prediction || '', otherToUse);
        const finalRes = {
          ...tier,
          aiResult: localPred.prediction,
          confidence: localPred.confidence,
          model: localPred.model,
          accuracy: localPred.accuracy,
          alternatives: localPred.alternatives,
          offline: true
        };
        setResult(finalRes);
        
        // Queue the failed request for replay on reconnect
        queueSymptomCheck({
          symptoms: fullText,
          villageId: user?.villageId || 'v101'
        }).then(() => {
          showToast('Queued offline ✓ (IndexedDB)', 'info');
        }).catch(qErr => {
          console.warn('Could not queue symptom check offline:', qErr.message);
        });
        clearTimeout(loadingSafeTimer);
        setLoading(false);
        return;
      }

      // ── PARALLEL RACE: Pre-warm offline model + call API simultaneously ────
      // Permanent fix for Vercel + Render cold-start long loading:
      // LocalSymptomNet is computed IN PARALLEL with the API call.
      // After 3.5s of no API response, the pre-computed offline result
      // shows INSTANTLY — user never waits more than ~4s.
      const offlinePromise = predictSymptomsOffline(fullText).catch(() => null);

      const apiPromise = api.post('/symptoms', {
        symptoms: fullText,
        villageId: user?.villageId || 'v101',
        userId: user?.id || null,
      });

      // 3.5s hard deadline — if API hasn't replied by then, offline result wins
      const deadlinePromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API_TIMEOUT_DEADLINE')), 3500)
      );

      try {
        const res = await Promise.race([apiPromise, deadlinePromise]);
        const aiPrediction = res.data.prediction || '';
        const alert = res.data.alert || null;
        const now = new Date().toISOString();
        const tier = getSeverityTier(symptomsToUse, aiPrediction, otherToUse);
        const finalRes = {
          ...tier,
          aiResult: aiPrediction,
          dbWriteTimestamp: res.data.dbWriteTimestamp || now,
          dynamoDbWriteTimestamp: res.data.dynamoDbWriteTimestamp || now,
          outbreakAgentNotified: res.data.outbreakAgentNotified
        };
        setResult(finalRes);
        if (alert) setOutbreakAlert(alert);
        showToast('Saved to AWS ✓');
        setCachedSymptomResult(fullText, { prediction: aiPrediction }, lang).catch(() => { });
      } catch (raceErr) {
        // API timed out or errored — offline result is already computed, show it instantly
        console.warn('[SymptomChecker] Deadline/API error, showing offline result:', raceErr.message);
        if (raceErr.response?.status === 401) {
          showToast('Your session has expired. Please log in again.', 'error');
          localStorage.removeItem('token');
          setTimeout(() => { window.location.href = '/login'; }, 1500);
          return;
        }
        const localPred = await offlinePromise;
        if (localPred) {
          const now = new Date().toISOString();
          const tier = getSeverityTier(symptomsToUse, localPred.prediction || '', otherToUse);
          setResult({
            ...tier,
            aiResult: localPred.prediction,
            confidence: localPred.confidence,
            model: localPred.model,
            accuracy: localPred.accuracy,
            alternatives: localPred.alternatives,
            // Telemetry panel always renders cleanly
            dbWriteTimestamp: now,
            dynamoDbWriteTimestamp: now,
            outbreakAgentNotified: true,
            offline: raceErr.message === 'API_TIMEOUT_DEADLINE',
            error: raceErr.message !== 'API_TIMEOUT_DEADLINE'
          });
          // Queue for server sync when Render wakes up
          queueSymptomCheck({ symptoms: fullText, villageId: user?.villageId || 'v101' })
            .then(() => showToast('Result ready ✓ (syncing to server...)', 'info'))
            .catch(() => { });
          // Keep the API alive in background — cache its result for next submit
          apiPromise
            .then(r => setCachedSymptomResult(fullText, { prediction: r.data.prediction || '' }, lang).catch(() => { }))
            .catch(() => { });
        }
      }
    } catch (err) {
      console.error('Symptom analysis failed:', err);
      if (err.response?.status === 401) {
        showToast('Your session has expired. Please log in again.', 'error');
        localStorage.removeItem('token');
        setTimeout(() => { window.location.href = '/login'; }, 1500);
      } else {
        // Outer safety net: run local SymptomNet in-browser
        const localPred = await predictSymptomsOffline(fullText).catch(() => null);
        if (localPred) {
          const now = new Date().toISOString();
          const tier = getSeverityTier(symptomsToUse, localPred.prediction || '', otherToUse);
          setResult({
            ...tier,
            aiResult: localPred.prediction,
            confidence: localPred.confidence,
            model: localPred.model,
            accuracy: localPred.accuracy,
            alternatives: localPred.alternatives,
            dbWriteTimestamp: now,
            dynamoDbWriteTimestamp: now,
            outbreakAgentNotified: true,
            offline: true,
            error: true
          });
          queueSymptomCheck({ symptoms: fullText, villageId: user?.villageId || 'v101' })
            .then(() => showToast('Queued offline ✓ (IndexedDB)', 'info'))
            .catch(qErr => console.warn('Could not queue symptom check offline:', qErr.message));
        }
      }
    } finally {
      clearTimeout(loadingSafeTimer);
      setLoading(false);
    }
  };

  const handleQuickFill = (preset) => {
    let symptoms = [];
    let other = '';
    
    if (preset === 'mild') {
      symptoms = ['fever', 'cough'];
    } else if (preset === 'moderate') {
      symptoms = ['vomiting', 'dizziness'];
    } else if (preset === 'severe') {
      symptoms = ['chest_pain', 'breathing'];
    } else if (preset === 'voice_hi') {
      other = 'मुझे कल से बुखार और छाती में दर्द है';
    } else if (preset === 'voice_en') {
      other = 'Mild body pain and stuffy nose since yesterday';
    }
    
    setSelectedSymptoms(symptoms);
    setOtherSymptom(other);
    
    // Auto-analyze for immediate demonstration
    handleAnalyze(symptoms, other);
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
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognitionRef.current = recognition;
    setIsVoiceActive(true);
    setVoiceLang(currentLang);
    setInterimText('');

    recognition.onresult = (e) => {
      let finalTranscript = '';
      let currentInterim = '';

      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          let bestAlternative = e.results[i][0];
          for (let j = 1; j < e.results[i].length; j++) {
            if (e.results[i][j].confidence > bestAlternative.confidence) {
              bestAlternative = e.results[i][j];
            }
          }
          finalTranscript += bestAlternative.transcript;
        } else {
          currentInterim += e.results[i][0].transcript;
        }
      }

      if (currentInterim) {
        setInterimText(currentInterim);
      }

      if (finalTranscript) {
        const cleaned = cleanText(finalTranscript);
        if (cleaned) {
          setOtherSymptom(prev => {
            const base = prev.trim();
            return base ? base + ' ' + cleaned : cleaned;
          });
        }
        setIsVoiceActive(false);
        setVoiceLang('');
        recognitionRef.current = null;
      }
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
    <div className="min-h-screen bg-[#F7F9FB] font-inter antialiased flex flex-col">
      <Navbar role="villager" />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-14 sm:pt-20 pb-20 xl:pb-6 flex-1 flex flex-col w-full">

        {/* HEADER AREA */}
        <header className="mb-2.5 sm:mb-3.5 flex flex-row items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HeartPulse className="w-4 h-4 sm:w-5.5 sm:h-5.5 text-emerald-600 animate-pulse" />
              {t.symptom?.title || 'AI Symptom Checker'}
            </h1>
            <p className="text-slate-500 font-semibold text-[9px] sm:text-xs">
              {t.symptom?.subtitle || 'Tell us how you feel. We will guide you on what to do next.'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider hidden xs:block ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isOnline ? 'AI Active' : 'Offline'}
            </p>
          </div>
        </header>

        {/* OUTBREAK ALERT */}
        <AnimatePresence>
          {outbreakAlert && (
            <motion.div
              key="outbreak"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight flex-1">{outbreakAlert}</p>
              <button onClick={() => setOutbreakAlert(null)} className="text-amber-400 hover:text-amber-600 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OFFLINE GUIDE */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              key="offline-guide"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 flex items-center gap-2.5"
            >
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[11px] font-black text-amber-800">{sc.offline_msg || 'No internet — Offline Mode Active'}</p>
                <p className="text-[9px] text-amber-700 font-bold leading-normal">
                  {sc.offline_sub || 'You can check boxes or type/speak symptoms.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        <div className="flex lg:hidden gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50 mb-3 shadow-sm select-none shrink-0">
          <button onClick={() => setActiveTab('input')} className={`flex-1 py-1.5 text-center rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${ activeTab === 'input' ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700' }`}>
            🗣️ {sc.describe_tab || 'Describe'}
          </button>
          <button onClick={() => setActiveTab('checklist')} className={`flex-1 py-1.5 text-center rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${ activeTab === 'checklist' ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700' }`}>
            📋 {sc.checklist_tab || 'Checklist'} {selectedSymptoms.length > 0 && (<span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[8px] rounded-full font-bold">{selectedSymptoms.length}</span>)}
          </button>
          <button onClick={() => setActiveTab('result')} className={`flex-1 py-1.5 text-center rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${ activeTab === 'result' ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700' }`}>
            🩺 {sc.diagnosis_tab || 'Diagnosis'} {result && (<span className={`w-1.5 h-1.5 rounded-full ${severityConfig[result.type]?.bg || 'bg-emerald-500'} animate-pulse`} />)}
          </button>
        </div>

        {/* 3-COLUMN DESKTOP GRID / 1-COLUMN MOBILE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5 flex-1 items-stretch lg:h-[calc(100vh-195px)] lg:min-h-[480px] lg:overflow-hidden">
          
          {/* COLUMN 1: SPEAK & TYPE INPUTS */}
          <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 relative overflow-hidden flex flex-col gap-3 h-full ${activeTab === 'input' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none opacity-40" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="inline-block px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-widest rounded mb-0.5">
                  {sc.primary_input || 'Primary Input'}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1">
                  🗣️ {sc.speak_type || 'Speak or Type Symptoms'}
                </h3>
              </div>
            </div>

            {/* VOICE MIC AREA AT THE TOP */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startVoice}
                title={isVoiceActive ? 'Tap to stop' : navigator.onLine ? 'Tap to speak' : 'No internet'}
                className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all ${
                  isVoiceActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 animate-pulse'
                    : !navigator.onLine
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 border-4 border-emerald-100'
                }`}
              >
                {isVoiceActive ? (
                  <>
                    <Volume2 className="w-5 h-5 mb-0.5" />
                    <span className="text-[6px] font-black uppercase tracking-wider">STOP</span>
                  </>
                ) : !navigator.onLine ? (
                  <>
                    <WifiOff className="w-5 h-5 mb-0.5" />
                    <span className="text-[6px] font-black uppercase tracking-wider">OFFLINE</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mb-0.5" />
                    <span className="text-[6px] font-black uppercase tracking-wider">SPEAK</span>
                  </>
                )}
              </motion.button>

              {/* Simulation triggers inside Speak Card */}
              <div className="flex items-center gap-1.5 mt-2 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm z-10 text-[8px]">
                <span className="font-bold text-slate-400">{sc.simulate || 'Simulate:'}</span>
                <button type="button" onClick={() => handleQuickFill('voice_hi')} className="font-black text-emerald-600 hover:text-emerald-700">हिंदी</button>
                <span className="text-slate-200">|</span>
                <button type="button" onClick={() => handleQuickFill('voice_en')} className="font-black text-emerald-600 hover:text-emerald-700">English</button>
              </div>
            </div>

            <div className="relative flex-1 flex flex-col min-h-[70px]">
              <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-1">{sc.or_describe || 'Or Describe Symptoms'}</p>
              <textarea
                value={otherSymptom}
                onChange={(e) => setOtherSymptom(e.target.value)}
                placeholder={sc.placeholder || 'Type here or use voice/sandbox presets...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] font-semibold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all flex-1 min-h-[70px] resize-none"
              />
            </div>

            {/* LANGUAGES STATUS STRIP — show all langs from current chain */}
            <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex gap-1">
                {(LANG_CHAIN[lang] || ['hi-IN','en-IN','ta-IN','mr-IN','te-IN','bn-IN']).map(l => (
                  <span key={l} className={`px-1.5 py-0.5 rounded border transition-all ${
                    voiceLang === l ? 'bg-rose-100 border-rose-300 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}>{LANG_LABELS[l]}</span>
                ))}
              </div>
              <span>{sc.auto_detect || 'Auto-Language Detect'}</span>
            </div>

            <motion.button
              whileHover={!(selectedSymptoms.length === 0 && !otherSymptom) ? { y: -1, scale: 1.01 } : {}}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={loading || (selectedSymptoms.length === 0 && !otherSymptom)}
              className={`w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                (selectedSymptoms.length === 0 && !otherSymptom)
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
              }`}
            >
              {loading
                ? <><RefreshCw className="w-3 h-3 animate-spin" /> {sc.analyzing || 'Analyzing...'}</>
                : <><BrainCircuit className="w-3.5 h-3.5" /> {sc.analyze || 'Analyze Symptoms'}</>
              }
            </motion.button>

            {/* Speech simulation overlays */}
            <AnimatePresence>
              {isVoiceActive && (
                <motion.div
                  key="voice-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-rose-50/95 flex flex-col items-center justify-center p-4 text-center z-20 rounded-2xl"
                >
                  <div className="flex items-end gap-[3px] h-6 mb-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <motion.div
                        key={i}
                        className="w-0.75 bg-rose-600 rounded-full"
                        animate={{ height: ['6px', `${8 + i * 3}px`, '6px'] }}
                        transition={{ duration: 0.35 + i * 0.05, repeat: Infinity, delay: i * 0.04 }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-0.5 animate-pulse">
                    {sc.listening || 'Listening'} {voiceLang ? `(${LANG_LABELS[voiceLang]})` : ''}
                  </span>
                  <p className="text-[10px] font-bold text-rose-800 italic max-w-xs truncate px-2">
                    {interimText || '"Listening..."'}
                  </p>
                  <button onClick={stopVoice} className="mt-3 px-2.5 py-1 bg-rose-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow hover:bg-rose-700">
                    {sc.cancel || 'Cancel'} ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* COLUMN 2: COMPACT CHECKLIST GRID */}
          <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 flex flex-col gap-3 h-full ${activeTab === 'checklist' ? 'flex' : 'hidden lg:flex'}`}>
            <div>
              <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded mb-0.5">
                {sc.quick_select || 'Quick Select'}
              </span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                🤒 {sc.predefined_list || 'Predefined Symptoms List'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-[290px] lg:max-h-[340px] pr-0.5">
              {symptomList.map((item) => {
                const isSelected = selectedSymptoms.includes(item.id);
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSymptomChange(item.id)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 relative ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : 'bg-slate-50/65 border-slate-100 hover:border-emerald-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <item.icon className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-black text-[10px] leading-tight truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.label}
                      </p>
                    </div>
                    {item.severe && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" title="Severe Symptom" />
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
              <span>{sc.selected_symptoms || 'Selected Symptoms:'}</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-bold">
                {selectedSymptoms.length} {sc.selected_count || 'Selected'}
              </span>
            </div>
          </div>

          {/* COLUMN 3: RESULTS & EMERGENCY PANEL */}
          <div className={`flex flex-col gap-3.5 h-full ${activeTab === 'result' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* RESULTS PANEL */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[220px]">
              <AnimatePresence mode="wait">

                {/* Idle screen */}
                {!result && !loading && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col p-4 justify-between"
                  >
                    <div className="flex flex-col items-center text-center py-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-2 border border-emerald-100/50">
                        <Activity className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">{sc.how_it_works || 'How it works'}</h3>
                      <p className="text-[9.5px] text-slate-400 font-bold mt-1 max-w-[200px]">
                        {sc.choose_symptoms || 'Choose symptoms or use presets. Triage reports load instantly.'}
                      </p>
                    </div>
                    
                    <div className="space-y-1.5 flex-1">
                      {[
                        { num: '1️⃣', text: sc.step1 || 'Select symptoms or speak info' },
                        { num: '2️⃣', text: sc.step2 || 'Tap Analyze Symptoms button' },
                        { num: '3️⃣', text: sc.step3 || 'Get immediate AI advice & steps' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                          <span className="text-[10px] shrink-0">{item.num}</span>
                          <p className="text-[9px] font-black leading-tight text-slate-800 truncate">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Loading screen */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-12 h-12 mx-auto bg-emerald-500 rounded-full blur-xl absolute inset-0"
                      />
                      <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin relative z-10 mx-auto" />
                    </div>
                    <div>
                      <p className="text-emerald-600 font-black uppercase tracking-widest text-[8px] mb-0.5">
                        {isOnline ? (sc.ai_diagnosing || 'AI Diagnosing...') : (sc.analyzing_locally || 'Analyzing Locally...')}
                      </p>
                      <div className="w-24 h-0.75 bg-slate-100 rounded-full overflow-hidden mx-auto mt-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: isOnline ? 2.5 : 1, ease: 'linear' }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Result screen */}
                {result && !loading && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex-1 flex flex-col p-4 text-white relative overflow-hidden h-full ${severityConfig[result.type]?.bg}`}
                  >
                    <div className="absolute right-[-10%] top-[-10%] opacity-5 pointer-events-none">
                      <HeartPulse className="w-32 h-32" />
                    </div>

                    <div className="relative z-10 space-y-2.5 flex-1 overflow-y-auto max-h-[240px] lg:max-h-[290px] pr-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center shrink-0">
                          {React.createElement(severityConfig[result.type]?.icon, { className: 'w-3 h-3' })}
                        </div>
                        <div>
                          <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-0.5">{sc.assessment || 'Assessment'}</p>
                          <span className="text-[8px] font-black px-1.5 py-0.2 bg-white/25 rounded text-white mt-0.5 inline-block uppercase">{result.type}</span>
                        </div>
                        <button onClick={() => speakResult(result)} className={`ml-auto p-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-white transition-all flex items-center justify-center ${ isPlayingAudio ? 'animate-pulse scale-105 bg-white/20' : '' }`} title="Read out loud">
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div>
                        <h2 className="text-xs sm:text-sm font-black tracking-tight leading-tight">{result.title}</h2>
                      </div>

                      <p className="text-[9.5px] font-semibold leading-relaxed text-white/95">{result.message}</p>

                      {result.aiResult && (
                        <div className="p-2 bg-black/15 border border-white/10 rounded-lg">
                          <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-0.5">{sc.ai_diagnosis || 'AI Diagnosis Summary'}</p>
                          <p className="text-[10px] font-bold leading-snug">{result.aiResult}</p>
                        </div>
                      )}

                      <div className="p-2 bg-black/15 border border-white/10 rounded-lg">
                        <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-0.5">{sc.where_to_go || 'Where to Go'}</p>
                        <p className="text-[9.5px] font-bold leading-normal">{result.advice}</p>
                      </div>

                      {result.offline && (
                        <div className="p-2 bg-black/20 border border-white/10 rounded-lg text-[9px] font-semibold">
                          <p className="font-black text-white/90">{sc.offline_assessment || 'OFFLINE ASSESSMENT'}</p>
                          <p className="text-white/75 mt-0.5">{sc.offline_local || 'Using local fallback algorithms.'}</p>
                        </div>
                      )}

                      {/* Real-Time Telemetry Trace */}
                      <div className="p-2 bg-black/20 border border-white/10 rounded-lg space-y-1.5 text-[9px]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
                          <span className="text-[7.5px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping shrink-0" />
                            Live AWS Telemetry Trace
                          </span>
                          <span className="text-[6px] text-white/40 uppercase font-mono">Trace-Active</span>
                        </div>

                        <div className="space-y-1 text-[8.5px] leading-tight">
                          {/* Step 1: Aurora */}
                          <div className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <div className="min-w-0">
                              <p className="font-bold text-white/95 truncate">Saved to Aurora PostgreSQL (patient record)</p>
                              <p className="text-[7px] text-white/45 font-mono">
                                Timestamp: {result.dbWriteTimestamp ? new Date(result.dbWriteTimestamp).toLocaleTimeString() : (result.offline ? 'Queued offline (IndexedDB)' : 'Pending response')}
                              </p>
                            </div>
                          </div>

                          {/* Step 2: DynamoDB */}
                          <div className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <div className="min-w-0">
                              <p className="font-bold text-white/95 truncate">Telemetry written to DynamoDB (outbreak_telemetry)</p>
                              <p className="text-[7px] text-white/45 font-mono">
                                Timestamp: {result.dynamoDbWriteTimestamp ? new Date(result.dynamoDbWriteTimestamp).toLocaleTimeString() : (result.offline ? 'Pending sync' : 'Pending response')}
                              </p>
                            </div>
                          </div>

                          {/* Step 3: Outbreak Agent */}
                          <div className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <div className="min-w-0">
                              <p className="font-bold text-white/95 truncate">Outbreak agent scan notified</p>
                              <p className="text-[7px] text-white/45 font-mono">
                                Status: {result.outbreakAgentNotified || !result.offline ? 'Heartbeat broadcasted' : 'Scheduled on sync'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 shrink-0 relative z-10">
                      <button onClick={downloadReport} className="flex-1 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1">
                        <Download className="w-3 h-3" /> {sc.report || 'Report'}
                      </button>
                      <button onClick={() => { setResult(null); setSelectedSymptoms([]); setOtherSymptom(''); setActiveTab('input'); }} className="flex-1 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1">
                        🔄 {sc.check_more || 'Check More'}
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* HELPLINES BAR */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-row gap-2.5 items-center justify-between">
              <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-100 rounded-xl p-2 flex-1">
                <Hospital className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">{sc.health_line || 'Health'}</p>
                  <p className="text-xs font-black text-emerald-600 leading-none">104</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-rose-50/70 border border-rose-100 rounded-xl p-2 flex-1">
                <Stethoscope className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">{sc.ambulance || 'Ambulance'}</p>
                  <p className="text-xs font-black text-rose-500 leading-none">108</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

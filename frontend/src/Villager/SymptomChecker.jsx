import { useState, useRef } from 'react';
import { Mic, Activity, AlertCircle, Volume2, ShieldCheck, HeartPulse, Scan, Upload } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const AI_SERVICE_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

export default function SymptomChecker() {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [skinImage, setSkinImage] = useState(null);
  const [skinPreview, setSkinPreview] = useState(null);
  const fileInputRef = useRef(null);

  const symptomList = [
    // Original 8
    { id: 'fever',        label: t.diseaseChecker?.fever        || 'Fever / High Temperature',       severe: false },
    { id: 'cough',        label: t.diseaseChecker?.cough        || 'Continuous Cough',                severe: false },
    { id: 'chest_pain',   label: t.diseaseChecker?.chest_pain   || 'Severe Chest Pain',               severe: true  },
    { id: 'breathing',    label: t.diseaseChecker?.breathing    || 'Difficulty Breathing',            severe: true  },
    { id: 'bleeding',     label: t.diseaseChecker?.bleeding     || 'Heavy Bleeding',                  severe: true  },
    { id: 'headache',     label: t.diseaseChecker?.headache     || 'Strong Headache',                 severe: false },
    { id: 'vomiting',     label: t.diseaseChecker?.vomiting     || 'Vomiting / Nausea',               severe: false },
    { id: 'weakness',     label: t.diseaseChecker?.weakness     || 'Extreme Weakness / Fatigue',      severe: false },
    // 12 new symptoms — critical for rural India (Malaria, Dengue, TB, Jaundice, UTI, Diarrhea)
    { id: 'chills',       label: 'Chills / Body Shivering ठंड लगना',                              severe: false },
    { id: 'diarrhea',     label: 'Diarrhea / Loose Motions दस्त',                                 severe: false },
    { id: 'yellow_eyes',  label: 'Yellow Eyes / Skin (Jaundice) पीलिया रोग',               severe: true  },
    { id: 'rash',         label: 'Skin Rash / Red Spots चकत्ते',                                severe: false },
    { id: 'joint_pain',   label: 'Joint Pain / Body Ache जोड़ों में दर्द',                    severe: false },
    { id: 'burn_urine',   label: 'Burning Urination (UTI) पेशाब में जलन',                 severe: false },
    { id: 'stomach_pain', label: 'Stomach / Abdominal Pain पेट दर्द',                      severe: false },
    { id: 'swelling',     label: 'Swelling in Body / Legs सूजन',                               severe: false },
    { id: 'loss_appetite',label: 'Loss of Appetite भूख न लगना',                            severe: false },
    { id: 'night_sweats', label: 'Night Sweats / TB Indicator रात में पसीना',              severe: false },
    { id: 'ear_pain',     label: 'Ear Pain / Discharge कान दर्द',                          severe: false },
    { id: 'eye_redness',  label: 'Eye Redness / Discharge आंख लाल होना',                   severe: false },
    { id: 'snake_bite',   label: 'Snake Bite / Poisoning सांप का काटना',                     severe: true  },
    { id: 'heat_stroke',  label: 'Heatstroke / Sunstroke लू लगना',                        severe: true  },
    { id: 'itching',      label: 'Itching / Skin Infection खुजli',                       severe: false },
  ];

  const handleSymptomChange = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSkinImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setSkinPreview(reader.result);
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  // Voice-to-symptom: say keyword → auto-selects matching symptom checkbox
  const handleVoiceSymptom = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    // Use current app language for recognition — critical for Hindi/Marathi users
    rec.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : lang === 'ta' ? 'ta-IN' : lang === 'bn' ? 'bn-IN' : 'en-IN';
    rec.onresult = (e) => {
      const spoken = e.results[0][0].transcript.toLowerCase();
      // Keyword map: spoken words → symptom IDs
      const map = {
        // Original symptoms
        fever: 'fever', bukhar: 'fever', bukhaar: 'fever',
        cough: 'cough', khansi: 'cough', khaansi: 'cough',
        chest: 'chest_pain', seena: 'chest_pain',
        breath: 'breathing', saans: 'breathing',
        bleed: 'bleeding', khoon: 'bleeding',
        headache: 'headache', sir: 'headache', sar: 'headache',
        vomit: 'vomiting', ulti: 'vomiting',
        weak: 'weakness', kamzor: 'weakness',
        // New 12 symptom keywords
        chill: 'chills', thand: 'chills', kaamp: 'chills',
        diarrhea: 'diarrhea', dast: 'diarrhea', loose: 'diarrhea',
        yellow: 'yellow_eyes', peela: 'yellow_eyes', jaundice: 'yellow_eyes', piliya: 'yellow_eyes',
        rash: 'rash', chakte: 'rash', daane: 'rash',
        joint: 'joint_pain', jodo: 'joint_pain', body: 'joint_pain',
        urine: 'burn_urine', peshaab: 'burn_urine', jalan: 'burn_urine',
        stomach: 'stomach_pain', pet: 'stomach_pain', abdomen: 'stomach_pain',
        swell: 'swelling', sujan: 'swelling',
        appetite: 'loss_appetite', bhookh: 'loss_appetite',
        night: 'night_sweats', raat: 'night_sweats', tb: 'night_sweats',
        ear: 'ear_pain', kaan: 'ear_pain',
        eye: 'eye_redness', aankh: 'eye_redness', laal: 'eye_redness',
        snake: 'snake_bite', saamp: 'snake_bite', bite: 'snake_bite',
        heat: 'heat_stroke', loo: 'heat_stroke', garmi: 'heat_stroke',
        itch: 'itching', khujli: 'itching', daad: 'itching',
      };
      const matched = Object.keys(map).filter(kw => spoken.includes(kw)).map(kw => map[kw]);
      if (matched.length > 0) {
        setSelectedSymptoms(prev => [...new Set([...prev, ...matched])]);
      }
    };
    rec.start();
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0 && !skinImage) return;
    setLoading(true);
    setResult(null);

    // --- SKIN IMAGE: call real FastAPI /predict/skin endpoint ---
    if (skinImage) {
      try {
        const formData = new FormData();
        formData.append('file', skinImage);
        const res = await fetch(`${AI_SERVICE_URL}/predict/skin`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResult({
          type: data.severity === 'severe' ? 'severe' : 'mild',
          prediction: data.prediction,
          confidence: Math.round(data.confidence * 100),
          markers: data.markers,
          source: 'skin',
        });
      } catch (err) {
        console.error('Skin AI error:', err);
        setResult({
          type: 'error',
          message: 'Skin analysis service unavailable. Please try again.',
        });
      }
      setLoading(false);
      return;
    }

    // --- SYMPTOM CHECKBOXES: call real backend /villager/symptoms ---
    const symptomText = selectedSymptoms
      .map((id) => symptomList.find((s) => s.id === id)?.label || id)
      .join(', ');

    try {
      const res = await api.post('/villager/symptoms', { symptoms: symptomText });
      const { prediction, confidence, alert: outbreakAlert, alternatives, model, accuracy } = res.data;
      const isSevere = selectedSymptoms.some((id) => symptomList.find((s) => s.id === id)?.severe);
      setResult({
        type: isSevere ? 'severe' : 'mild',
        prediction,
        confidence: confidence ? Math.round(confidence * 100) : null,
        alternatives,
        model,
        accuracy,
        alert: outbreakAlert,
        message: isSevere
          ? t.diseaseChecker?.severe_msg || 'CRITICAL: Severe symptoms detected. Go to hospital immediately.'
          : t.diseaseChecker?.mild_msg || 'Mild condition. Rest and monitor. See a doctor if it worsens.',
        source: 'symptom',
      });
    } catch (err) {
      console.error('Symptom AI error:', err);
      // Graceful offline fallback — rule-based only if API is down
      const isSevere = selectedSymptoms.some((id) => symptomList.find((s) => s.id === id)?.severe);
      setResult({
        type: isSevere ? 'severe' : 'mild',
        prediction: isSevere ? 'Possible Emergency' : 'Mild Condition',
        message: isSevere
          ? t.diseaseChecker?.severe_msg || 'CRITICAL: Severe symptoms detected. Go to hospital immediately.'
          : t.diseaseChecker?.mild_msg || 'Mild condition. Rest and monitor.',
        source: 'offline',
      });
    }
    setLoading(false);
  };

  // TTS: Speak the diagnosis result aloud for low-literacy rural users
  const speakResult = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const speechLang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : lang === 'ta' ? 'ta-IN' : lang === 'bn' ? 'bn-IN' : 'en-IN';
    utterance.lang = speechLang;
    utterance.rate = 0.85;
    utterance.pitch = 1.1; // Slightly higher pitch for female voice simulation

    // Dynamically select a premium female voice (Microsoft Neerja, Google Hindi Female, Swara, Heera, etc.)
    const voices = window.speechSynthesis.getVoices();
    const l = speechLang.toLowerCase().split('-')[0];
    
    // 1. Search specifically for "neerja" first for Hindi
    let femaleVoice = null;
    if (l === 'hi') {
      femaleVoice = voices.find(v => 
        v.lang.toLowerCase().replace('_', '-').startsWith('hi') && 
        v.name.toLowerCase().includes('neerja')
      );
    }
    
    // 2. If not found, look for general premium female Hindi/regional voices
    if (!femaleVoice) {
      femaleVoice = voices.find(v => 
        v.lang.toLowerCase().replace('_', '-').startsWith(l) && 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('swara') || 
         v.name.toLowerCase().includes('heera') || 
         v.name.toLowerCase().includes('kalpana') || 
         v.name.toLowerCase().includes('google') ||
         (v.name.toLowerCase().includes('microsoft') && 
          !v.name.toLowerCase().includes('david') && 
          !v.name.toLowerCase().includes('ravi') && 
          !v.name.toLowerCase().includes('karan') && 
          !v.name.toLowerCase().includes('hemant'))) // Exclude male Hemant voice
      );
    }

    if (!femaleVoice) {
      femaleVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(l));
    }

    if (!femaleVoice) {
      femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('zira') || 
        v.name.toLowerCase().includes('hazel') || 
        v.name.toLowerCase().includes('samantha')
      );
    }

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Home remedies lookup — post-diagnosis first-aid for rural patients
  const REMEDIES = {
    'fever':          ['Stay hydrated — drink ORS / coconut water every hour', 'Rest in a cool, shaded area and use a wet cloth on forehead', 'Take paracetamol 500mg if temp >101°F. See doctor if fever lasts 3+ days'],
    'malaria':        ['Take prescribed anti-malarial immediately — do not delay', 'Sleep under a mosquito net tonight', 'Drink plenty of fluids. Go to PHC within 24 hours'],
    'dengue':         ['Rest completely — no physical exertion', 'Drink papaya leaf juice if available — helps platelet count', 'Do NOT take ibuprofen/aspirin. Only paracetamol is safe'],
    'typhoid':        ['Only soft boiled food — no raw vegetables or street food', 'Drink only boiled or filtered water', 'Take prescribed antibiotics full course without missing doses'],
    'diarrhea':       ['Drink 1 glass ORS after every loose stool', 'Eat boiled rice, bananas, and curd (no spicy food)', 'See doctor if blood in stool or more than 6 stools per day'],
    'jaundice':       ['Complete bed rest — no physical work', 'Drink sugarcane juice / glucose water hourly', 'Strictly avoid oil, ghee, and alcohol. Visit PHC urgently'],
    'tb':             ['Wear a mask around family members', 'Sleep in a separate, well-ventilated room', 'Start DOTS treatment from nearest PHC — it is free'],
    'uti':            ['Drink 2–3 liters of water daily to flush infection', 'Avoid holding urine — go as soon as you feel the urge', 'See a doctor for antibiotic prescription — do not self-medicate'],
    'mild':           ['Rest and drink plenty of fluids', 'Eat light, easily digestible food', 'Monitor symptoms and see an ASHA worker if no improvement in 2 days'],
    'default':        ['Rest well and stay hydrated', 'Do not take any unknown medicines without a doctor\'s advice', 'Contact your ASHA worker or visit the nearest PHC'],
  };

  const getRemedies = (prediction) => {
    if (!prediction) return REMEDIES.default;
    const p = prediction.toLowerCase();
    if (p.includes('malaria'))  return REMEDIES.malaria;
    if (p.includes('dengue'))   return REMEDIES.dengue;
    if (p.includes('typhoid'))  return REMEDIES.typhoid;
    if (p.includes('diarrhea') || p.includes('diarrhoea')) return REMEDIES.diarrhea;
    if (p.includes('jaundice') || p.includes('yellow'))    return REMEDIES.jaundice;
    if (p.includes('tb') || p.includes('tuberculosis'))    return REMEDIES.tb;
    if (p.includes('uti') || p.includes('urin'))           return REMEDIES.uti;
    if (p.includes('fever'))    return REMEDIES.fever;
    if (p.includes('mild'))     return REMEDIES.mild;
    return REMEDIES.default;
  };

  return (
    <div className="bg-white rounded-[50px] shadow-2xl p-8 lg:p-12 w-full translate-y-[-20px] animate-in fade-in slide-in-from-bottom-10 duration-1000 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center gap-4 mb-10 overflow-hidden relative group">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-[24px] flex items-center justify-center p-4 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform">
          <HeartPulse className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.diseaseChecker?.ai_axis || 'Smart Health Checker'}</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">AI Powered · Real-time Analysis</p>
        </div>
      </div>

      <div className="space-y-10 relative z-10 p-2">
        {/* SYMPTOM CHECKBOXES */}
        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <Scan className="w-6 h-6 text-indigo-500" />
            <label className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">
              {t.diseaseChecker?.choose_symptoms || 'Select Your Symptoms'}
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {symptomList.map((symp) => (
              <label
                key={symp.id}
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedSymptoms.includes(symp.id)
                    ? 'bg-indigo-50 border-indigo-500 shadow-md transform scale-[1.02]'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 w-6 h-6 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition-all"
                  checked={selectedSymptoms.includes(symp.id)}
                  onChange={() => handleSymptomChange(symp.id)}
                />
                <span className={`font-bold text-lg leading-tight ${selectedSymptoms.includes(symp.id) ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {symp.label}
                  {symp.severe && <span className="ml-2 text-xs text-red-500 font-black uppercase">⚠ Critical</span>}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* SKIN DISEASE UPLOAD */}
        <div className="p-8 bg-teal-50 rounded-[40px] border border-teal-100">
          <div className="flex items-center gap-3 mb-6">
            <Scan className="w-6 h-6 text-teal-600" />
            <label className="text-sm font-black uppercase tracking-[0.1em] text-teal-900">
              {t.diseaseChecker?.title || 'Check Skin Disease (AI Pixel Analysis)'}
            </label>
          </div>
          {!skinPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-4 border-dashed border-teal-300 bg-white hover:bg-teal-100/50 transition-colors rounded-3xl flex flex-col items-center justify-center cursor-pointer group"
            >
              <Upload className="w-12 h-12 text-teal-400 mb-4 group-hover:-translate-y-2 transition-transform duration-300" />
              <span className="text-lg font-bold text-teal-700">{t.diseaseChecker?.scanner_desc || 'Tap here to upload a skin photo'}</span>
              <p className="text-sm font-medium text-teal-500 mt-2">Real AI pixel analysis · JPG, PNG, WEBP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          ) : (
            <div className="w-full h-64 rounded-3xl overflow-hidden relative border-4 border-teal-500 shadow-lg">
              <img src={skinPreview} alt="Skin Upload" className="w-full h-full object-cover" />
              <button
                onClick={() => { setSkinPreview(null); setSkinImage(null); setResult(null); }}
                className="absolute top-4 right-4 bg-slate-900/80 hover:bg-red-600 px-4 py-2 rounded-xl text-white font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" /> Remove
              </button>
            </div>
          )}
        </div>

        {/* ANALYZE BUTTON */}
        <div className="flex flex-col gap-6 pt-4">
          <button
            onClick={handleAnalyze}
            disabled={loading || (selectedSymptoms.length === 0 && !skinImage)}
            className="w-full py-6 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-[28px] text-[14px] font-black tracking-[0.2em] uppercase transition-all shadow-xl disabled:shadow-none flex items-center justify-center gap-4 group"
          >
            {loading ? (
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-emerald-300 animate-pulse">
                  {skinImage ? 'Analyzing skin pixels...' : 'Running AI diagnosis...'}
                </span>
              </div>
            ) : (
              <>
                <Activity className="w-6 h-6 group-hover:scale-125 transition-transform" />
                {t.diseaseChecker?.init_scan || 'Analyze Now'}
              </>
            )}
          </button>

          {/* RESULT OUTPUT */}
          {result && result.type !== 'error' && (
            <div
              className={`p-8 rounded-[40px] shadow-2xl relative overflow-hidden border-2 animate-in slide-in-from-bottom-8 duration-700 ${
                result.is_uncertain 
                  ? 'bg-slate-100 border-slate-300 shadow-slate-200 text-slate-900'
                  : result.type === 'severe'
                    ? 'bg-red-600 border-red-500 shadow-red-200 text-white'
                    : 'bg-emerald-500 border-emerald-400 shadow-emerald-200 text-white'
              }`}
            >
              <div className="absolute right-[-20px] top-[-20px] bg-white opacity-10 w-64 h-64 rounded-full blur-3xl" />
              <div className="flex items-start md:items-center gap-6 relative z-10 flex-col md:flex-row">
                <div className={`p-5 backdrop-blur-xl rounded-[24px] border shrink-0 ${
                  result.is_uncertain ? 'bg-slate-200 border-slate-300' : 'bg-white/20 border-white/30'
                }`}>
                  {result.is_uncertain ? <AlertCircle className="w-10 h-10 text-slate-600" /> : <ShieldCheck className="w-10 h-10 text-white" />}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full animate-ping ${result.is_uncertain ? 'bg-slate-400' : 'bg-white'}`} />
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${result.is_uncertain ? 'text-slate-500' : 'text-white/90'}`}>
                      {result.is_uncertain ? 'Safety Guardrail Active' : result.source === 'skin' ? 'Pixel AI Analysis' : result.source === 'offline' ? 'Offline Triage' : 'AI Diagnosis'}
                    </p>
                    <span className={`ml-auto px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                      result.is_uncertain ? 'bg-slate-200 border-slate-300 text-slate-600' : 'bg-white/20 border-white/30 text-white/90'
                    }`}>
                      {result.model || 'Hybrid Model'}
                    </span>
                  </div>

                  <h3 className={`text-3xl font-black mb-2 ${result.is_uncertain ? 'text-slate-900' : 'text-white'}`}>
                    {result.prediction}
                  </h3>

                  {/* Confidence Bar - Only show if not uncertain, or show as low */}
                  {!result.is_uncertain && result.confidence && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${result.is_uncertain ? 'text-slate-400' : 'text-white/80'}`}>Confidence Meter</span>
                        <span className={`text-sm font-black ${result.is_uncertain ? 'text-slate-600' : 'text-white'}`}>{result.confidence}%</span>
                      </div>
                      <div className={`w-full h-3 rounded-full overflow-hidden border ${
                        result.is_uncertain ? 'bg-slate-200 border-slate-300' : 'bg-white/20 border-white/30'
                      }`}>
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${result.is_uncertain ? 'bg-slate-400' : 'bg-white'}`}
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className={`text-lg font-bold leading-tight mb-4 ${result.is_uncertain ? 'text-slate-700' : 'text-white'}`}>
                    {result.message}
                  </p>

                  {/* Alternatives Section */}
                  {result.alternatives && result.alternatives.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-3 italic">Clinical Alternatives to consider:</p>
                      <div className="flex gap-2 flex-wrap">
                        {result.alternatives.map((alt, i) => (
                          <div key={i} className="px-3 py-1.5 bg-white/10 rounded-xl border border-white/20 flex items-center gap-2">
                            <span className="text-[11px] font-black text-white">{alt.disease}</span>
                            <span className="text-[9px] font-bold text-white/60">{(alt.confidence * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 🔊 TTS Button */}
                  <button
                    onClick={() => speakResult(`${result.prediction || ''}. ${result.message || ''}`)}     
                    className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 rounded-2xl text-slate-900 text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                  >
                    <Volume2 className="w-4 h-4" /> Listen to Result
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HOME REMEDIES — shown after any successful diagnosis */}
          {result && result.type !== 'error' && (
            <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-[32px] animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white text-base">🌿</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Post-Diagnosis First Aid</p>
                  <h4 className="text-sm font-black text-amber-900">Home Remedies While You Wait</h4>
                </div>
              </div>
              <ul className="space-y-2.5">
                {getRemedies(result.prediction).map((remedy, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 bg-amber-300 text-amber-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-amber-800 font-semibold text-sm leading-relaxed">{remedy}</p>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-amber-500 font-bold mt-4 uppercase tracking-widest">⚠ These are not a substitute for medical treatment. Always see a doctor.</p>
            </div>
          )}
          {result?.type === 'error' && (
            <div className="p-6 bg-orange-50 border-2 border-orange-300 rounded-[32px] flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-orange-500 shrink-0" />
              <p className="text-orange-800 font-bold">{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

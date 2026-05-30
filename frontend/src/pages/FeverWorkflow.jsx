import { useState, useEffect } from 'react';
import { motion as motionElement } from 'framer-motion';
import { Activity, ChevronLeft, Check, CheckCircle2, RefreshCw } from 'lucide-react';
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

export default function FeverWorkflow({ onBack, lang, voiceEnabled }) {
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
      qHi: 'क्या आपके जोड़ों में तेज दर्द है या आँखों के पीछे दर्द है?',
      voiceEn: 'Do you have severe joint pain or pain behind your eyes?',
      voiceHi: 'क्या आपके जोड़ों में तेज़ दर्द है या आँखों के पीछे दर्द है?'
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
      'Chickenpox / चेचक (छोटी माता)': lang === 'hi' ? 'अलग कमरे में रहें, खुजली से बचें और एहतियात के तौर पर आशा कार्यकर्ता को सूचित करें।' : 'Isolate yourself, avoid scratching, apply soothing lotion, and alert ASHA.',
      'Viral Fever & Cold / सामान्य बुखार और सर्दी': lang === 'hi' ? 'गर्म पानी पिएं, विश्राम करें और ३ दिन से अधिक बुखार रहने पर सरकारी अस्पताल जाएं।' : 'Drink warm water, take rest, take paracetamol, and visit PHC if fever persists > 3 days.'
    }[predictedDisease];

    setResult({ disease: predictedDisease, urgency, advice });

    if (voiceEnabled) {
      const diagnosisText = lang === 'hi'
        ? `संभावित बीमारी है: ${predictedDisease.split(' / ')[1]}. सलाह: ${advice}`
        : `Potential condition: ${predictedDisease.split(' / ')[0]}. Advice: ${advice}`;
      speak(diagnosisText, lang);
    }

    try {
      const summaryText = `[Guided Mode Fever Flow] highFever:${finalAnswers.highFever ? 'Y' : 'N'} shiver:${finalAnswers.shiver ? 'Y' : 'N'} jointPain:${finalAnswers.jointPain ? 'Y' : 'N'} rash:${finalAnswers.rash ? 'Y' : 'N'}`;
      await api.post('/villager/symptoms', { symptoms: summaryText });
    } catch (err) {
      console.warn('Offline or error logging symptom check to backend:', err.message);
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
    <motionElement.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-8 sm:p-12 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 max-w-2xl mx-auto">
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
            <motionElement.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 py-4">
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
            </motionElement.div>
          )}
        </div>
      )}
    </motionElement.div>
  );
}

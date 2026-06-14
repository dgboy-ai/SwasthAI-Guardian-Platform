import { useState } from 'react';
import { motion } from 'framer-motion';
import { Baby, ChevronLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { speak } from '../utils/tts';

export default function PregnancyWorkflow({ onBack, lang, voiceEnabled }) {
  const [form, setForm] = useState({ age: 24, trimester: 1, systolic: 120, diastolic: 80, sugar: 5.2 });
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState(null);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

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

    try {
      const offlineRecord = {
        id: `offline-${Date.now()}`,
        name: `Villager-${Date.now().toString().slice(-4)}`,
        age: form.age,
        trimester: form.trimester,
        dueDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

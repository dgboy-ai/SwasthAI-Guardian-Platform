import { useState } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, ChevronLeft, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { speak } from '../utils/tts';

export default function ChildWorkflow({ onBack, lang, voiceEnabled }) {
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

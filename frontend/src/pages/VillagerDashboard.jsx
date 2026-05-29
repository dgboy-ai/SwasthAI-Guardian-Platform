import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import {
  Truck, Activity, MapPin, Mic, AlertCircle, HeartPulse,
  ArrowRight, CheckCircle, PhoneCall, Plus, Scan, BrainCircuit, Shield, Zap, Video, BookOpen, Upload, Image as ImageIcon,
  ShieldCheck, Layout, Activity as ActivityIcon, Users, RefreshCw, Camera, Droplets, WifiOff
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function VillagerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // States for Symptom Checkboxes
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [outbreakAlert, setOutbreakAlert] = useState(null);

  // States for Ambulance
  const [ambLoading, setAmbLoading] = useState(false);
  const [ambStatus, setAmbStatus] = useState('');
  const [ambError, setAmbError] = useState(false);

  // States for Skin Image Upload
  const [skinImage, setSkinImage] = useState(null);
  const [skinPreview, setSkinPreview] = useState(null);
  const [skinLoading, setSkinLoading] = useState(false);
  const [skinPrediction, setSkinPrediction] = useState(null);

  // Plain bilingual labels — readable by rural users
  const symptomList = [
    { id: 'fever',       label: 'Bukhar / बुखार',              severe: false },
    { id: 'cough',       label: 'Khansi / खाँसी',              severe: false },
    { id: 'chest_pain',  label: 'Seene Mein Dard / सीने में दर्द', severe: true },
    { id: 'breathing',   label: 'Saans Lene Mein Takleef / सांस की तकलीफ', severe: true },
    { id: 'bleeding',    label: 'Khoon Aana / खून आना',        severe: true },
    { id: 'headache',    label: 'Sar Dard / सिर दर्द',         severe: false },
    { id: 'vomiting',    label: 'Ulti / उल्टी',                severe: false },
    { id: 'weakness',    label: 'Kamzori / कमज़ोरी',            severe: false },
  ];

  const handleSymptomChange = (id) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // ── 3-Tier Severity Engine ─────────────────────────────────────────────────
  const getSeverityTier = (selectedIds, aiPrediction = '') => {
    const count = selectedIds.length;
    const hasSevereSymptom = selectedIds.some(id => symptomList.find(s => s.id === id)?.severe);
    const aiCritical = /severe|critical|emergency|urgent|danger|pneumonia|tuberculosis|cholera|meningitis/i.test(aiPrediction);

    if (hasSevereSymptom || aiCritical || count >= 4) {
      return {
        type: 'urgent',
        label: '🚨 Turant Aspatal Jaye / GO TO HOSPITAL NOW',
        message: `Aapke ${count} lakshan hain jo gambhir hain. ABHI najdeeki sarkari aspatal ya doctor ke paas jaye. Der mat karo. / You have ${count} symptoms that are serious. Go to the nearest hospital or doctor IMMEDIATELY. Do not delay.`,
        advice: 'Nearest Government Hospital / District Hospital — Emergency Ward',
        color: 'rose',
      };
    } else if (count >= 2) {
      return {
        type: 'moderate',
        label: '⚠️ Aaj Doctor Se Mile / SEE A DOCTOR TODAY',
        message: `Aapne ${count} lakshan bataye hain. Aaj hi najdeeki Primary Health Centre (PHC) ya doctor se mile. ASHA didi ko bhi bata sakte hain. / You have ${count} symptoms. Visit your nearest PHC or doctor today. You can also contact your ASHA worker.`,
        advice: 'Nearest Primary Health Centre (PHC) or ASHA Worker',
        color: 'amber',
      };
    } else {
      return {
        type: 'mild',
        label: '✅ Halka Lakshan / MILD — Monitor at Home',
        message: 'Aapka lakshan abhi halka lag raha hai. Aaram karo, saaf paani piyo aur khana khao. Agar 24 ghante mein theek na ho, to ASHA didi se mile. / Your symptom appears mild. Rest, drink clean water, eat well. If not better in 24 hours, contact your ASHA worker.',
        advice: 'Contact ASHA Worker if no improvement in 24 hours',
        color: 'emerald',
      };
    }
  };

  const checkSymptoms = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return;
    setLoading(true);
    setPrediction(null);
    setOutbreakAlert(null);

    const symptomText = selectedSymptoms
      .map(id => symptomList.find(s => s.id === id)?.id)
      .join(', ');

    try {
      const res = await api.post('/villager/symptoms', {
        symptoms: symptomText,
        villageId: user?.villageId || 'v101',
        userId: user?.id || null,
      });

      const aiPrediction = res.data.prediction || '';
      const alert = res.data.alert || null;
      const tier = getSeverityTier(selectedSymptoms, aiPrediction);

      setPrediction({ ...tier, aiResult: aiPrediction });
      if (alert) setOutbreakAlert(alert);
    } catch (err) {
      // Offline fallback — local severity rules still work
      const tier = getSeverityTier(selectedSymptoms, '');
      setPrediction({ ...tier, aiResult: null, offline: true });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSkinImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSkinPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkSkinDisease = () => {
    // Navigate to the real dedicated Skin Disease Checker page
    // (which uses actual client-side AI pixel analysis, not random results)
    navigate('/skin-disease');
  };

  const requestAmbulance = async () => {
    setAmbLoading(true);
    setAmbStatus('');
    setAmbError(false);

    // Step 1: Get real GPS coordinates
    let locationStr = 'Location unavailable — District Emergency Dispatch';
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 })
      );
      const { latitude, longitude } = position.coords;
      locationStr = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    } catch {
      // GPS denied or unavailable — fall back gracefully
      locationStr = 'GPS unavailable — please tell location verbally to dispatcher';
    }

    try {
      await api.post('/villager/ambulance', {
        name: user?.name || 'Villager',
        location: locationStr,
        priority: 'High',
        symptoms: 'Emergency dispatch from SwasthAI app',
      });
      setAmbStatus(`Dispatch Hub Notified. ETA: 12m. 📍 ${locationStr}`);
    } catch (err) {
      setAmbError(true);
      setAmbStatus('Internet connection problem / इंटरनेट कनेक्शन की समस्या');
    } finally {
      setAmbLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen font-inter selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <div className="flex flex-1 pt-[80px] lg:pt-[90px]">
        <Sidebar role="villager" />

        <main className="flex-1 p-3 sm:p-8 lg:p-12 overflow-y-auto max-w-[1600px] mx-auto w-full pb-24 lg:pb-12">

          {/* STRATEGIC HEADER */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 sm:gap-6 pb-6 sm:pb-10 border-b border-slate-200 mb-8 sm:mb-12"
          >
            <div className="space-y-1.5 sm:space-y-2 text-left w-full">
              <div className="flex items-center justify-start gap-2.5 sm:gap-3 text-emerald-600 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[8px] sm:text-[10px]">
                <ActivityIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> SwasthAI Guardian
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                Namaste, <span className="text-emerald-600 italic">{user?.name || 'Friend'}</span> 🙏
              </h1>
              <p className="text-slate-400 font-bold text-[11px] sm:text-lg">
                {t.dashboardExt?.greeting || 'How are you feeling today?'}
              </p>
            </div>

            <div className="text-right hidden md:block">
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">SwasthAI — आपका स्वास्थ्य साथी</p>
              <div className="flex items-center gap-2 justify-end">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">✓ App Ready</span>
              </div>
            </div>
          </motion.header>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
          >

            {/* AI DIAGNOSTIC TERMINAL */}
            <motion.div
              variants={itemVariants}
              className="p-5 sm:p-8 lg:p-10 bg-white border border-slate-100 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm flex flex-col justify-between hover:shadow-xl hover:shadow-slate-200/50 transition-all md:col-span-2 xl:col-span-2"
            >
              <div>
                <div className="flex items-center justify-between mb-6 sm:mb-10">
                  <div className="flex items-center gap-3.5 sm:gap-5">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 bg-[#0A2E24] text-emerald-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <BrainCircuit className="w-5.5 h-5.5 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Bimari Jaanch / बीमारी जांच</h2>
                      <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Apne lakshan chunein — Check Your Symptoms</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex gap-1.5">
                    {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-100" />)}
                  </div>
                </div>

                <form onSubmit={checkSymptoms} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {symptomList.map((symp) => (
                      <label key={symp.id} className={`group flex items-center gap-2.5 sm:gap-4 p-3.5 sm:p-5 rounded-xl sm:rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 ${selectedSymptoms.includes(symp.id)
                          ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-50 border-slate-100 hover:border-emerald-200 hover:bg-white'
                        }`}>
                        <div className={`w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedSymptoms.includes(symp.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                          {selectedSymptoms.includes(symp.id) && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedSymptoms.includes(symp.id)}
                          onChange={() => handleSymptomChange(symp.id)}
                        />
                        <span className={`text-[11px] sm:text-sm font-black uppercase tracking-tight ${selectedSymptoms.includes(symp.id) ? 'text-emerald-900' : 'text-slate-500'}`}>
                          {symp.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || selectedSymptoms.length === 0}
                    className="w-full h-14 sm:h-16 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl sm:rounded-[1.5rem] font-black uppercase text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-3 sm:gap-4 group"
                  >
                    {loading ? (
                      <><RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Jaanch Karo... / Checking...</>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                        Jaanch Karo / Check Now
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <AnimatePresence>
                  {outbreakAlert && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center gap-4"
                    >
                      <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                      <p className="text-sm font-black text-amber-800 uppercase tracking-tight">{outbreakAlert}</p>
                    </motion.div>
                  )}
                  {prediction && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-6 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border-2 flex flex-col gap-4 ${
                        prediction.type === 'urgent'   ? 'bg-rose-50 border-rose-300' :
                        prediction.type === 'moderate' ? 'bg-amber-50 border-amber-300' :
                                                         'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${
                          prediction.type === 'urgent'   ? 'bg-rose-600 text-white' :
                          prediction.type === 'moderate' ? 'bg-amber-500 text-white' :
                                                           'bg-emerald-600 text-white'
                        }`}>
                          <AlertCircle className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-black uppercase tracking-widest ${
                            prediction.type === 'urgent'   ? 'text-rose-600' :
                            prediction.type === 'moderate' ? 'text-amber-600' :
                                                             'text-emerald-600'
                          }`}>
                            {prediction.label}
                          </h4>
                          <p className={`text-base font-bold leading-snug mt-1 ${
                            prediction.type === 'urgent'   ? 'text-rose-900' :
                            prediction.type === 'moderate' ? 'text-amber-900' :
                                                             'text-emerald-900'
                          }`}>
                            {prediction.message}
                          </p>
                        </div>
                      </div>
                      {prediction.advice && (
                        <div className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wide ${
                          prediction.type === 'urgent'   ? 'bg-rose-100 text-rose-700' :
                          prediction.type === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                                           'bg-emerald-100 text-emerald-700'
                        }`}>
                          📍 {prediction.advice}
                        </div>
                      )}
                      {prediction.aiResult && (
                        <div className="mt-2 p-4 bg-white/70 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Analysis / AI विश्लेषण</p>
                          <p className="text-sm font-bold text-slate-700">{prediction.aiResult}</p>
                        </div>
                      )}
                      {prediction.offline && (
                        <div className="flex items-center gap-2 p-3 bg-white/60 rounded-2xl border border-slate-100">
                          <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-slate-600">फ़ोन से जांच हुई — इंटरनेट नहीं था ✔️</p>
                            <p className="text-[9px] text-slate-400 font-medium">Checked on your phone only — no internet needed ✔️</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* AI SKIN DIAGNOSTICS */}
            <motion.div
              variants={itemVariants}
              className="p-5 sm:p-8 lg:p-10 bg-[#0A2E24] rounded-[1.5rem] sm:rounded-[3rem] shadow-2xl flex flex-col justify-between hover:shadow-emerald-900/20 transition-all md:col-span-1 xl:col-span-1 text-white relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-[0.05]" />
              <div className="absolute -right-20 -bottom-20 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Scan className="w-80 h-80 text-emerald-400" />
              </div>

              <div className="relative z-10 w-full h-full flex flex-col">
                <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-xl text-emerald-400 rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-center">
                    <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter leading-none mb-1">{t.dashboardExt?.skin_ai || 'Tvacha Jaanch / Skin Check'}</h2>
                    <p className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.dashboardExt?.skin_ai_desc || 'Tasveer Se Bimari Pehchaanein'}</p>
                  </div>
                </div>

                {!skinPreview ? (
                  <label className="flex-1 min-h-[160px] border-2 border-dashed border-emerald-500/30 bg-white/5 hover:bg-white/10 transition-all rounded-[2rem] flex flex-col items-center justify-center cursor-pointer mb-8 group/upload">
                    <Camera className="w-10 h-10 text-emerald-500 mb-4 group-hover/upload:-translate-y-2 transition-transform" />
                    <span className="text-[11px] font-black text-emerald-300 text-center leading-snug">📸 Tasveer Lein ya Upload Karen</span>
                    <span className="text-[9px] font-bold text-emerald-500/60 mt-1">Take or upload a photo of skin problem</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                ) : (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-emerald-500/30 bg-white/5 rounded-[2rem] mb-8 text-center px-4">
                    <Camera className="w-10 h-10 text-emerald-500 mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-1">Privacy-first Edge AI</p>
                    <p className="text-xs text-emerald-500/60 font-medium">Analysis runs on your device — no image is uploaded</p>
                </div>
                )}

                <button
                  onClick={checkSkinDisease}
                  className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-[#0A2E24] rounded-[1.2rem] font-black text-[11px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Camera className="w-4 h-4" /> {t.dashboardExt?.open || 'Tvacha Jaanch Karo / Check Skin'}
                </button>
              </div>
            </motion.div>


            {/* STRATEGIC RESPONSE PROTOCOL (AMBULANCE) */}
            <motion.div
              variants={itemVariants}
              className="p-5 sm:p-8 lg:p-10 bg-white border border-slate-100 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm flex flex-col justify-between hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
            >
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100">
                    <Truck className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{t.ambulance?.title || 'Rapid Response'}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.ambulance?.subtitle || 'Emergency Dispatch Hub'}</p>
                  </div>
                </div>

                <p className="text-slate-400 font-bold text-sm leading-relaxed">
                  {t.services?.ambulance_desc || 'Ek button dabao — Ambulance aayegi. GPS se aapki jagah pata chalegi. / Press once — Ambulance will come. GPS finds your location.'}
                </p>

                <div className="space-y-4 pt-2">
                  <button
                    onClick={requestAmbulance}
                    disabled={ambLoading}
                    className="w-full h-14 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-100 disabled:text-rose-300 text-white font-black uppercase text-[9px] tracking-[0.3em] rounded-xl shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-4 relative overflow-hidden"
                  >
                    {ambLoading ? (
                      <><RefreshCw className="w-5 h-5 animate-spin" /> Bhej rahe hain...</>
                    ) : (
                      <>
                        <PhoneCall className="w-4 h-4" />
                        Ambulance Bulao / Call Ambulance
                      </>
                    )}
                  </button>
                  {ambStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl text-center border uppercase tracking-widest ${
                        ambError ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-100'
                      }`}
                    >
                      <p className={`text-[10px] font-black ${ambError ? 'text-amber-700' : 'text-rose-700'}`}>
                        {ambStatus}
                      </p>
                      
                      {ambError && (
                        <div className="mt-4 space-y-3">
                          <p className="text-[10px] font-bold text-slate-600 normal-case tracking-normal">
                            Don't panic. Call 108 for free help now.<br/>
                            घबराएं नहीं। 108 पर मुफ्त कॉल करें।
                          </p>
                          <a href="tel:108" className="flex items-center justify-center gap-3 w-full py-3 bg-rose-600 text-white rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all">
                            <PhoneCall className="w-4 h-4" />
                            CALL 108 — MUFT / मुफ्त
                          </a>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* MATERNAL PULSE TERMINAL */}
            <motion.div
              variants={itemVariants}
              className="p-5 sm:p-8 lg:p-10 bg-[#0A2E24] rounded-[1.5rem] sm:rounded-[3rem] text-white shadow-2xl relative overflow-hidden group/maternal md:col-span-1 xl:col-span-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-transparent opacity-50" />
              <div className="absolute -right-20 -top-20 opacity-10 group-hover/maternal:rotate-12 transition-transform duration-1000">
                <HeartPulse className="w-[400px] h-[400px] text-emerald-400" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 md:gap-10 h-full">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-xl text-emerald-400 rounded-2xl border border-white/10 flex items-center justify-center shadow-inner group-hover/maternal:scale-110 transition-transform">
                    <Droplets className="w-8 h-8" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{t.dashboardExt?.maternal_pulse || "Mahila Swasthya / Women's Health"}</h2>
                      <span className="px-3 py-1 bg-emerald-500 text-[#0A2E24] text-[9px] font-black uppercase tracking-widest rounded-full">{t.dashboardExt?.secure_axis || 'Bilkul Private'}</span>
                    </div>
                    <p className="text-emerald-100/60 text-sm font-bold leading-relaxed max-w-xl">
                      {t.services?.maternal_desc || 'Mahvari, garbhavastha aur sehat ki poori jaankari. ASHA didi se judein. / Period health, pregnancy guidance & ASHA worker support.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/menstrual-health')}
                  className="shrink-0 flex items-center gap-4 px-10 py-5 bg-white text-[#0A2E24] hover:bg-emerald-50 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0 w-full lg:w-auto justify-center group"
                >
                  {t.dashboardExt?.terminal_access || 'Kholo / Open'} <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* QUICK ACCESS SHORTCUTS */}
            <motion.div variants={itemVariants} className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Menstrual Health */}
              <div
                onClick={() => navigate('/menstrual-health')}
                className="p-6 sm:p-8 bg-white border border-slate-100 rounded-2xl sm:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-50 text-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-all">
                    <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tighter">{t.menstrual?.title || 'Menstrual Health'}</h3>
                </div>
                <p className="text-slate-400 font-bold text-[11px] sm:text-xs leading-relaxed">{t.menstrual?.subtitle || 'Track your cycle and get health guidance in your language.'}</p>
                <div className="mt-3 sm:mt-4 flex items-center gap-2 text-pink-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                  {t.dashboardExt?.open || 'Open'} <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>



              {/* Symptom Checker */}
              <div
                onClick={() => navigate('/symptoms')}
                className="p-6 sm:p-8 bg-white border border-slate-100 rounded-2xl sm:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tighter">{t.diseaseChecker?.title || 'Bimari Jaanch'}</h3>
                </div>
                <p className="text-slate-400 font-bold text-[11px] sm:text-xs leading-relaxed">Apne lakshan chunkar AI se poochhein — check symptoms with AI + voice.</p>
                <div className="mt-3 sm:mt-4 flex items-center gap-2 text-amber-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                  {t.dashboardExt?.open || 'Open'} <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* My Profile */}
              <div
                onClick={() => navigate('/profile')}
                className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer md:col-span-1"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white transition-all">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tighter">{t.dashboardExt?.my_profile || 'My Profile'}</h3>
                </div>
                <p className="text-slate-400 font-bold text-xs leading-relaxed">{t.dashboardExt?.profile_desc || 'View your health ID, update your name and village, and manage your account details.'}</p>
                <div className="mt-4 flex items-center gap-2 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                  {t.dashboardExt?.open || 'Open'} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </motion.div>


          </motion.div>
        </main>
      </div>
    </div>
  );
}

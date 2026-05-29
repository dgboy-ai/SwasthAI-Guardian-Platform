import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Camera, ShieldCheck, ChevronRight, RotateCcw, HeartPulse, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import imageCompression from 'browser-image-compression';
// ── PHOTO ANALYSIS: Skin-aware pixel processing ──────────────────────────────
// Only analyzes pixels that look like skin (any skin tone — fair to dark).
// Ignores backgrounds (green, white, blue, walls, clothes, etc.)
// Same photo → always same result. Different photos → different results.
const analyzePhotoPixels = (imgElement) => {
  const SIZE = 300;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgElement, 0, 0, SIZE, SIZE);

  // Analyze center 70% of image — where the skin problem is most likely centered
  const margin = Math.floor(SIZE * 0.15);
  const cropSize = SIZE - margin * 2;
  const { data } = ctx.getImageData(margin, margin, cropSize, cropSize);
  const totalPixels = cropSize * cropSize;

  let skinPixels = 0, redSkinPixels = 0, sumR = 0, sumG = 0;
  const rValues = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];

    // ── Skin pixel detection (works for all skin tones: fair, medium, dark) ──
    // A pixel is likely skin if:
    //   - It has enough red/warmth
    //   - Red is greater than blue (skin rule)
    //   - Not pure green/blue (not background/cloth)
    //   - Not overexposed white or pitch black
    const isSkin = (
      r > 60 && g > 30 && b > 15 &&
      r > b &&
      (r - Math.min(g, b)) > 18 &&
      Math.abs(r - g) < 110 &&
      r < 252 && g < 240
    );

    if (isSkin) {
      skinPixels++;
      sumR += r;
      sumG += g;
      rValues.push(r);

      // Inflamed skin pixel: red is significantly elevated vs green
      const ratio = r / (g + 1);
      if (ratio > 1.38 && r > 130) redSkinPixels++;
    }
  }

  // If almost no skin detected (far away photo / bad angle), return low score
  const skinCoverage = Math.round((skinPixels / totalPixels) * 100);
  if (skinPixels < 500) {
    return { photoScore: 0, rednessPercent: 0, irregularPercent: 0, inflammationRatio: 1.0, skinCoverage, lowQuality: true };
  }

  const avgR = sumR / skinPixels;
  const avgG = sumG / skinPixels;
  const inflammationRatio = parseFloat((avgR / (avgG + 1)).toFixed(2));

  // Redness: % of SKIN pixels that are inflamed (not whole image)
  const rednessPercent = Math.round((redSkinPixels / skinPixels) * 100);

  // Irregularity: how varied the redness is across skin pixels (std deviation)
  const variance = rValues.reduce((s, r) => s + Math.pow(r - avgR, 2), 0) / skinPixels;
  const irregularPercent = Math.min(100, Math.round((Math.sqrt(variance) / (avgR + 1)) * 180));

  // Photo score (0–9)
  let photoScore = 0;
  if (rednessPercent > 35) photoScore += 4;
  else if (rednessPercent > 20) photoScore += 3;
  else if (rednessPercent > 8) photoScore += 1;

  if (inflammationRatio > 1.55) photoScore += 3;
  else if (inflammationRatio > 1.35) photoScore += 2;
  else if (inflammationRatio > 1.18) photoScore += 1;

  if (irregularPercent > 42) photoScore += 2;
  else if (irregularPercent > 22) photoScore += 1;

  return { photoScore, rednessPercent, irregularPercent, inflammationRatio, skinCoverage, lowQuality: false };
};

// ── 3 CONFIRMING QUESTIONS (secondary, adjusts photo score) ─────────────────
const QUESTIONS = [
  {
    id: 'duration',
    q: 'How long have you had this?',
    h: 'यह कितने समय से है?',
    opts: [
      { v: '1-2days', l: 'Just started (1-2 days) / Abhi shuru hua', e: '📅', score: 0 },
      { v: '3-7days', l: '3 to 7 days / 3-7 din se', e: '📆', score: 1 },
      { v: 'week+', l: 'More than a week / Hafte se zyada', e: '🗓️', score: 2 },
    ],
  },
  {
    id: 'spreading',
    q: 'Is it spreading to other areas?',
    h: 'क्या यह और फैल रहा है?',
    opts: [
      { v: 'no', l: 'No, same spot / Nahi, same jagah', e: '✅', score: 0 },
      { v: 'yes', l: 'Yes, spreading / Haan, failh raha hai', e: '⚠️', score: 3 },
    ],
  },
  {
    id: 'pain',
    q: 'Is there pain or burning?',
    h: 'क्या दर्द या जलन है?',
    opts: [
      { v: 'no', l: 'No pain / Dard nahi', e: '😌', score: 0 },
      { v: 'mild', l: 'A little / Thoda', e: '😐', score: 1 },
      { v: 'yes', l: 'Yes, painful / Haan, bahut dard', e: '😣', score: 2 },
    ],
  },
];

// ── FINAL ASSESSMENT: photo (60%) + questions (40%) ──────────────────────────
const getFinalResult = (photoData, answers) => {
  const questionScore = QUESTIONS.reduce((sum, q) => {
    const chosen = q.opts.find(o => o.v === answers[q.id]);
    return sum + (chosen?.score || 0);
  }, 0);

  // Weighted combined score: photo is primary driver
  const combined = (photoData.photoScore * 0.6) + (questionScore * 0.4);

  // Determine condition label based on visual + symptom context
  let condition = 'Minor Skin Irritation';
  if (photoData.rednessPercent > 20 && answers.spreading === 'yes') {
    condition = 'Possible Skin Infection / Bacterial Rash';
  } else if (photoData.rednessPercent > 15 && answers.duration === 'week+') {
    condition = 'Chronic Skin Rash / Fungal Infection (Daad)';
  } else if (photoData.rednessPercent > 10) {
    condition = 'Allergic Reaction / Contact Rash (Ghamoriya)';
  } else if (photoData.irregularPercent > 50) {
    condition = 'Dry Skin / Eczema / Skin Discoloration';
  }

  const severity = combined >= 4.5 ? 'urgent' : combined >= 2 ? 'moderate' : 'mild';
  return { condition, severity, combined: combined.toFixed(1) };
};

const RESULTS = {
  urgent: {
    icon: '🚨', bg: 'bg-rose-600',
    title: 'Visit Health Worker Today',
    titleH: 'आज ही स्वास्थ्य कार्यकर्ता से मिलें',
    advice: 'The photo shows signs of skin inflammation. Please visit your nearest primary health centre immediately.',
    adviceH: 'आज ही नजदीकी अस्पताल या सरकारी स्वास्थ्य केंद्र जाएं। देरी न करें।',
    helpline: '108',
  },
  moderate: {
    icon: '⚠️', bg: 'bg-amber-500',
    title: 'Visit ASHA Worker Soon',
    titleH: 'जल्द ही आशा कार्यकर्ता से मिलें',
    advice: 'The photo shows some skin changes that need attention. Visit your nearby PHC or ASHA worker within 2-3 days.',
    adviceH: '2-3 दिन में अपने PHC या आशा कार्यकर्ता से मिलें।',
    helpline: '104',
  },
  mild: {
    icon: '✅', bg: 'bg-emerald-600',
    title: 'Mild Skin Issue',
    titleH: 'सामान्य त्वचा समस्या',
    advice: 'Keep the area clean and dry. If it does not improve in 3-4 days, please see an ASHA worker.',
    adviceH: 'जगह को साफ और सूखा रखें। 3-4 दिन में ठीक न हो तो आशा कार्यकर्ता से मिलें।',
    helpline: '104',
  },
};

export default function SkinDiseaseCheckerPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState('upload');
  const [skinPreview, setSkinPreview] = useState(null);
  const [skinImage, setSkinImage] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoWarning, setPhotoWarning] = useState(false);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const handleImageUpload = async (file) => {
    if (file && file.type.startsWith('image/')) {
      try {
        // Compress image for fast upload on 2G networks (<200KB)
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        
        setSkinImage(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => setSkinPreview(reader.result);
        reader.readAsDataURL(compressedFile);
        
        setPhotoData(null);
        setPhotoWarning(false);
      } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback to original file
        setSkinImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setSkinPreview(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  // ── Real camera via getUserMedia (works desktop + mobile) ──────────────────
  const openCamera = async () => {
    setCameraError(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      // Modal renders async — retry attaching stream until video element exists
      const attach = (tries = 15) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
        } else if (tries > 0) {
          setTimeout(() => attach(tries - 1), 100);
        }
      };
      setTimeout(() => attach(), 150);
    } catch (err) {
      console.warn('Camera access denied:', err);
      setCameraError(true);
      setShowCamera(false);
      fileInputRef.current?.click(); // fallback to gallery
    }
  };

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], 'skin_capture.jpg', { type: 'image/jpeg' });
      handleImageUpload(file);
      closeCamera();
    }, 'image/jpeg', 0.92);
  };

  // Stop stream if component unmounts
  useEffect(() => () => closeCamera(), [closeCamera]);

  const handleProceedToQuestions = () => {
    setAnalyzing(true);
    setPhotoWarning(false);
    setTimeout(() => {
      if (imgRef.current) {
        const data = analyzePhotoPixels(imgRef.current);
        setPhotoData(data);
        if (data.lowQuality) {
          // Photo too far or no skin detected — warn user but still allow to continue
          setPhotoWarning(true);
          setAnalyzing(false);
          return; // Stay on upload step, show warning
        }
      }
      setAnalyzing(false);
      setStep('questions');
    }, 900);
  };

  const handleAnswer = async (qId, value) => {
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const pData = photoData || { photoScore: 0, rednessPercent: 0, irregularPercent: 0 };
      const { condition, severity, combined } = getFinalResult(pData, newAnswers);
      setResult({ ...RESULTS[severity], condition, combined });
      setStep('result');

      // Silently sync the offline result to the backend history
      try {
        await api.post('/villager/skin-log', {
          condition: condition,
          severity: severity,
          rednessPercent: pData.rednessPercent,
          irregularPercent: pData.irregularPercent
        });
      } catch (err) {
        console.error('Offline - could not sync skin log to backend', err);
      }
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const now = new Date();
    const lines = [
      '================================================',
      '   SWASTHAI GUARDIAN — SKIN HEALTH REPORT',
      '================================================',
      `Date : ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      '------------------------------------------------',
      'PHOTO ANALYSIS (Visual Screening)',
      `  Redness Level   : ${photoData?.rednessPercent ?? 'N/A'}%`,
      `  Irregularity    : ${photoData?.irregularPercent ?? 'N/A'}%`,
      `  Inflammation    : ${photoData?.inflammationRatio ?? 'N/A'}`,
      '------------------------------------------------',
      'CONFIRMING QUESTIONS',
      ...QUESTIONS.map((q) => `  ${q.q}: ${answers[q.id] || 'N/A'}`),
      '------------------------------------------------',
      'FINAL ASSESSMENT',
      `  Condition : ${result.condition}`,
      `  Severity  : ${result.title}`,
      `  Advice    : ${result.advice}`,
      '================================================',
      'Health Helpline : 104 (Free · 24x7)',
      'Ambulance       : 108 (Free · 24x7)',
      '================================================',
      'For health advice, please consult an ASHA worker or doctor.',
      '================================================',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Skin_Report_${now.toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStep('upload'); setSkinPreview(null); setSkinImage(null);
    setPhotoData(null); setAnswers({}); setCurrentQ(0); setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-inter pt-10 lg:pt-14 pb-12 px-4 sm:px-6">
      <Navbar />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-teal-50/60 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* ── CAMERA MODAL ── */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
          >
            {/* Live camera preview */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full sm:max-w-lg rounded-xl sm:rounded-2xl object-cover h-[60vh] sm:h-auto"
            />

            {/* Guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-white/40 rounded-3xl" />
            </div>
            <p className="text-white/60 text-[11px] font-black uppercase tracking-widest mt-4 text-center px-4">
              {t.diseaseChecker?.camera_guide || 'Point camera at the affected skin area · प्रभावित त्वचा पर कैमरा रखें'}
            </p>

            {/* Buttons */}
            <div className="flex gap-3 sm:gap-4 mt-6">
              <button
                onClick={closeCamera}
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 border border-white/20 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                ✕ Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-slate-900 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl"
              >
                📸 Capture Photo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl mx-auto mt-6">
        {/* HEADER */}
        <header className="mb-5 sm:mb-8 text-center">
          <div className="flex items-center justify-center gap-1.5 text-teal-600 font-black uppercase tracking-widest text-[8px] sm:text-[10px] mb-1.5 sm:mb-3">
            <Camera className="w-3 h-3 sm:w-4 sm:h-4" /> {t.diseaseChecker?.title || 'Skin Health Check'}
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-1.5 sm:mb-2">
            {t.diseaseChecker?.ai_axis || 'Check Your Skin'}
          </h1>
          <p className="text-[10px] sm:text-sm text-slate-400 font-medium">
            {t.diseaseChecker?.processing || 'Photo analyzed for inflammation · फोटो से रोग पहचाना जाएगा'}
          </p>
        </header>

        {/* STEP INDICATOR */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
          {['Photo', '3 Questions', 'Result'].map((label, idx) => {
            const states = ['upload', 'questions', 'result'];
            const active = step === states[idx];
            const done = states.indexOf(step) > idx;
            return (
              <React.Fragment key={label}>
                <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider transition-all ${active ? 'bg-teal-600 text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {done ? '✓' : `${idx + 1}.`} {label}
                </span>
                {idx < 2 && <div className={`w-4 sm:w-6 h-0.5 ${done || active ? 'bg-teal-400' : 'bg-slate-200'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: UPLOAD ── */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl p-5 sm:p-8 border border-slate-100"
            >
              <h2 className="text-base font-black text-slate-800 text-center mb-2">
                📸 {t.diseaseChecker?.scanner_desc || 'Take or upload a photo of the affected skin area'}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 text-center mb-6">
                {t.diseaseChecker?.processing || 'Photo is analyzed for redness & inflammation'}
              </p>

              {!skinPreview ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                    <button onClick={openCamera}
                      className="flex flex-col items-center justify-center gap-1.5 sm:gap-3 p-4 sm:p-7 bg-teal-600 text-white rounded-[1.2rem] sm:rounded-[2rem] font-black hover:bg-teal-700 active:scale-95 transition-all shadow-lg"
                    >
                      <span className="text-2xl sm:text-4xl">📸</span>
                      <span className="text-[9px] sm:text-[11px] uppercase tracking-widest">{t.diseaseChecker?.take_photo || 'Take Photo'}</span>
                      <span className="text-[8px] sm:text-[10px] font-bold text-teal-200">{t.diseaseChecker?.take_photo_hi || 'अभी फोटो लें'}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-1.5 sm:gap-3 p-4 sm:p-7 bg-slate-100 text-slate-700 rounded-[1.2rem] sm:rounded-[2rem] font-black hover:bg-slate-200 active:scale-95 transition-all border border-slate-200"
                    >
                      <span className="text-2xl sm:text-4xl">🖼️</span>
                      <span className="text-[9px] sm:text-[11px] uppercase tracking-widest">{t.diseaseChecker?.upload_photo || 'Upload Photo'}</span>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-400">{t.diseaseChecker?.upload_photo_hi || 'गैलरी से चुनें'}</span>
                    </button>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); handleImageUpload(e.dataTransfer.files[0]); }}
                    className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all ${dragActive ? 'bg-teal-50 border-teal-500 text-teal-600' : 'border-slate-200 text-slate-300'}`}
                  >
                    {t.diseaseChecker?.drag_drop || 'Or drag & drop a photo here'}
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0])} />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Hidden img for pixel reading */}
                  <img ref={imgRef} src={skinPreview} alt="skin" className="hidden" crossOrigin="anonymous" />

                  <div className="relative w-full h-[220px] sm:h-[300px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-2 border-teal-100 shadow-lg">
                    <img src={skinPreview} alt="Skin" className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg">
                      <p className="text-[9px] font-black text-teal-700">Photo Ready ✓</p>
                    </div>
                  </div>

                  {/* LOW QUALITY WARNING — shown when skin not detected */}
                  {photoWarning && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl"
                    >
                      <p className="text-sm font-black text-amber-700 mb-1">⚠️ Skin not clearly visible in this photo</p>
                      <p className="text-[11px] font-bold text-amber-600 mb-3">
                        The photo may be too far away, poorly lit, or showing mostly background/clothes. For the best result, take a close-up photo of only the affected skin area.
                        <br /><span className="text-amber-500">फोटो में त्वचा स्पष्ट नहीं दिख रही। करीब से फोटो लें।</span>
                      </p>
                      <div className="flex gap-3">
                        <button onClick={reset}
                          className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all"
                        >
                          📸 Retake Photo
                        </button>
                        <button onClick={() => { setPhotoWarning(false); setStep('questions'); }}
                          className="flex-1 py-3 bg-white border border-amber-300 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-all"
                        >
                          Continue Anyway →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {!photoWarning && (
                    <div className="flex gap-3">
                      <button onClick={reset} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center gap-2">
                        <RotateCcw className="w-3 h-3" /> Change Photo
                      </button>
                      <button onClick={handleProceedToQuestions} disabled={analyzing}
                        className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-2 disabled:bg-slate-800"
                      >
                        {analyzing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                            <span className="animate-pulse">{t.diseaseChecker?.processing || 'Reading photo pixels...'}</span>
                          </div>
                        ) : (
                          <>{t.diseaseChecker?.init_scan || 'Analyze Photo'} <ChevronRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                <p className="text-[11px] font-bold text-slate-500 leading-snug">
                  <span className="text-teal-700 font-black block">{t.diseaseChecker?.privacy_main || 'Your photo stays private — analyzed only on this device'}</span>
                  {t.diseaseChecker?.privacy_sub || 'आपकी फोटो किसी को नहीं भेजी जाती। यह केवल आपके डिवाइस पर रहती है।'}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: 3 CONFIRMING QUESTIONS ── */}
          {step === 'questions' && (
            <motion.div key="questions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] shadow-xl p-6 md:p-8 border border-slate-100"
            >
              <div className="flex items-center gap-4 mb-6 p-3 bg-slate-50 rounded-2xl">
                <img src={skinPreview} alt="Skin" className="w-14 h-14 rounded-xl object-cover border-2 border-teal-100" />
                <div className="flex-1">
                  {photoData && (
                    <div className="flex gap-3 mb-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                        Redness: {photoData.rednessPercent}%
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                        Irregularity: {photoData.irregularPercent}%
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentQ + 1} of {QUESTIONS.length} — to confirm the photo result</p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(currentQ / QUESTIONS.length) * 100}%` }} />
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-xl font-black text-slate-900 mb-1">{QUESTIONS[currentQ].q}</h2>
                  <p className="text-sm font-bold text-slate-400 mb-5">{QUESTIONS[currentQ].h}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {QUESTIONS[currentQ].opts.map((opt) => (
                      <button key={opt.v} onClick={() => handleAnswer(QUESTIONS[currentQ].id, opt.v)}
                        className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-left flex items-center gap-4 hover:bg-teal-50 hover:border-teal-400 transition-all active:scale-95"
                      >
                        <span className="text-2xl">{opt.e}</span>
                        <span className="text-sm font-black text-slate-700">{opt.l}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <button onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : setStep('upload')}
                className="mt-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors"
              >
                ← Go Back
              </button>
            </motion.div>
          )}

          {/* ── STEP 3: RESULT ── */}
          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className={`p-8 rounded-[2.5rem] shadow-2xl ${result.bg} text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 opacity-10 text-[120px] leading-none p-6">{result.icon}</div>
                <div className="absolute -bottom-10 -left-10 opacity-5">
                  <HeartPulse className="w-48 h-48" />
                </div>

                <div className="relative z-10 space-y-5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-0.5">Skin Photo Analysis Result</p>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">{result.title}</h2>
                    <p className="text-[11px] sm:text-sm font-bold text-white/70">{result.titleH}</p>
                  </div>

                  {/* Photo metrics — shows what the photo told us */}
                  {photoData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-black/10 rounded-2xl border border-white/10 text-center">
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Redness Level</p>
                        <p className="text-xl font-black">{photoData.rednessPercent}%</p>
                      </div>
                      <div className="p-3 bg-black/10 rounded-2xl border border-white/10 text-center">
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Skin Irregularity</p>
                        <p className="text-xl font-black">{photoData.irregularPercent}%</p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-black/10 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Possible Condition / संभावित समस्या</p>
                    <p className="text-lg font-black">{result.condition}</p>
                  </div>

                  <div className="p-3.5 bg-black/10 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1.5">What to do / क्या करें</p>
                    <p className="text-[13px] sm:text-sm font-bold leading-relaxed">{result.advice}</p>
                    <p className="text-[11px] text-white/60 font-bold mt-1.5">{result.adviceH}</p>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 bg-white/10 rounded-2xl">
                    <span className="text-xl">📞</span>
                    <div>
                      <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Helpline</p>
                      <p className="text-lg font-black">{result.helpline} · Free · 24x7</p>
                    </div>
                  </div>
                </div>

                <button onClick={downloadReport}
                  className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-6 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 relative z-10"
                >
                  ⬇ Download Health Report (.txt)
                </button>
              </div>

              <button onClick={reset}
                className="w-full mt-4 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Check Another Problem
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

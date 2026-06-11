import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Camera, ShieldCheck, ChevronRight, RotateCcw, HeartPulse, Activity, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import imageCompression from 'browser-image-compression';
import api from '../services/api';
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

// ── DYNAMIC CONFIRMING QUESTIONS (language-aware, single language per locale) ──
const QUESTIONS_BY_LANG = {
  en: {
    duration: { q: 'How long has this rash been present?', opts: [
      { v: '1-2days', l: 'Just started (1–2 days)', e: '📅', score: 0 },
      { v: '3-7days', l: '3 to 7 days', e: '📆', score: 1 },
      { v: 'week+',  l: 'More than a week', e: '🗓️', score: 2 },
    ]},
    spreading: { q: 'Is it spreading to other areas?', opts: [
      { v: 'no',  l: 'No — same spot', e: '✅', score: 0 },
      { v: 'yes', l: 'Yes — spreading', e: '⚠️', score: 3 },
    ]},
    pain: { q: 'Is there pain, itching, or burning?', opts: [
      { v: 'no',   l: 'No pain or itching', e: '😌', score: 0 },
      { v: 'mild', l: 'Mild discomfort',    e: '😐', score: 1 },
      { v: 'yes',  l: 'Yes, quite painful', e: '😣', score: 2 },
    ]},
    redflags: { q: 'Does the child show any danger signs?', opts: [
      { v: 'none',   l: 'No danger signs', e: '😊', score: 0 },
      { v: 'danger', l: 'High fever / breathing difficulty / lethargy', e: '🚨', score: 6 },
    ]},
  },
  hi: {
    duration: { q: 'यह चकत्ता कितने समय से है?', opts: [
      { v: '1-2days', l: 'अभी शुरू हुआ (1-2 दिन)', e: '📅', score: 0 },
      { v: '3-7days', l: '3 से 7 दिन', e: '📆', score: 1 },
      { v: 'week+',  l: 'एक हफ्ते से ज्यादा', e: '🗓️', score: 2 },
    ]},
    spreading: { q: 'क्या यह अन्य जगहों पर फैल रहा है?', opts: [
      { v: 'no',  l: 'नहीं — एक ही जगह है', e: '✅', score: 0 },
      { v: 'yes', l: 'हाँ — फैल रहा है', e: '⚠️', score: 3 },
    ]},
    pain: { q: 'क्या दर्द, खुजली या जलन है?', opts: [
      { v: 'no',   l: 'कोई दर्द नहीं', e: '😌', score: 0 },
      { v: 'mild', l: 'थोड़ी तकलीफ है', e: '😐', score: 1 },
      { v: 'yes',  l: 'हाँ, बहुत दर्द है', e: '😣', score: 2 },
    ]},
    redflags: { q: 'क्या बच्चे में कोई खतरे के लक्षण हैं?', opts: [
      { v: 'none',   l: 'कोई लक्षण नहीं', e: '😊', score: 0 },
      { v: 'danger', l: 'तेज बुखार / सांस में तकलीफ / सुस्ती', e: '🚨', score: 6 },
    ]},
  },
  mr: {
    duration: { q: 'हे पुरळ किती दिवसांपासून आहे?', opts: [
      { v: '1-2days', l: 'नुकतेच सुरू झाले (1-2 दिवस)', e: '📅', score: 0 },
      { v: '3-7days', l: '3 ते 7 दिवस', e: '📆', score: 1 },
      { v: 'week+',  l: 'एका आठवड्यापेक्षा जास्त', e: '🗓️', score: 2 },
    ]},
    spreading: { q: 'हे इतर ठिकाणी पसरत आहे का?', opts: [
      { v: 'no',  l: 'नाही — एकाच जागी आहे', e: '✅', score: 0 },
      { v: 'yes', l: 'हो — पसरत आहे', e: '⚠️', score: 3 },
    ]},
    pain: { q: 'वेदना, खाज किंवा जळजळ आहे का?', opts: [
      { v: 'no',   l: 'नाही', e: '😌', score: 0 },
      { v: 'mild', l: 'थोडी अस्वस्थता', e: '😐', score: 1 },
      { v: 'yes',  l: 'हो, खूप वेदना आहे', e: '😣', score: 2 },
    ]},
    redflags: { q: 'मुलामध्ये काही धोक्याची चिन्हे आहेत का?', opts: [
      { v: 'none',   l: 'धोक्याची चिन्हे नाहीत', e: '😊', score: 0 },
      { v: 'danger', l: 'तीव्र ताप / श्वास घेण्यास त्रास / सुस्ती', e: '🚨', score: 6 },
    ]},
  },
  ta: {
    duration: { q: 'இந்த சொறி எவ்வளவு நாளாக உள்ளது?', opts: [
      { v: '1-2days', l: 'இப்போது தொடங்கியது (1-2 நாள்)', e: '📅', score: 0 },
      { v: '3-7days', l: '3 முதல் 7 நாட்கள்', e: '📆', score: 1 },
      { v: 'week+',  l: 'ஒரு வாரத்திற்கும் மேல்', e: '🗓️', score: 2 },
    ]},
    spreading: { q: 'இது மற்ற இடங்களுக்கு பரவுகிறதா?', opts: [
      { v: 'no',  l: 'இல்லை — அதே இடத்தில்', e: '✅', score: 0 },
      { v: 'yes', l: 'ஆம் — பரவுகிறது', e: '⚠️', score: 3 },
    ]},
    pain: { q: 'வலி, அரிப்பு அல்லது எரிச்சல் உள்ளதா?', opts: [
      { v: 'no',   l: 'இல்லை', e: '😌', score: 0 },
      { v: 'mild', l: 'சிறிய அசௌகரியம்', e: '😐', score: 1 },
      { v: 'yes',  l: 'ஆம், மிகவும் வலிக்கிறது', e: '😣', score: 2 },
    ]},
    redflags: { q: 'குழந்தைக்கு ஏதேனும் ஆபத்து அறிகுறிகள் உள்ளதா?', opts: [
      { v: 'none',   l: 'ஆபத்து அறிகுறிகள் இல்லை', e: '😊', score: 0 },
      { v: 'danger', l: 'அதிக காய்ச்சல் / சுவாசக் கஷ்டம் / சோர்வு', e: '🚨', score: 6 },
    ]},
  },
  te: {
    duration: { q: 'ఈ దద్దుర్లు ఎంత కాలంగా ఉన్నాయి?', opts: [
      { v: '1-2days', l: 'ఇప్పుడే మొదలైంది (1-2 రోజులు)', e: '📅', score: 0 },
      { v: '3-7days', l: '3 నుండి 7 రోజులు', e: '📆', score: 1 },
      { v: 'week+',  l: 'ఒక వారం కంటే ఎక్కువ', e: '🗓️', score: 2 },
    ]},
    spreading: { q: 'ఇది ఇతర ప్రాంతాలకు వ్యాపిస్తుందా?', opts: [
      { v: 'no',  l: 'లేదు — అదే చోట', e: '✅', score: 0 },
      { v: 'yes', l: 'అవును — వ్యాపిస్తుంది', e: '⚠️', score: 3 },
    ]},
    pain: { q: 'నొప్పి, దురద లేదా మంట ఉందా?', opts: [
      { v: 'no',   l: 'లేదు', e: '😌', score: 0 },
      { v: 'mild', l: 'తేలికపాటి అసౌకర్యం', e: '😐', score: 1 },
      { v: 'yes',  l: 'అవును, చాలా నొప్పిగా ఉంది', e: '😣', score: 2 },
    ]},
    redflags: { q: 'పిల్లవాడికి ఏదైనా ప్రమాద సంకేతాలు ఉన్నాయా?', opts: [
      { v: 'none',   l: 'ప్రమాద సంకేతాలు లేవు', e: '😊', score: 0 },
      { v: 'danger', l: 'తీవ్ర జ్వరం / శ్వాస తీసుకోవడంలో ఇబ్బంది / అలసట', e: '🚨', score: 6 },
    ]},
  },
  bn: {
    duration: { q: 'এই র‍্যাশ কতদিন ধরে আছে?', opts: [
      { v: '1-2days', l: 'এইমাত্র শুরু হয়েছে (১-২ দিন)', e: '📅', score: 0 },
      { v: '3-7days', l: '৩ থেকে ৭ দিন', e: '📆', score: 1 },
      { v: 'week+',  l: 'এক সপ্তাহের বেশি', e: '🗓️', score: 2 },
    ]},
    spreading: { q: 'এটি কি অন্য জায়গায় ছড়িয়ে পড়ছে?', opts: [
      { v: 'no',  l: 'না — একই জায়গায় আছে', e: '✅', score: 0 },
      { v: 'yes', l: 'হ্যাঁ — ছড়িয়ে পড়ছে', e: '⚠️', score: 3 },
    ]},
    pain: { q: 'ব্যথা, চুলকানি বা জ্বালা আছে কি?', opts: [
      { v: 'no',   l: 'না', e: '😌', score: 0 },
      { v: 'mild', l: 'সামান্য অস্বস্তি', e: '😐', score: 1 },
      { v: 'yes',  l: 'হ্যাঁ, অনেক ব্যথা', e: '😣', score: 2 },
    ]},
    redflags: { q: 'শিশুর মধ্যে কোনো বিপদের লক্ষণ আছে কি?', opts: [
      { v: 'none',   l: 'কোনো বিপদের লক্ষণ নেই', e: '😊', score: 0 },
      { v: 'danger', l: 'তীব্র জ্বর / শ্বাসকষ্ট / অলসতা', e: '🚨', score: 6 },
    ]},
  },
};

const getQuestionsList = (isChild, lang = 'en') => {
  const L = QUESTIONS_BY_LANG[lang] || QUESTIONS_BY_LANG.en;
  const base = [
    { id: 'duration',  ...L.duration  },
    { id: 'spreading', ...L.spreading },
    { id: 'pain',      ...L.pain      },
  ];
  if (isChild) base.push({ id: 'redflags', ...L.redflags });
  return base;
};

// ── FINAL ASSESSMENT: photo (60%) + questions (40%) ──────────────────────────
const getFinalResult = (photoData, answers, questionsList) => {
  const questionScore = questionsList.reduce((sum, q) => {
    const chosen = q.opts.find(o => o.v === answers[q.id]);
    return sum + (chosen?.score || 0);
  }, 0);

  const hasDangerSigns = answers.redflags === 'danger';

  // Weighted combined score: photo is primary driver
  const combined = (photoData.photoScore * 0.6) + (questionScore * 0.4);

  // Determine condition label based on visual + symptom context
  let condition = 'Mild skin irritation (screening advice)';
  
  if (hasDangerSigns) {
    condition = 'Emergency Triage Escalation (Danger Signs Present)';
  } else if (photoData.rednessPercent > 20 && answers.spreading === 'yes') {
    condition = 'Indications of Possible Skin Infection / Bacterial Rash';
  } else if (photoData.rednessPercent > 15 && answers.duration === 'week+') {
    condition = 'Indications of Fungal Rash / Skin Issue';
  } else if (photoData.rednessPercent > 10) {
    condition = 'Possible Contact Irritation / Allergic Rash';
  } else if (photoData.irregularPercent > 50) {
    condition = 'Indications of Dry Skin / Possible Eczema';
  }

  let severity = combined >= 4.5 ? 'urgent' : combined >= 2 ? 'moderate' : 'mild';
  if (hasDangerSigns) {
    severity = 'urgent'; // Force red emergency card
  }

  return { condition, severity, combined: combined.toFixed(1) };
};

const RESULTS = {
  urgent: {
    icon: '🚨', bg: 'bg-rose-600',
    title: 'Refer to Healthcare Professional Today',
    titleH: 'आज ही योग्य डॉक्टर या अस्पताल से मिलें',
    advice: 'The photo shows signs of significant skin inflammation. Please consult a pediatrician or doctor immediately for clinical diagnosis.',
    adviceH: 'आज ही नजदीकी अस्पताल या सरकारी स्वास्थ्य केंद्र जाएं। देरी न करें।',
    helpline: '108',
  },
  moderate: {
    icon: '⚠️', bg: 'bg-amber-500',
    title: 'Consult Health Worker Soon',
    titleH: 'जल्द ही आशा कार्यकर्ता या पीएचसी से मिलें',
    advice: 'The photo shows skin changes that warrant screening. Consult your nearby PHC or ASHA worker within 2-3 days.',
    adviceH: '2-3 दिन में अपने PHC या आशा कार्यकर्ता से मिलें।',
    helpline: '104',
  },
  mild: {
    icon: '✅', bg: 'bg-emerald-600',
    title: 'Mild Skin Changes',
    titleH: 'सामान्य त्वचा परिवर्तन (गृह सुरक्षा सलाह)',
    advice: 'Keep the area clean and dry. If it does not improve in 3-4 days or if fever develops, consult a healthcare professional.',
    adviceH: 'जगह को साफ और सूखा रखें। सुधार न होने पर चिकित्सक से मिलें।',
    helpline: '104',
  },
};

const WARNING_TRANSLATIONS = {
  en: {
    title: "⚠️ Emergency Rash Warning Signs (For Children)",
    inspect: "Please inspect the child immediately for any of these danger signs:",
    fever: "High fever accompanied by a rash",
    breathing: "Difficulty breathing or rapid breathing",
    sleepiness: "Extreme sleepiness or lethargy",
    seizures: "Seizures or abnormal muscle movements",
    spreading: "Rapidly spreading rash (spreads over a few hours)",
    glass: "Rash that does not fade when pressed firmly with the side of a clear drinking glass",
    emergency: "⚠️ A non-fading rash can be a medical emergency. Seek urgent medical care immediately."
  },
  hi: {
    title: "⚠️ आपातकालीन दाने के लक्षण (बच्चों के लिए)",
    inspect: "कृपया इन खतरे के लक्षणों के लिए बच्चे की तुरंत जांच करें:",
    fever: "चकत्ते के साथ तेज बुखार",
    breathing: "सांस लेने में तकलीफ या तेज सांस चलना",
    sleepiness: "अत्यधिक नींद आना या सुस्ती होना",
    seizures: "दौरे पड़ना या असामान्य रूप से शरीर का कांपना",
    spreading: "तेजी से फैलने वाले चकत्ते (कुछ ही घंटों में फैलना)",
    glass: "कांच के साफ गिलास से दबाने पर भी फीके न पड़ने वाले चकत्ते",
    emergency: "⚠️ न मिटने वाले चकत्ते एक चिकित्सा आपातकाल हो सकते हैं। तुरंत आपातकालीन डॉक्टर से मिलें।"
  },
  mr: {
    title: "⚠️ मुलांसाठी आपत्कालीन त्वचेच्या पुरळचे धोक्याचे संकेत",
    inspect: "कृपया या धोक्याच्या लक्षणांसाठी मुलाची त्वरित तपासणी करा:",
    fever: "पुरळ सह तीव्र ताप",
    breathing: "श्वास घेण्यास त्रास होणे किंवा वेगाने श्वास चालणे",
    sleepiness: "अतिशय झोप येणे किंवा सुस्ती येणे",
    seizures: "झटके येणे किंवा स्नायूंच्या असामान्य हालचाली",
    spreading: "झपाट्याने पसरणारे पुरळ (काही तासांत पसरणारे)",
    glass: "काचेच्या स्वच्छ पेल्याने दाबल्यावरही न पुसणारे लाल डाग",
    emergency: "⚠️ न मिटणारे लाल डाग ही वैद्यकीय आणीबाणी असू शकते. त्वरित वैद्यकीय उपचार घ्या."
  },
  ta: {
    title: "⚠️ அவசர சொறி எச்சரிக்கை அறிகுறிகள் (குழந்தைகளுக்கு)",
    inspect: "குழந்தையிடம் இந்த ஆபத்தான அறிகுறிகள் ஏدهனும் உள்ளதா என்பதை உடனடியாக சோதிக்கவும்:",
    fever: "கடுமையான காய்ச்சலுடன் கூடிய சொறி/சரும பாதிப்பு",
    breathing: "மூச்சுத் திணறல் அல்லது வேகமான சுவாசம்",
    sleepiness: "அதிகப்படியான தூக்கம் அல்லது சோம்பல்",
    seizures: "வலிப்பு அல்லது அசாதாரண தசை அசைவுகள்",
    spreading: "வேகமாக பரவக்கூடிய சொறி (சில மணிநேரங்களில் பரவும்)",
    glass: "சுத்தமான கண்ணாடி கொண்டு அழுத்தினாலும் மறையாத சிவப்பு புள்ளிகள்",
    emergency: "⚠️ அழுத்தினாலும் மறையாத சிவப்பு புள்ளிகள் ஒரு மருத்துவ அவசரநிலை ஆகும். உடனடியாக அவசர சிகிச்சை பெறவும்."
  },
  te: {
    title: "⚠️ పిల్లల కొరకు అత్యవసర దద్దుర్లు మరియు ప్రమాద సంకేతాలు",
    inspect: "దయచేసి ఈ క్రింది ప్రమాద సంకేతాల కోసం పిల్లవాడిని వెంటనే పరిశీలించండి:",
    fever: "దద్దుర్లతో కూడిన తీవ్ర జ్వరం",
    breathing: "శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా వేగంగా శ్వాస పీల్చడం",
    sleepiness: "అత్యధిక నీరసం లేదా నిద్రమత్తు",
    seizures: "ఫిట్స్ లేదా అసాధారణ కండరాల కదలికలు",
    spreading: "వేగంగా వ్యాపించే దద్దుర్లు (కొన్ని గంటల్లోనే వ్యాపించడం)",
    glass: "కనిపించే స్వచ్ఛమైన గ్లాసుతో నొక్కినప్పుడు కూడా రంగు మారని దద్దుర్లు",
    emergency: "⚠️ రంగు మారని దద్దుర్లు వైద్య అత్యవసర పరిస్థితి కావచ్చు. వెంటనే అత్యవసర వైద్య సహాయాన్ని సంప్రదించండి."
  },
  bn: {
    title: "⚠️ শিশুদের জরুরি ফুসকুড়ি সংক্রান্ত বিপদের লক্ষণ",
    inspect: "দয়া করে এই বিপদ সংকেতগুলির জন্য শিশুকে অবিলম্বে পরীক্ষা করুন:",
    fever: "ফুসকুড়ি বা র‍্যাশের সাথে তীব্র জ্বর",
    breathing: "শ্বাসকষ্ট বা দ্রুত শ্বাস নেওয়া",
    sleepiness: "অতিরিক্ত ঘুম পাওয়া বা চরম অলসতা/অসাড়তা",
    seizures: "খিঁচুনি বা অস্বাভাবিক পেশীর নড়াচড়া",
    spreading: "দ্রুত ছড়িয়ে পড়া ফুসকুড়ি (কয়েক ঘন্টার মধ্যে ছড়িয়ে পড়ে)",
    glass: "পরিষ্কার কাঁচের গ্লাস দিয়ে চাপলেও যে লালচে দাগ অদৃশ্য হয় না",
    emergency: "⚠️ চাপ দেওয়ার পরেও অদৃশ্য না হওয়া লালচে দাগ একটি জরুরি অবস্থা। অবিলম্বে জরুরি চিকিৎসা সেবা নিন।"
  },
  hinglish: {
    title: "⚠️ Emergency Rash Warning Signs (Bachon ke liye)",
    inspect: "Kripya in danger signs ke liye bache ko turant check karein:",
    fever: "Rash ke sath tej bukhar",
    breathing: "Saans lene me takleef ya fast saans chalna",
    sleepiness: "Bahut zyada neend aana ya susti hona",
    seizures: "Jhatke aana ya abnormal muscle movements",
    spreading: "Tezi se phailne wala rash (kuch hi ghanto me phailna)",
    glass: "Saaf glass se dabane par bhi na mitne wale laal chakte",
    emergency: "⚠️ Na mitne wale chakte medical emergency ho sakte hain. Turant doctor ke paas jayein."
  }
};

const GLASS_TEST_TRANSLATIONS = {
  en: {
    title: "🔍 Bedside Triage Helper: How to perform the Glass Test",
    intro: "The Glass Test is a bedside test to help identify if a rash is non-blanching (does not fade), which can be a sign of a serious medical emergency like meningitis or sepsis.",
    step1Title: "1. Press Firmly",
    step1Desc: "Press the side of a clear glass tumbler firmly against the rash spots.",
    step2Title: "2. Observe Blanching",
    step2Desc: "Watch if the red/purple spots fade (blanch) under the pressure.",
    step3Title: "3. Safety Interpretation",
    step3DescRed: "If the spots do NOT fade (non-blanching), it is a red flag for meningitis or sepsis — seek immediate emergency care.",
    step3DescGreen: "If they do fade (blanch), continue standard triage."
  },
  hi: {
    title: "🔍 बेडसाइड ट्राइएज हेल्पर: ग्लास टेस्ट कैसे करें (कांच की ग्लास जांच)",
    intro: "ग्लास टेस्ट यह जांचने में मदद करता है कि क्या त्वचा के चकत्ते दबाने पर हल्के पड़ते हैं या नहीं। यदि चकत्ते हल्के नहीं पड़ते हैं, तो यह मेनिनजाइटिस या सेप्सिस जैसी गंभीर बीमारी का संकेत हो सकता है।",
    step1Title: "1. जोर से दबाएं",
    step1Desc: "एक साफ और पारदर्शी कांच के गिलास के किनारे को चकत्तों पर जोर से दबाएं।",
    step2Title: "2. रंग बदलते देखें",
    step2Desc: "गिलास के माध्यम से देखें कि क्या दबाव के कारण लाल/बैंगनी धब्बे हल्के (फीके) पड़ते हैं।",
    step3Title: "3. सुरक्षा निष्कर्ष",
    step3DescRed: "यदि धब्बे फीके नहीं पड़ते हैं, तो यह मेनिनजाइटिस या सेप्सिस का संकेत है — तुरंत आपातकालीन चिकित्सा सहायता लें।",
    step3DescGreen: "यदि वे फीके पड़ जाते हैं, तो सामान्य ट्राइएज/जांच जारी रखें।"
  },
  mr: {
    title: "🔍 बेडसाइड ट्रायज मदतगार: काचेच्या पेल्याची चाचणी कशी करावी",
    intro: "काचेच्या पेल्याची चाचणी ही त्वचेवरील पुरळ दाबल्यावर फिकट होते की नाही हे ओळखण्यास मदत करते। पुरळ फिकट न झाल्यास, तो मेनिनजायटीस किंवा सेप्सिस सारख्या गंभीर वैद्यकीय आणीबाणीचा संकेत असू शकतो।",
    step1Title: "1. घट्ट दाबा",
    step1Desc: "एका स्वच्छ व पारदर्शक काचेच्या पेल्याची बाजू पुरळ उठलेल्या जागेवर घट्ट दाबा।",
    step2Title: "2. रंग बदलताना पाहा",
    step2Desc: "पेल्यातून लक्ष ठेवा की लाल/जांभळे डाग दबावाखाली फिकट (रंगहीन) होतात का।",
    step3Title: "3. सुरक्षा निष्कर्ष",
    step3DescRed: "जर डाग फिकट होत नसतील, तर हा मेनिनजायटीस किंवा सेप्सिसचा धोका आहे — त्वरित आपत्कालीन वैद्यकीय मदत घ्या।",
    step3DescGreen: "जर डाग फिकट झाले, तर सामान्य सल्ला प्रक्रिया सुरू ठेवा।"
  },
  ta: {
    title: "🔍 பெட்சைட் ட்ரையாஜ் உதவியாளர்: கண்ணாடி டம்ளர் பரிசோதனை செய்வது எப்படி",
    intro: "கண்ணாடி டம்ளர் பரிசோதனை என்பது சொறி அழுத்தும்போது நிறம் மாறுகிறதா என்பதை கண்டறிய உதவும் ஒரு சோதனை ஆகும். நிறம் மாறாவிட்டால், அது மூளைக்காய்ச்சல் அல்லது செப்சிஸ் போன்ற அவசரநிலையின் அறிகுறியாக இருக்கலாம்.",
    step1Title: "1. நன்றாக அழுத்தவும்",
    step1Desc: "ஒரு சுத்தமான கண்ணாடி டம்ளரின் பக்கவாட்டு பகுதியை சொறி அல்லது சிவப்பு புள்ளிகளின் மீது நன்றாக அழுத்தவும்.",
    step2Title: "2. நிறம் மாறுவதை கவனிக்கவும்",
    step2Desc: "அழுத்தும்போது கண்ணாடி வழியாக சிவப்பு/ஊதா நிற புள்ளிகள் நிறம் மங்கி மறைகிறதா என்று பாருங்கள்.",
    step3Title: "3. பாதுகாப்பு விளக்கம்",
    step3DescRed: "புள்ளிகள் மறையவில்லை என்றால், இது மூளைக்காய்ச்சல் அல்லது செப்சிஸ் ஆபத்து — உடனடியாக அவசர சிகிச்சை பெறவும்.",
    step3DescGreen: "புள்ளிகள் மங்கி மறைந்தால், வழக்கம் போல் சுகாதார பணியாளரின் ஆলোசனையை தொடரவும்."
  },
  te: {
    title: "🔍 బెడ్‌సైడ్ ట్రయాజ్ హెల్పర్: గ్లాస్ పరీక్ష ఎలా చేయాలి",
    intro: "గ్లాస్ పరీక్ష అనేది దద్దుర్లు నొక్కినప్పుడు రంగు మారుతున్నాయా లేదా అని గుర్తించడానికి సహాయపడుతుంది. రంగు మారకపోతే, అది మెనింజైటిస్ లేదా సెప్సిస్ వంటి అత్యవసర పరిస్థితికి సంకేతం కావచ్చు.",
    step1Title: "1. గట్టిగా నొక్కండి",
    step1Desc: "శుభ్రమైన గాజు గ్లాసు పక్క భాగాన్ని దద్దుర్లపై గట్టిగా నొక్కండి.",
    step2Title: "2. రంగు మారడం గమనించండి",
    step2Desc: "గాజు గ్లాసు గుండా చూస్తూ, ఒత్తిడికి ఎరుపు/నేరేడు రంగు మచ్చలు వెలిసిపోతున్నాయో లేదో గమనించండి.",
    step3Title: "3. భద్రతా వివరణ",
    step3DescRed: "మచ్చలు వెలిసిపోకపోతే, ఇది మెనింజైటిస్ లేదా సెప్సిస్ ప్రమాద సంకేతం — వెంటనే అత్యవసర వైద్య సహాయం తీసుకోండి.",
    step3DescGreen: "మచ్చలు వెలిసిపోతే, సాధారణ ట్రయాజ్ సలహాను అనుసరించండి."
  },
  bn: {
    title: "🔍 বেডসাইড ট্রায়াজ সহায়ক: গ্লাস টেস্ট কীভাবে করবেন",
    intro: "গ্লাস টেস্টের মাধ্যমে বোঝা যায় যে র্যাশ চাপ দিলে ফ্যাকাশে (রংহীন) হয়ে যায় কি না। যদি ফুসকুড়ি ফ্যাকাশে না হয়, তবে এটি মেনিনজাইটিস বা সেপসিসের মতো মারাত্মক স্বাস্থ্য সমস্যার লক্ষণ হতে পারে।",
    step1Title: "1. জোরে চাপুন",
    step1Desc: "একটি পরিষ্কার কাঁচের গ্লাসের সাইড র্যাশের উপর জোরে চাপুন।",
    step2Title: "2. রঙ পরিবর্তন দেখুন",
    step2Desc: "গ্লাসের ভেতর দিয়ে লক্ষ্য করুন যে চাপের ফলে লাল/বেগুনী দাগগুলি ফ্যাকাশে হচ্ছে কি না।",
    step3Title: "3. safety ফলাফল",
    step3DescRed: "দাগ ফ্যাকাশে না হলে, এটি মেনিনজাইটিস বা সেপসিসের লক্ষণ — অবিলম্বে জরুরি চিকিৎসা সেবা নিন।",
    step3DescGreen: "দাগ ফ্যাকাশে হলে, সাধারণ পরীক্ষা বা স্বাস্থ্যকর্মীর পরামর্শের প্রক্রিয়া চালিয়ে যান।"
  },
  hinglish: {
    title: "🔍 Bedside Triage Helper: Glass Test kaise karein (कांच की ग्लास जांच)",
    intro: "Glass test se check karte hain ki skin ka rash dabane par fade hota hai ya nahi. Agar chakte fade nahi hote, toh yeh meningitis ya sepsis jaisi medical emergency ka sign ho sakta hai.",
    step1Title: "1. Firmly Press Karein",
    step1Desc: "Ek saaf aur transparent glass tumbler ke side ko rash ke upar firmly press karein.",
    step2Title: "2. Observe Karein",
    step2Desc: "Glass ke through dekhein ki kya red/purple spots pressure ki wajah se fade hote hain.",
    step3Title: "3. Safety Interpretation",
    step3DescRed: "Agar spots fade nahi hote, toh yeh meningitis ya sepsis ka sign hai — emergency hospital ya doctor ke paas jayein.",
    step3DescGreen: "Agar spots fade ho jate hain, toh normal triage/salah follow karein."
  }
};

export default function SkinDiseaseCheckerPage() {
  const { t, lang } = useLanguage();
  const childMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('childMode') === 'true' : false;
  
  // Custom fallback to Hinglish or language checks
  const currentLang = lang === 'hi' && localStorage.getItem('swasth_lang_is_hinglish') === 'true' ? 'hinglish' : (lang || 'en');
  const wt = WARNING_TRANSLATIONS[currentLang] || WARNING_TRANSLATIONS.en;
  const gt = GLASS_TEST_TRANSLATIONS[currentLang] || GLASS_TEST_TRANSLATIONS.en;

  const QUESTIONS_LIST = getQuestionsList(childMode, lang || 'en');

  const [step, setStep] = useState('upload');
  const [showWarningSigns, setShowWarningSigns] = useState(false);
  const [showGlassTestGuide, setShowGlassTestGuide] = useState(false);
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
    if (currentQ < QUESTIONS_LIST.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const pData = photoData || { photoScore: 0, rednessPercent: 0, irregularPercent: 0 };
      const { condition, severity, combined } = getFinalResult(pData, newAnswers, QUESTIONS_LIST);
      
      let selectedResult = { ...RESULTS[severity] };
      if (childMode) {
        if (severity === 'urgent') {
          selectedResult.title = 'Consult Pediatrician / Hospital Today';
          selectedResult.titleH = 'आज ही बच्चों के डॉक्टर या अस्पताल से संपर्क करें';
          selectedResult.advice = 'Child skin is delicate. This rash shows indications of potential severe inflammation or danger signs. Please consult a pediatrician or hospital immediately. Do NOT apply adult steroid creams as they can harm young skin.';
          selectedResult.adviceH = 'बच्चे की त्वचा अत्यंत संवेदनशील है। गंभीर सूजन या संक्रमण के संकेत हैं। तुरंत बाल रोग विशेषज्ञ या अस्पताल जाएं। वयस्क क्रीम का प्रयोग न करें।';
        } else if (severity === 'moderate') {
          selectedResult.title = 'Consult ASHA / Doctor Soon';
          selectedResult.titleH = 'जल्द ही आशा कार्यकर्ता या डॉक्टर से मिलें';
          selectedResult.advice = 'This rash requires visual triage. Please consult your local ASHA worker or primary health centre soon. Keep the child hydrated, avoid harsh soaps, and do not scratch.';
          selectedResult.adviceH = 'जल्द ही डॉक्टर या आशा कार्यकर्ता से सलाह लें। बच्चे को हाइड्रेटेड रखें, हल्के साबुन का प्रयोग करें और खुजली से बचाएं।';
        } else if (severity === 'mild') {
          selectedResult.title = 'Mild Skin Changes (Triage)';
          selectedResult.titleH = 'सामान्य बाल रोग त्वचा गाइडेंस';
          selectedResult.advice = 'Keep the area clean, dry, and cool. Use only mild, child-safe moisturizers. Seek medical attention if fever develops or if the rash does not improve in 3 days.';
          selectedResult.adviceH = 'जगह को साफ, सूखा और ठंडा रखें। बच्चों के सुरक्षित मॉइस्चराइजर का उपयोग करें। सुधार न होने या बुखार आने पर डॉक्टर से मिलें।';
        }
      }
      
      setResult({ ...selectedResult, condition, combined });
      setStep('result');

      // Silently sync the offline result to the backend history
      try {
        await api.post('/skin-log', {
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
      '   SWASTHAI GUARDIAN — SKIN TRIAGE REPORT',
      childMode ? '              (PEDIATRIC SCANMODE)' : '',
      '================================================',
      `Date : ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      '------------------------------------------------',
      'PHOTO SCREENING METRICS',
      `  Redness Level   : ${photoData?.rednessPercent ?? 'N/A'}%`,
      `  Irregularity    : ${photoData?.irregularPercent ?? 'N/A'}%`,
      `  Inflammation    : ${photoData?.inflammationRatio ?? 'N/A'}`,
      '------------------------------------------------',
      'TRIAGE QUESTIONS',
      ...QUESTIONS_LIST.map((q) => `  ${q.q}: ${answers[q.id] || 'N/A'}`),
      '------------------------------------------------',
      'AI TRIAGE SCREENING ASSESSMENT',
      `  Suggested Triage : ${result.condition}`,
      `  Recommendation   : ${result.title}`,
      `  Advice           : ${result.advice}`,
      '================================================',
      'Health Helpline : 104 (Free · 24x7)',
      'Ambulance       : 108 (Free · 24x7)',
      '================================================',
      'NOTICE: This is screening assistance, NOT a medical diagnosis.',
      'Always consult a qualified doctor or healthcare worker.',
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
    a.remove();
  };

  const reset = () => {
    setStep('upload'); setSkinPreview(null); setSkinImage(null);
    setPhotoData(null); setAnswers({}); setCurrentQ(0); setResult(null);
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] font-inter flex flex-col">
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-20 w-full flex-1 flex flex-col">
        {/* HEADER */}
        <header className="mb-5 sm:mb-8 text-center">
          {childMode ? (
            <>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-1.5 sm:mb-2">
                Pediatric Skin Triage <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black align-middle ml-1">CHILD MODE</span>
              </h1>
              <p className="text-[10px] sm:text-sm text-slate-400 font-medium">
                Child-safe skin assessment & triage support · बच्चों की त्वचा की जांच
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-1.5 sm:mb-2">
                {t.diseaseChecker?.ai_axis || 'Check Your Skin'}
              </h1>
              <p className="text-[10px] sm:text-sm text-slate-400 font-medium">
                {t.diseaseChecker?.processing || 'Photo analyzed for inflammation · फोटो से रोग पहचाना जाएगा'}
              </p>
            </>
          )}
        </header>

        {/* STEP INDICATOR */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
          {['Photo', 'Questions', 'Result'].map((label, idx) => {
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
              {childMode && (
                <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl flex gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-black text-rose-800 uppercase tracking-wider mb-1">Pediatric Safety Disclaimer</h3>
                    <p className="text-[11px] font-bold text-rose-700 leading-relaxed">
                      Child skin is delicate. If this rash is accompanied by high fever, difficulty breathing, lethargy, or is a purple/red spot rash that does not fade when pressed (the glass test), visit a hospital immediately. Do not apply adult steroid creams without clinical prescription.
                    </p>
                    <p className="text-[10px] text-rose-600 font-bold mt-1">
                      बच्चों की त्वचा अति संवेदनशील होती है। बुखार या सांस लेने में तकलीफ होने पर तुरंत चिकित्सक से परामर्श लें।
                    </p>
                  </div>
                </div>
              )}

              {childMode && (
                <div className="mb-6 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setShowWarningSigns(!showWarningSigns)}
                    className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wider text-left border-b border-slate-100"
                  >
                    <span>{wt.title}</span>
                    <span className="text-slate-400 font-bold text-base">{showWarningSigns ? '▼' : '▶'}</span>
                  </button>
                  <AnimatePresence>
                    {showWarningSigns && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-4 bg-white text-xs text-slate-600 space-y-2 text-left"
                      >
                        <p className="font-bold text-slate-700">{wt.inspect}</p>
                        <ul className="list-disc pl-5 space-y-1.5 font-medium leading-relaxed">
                          <li>{wt.fever}</li>
                          <li>{wt.breathing}</li>
                          <li>{wt.sleepiness}</li>
                          <li>{wt.seizures}</li>
                          <li>{wt.spreading}</li>
                          <li>{wt.glass}</li>
                        </ul>
                        <p className="p-2.5 bg-rose-50 text-rose-700 rounded-lg font-bold mt-2 leading-relaxed border border-rose-100">
                          {wt.emergency}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {childMode && (
                <div className="mb-6 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setShowGlassTestGuide(!showGlassTestGuide)}
                    className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wider text-left border-b border-slate-100"
                  >
                    <span>{gt.title}</span>
                    <span className="text-slate-400 font-bold text-base">{showGlassTestGuide ? '▼' : '▶'}</span>
                  </button>
                  <AnimatePresence>
                    {showGlassTestGuide && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-4 bg-white text-xs text-slate-600 space-y-4 text-left"
                      >
                        <p className="font-bold text-slate-700 leading-relaxed">{gt.intro}</p>
                        <div className="space-y-3">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <h4 className="font-black text-slate-800 mb-1">{gt.step1Title}</h4>
                            <p className="font-medium text-slate-600 leading-relaxed">{gt.step1Desc}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <h4 className="font-black text-slate-800 mb-1">{gt.step2Title}</h4>
                            <p className="font-medium text-slate-600 leading-relaxed">{gt.step2Desc}</p>
                          </div>
                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                            <h4 className="font-black text-rose-800 mb-1">{gt.step3Title}</h4>
                            <p className="font-bold text-rose-700 leading-relaxed mb-2">{gt.step3DescRed}</p>
                            <p className="font-bold text-emerald-700 leading-relaxed">{gt.step3DescGreen}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

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

          {/* ── STEP 2: TRIAGE QUESTIONS ── */}
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentQ + 1} of {QUESTIONS_LIST.length} — triage assistant</p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(currentQ / QUESTIONS_LIST.length) * 100}%` }} />
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-xl font-black text-slate-900 mb-5">{QUESTIONS_LIST[currentQ].q}</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {QUESTIONS_LIST[currentQ].opts.map((opt) => (
                      <button key={opt.v} onClick={() => handleAnswer(QUESTIONS_LIST[currentQ].id, opt.v)}
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
                  <div className="p-3 bg-black/20 rounded-2xl border border-white/20 text-[10px] font-bold leading-relaxed">
                    ⚠️ WARNING: This AI triage screening tool is not a medical diagnosis. Always consult a pediatrician or qualified healthcare professional.
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-0.5">AI Triage Screening</p>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">{result.title}</h2>
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
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">{t.diseaseChecker?.triage_label || 'Suggested Triage'}</p>
                    <p className="text-lg font-black">{result.condition}</p>
                  </div>

                  <div className="p-3.5 bg-black/10 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1.5">{t.diseaseChecker?.what_to_do || 'What to do'}</p>
                    <p className="text-[13px] sm:text-sm font-bold leading-relaxed">{result.advice}</p>
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
                  ⬇ Download Triage Report (.txt)
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

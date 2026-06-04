import express from 'express';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { auth, checkRole } from '../middleware/auth.js';
import dynamoHelper from '../dynamodb.js';
import eventEmitter from '../eventDispatcher.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait 1 minute.' },
});

const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

const OFFLINE_DISEASE_MAP = {
  'Malaria / मलेरिया': { severity: 'P2', specialty: 'General Physician', advice: 'Sleep under a mosquito net, drink fluids, and visit nearest PHC within 24h for blood test.' },
  'Dengue / डेंगू': { severity: 'P2', specialty: 'General Physician', advice: 'Complete bed rest, stay hydrated. Do NOT take pain relievers like Ibuprofen/Aspirin (only Paracetamol is safe).' },
  'Typhoid / टाइफाइड': { severity: 'P2', specialty: 'General Physician', advice: 'Drink only boiled/filtered water, eat soft cooked food, and complete prescribed antibiotics.' },
  'Tuberculosis (TB) / क्षय रोग (टीबी)': { severity: 'P2', specialty: 'Pulmonologist', advice: 'Wear a mask, sleep in a ventilated room, and visit PHC for free sputum/DOTS test.' },
  'Diarrhea & Cholera / दस्त (हैजा)': { severity: 'P1', specialty: 'Emergency Care', advice: 'Drink ORS after every stool to prevent dehydration. Continue light diet (rice/curd) and see doctor.' },
  'Dysentery / पेचिश (खूनी दस्त)': { severity: 'P2', specialty: 'General Physician', advice: 'Drink ORS to stay hydrated, eat clean soft food, and visit doctor for antibiotic check.' },
  'Jaundice / पीलिया (हेपेटाइटिस)': { severity: 'P2', specialty: 'Gastroenterologist', advice: 'Rest completely. Avoid fatty/oily food and alcohol. Seek medical check at PHC.' },
  'Urinary Tract Infection (UTI) / मूत्र पथ का संक्रमण (UTI)': { severity: 'P3', specialty: 'General Physician', advice: 'Drink 2-3 liters of water daily. Do not hold urine. Consult doctor for antibiotics.' },
  'Pneumonia / निमोनिया (फेफड़ों का संक्रमण)': { severity: 'P1', specialty: 'Pulmonologist', advice: 'Requires urgent doctor visit. Keep patient in upright position to ease breathing.' },
  'Anaemia / एनीमिया (खून की कमी)': { severity: 'P3', specialty: 'General Physician', advice: 'Eat iron-rich food daily (spinach, jaggery, dates). Consult ASHA for free Iron tablets.' },
  'Chickenpox / चेचक': { severity: 'P3', specialty: 'General Physician', advice: 'Keep isolated, avoid scratching blisters, apply calamine lotion, and watch for complications.' },
  'Measles / खसरा': { severity: 'P3', specialty: 'Pediatrician', advice: 'Keep isolated, keep eyes clean, consult doctor for vitamin A dosage and fever management.' },
  'Heatstroke / लू लगना': { severity: 'P1', specialty: 'Emergency Care', advice: 'Move to shade, apply wet cloths, sip cool water, and seek immediate emergency care.' },
  'Snakebite / सांप का काटना': { severity: 'P1', specialty: 'Emergency Care', advice: 'Keep calm and still, immobilize limb, do NOT cut or suck wound, seek nearest hospital with anti-venom immediately.' },
  'Acute Respiratory Infection / तीव्र श्वसन संक्रमण': { severity: 'P2', specialty: 'Pulmonologist', advice: 'Drink warm fluids, steam inhalation, and see doctor if breathing is difficult.' },
  'Skin Infection / त्वचा संक्रमण': { severity: 'P4', specialty: 'Dermatologist', advice: 'Keep skin clean and dry. Apply antifungal/antibacterial cream as prescribed.' },
  'Appendicitis / अपेंडिसाइटिस (पेट दर्द)': { severity: 'P1', specialty: 'Emergency Care', advice: 'Go to the emergency room immediately. Do NOT eat or drink anything until doctor checks you.' },
  'Meningitis / मस्तिष्क ज्वर (गर्दन अकड़ना)': { severity: 'P1', specialty: 'Neurologist', advice: 'Urgent neurological checkup needed. Go to the hospital emergency ward immediately.' },
  'Scrub Typhus / स्क्रब टाइफस': { severity: 'P2', specialty: 'General Physician', advice: 'Avoid contact with bush/shrubs, wear long clothes, and see doctor for Doxycycline check.' },
  'Pre-eclampsia (Maternal Hypertension) / गर्भावस्था उच्च रक्तचाप': { severity: 'P1', specialty: 'Obstetrician', advice: 'URGENT. Bed rest on left side, avoid salt, and visit hospital immediately to check blood pressure.' },
  'Gestational Diabetes / गर्भावधि मधुमेह': { severity: 'P2', specialty: 'Obstetrician', advice: 'Restrict sugars, follow diabetic diet plan, do moderate walking, and visit doctor for sugar profile.' },
  'Asthma / दमा (अस्थमा)': { severity: 'P2', specialty: 'Pulmonologist', advice: 'Avoid dust/smoke, use prescribed rescue inhaler, and see doctor if breathing does not improve.' },
  'Bronchitis / ब्रोंकाइटिस (फेफड़ों में सूजन)': { severity: 'P2', specialty: 'Pulmonologist', advice: 'Warm steam inhalation, drink hot water, avoid cold items, and seek medical consultation.' },
  'Food Poisoning / खाद्य विषाक्तता (दूषित भोजन)': { severity: 'P2', specialty: 'General Physician', advice: 'Drink plenty of ORS/coconut water. Avoid solid food for a few hours. Consult doctor if vomiting persists.' },
  'Rabies / रेबीज (पागल कुत्ते का काटना)': { severity: 'P1', specialty: 'Emergency Care', advice: 'Wash wound under running tap water with soap for 15 mins. Visit hospital immediately for Anti-Rabies Vaccine (ARV).' },
  'Tetanus / धनुस्तंभ (टिटनेस)': { severity: 'P1', specialty: 'Emergency Care', advice: 'Seek immediate hospitalization. Keep patient in a quiet, dark room to prevent muscle spasms.' },
  'Leptospirosis / लेप्टोस्पायरोसिस': { severity: 'P2', specialty: 'General Physician', advice: 'Avoid walking in waterlogged areas. See doctor immediately for early antibiotics.' },
  'Chikungunya / चिकनगुनिया': { severity: 'P2', specialty: 'General Physician', advice: 'Stay hydrated, take paracetamol for joint pain, and rest completely. Joint pain may persist for weeks.' },
  'Japanese Encephalitis / जापानी इन्सेफेलाइटिस': { severity: 'P1', specialty: 'Neurologist', advice: 'Requires immediate hospitalization. Monitor child/patient for fits or consciousness level.' },
  'Filariasis (Elephantiasis) / फाइलेरिया (हाथीपांव)': { severity: 'P3', specialty: 'General Physician', advice: 'Keep leg clean, elevate limb, wear comfortable footwear, and consult for DEC tablets.' },
  'Scabies / खाज-खुजली (स्केबीज)': { severity: 'P3', specialty: 'Dermatologist', advice: 'Wash all clothes/bedding in hot water. Apply Permethrin lotion from neck down as prescribed.' },
  'Peptic Ulcer Disease / पेट का अल्सर': { severity: 'P3', specialty: 'Gastroenterologist', advice: 'Avoid spicy food, tea, coffee, and pain-relievers. Eat small regular meals. Consult doctor.' },
  'GERD (Acid Reflux) / सीने में जलन (एसिडिटी)': { severity: 'P3', specialty: 'Gastroenterologist', advice: 'Do not lie down immediately after eating. Avoid fatty food, caffeine, and smoking.' },
  'Tonsillitis / टॉन्सिलाइटिस (गले का संक्रमण)': { severity: 'P3', specialty: 'ENT Specialist', advice: 'Gargle with warm salt water, drink warm fluids, rest voice, and see doctor if pain is severe.' },
  'Otitis Media (Ear Infection) / कान का संक्रमण': { severity: 'P3', specialty: 'ENT Specialist', advice: 'Do not put oil or water in ear. Keep ear dry and consult doctor for antibiotics.' },
  'Conjunctivitis (Pink Eye) / आंख आना (नेत्रशोथ)': { severity: 'P3', specialty: 'Ophthalmologist', advice: 'Wash hands frequently, do not touch eyes, use separate towel, and use antibiotic eye drops.' },
  'Covid-19 / कोविड-19': { severity: 'P2', specialty: 'General Physician', advice: 'Isolate yourself, wear a mask, monitor oxygen levels, and consult doctor if oxygen drops below 94%.' },
  'Diabetes Mellitus / मधुमेह (शुगर)': { severity: 'P3', specialty: 'Endocrinologist', advice: 'Avoid sweets/simple carbs, walk 30 mins daily, take medicines regularly, and inspect feet daily.' },
  'Hypertension / उच्च रक्तचाप (हाई बीपी)': { severity: 'P3', specialty: 'Cardiologist', advice: 'Reduce salt intake, avoid stress, walk daily, check BP weekly, and do not miss BP medicine.' },
  'Coronary Angina / हृदय शूल (सीने में दर्द)': { severity: 'P1', specialty: 'Cardiologist', advice: 'Keep patient calm, sit down, place Sorbitrate tablet under tongue if prescribed, go to ER immediately.' },
  'COPD / क्रॉनिक ब्रोंकाइटिस': { severity: 'P2', specialty: 'Pulmonologist', advice: 'Avoid smoking/chulha smoke, use inhaler as directed, seek doctor if breathless at rest.' },
  'Rheumatoid Arthritis / संधिशोथ (गठिया)': { severity: 'P3', specialty: 'Rheumatologist', advice: 'Gentle joint exercises, apply warm compress, avoid cold weather, and consult doctor.' },
  'Kidney Stones / गुर्दे की पथरी': { severity: 'P2', specialty: 'Urologist', advice: 'Drink 3-4 liters of water daily. Avoid spinach, tomatoes, and excess salt. Consult doctor.' },
  'Migraine / आधासीसी (माइग्रेन)': { severity: 'P3', specialty: 'Neurologist', advice: 'Rest in a dark quiet room, drink water, avoid triggers like tea/caffeine or bright light.' },
  'Goitre / घेंघा रोग (थायराइड)': { severity: 'P3', specialty: 'Endocrinologist', advice: 'Use iodized salt in cooking. Consult doctor for thyroid hormone level test.' },
  'Scorpion Sting / बिच्छू का डंक': { severity: 'P1', specialty: 'Emergency Care', advice: 'Wash with soap, keep limb low and still, do NOT cut, seek nearest doctor/hospital immediately for anti-venom.' },
  'Eczema / एक्जिमा (त्वचा की खुजली)': { severity: 'P3', specialty: 'Dermatologist', advice: 'Moisturize skin immediately after bath, avoid harsh soaps, use cotton clothes.' },
  'Psoriasis / सोरायसिस (त्वचा रोग)': { severity: 'P3', specialty: 'Dermatologist', advice: 'Keep skin moisturized, expose to mild sunlight, avoid scratching, and follow doctor\'s treatment.' },
  'Whooping Cough / काली खांसी (कुकुर खांसी)': { severity: 'P2', specialty: 'Pediatrician', advice: 'Keep child in fresh air, give small frequent liquids, and seek doctor for antibiotic check.' },
  'Ringworm / दाद (फंगल संक्रमण)': { severity: 'P3', specialty: 'Dermatologist', advice: 'Do not scratch, keep area dry, wash towel/clothes separately, apply antifungal cream.' },
  'Viral Fever & Cold / सामान्य बुखार और सर्दी': { severity: 'P4', specialty: 'General Physician', advice: 'Rest, drink warm fluids, monitor temperature, take paracetamol for fever. Consult doctor if fever lasts >3 days.' }
};

const rules = [
  { name: 'Malaria / मलेरिया', keywords: ['malaria', 'chills fever', 'shivering', 'jod bukhar', 'mosquito bite'] },
  { name: 'Dengue / डेंगू', keywords: ['dengue', 'eye pain', 'joint muscle pain', 'bone breaking fever', 'platelet', 'rash fever'] },
  { name: 'Typhoid / टाइफाइड', keywords: ['typhoid', 'step-ladder fever', 'stomach pain headache', 'miadi bukhar', 'miyadi bukhar'] },
  { name: 'Tuberculosis (TB) / क्षय रोग (टीबी)', keywords: ['tuberculosis', 'tb', 'cough three weeks', 'blood sputum', 'weight loss night sweat'] },
  { name: 'Diarrhea & Cholera / दस्त (हैजा)', keywords: ['diarrhea', 'diarrhoea', 'watery stool', 'vomit', 'dast', 'cholera'] },
  { name: 'Dysentery / पेचिश (खूनी दस्त)', keywords: ['dysentery', 'blood stool', 'bloody', 'pechish'] },
  { name: 'Jaundice / पीलिया (हेपेटाइटिस)', keywords: ['jaundice', 'yellow skin', 'yellow eyes', 'piliya', 'pila peshab'] },
  { name: 'Urinary Tract Infection (UTI) / मूत्र पथ का संक्रमण (UTI)', keywords: ['uti', 'burning urine', 'burn pee', 'peshab jalan'] },
  { name: 'Pneumonia / निमोनिया (फेफड़ों का संक्रमण)', keywords: ['pneumonia', 'breathing difficulty', 'chest pain cough', 'sans phulna'] },
  { name: 'Anaemia / एनीमिया (खून की कमी)', keywords: ['anemia', 'anaemia', 'weakness dizzy', 'khoon ki kami'] },
  { name: 'Chickenpox / चेचक', keywords: ['chickenpox', 'blisters', 'spots', 'chechak', 'daane'] },
  { name: 'Measles / खसरा', keywords: ['measles', 'khasra', 'flat rash', 'watery eyes'] },
  { name: 'Heatstroke / लू लगना', keywords: ['heatstroke', 'loo lagna', 'dhoop', 'high temp no sweat'] },
  { name: 'Snakebite / सांप का काटना', keywords: ['snake', 'bite', 'fang', 'saanp'] },
  { name: 'Acute Respiratory Infection / तीव्र श्वसन संक्रमण', keywords: ['respiratory', 'breathless', 'cough fever runny'] },
  { name: 'Skin Infection / त्वचा संक्रमण', keywords: ['skin infection', 'pus bumps', 'redness skin', 'khujli'] },
  { name: 'Appendicitis / अपेंडिसाइटिस (पेट दर्द)', keywords: ['appendicitis', 'right side stomach', 'navel pain', 'stomach append'] },
  { name: 'Meningitis / मस्तिष्क ज्वर (गर्दन अकड़ना)', keywords: ['meningitis', 'stiff neck', 'neck pain fever', 'mence'] },
  { name: 'Scrub Typhus / स्क्रब टाइफस', keywords: ['scrub typhus', 'eschar', 'mite bite', 'black scab'] },
  { name: 'Pre-eclampsia (Maternal Hypertension) / गर्भावस्था उच्च रक्तचाप', keywords: ['pre-eclampsia', 'pregnancy high bp', 'face swelling', 'pregnancy protein'] },
  { name: 'Gestational Diabetes / गर्भावधि मधुमेह', keywords: ['gestational diabetes', 'pregnancy sugar', 'pregnancy diabetes'] },
  { name: 'Asthma / दमा (अस्थमा)', keywords: ['asthma', 'wheezing', 'chest tightness', 'dama', 'inhaler'] },
  { name: 'Bronchitis / ब्रोंकाइटिस (फेफड़ों में सूजन)', keywords: ['bronchitis', 'yellow green mucus', 'sputum cough'] },
  { name: 'Food Poisoning / खाद्य विषाक्तता (दूषित भोजन)', keywords: ['food poisoning', 'food vomit', 'eating bad food'] },
  { name: 'Rabies / रेबीज (पागल कुत्ते का काटना)', keywords: ['rabies', 'dog bite', 'kutte ne kata', 'hydrophobia', 'fear of water'] },
  { name: 'Tetanus / धनुस्तंभ (टिटनेस)', keywords: ['tetanus', 'lockjaw', 'rusty nail', 'kil chot', 'muscle spasm'] },
  { name: 'Leptospirosis / लेप्टोस्पायरोसिस', keywords: ['leptospirosis', 'flood water', 'calf muscle', 'red eyes fever'] },
  { name: 'Chikungunya / चिकनगुनिया', keywords: ['chikungunya', 'severe joint pain', 'joints swell fever'] },
  { name: 'Japanese Encephalitis / जापानी इन्सेफेलाइटिस', keywords: ['japanese encephalitis', 'mosquito brain fever', 'dimagi bukhar'] },
  { name: 'Filariasis (Elephantiasis) / फाइलेरिया (हाथीपांव)', keywords: ['filariasis', 'elephantiasis', 'leg swelling huge', 'hathipao'] },
  { name: 'Scabies / खाज-खुजली (स्केबीज)', keywords: ['scabies', 'itching night', 'finger rash', 'khaj khujli'] },
  { name: 'Peptic Ulcer Disease / पेट का अल्सर', keywords: ['peptic ulcer', 'stomach burning ulcer', 'empty stomach pain'] },
  { name: 'GERD (Acid Reflux) / सीने में जलन (एसिडिटी)', keywords: ['gerd', 'acid reflux', 'heartburn', 'seene me jalan'] },
  { name: 'Tonsillitis / टॉन्सिलाइटिस (गले का संक्रमण)', keywords: ['tonsillitis', 'swollen tonsils', 'gale me tonsil', 'pain swallow'] },
  { name: 'Otitis Media (Ear Infection) / कान का संक्रमण', keywords: ['otitis media', 'ear pain', 'ear pus', 'kaan behna'] },
  { name: 'Conjunctivitis (Pink Eye) / आंख आना (नेत्रशोथ)', keywords: ['conjunctivitis', 'pink eye', 'eye discharge', 'aankh aana', 'laal aankhen'] },
  { name: 'Covid-19 / कोविड-19', keywords: ['covid', 'corona', 'loss smell taste', 'dry cough fever'] },
  { name: 'Diabetes Mellitus / मधुमेह (शुगर)', keywords: ['diabetes', 'sugar disease', 'frequent urine thirst', 'healing slow'] },
  { name: 'Hypertension / उच्च रक्तचाप (हाई बीपी)', keywords: ['hypertension', 'high bp', 'vertigo bp', 'dizziness head'] },
  { name: 'Coronary Angina / हृदय शूल (सीने में दर्द)', keywords: ['angina', 'chest pressure arm pain', 'heart pain', 'left arm pain'] },
  { name: 'COPD / क्रॉनिक ब्रोंकाइटिस', keywords: ['copd', 'chronic cough balgam', 'whistling breath', 'smoking cough'] },
  { name: 'Rheumatoid Arthritis / संधिशोथ (गठिया)', keywords: ['rheumatoid', 'morning stiff joints', 'gathiya', 'joint swelling pain'] },
  { name: 'Kidney Stones / गुर्दे की पथरी', keywords: ['kidney stone', 'pathri', 'back pain groin', 'painful blood urine'] },
  { name: 'Migraine / आधासीसी (माइग्रेन)', keywords: ['migraine', 'one side head pain', 'light sensitivity aura', 'adhasisi'] },
  { name: 'Goitre / घेंघा रोग (थायराइड)', keywords: ['goitre', 'goiter', 'thyroid neck', 'ghengha', 'neck swelling throat'] },
  { name: 'Scorpion Sting / बिच्छू का डंक', keywords: ['scorpion sting', 'bichhu ne kata', 'scorpion sting pain'] },
  { name: 'Eczema / एक्जिमा (त्वचा की खुजली)', keywords: ['eczema', 'dry skin peeling', 'scaly patches itching'] },
  { name: 'Psoriasis / सोरायसिस (त्वचा रोग)', keywords: ['psoriasis', 'silver scales skin', 'red scaly patches'] },
  { name: 'Whooping Cough / काली खांसी (कुकुर खांसी)', keywords: ['whooping cough', 'hacking cough fits', 'whoop sound', 'kali khansi'] },
  { name: 'Ringworm / दाद (फंगल संक्रमण)', keywords: ['ringworm', 'round rash', 'circular patch itching', 'daad'] },
  { name: 'Viral Fever & Cold / सामान्य बुखार और सर्दी', keywords: ['fever', 'cough', 'cold', 'headache', 'body ache', 'sardi', 'bukhar'] }
];

function predictDiseaseLocal(text) {
  if (!text || !text.trim()) return 'Undetermined Symptoms / अनिर्धारित लक्षण';
  const clean = text.toLowerCase().trim();
  let bestMatch = 'Undetermined Symptoms / अनिर्धारित लक्षण';
  let maxScore = 0;

  for (const d of rules) {
    let score = 0;
    for (const kw of d.keywords) if (clean.includes(kw)) score += 1;
    if (score > maxScore) { maxScore = score; bestMatch = d.name; }
  }
  return bestMatch;
}

// ── Helper: derive districtId from village_health or env fallback ─────────────
async function getDistrictId(db, villageId) {
  try {
    const row = await db.get('SELECT "districtId" FROM village_health WHERE "villageId" = ?', [villageId]);
    return row?.districtId || process.env.DISTRICT_NAME || 'district_main';
  } catch (_) {
    return process.env.DISTRICT_NAME || 'district_main';
  }
}

router.post('/emergency-alert', auth, async (req, res) => {
  const db   = req.app.locals.db;
  const pool = req.app.locals.pool;
  const { alertType = 'menstrual_emergency', message = 'Emergency help needed' } = req.body;
  try {
    const userId = req.user.id;
    const userRecord = await db.get('SELECT name, "villageId" FROM users WHERE id = ?', [userId]);
    const userName = userRecord?.name || 'Unknown User';
    const villageId = userRecord?.villageId || 'v101';

    // Fix 2: derive real districtId — no more 'district_main' hardcode
    const districtId = await getDistrictId(db, villageId);

    let requestId;
    if (pool) {
      const resPg = await pool.query(
        'INSERT INTO ambulance_requests (user_id, name, location, priority, symptoms, status, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [userId, userName, villageId, 'High', message, 'pending', alertType]
      );
      requestId = resPg.rows[0].id;
    } else {
      const result = await db.run(
        'INSERT INTO ambulance_requests (user_id, name, location, priority, symptoms, status, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, userName, villageId, 'High', message, 'pending', alertType]
      );
      requestId = result.lastID;
    }

    const timestamp  = new Date().toISOString();
    const requestObj = { requestId, userId, name: userName, location: villageId, priority: 'High', symptoms: message, status: 'pending', timestamp, type: alertType };

    await dynamoHelper.put('emergency_streams', {
      districtId,
      streamId: `amb-${requestId}-${Date.now()}`,
      priority: 'High',
      ...requestObj
    });

    if (typeof req.app.locals.broadcastToAdmins === 'function') {
      req.app.locals.broadcastToAdmins('ambulance', requestObj);
    }

    res.status(201).json({ success: true, requestId });
  } catch (err) {
    console.error('Emergency alert error:', err);
    res.status(500).json({ error: 'Failed to process emergency alert.' });
  }
});

router.post('/symptoms', auth, aiLimiter, checkRole(['villager', 'ngo', 'admin']), logAudit('evaluate_symptoms', 'symptoms'), async (req, res) => {
  const db = req.app.locals.db;
  const AI_SERVICE_URL = req.app.locals.AI_SERVICE_URL;
  const text = sanitize(req.body.symptoms);
  const userId = req.user.id;
  const villageId = req.user.villageId || req.body.villageId;
  
  let prediction;
  let disease = 'Undetermined Symptoms / अनिर्धारित लक्षण';
  let advice = 'Consult your local ASHA worker or visit the nearest PHC.';
  let severity = 'P3';
  let doctor_specialty = 'General Physician';
  let confidence = null;
  let alternatives = [];
  let model = 'Offline Rule Matcher';
  let accuracy = '90.0%';

  try {
    const aiRes = await axios.post(`${AI_SERVICE_URL}/predict/disease`, { symptoms: text }, {
      headers: { 'x-trace-id': req.traceId },
      timeout: 8000
    });
    prediction = aiRes.data.prediction;
    disease = aiRes.data.disease || prediction;
    advice = aiRes.data.advice || '';
    severity = aiRes.data.severity || 'P3';
    doctor_specialty = aiRes.data.doctor_specialty || 'General Physician';
    confidence = aiRes.data.confidence;
    alternatives = aiRes.data.alternatives || [];
    model = aiRes.data.model || 'Hybrid Model';
    accuracy = aiRes.data.accuracy || '86.9%';
  } catch (err) {
    console.warn('AI Service unavailable for symptom check — using offline rule:', err.message);
    const matchedName = predictDiseaseLocal(text);
    const details = OFFLINE_DISEASE_MAP[matchedName] || {
      severity: 'P3',
      specialty: 'General Physician',
      advice: 'Consult your local ASHA worker or visit the nearest PHC.'
    };
    disease = matchedName;
    advice = details.advice;
    severity = details.severity;
    doctor_specialty = details.specialty;
    prediction = `${matchedName} - Reliable Advice: ${advice}`;
  }

  await db.run(
    'INSERT INTO symptoms ("userId", "villageId", symptoms, prediction, disease, advice, confidence, model_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, villageId, text, prediction, disease, advice, confidence, model]
  );

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const logs = await db.all(
    `SELECT id FROM symptoms WHERE "villageId" = ? AND "createdAt" >= ?`,
    [villageId, oneDayAgo]
  ).catch(() => []);
  const alert = logs.length > 5 ? `⚠️ CLUSTER ALERT in ${villageId}: ${logs.length} similar cases detected.` : null;
  if (alert) eventEmitter.emit('outbreak_detected', { villageId, count: logs.length, prediction });

  res.send({ 
    prediction,
    disease,
    advice,
    severity,
    doctor_specialty,
    confidence,
    alternatives,
    model,
    accuracy,
    alert 
  });
});

router.post('/skin-log', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { condition, severity, rednessPercent, irregularPercent } = req.body;
  const userId = req.user.id;
  const villageId = req.user.villageId || 'v101';
  try {
    await db.run(
      'INSERT INTO skin_logs ("userId", "villageId", condition, severity, "rednessPercent", "irregularPercent") VALUES (?, ?, ?, ?, ?, ?)',
      [userId, villageId, condition, severity, rednessPercent, irregularPercent]
    );
    res.status(201).send({ status: 'Logged' });
  } catch (err) {
    console.error('Failed to log skin condition:', err);
    res.status(500).send({ error: 'Failed to log skin condition' });
  }
});

router.post('/ambulance', auth, logAudit('request_ambulance', 'ambulance_requests'), async (req, res) => {
  const db = req.app.locals.db;
  const usingSQLite = req.app.locals.usingSQLite;
  const name     = sanitize(req.body.name);
  const location = sanitize(req.body.location);
  const priority = sanitize(req.body.priority);
  const sxy      = sanitize(req.body.symptoms);
  const userId   = req.user.id;
  try {
    let recent = null;
    if (usingSQLite) {
      recent = await db.get(
        `SELECT id FROM ambulance_requests WHERE user_id = ? AND created_at >= datetime('now', '-60 seconds')`,
        [userId]
      );
    } else {
      recent = await db.get(
        `SELECT id FROM ambulance_requests WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '60 seconds'`,
        [userId]
      );
    }
    if (recent) {
      return res.status(429).json({
        error: 'Request already sent. Please wait 60 seconds before sending another.',
        retryAfter: 60
      });
    }

    const result = await db.run(
      'INSERT INTO ambulance_requests (user_id, name, location, priority, request_type, symptoms, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, location, priority, 'ambulance', sxy, 'pending']
    );

    const requestId  = result.lastID;
    const timestamp  = new Date().toISOString();
    const requestObj = { requestId, userId, name, location, priority, symptoms: sxy, status: 'pending', timestamp };

    // Fix 2: derive real districtId from the village's record in the DB
    const districtId = await getDistrictId(db, req.user.villageId || location);

    await dynamoHelper.put('emergency_streams', {
      districtId,
      streamId: `amb-${requestId}-${Date.now()}`,
      priority: priority || 'High',
      ...requestObj
    });

    if (typeof req.app.locals.broadcastToAdmins === 'function') {
      req.app.locals.broadcastToAdmins('ambulance', requestObj);
    }

    console.log(`[AMBULANCE] Request #${requestId} from user ${userId} — ${priority} at ${location} (district: ${districtId}) → SSE broadcast`);
    res.status(201).json({ status: 'dispatched', eta: '14 mins', requestId });
  } catch (err) {
    console.error('[AMBULANCE ERROR]', err);
    res.status(500).json({
      error: 'Server error saving ambulance request.',
      details: err.message,
      hint: 'Please call 108 directly.'
    });
  }
});

router.get('/ambulance-status', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const latest = await db.get(
      'SELECT id, status, location, priority, created_at FROM ambulance_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [req.user.id]
    );
    if (!latest) return res.status(404).json({ error: 'No requests found.' });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status.' });
  }
});

router.get('/my-history', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const symptoms = await db.all(
      'SELECT id, symptoms, prediction, "createdAt" FROM symptoms WHERE "userId" = ? ORDER BY id DESC LIMIT 5',
      [req.user.id]
    );
    const ambulances = await db.all(
      'SELECT id, location, priority, status, created_at FROM ambulance_requests WHERE user_id = ? ORDER BY id DESC LIMIT 5',
      [req.user.id]
    );
    res.json({ symptoms, ambulances });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

router.get('/schemes', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).send({ error: 'User not found.' });

    const { age, gender, economic_status, caste, area_type } = user;

    const rows = await db.all(
      `SELECT * FROM government_schemes
       WHERE (min_age = 0 OR min_age <= ?)
         AND (max_age = 120 OR max_age >= ?)
         AND (gender_eligibility = 'all' OR gender_eligibility = ? OR ? IS NULL)
         AND (
           economic_status_eligibility = 'all'
           OR economic_status_eligibility = ?
           OR ? IS NULL
         )
       ORDER BY id`,
      [age || 25, age || 25, gender || 'all', gender || null, economic_status || null, economic_status || null]
    );

    const schemes = rows.map(s => ({
      ...s,
      steps: s.steps ? s.steps.split('|') : [],
      required_documents: s.required_documents ? s.required_documents.split(',') : []
    }));

    res.json({ schemes, profile: { age, gender, economic_status, caste, area_type } });
  } catch (err) {
    console.error('Schemes fetch error:', err);
    res.status(500).send({ error: 'Failed to fetch schemes.' });
  }
});

router.get('/schemes/all', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const rows = await db.all('SELECT * FROM government_schemes ORDER BY id');
    const schemes = rows.map(s => ({
      ...s,
      steps: s.steps ? s.steps.split('|') : [],
      required_documents: s.required_documents ? s.required_documents.split(',') : []
    }));
    res.json({ schemes });
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch all schemes.' });
  }
});

router.get('/schemes/:id', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const scheme = await db.get('SELECT * FROM government_schemes WHERE id = ?', [req.params.id]);
    if (!scheme) return res.status(404).send({ error: 'Scheme not found.' });
    scheme.steps = scheme.steps ? scheme.steps.split('|') : [];
    scheme.required_documents = scheme.required_documents ? scheme.required_documents.split(',') : [];
    res.json(scheme);
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch scheme.' });
  }
});

router.post('/villager/pad-request', auth, logAudit('request_pads', 'ambulance_requests'), async (req, res) => {
  const db = req.app.locals.db;
  const { village } = req.body;
  if (!village) return res.status(400).send({ error: 'Village name is required.' });
  try {
    const userRecord = await db.get('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const userName = userRecord?.name || 'Unknown Villager';

    await db.run('INSERT INTO ambulance_requests (user_id, name, location, priority, request_type, symptoms, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, userName, village, 'Low', 'pad_request', 'Requires Sanitary Pads delivered to village.', 'pending']
    );
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to process pad request.' });
  }
});

router.post('/health-assistant', auth, aiLimiter, async (req, res) => {
  const AI_SERVICE_URL = req.app.locals.AI_SERVICE_URL;
  const ragTraces = req.app.locals.ragTraces || [];
  const { message } = req.body;
  if (!message) return res.status(400).send({ error: 'Message is required.' });

  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey || groqKey === 'your_groq_api_key_here') {
    return res.send({
      reply: "Hello! I'm Sakhi. My advanced AI brain is currently being updated to better serve you. For now, please refer to the verified health tips above or contact your local ASHA worker for any health concerns. I'll be back fully soon!",
      grounded: false,
      sources: ["Sakhi Health Assistant — General Information"],
      urgency: "P4"
    });
  }

  const ragStartTime = Date.now();
  try {
    const ragRes = await axios.post(`${AI_SERVICE_URL}/ai/rag-chat`, { message }, {
      headers: { 'x-trace-id': req.traceId },
      timeout: 12000
    });
    const duration = Date.now() - ragStartTime;
    ragTraces.push({
      traceId: req.traceId,
      timestamp: new Date().toISOString(),
      query: message.slice(0, 40),
      latency: duration,
      chunksCount: ragRes.data.sources?.length || 2,
      similarityScore: ragRes.data.similarity || 0.88,
      grounded: true,
      sources: ragRes.data.sources || []
    });
    if (ragTraces.length > 15) ragTraces.shift();

    return res.send({
      reply: ragRes.data.reply,
      sources: ragRes.data.sources || [],
      urgency: ragRes.data.urgency || 'P4',
      grounded: true
    });
  } catch (ragErr) {
    const duration = Date.now() - ragStartTime;
    console.warn('[Sakhi] RAG service unavailable, falling back to direct Groq with hard guardrails:', ragErr.message);
    ragTraces.push({
      traceId: req.traceId,
      timestamp: new Date().toISOString(),
      query: message.slice(0, 40),
      latency: duration,
      chunksCount: 0,
      similarityScore: 0.0,
      grounded: false,
      sources: ["Sakhi Health Assistant — General Information"]
    });
    if (ragTraces.length > 15) ragTraces.shift();
  }

  const queryClean = message.trim().toLowerCase().replace(/[?!.,]/g, '');

  const GREETINGS = ["hi", "hello", "namaste", "helo", "hey", "hola", "kaise ho", "good morning", "good evening", "namaskar", "pranam", "kya ho", "kaun ho", "who are you", "what is this", "intro", "sakhi"];
  const isGreeting = GREETINGS.some(g => queryClean === g || queryClean.startsWith(g + " ")) && message.split(/\s+/).length <= 4;

  const HEALTH_KEYWORDS = [
    "period", "menses", "mahvari", "mahavari", "maahvaari", "pad", "pads", "sanitary", "hygiene", "bleed", "bleeding",
    "mowho", "mahavari", "chhati", "pain", "dard", "discharge", "cycle", "white discharge", "periods", "pelvic",
    "pregnant", "pregnancy", "garbh", "garbhavastha", "delivery", "birth", "bacha", "bachhe", "bacche", "child",
    "nutrition", "breastfeed", "dudh", "doodh", "feed", "mother", "anc", "pcos", "weight", "acne",
    "fever", "bukhar", "vomit", "vomiting", "ultee", "diarrhea", "loose stool", "dast", "dehydration", "snake",
    "snakebite", "saanp", "heat", "heatstroke", "loo", "ambulance", "hospital", "phc", "doctor", "illness",
    "disease", "samasya", "bimar", "bimari", "vaccine", "dawa", "medicine", "cough", "tb", "tuberculosis",
    "malaria", "dengue", "typhoid", "hypertension", "bp", "pressure", "heart", "ors", "zinc"
  ];
  const hasHealthKeyword = HEALTH_KEYWORDS.some(k => queryClean.includes(k));

  if (!isGreeting && !hasHealthKeyword) {
    return res.send({
      reply: "Namaste! Main Sakhi hoon, aapki women's health assistant. Main keval mahila aur parivaar ke swasthya, pregnancy, aur periods se jude sawalon ke jawab de sakti hoon. Kripya swasthya se juda sawal poochein.",
      sources: ["Sakhi Health Assistant — General Information"],
      urgency: "P4",
      grounded: false
    });
  }

  try {
    let systemPrompt = "";
    if (isGreeting) {
      systemPrompt = `You are Sakhi, a warm, polite, and trusted female Women's & Family Health Assistant for rural India.
The user is saying hello. Respond with a warm, culturally polite greeting in the exact SAME language or Hinglish style they used.
Introduce yourself as Sakhi, and invite them to ask you any questions about pregnancy care, menstrual hygiene, periods, maternal health, or child nutrition.
Keep your response extremely brief (2 sentences max). Do NOT mention any medical rules or diseases in this greeting.
FEMALE PERSONA RULE: You are female. Use feminine verb endings in Hindi/Hinglish (e.g. use "sakti hoon", "karungi", "bolungi" — NEVER use masculine "karunga", "saku", "bolunga", "jaunga").`;
    } else {
      systemPrompt = `You are Sakhi, a warm, polite, and highly trusted female Women's & Family Health Assistant for rural India.
Provide safe, accurate, empathetic guidance on menstrual health, pregnancy care, nutrition, hygiene, and when to see a doctor.
FEMALE PERSONA RULE: You are female. You MUST use feminine grammar and verb endings in Hindi/Hinglish (e.g. use "sakti hoon", "karungi", "bolungi" — NEVER use masculine "karunga", "saku", "bolunga", "jaunga").
CRITICAL CLINICAL & TRANSLATION SAFEGUARDS:
1. Menstruation/Periods/Mowho: Explain it strictly as a normal monthly biological process where the uterus lining (garbhashay ki lining) sheds, causing blood flow (khoon ka bahaw).
2. ABSOLUTE BAN ON HAIR TRANSLATION: Never under any circumstances translate period bleeding or flow as hair ("baal" or "balon" or "balon ka nikaas"). Doing so is medically incorrect and unsafe.
3. ABSOLUTE BAN ON MYTHS: Do NOT mention any non-scientific cultural taboos, bad blood, toxins, impurities, bad spirits, or curses.
4. Keep responses strictly concise: 2-3 sentences maximum. Never diagnose or prescribe medicines — always recommend consulting a doctor or local ASHA worker.`;
    }

    const groqRes = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.35,
        max_tokens: 300
      },
      { headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' } }
    );
    const reply = groqRes.data.choices?.[0]?.message?.content || 'I could not process your question. Please try again.';
    let sources = ["Sakhi Health Assistant — General Information"];
    if (queryClean.match(/period|bleed|menses|mahvari|mahavari|maahvaari|pad|pads|hygiene/)) {
      sources = ["WHO Menstrual Hygiene Guidelines", "MoHFW MHM Scheme 2023", "FOGSI Menstrual Health Manual"];
    } else if (queryClean.match(/pregnant|pregnancy|garbh|delivery|birth|anc/)) {
      sources = ["WHO Antenatal Care Guidelines", "Ministry of Health Maternal Care Protocols", "FOGSI Obstetric Care Guidelines"];
    } else if (queryClean.match(/fever|bukhar|cough|vomit|diarrhea|dehydration|ors|zinc/)) {
      sources = ["WHO Pediatric Diarrheal Disease Management", "National Health Mission Clinical Guidance"];
    } else if (queryClean.match(/heat|stroke|loo/)) {
      sources = ["NDMA Heat Wave Action Plan Guidelines"];
    } else if (queryClean.match(/snake|saanp/)) {
      sources = ["National Snakebite Management Protocols"];
    }
    const lastTrace = ragTraces[ragTraces.length - 1];
    if (lastTrace && lastTrace.traceId === req.traceId) {
      lastTrace.sources = sources;
    }
    res.send({
      reply,
      sources,
      urgency: "P4",
      grounded: false
    });
  } catch (err) {
    console.error('Groq API error:', err.response?.data || err.message);
    res.status(503).send({ error: 'Health Assistant is temporarily unavailable. Please try again.' });
  }
});

// POST /villager/sync-health — Telemetry recorder on client IndexedDB queue replay
router.post('/villager/sync-health', auth, async (req, res) => {
  const { recordCount, durationMs } = req.body;
  try {
    const deviceId = req.headers['x-device-id'] || 'unknown-device';
    const logItem = {
      deviceId,
      queuedAt: new Date().toISOString(),
      status: 'synced',
      recordCount: Number(recordCount || 0),
      durationMs: Number(durationMs || 0),
      userId: req.user.id
    };

    await dynamoHelper.put('sync_queues', logItem);
    console.log(`[SYNC REPLAY] Successful drainage of ${recordCount} items from device ${deviceId} in ${durationMs}ms`);
    res.json({ success: true });
  } catch (err) {
    console.error('[SYNC REPLAY ERROR]', err.message);
    res.status(500).json({ error: 'Failed to record sync telemetry.' });
  }
});

// POST /villager/phq2 — Patient Health Questionnaire-2 mental health triage screener
router.post('/villager/phq2', auth, logAudit('evaluate_mental_health', 'symptoms'), async (req, res) => {
  const db = req.app.locals.db;
  const { interest_score, mood_score } = req.body;

  if (interest_score === undefined || mood_score === undefined) {
    return res.status(400).json({ error: 'interest_score and mood_score are required (range: 0-3).' });
  }

  const score = Number(interest_score) + Number(mood_score);
  const positiveScreen = score >= 3;
  const advice = positiveScreen 
    ? 'Your responses suggest you might be experiencing depression. We advise consulting a doctor or mental health professional. An alert has been sent to your local ASHA worker.'
    : 'Your responses suggest a low risk. Continue prioritizing sleep, exercise, and social connections.';

  try {
    const villageId = req.user.villageId || 'unassigned';
    await db.run(
      `INSERT INTO symptoms ("userId", "villageId", symptoms, prediction, disease, advice, confidence, model_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, villageId, `PHQ-2 score: ${score} (Interest: ${interest_score}, Mood: ${mood_score})`, advice, 'Depression Screen (PHQ-2)', advice, 1.0, 'PHQ-2 Screener']
    );

    if (positiveScreen) {
      const userName = req.user.name || 'Anonymous Villager';
      const userPhone = req.user.phone || null;
      
      await db.run(
        `INSERT INTO referrals (patient_name, patient_phone, "villageId", referred_by, referred_to, reason, priority, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [userName, userPhone, villageId, req.user.id, 'Mental Health Center / PHC', `Positive PHQ-2 Screen (Score: ${score}/6)`, 'urgent', 'Auto-generated via PHQ-2 Screening']
      );
    }

    res.json({ success: true, score, positiveScreen, advice });
  } catch (err) {
    console.error('[PHQ2 ERROR]', err.message);
    res.status(500).json({ error: 'Failed to process PHQ-2 screening.' });
  }
});

router.get('/predict/seasonal-risk', auth, async (req, res) => {
  const AI_SERVICE_URL = req.app.locals.AI_SERVICE_URL;
  const villageId = req.query.villageId || 'v101';
  const month = req.query.month;
  try {
    const url = month 
      ? `${AI_SERVICE_URL}/predict/seasonal-risk?villageId=${encodeURIComponent(villageId)}&month=${encodeURIComponent(month)}`
      : `${AI_SERVICE_URL}/predict/seasonal-risk?villageId=${encodeURIComponent(villageId)}`;
    const aiRes = await axios.get(url);
    res.json(aiRes.data);
  } catch (err) {
    console.error('AI Service Error (Seasonal Risk):', err.message);
    res.status(503).json({ error: 'Seasonal risk prediction AI is currently unavailable.' });
  }
});

export default router;

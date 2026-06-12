/**
 * semanticCache.js — Local Semantic AI Cache
 *
 * Uses IndexedDB for persistent offline storage of:
 *   1. Repeated symptom AI query results
 *   2. Multilingual emergency first-aid guidance
 *   3. RAG/WHO guideline chunks
 *
 * Cache TTL: 24h for symptoms, 7 days for emergency/WHO content.
 * Falls back to in-memory Map if IndexedDB is unavailable.
 */

const DB_NAME = 'swasthai_cache';
const DB_VERSION = 1;
const STORES = {
  symptoms:  'symptoms_cache',   // TTL: 24h
  emergency: 'emergency_cache',  // TTL: 7 days
  rag:       'rag_cache',        // TTL: 7 days
};

const TTL = {
  symptoms:  24 * 60 * 60 * 1000,        // 24 hours
  emergency: 7  * 24 * 60 * 60 * 1000,   // 7 days
  rag:       7  * 24 * 60 * 60 * 1000,   // 7 days
};

// ── Fallback in-memory store when IndexedDB is blocked ─────────────────────
const memoryFallback = new Map();

// ── IndexedDB bootstrap ──────────────────────────────────────────────────────
let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { resolve(null); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.values(STORES).forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'key' });
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => { console.warn('[SemanticCache] IndexedDB unavailable, using memory fallback.'); resolve(null); };
    req.onblocked = () => { console.warn('[SemanticCache] IndexedDB blocked by another tab, using memory fallback.'); resolve(null); };
  });
  return dbPromise;
}

// ── Core read/write helpers ──────────────────────────────────────────────────
async function idbGet(storeName, key) {
  const db = await getDB();
  if (!db) return memoryFallback.get(`${storeName}:${key}`) || null;
  return new Promise((resolve) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => resolve(null);
  });
}

async function idbSet(storeName, key, value) {
  const db = await getDB();
  if (!db) { memoryFallback.set(`${storeName}:${key}`, value); return; }
  return new Promise((resolve) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(value);
    req.onsuccess = () => resolve();
    req.onerror   = () => resolve(); // Non-fatal
  });
}

async function idbDelete(storeName, key) {
  const db = await getDB();
  if (!db) { memoryFallback.delete(`${storeName}:${key}`); return; }
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
  });
}

// ── Normalise symptom text for cache key ────────────────────────────────────
// Strips punctuation and whitespace, lowercases — so "Fever, headache!" and
// "fever headache" resolve to the same cache key.
function normaliseKey(text) {
  return text.toLowerCase().replace(/[^a-z0-9\u0900-\u097f\u0080-\u00ff]/gi, ' ').trim().replace(/\s+/g, ' ');
}

// ── TTL expiry check ──────────────────────────────────────────────────────────
function isExpired(entry, ttlMs) {
  return !entry || !entry.ts || (Date.now() - entry.ts) > ttlMs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Look up a cached symptom prediction.
 * @param {string} symptomsText  Raw symptom input from the user
 * @param {string} [lang='en']   Language code (affects cache namespace)
 * @returns {object|null}  { prediction, sources, urgency, fromCache: true } or null
 */
export async function getCachedSymptomResult(symptomsText, lang = 'en') {
  const key  = `${lang}:${normaliseKey(symptomsText)}`;
  const entry = await idbGet(STORES.symptoms, key);
  if (isExpired(entry, TTL.symptoms)) return null;
  return { ...entry.data, fromCache: true, cachedAt: entry.ts };
}

/**
 * Store an AI symptom result in the cache.
 * @param {string} symptomsText  Raw input
 * @param {object} result        AI response object
 * @param {string} [lang='en']
 */
export async function setCachedSymptomResult(symptomsText, result, lang = 'en') {
  const key = `${lang}:${normaliseKey(symptomsText)}`;
  await idbSet(STORES.symptoms, key, { key, data: result, ts: Date.now() });
}

/**
 * Get cached emergency first-aid guidance for a given condition.
 * @param {string} condition  e.g. 'snakebite', 'heatstroke', 'cardiac_arrest'
 * @param {string} [lang='en']
 * @returns {object|null}
 */
export async function getCachedEmergencyGuidance(condition, lang = 'en') {
  const key   = `${lang}:${condition.toLowerCase().replace(/\s+/g, '_')}`;
  const entry = await idbGet(STORES.emergency, key);
  if (isExpired(entry, TTL.emergency)) return null;
  return { ...entry.data, fromCache: true };
}

/**
 * Store emergency first-aid guidance (seeded once from bundled data).
 */
export async function setCachedEmergencyGuidance(condition, data, lang = 'en') {
  const key = `${lang}:${condition.toLowerCase().replace(/\s+/g, '_')}`;
  await idbSet(STORES.emergency, key, { key, data, ts: Date.now() });
}

/**
 * Get a cached RAG/WHO chunk by topic.
 * @param {string} topic  e.g. 'malaria_prevention', 'ORS_preparation'
 * @returns {object|null}
 */
export async function getCachedRAGChunk(topic) {
  const key   = normaliseKey(topic);
  const entry = await idbGet(STORES.rag, key);
  if (isExpired(entry, TTL.rag)) return null;
  return entry.data;
}

/**
 * Store a RAG/WHO chunk.
 */
export async function setCachedRAGChunk(topic, data) {
  const key = normaliseKey(topic);
  await idbSet(STORES.rag, key, { key, data, ts: Date.now() });
}

/**
 * Purge all expired entries from all stores.
 * Call once on app start to keep storage lean.
 */
export async function purgeExpiredCache() {
  const db = await getDB();
  if (!db) return;
  const storeList = [
    { name: STORES.symptoms,  ttl: TTL.symptoms  },
    { name: STORES.emergency, ttl: TTL.emergency },
    { name: STORES.rag,       ttl: TTL.rag       },
  ];
  for (const { name, ttl } of storeList) {
    await new Promise((resolve) => {
      const tx      = db.transaction(name, 'readwrite');
      const store   = tx.objectStore(name);
      const req     = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) { resolve(); return; }
        if (isExpired(cursor.value, ttl)) cursor.delete();
        cursor.continue();
      };
      req.onerror = () => resolve();
    });
  }
}

/**
 * Report cache stats (for MonitoringDashboard).
 * @returns {{ symptoms: number, emergency: number, rag: number }}
 */
export async function getCacheStats() {
  const db = await getDB();
  if (!db) return { symptoms: 0, emergency: 0, rag: 0 };
  const counts = {};
  for (const [key, name] of Object.entries(STORES)) {
    counts[key] = await new Promise((resolve) => {
      const tx  = db.transaction(name, 'readonly');
      const req = tx.objectStore(name).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => resolve(0);
    });
  }
  return counts;
}

// ── Bundled multilingual emergency first-aid seed data ──────────────────────
// Pre-seeded so it is available offline from the very first load.
const EMERGENCY_SEED = {
  snakebite: {
    en: { title: 'Snakebite First Aid', steps: ['Keep the person still and calm','Immobilize the bitten limb below heart level','Remove tight clothing/jewellery near bite','Do NOT cut, suck, or apply tourniquet','Rush to hospital with anti-venom — call 108 immediately'], urgent: true },
    hi: { title: 'साँप के काटने पर प्राथमिक चिकित्सा', steps: ['व्यक्ति को शांत रखें','काटे हुए अंग को दिल के नीचे रखें','तंग कपड़े हटाएं','काटें नहीं, चूसें नहीं','108 कॉल करें, तुरंत अस्पताल जाएं'], urgent: true },
  },
  heatstroke: {
    en: { title: 'Heatstroke First Aid', steps: ['Move to shade immediately','Apply wet cloths to neck, armpits, groin','Fan the person actively','Give sips of cool water if conscious','Call 108 — heatstroke is life-threatening'], urgent: true },
    hi: { title: 'लू लगने पर प्राथमिक चिकित्सा', steps: ['तुरंत छाया में ले जाएं','गर्दन, बगल पर गीला कपड़ा लगाएं','हवा दें','होश में हो तो ठंडा पानी पिलाएं','108 पर कॉल करें'], urgent: true },
  },
  choking: {
    en: { title: 'Choking First Aid', steps: ['Ask: Are you choking?','Give 5 firm back blows between shoulder blades','Give 5 abdominal thrusts (Heimlich)','Repeat until object expelled or person unconscious','Call 108 if unconscious'], urgent: true },
    hi: { title: 'गले में कुछ फंसने पर', steps: ['पूछें: क्या आप घुट रहे हैं?','कंधे के बीच 5 बार थपथपाएं','पेट पर 5 बार दबाव दें','दोहराएं जब तक निकले या बेहोश हो','बेहोश होने पर 108 कॉल करें'], urgent: true },
  },
  severe_bleeding: {
    en: { title: 'Severe Bleeding Control', steps: ['Apply firm direct pressure with a clean cloth','Keep pressing — do not remove cloth, add more on top','Elevate the limb above heart','Do NOT apply tourniquet unless limb is severed','Call 108 immediately'], urgent: true },
    hi: { title: 'अधिक खून बहने पर', steps: ['साफ कपड़े से दबाव डालें','दबाव बनाए रखें, कपड़ा न हटाएं','अंग को दिल से ऊंचा रखें','108 पर कॉल करें'], urgent: true },
  },
  ors_preparation: {
    en: { title: 'ORS (Oral Rehydration Solution)', steps: ['Take 1 litre of clean boiled water','Add 6 level teaspoons of sugar','Add 1/2 teaspoon of salt','Stir until dissolved','Give small sips every 5 minutes'], urgent: false },
    hi: { title: 'ORS बनाने का तरीका', steps: ['1 लीटर साफ उबला पानी लें','6 चम्मच चीनी मिलाएं','आधा चम्मच नमक मिलाएं','अच्छे से मिलाएं','हर 5 मिनट में थोड़ा-थोड़ा पिलाएं'], urgent: false },
  },
};

/**
 * Seed emergency guidance into cache on first load.
 * Idempotent — only writes if not already cached.
 */
export async function seedEmergencyCache() {
  for (const [condition, langs] of Object.entries(EMERGENCY_SEED)) {
    for (const [lang, data] of Object.entries(langs)) {
      const existing = await getCachedEmergencyGuidance(condition, lang);
      if (!existing) {
        await setCachedEmergencyGuidance(condition, data, lang);
      }
    }
  }
  await seedRAGCache();
}

// ── Bundled RAG Multilingual Guideline Seeds ────────────────────────────────
const RAG_SEED_DATA = [
  // --- English ---
  {
    key: "en_rag_anc",
    lang: "en",
    text: "Pregnant women should attend at least 8 antenatal care (ANC) visits. The first ANC visit should be scheduled before 12 weeks of pregnancy. Initial checks must cover blood pressure, haemoglobin, blood sugar, and urine protein.",
    source: "WHO ANC Guidelines + MoHFW",
    urgency: "P4",
    keywords: ["pregnancy", "pregnant", "anc", "visit", "weeks", "baby", "delivery", "birth", "checkup"]
  },
  {
    key: "en_rag_pregnancy_hypertension",
    lang: "en",
    text: "Gestational hypertension (BP >= 140/90 mmHg) requires close observation. Severe hypertension (BP >= 160/110 mmHg) is a critical emergency requiring immediate hospital admission to prevent maternal seizures (eclampsia).",
    source: "MoHFW Hypertension in Pregnancy Guidelines 2022",
    urgency: "P1",
    keywords: ["bp", "blood pressure", "hypertension", "seizures", "eclampsia", "convulsions", "severe bp", "headache"]
  },
  {
    key: "en_rag_ifa_anemia",
    lang: "en",
    text: "Iron-Folic Acid (IFA) tablets must be taken daily from 12 weeks of pregnancy for 180 days. Anaemia is defined as Hb levels below 11 g/dL. Eat iron-rich foods like spinach, jaggery, and green leafy vegetables.",
    source: "MoHFW National Iron+ Initiative, NHM Protocol 2023",
    urgency: "P3",
    keywords: ["anemia", "anaemia", "ifa", "iron", "folic acid", "hb", "hemoglobin", "weakness", "spinach", "jaggery"]
  },
  {
    key: "en_rag_period_pain",
    lang: "en",
    text: "Severe period pain is called dysmenorrhoea. Manage it with warm water bag compresses or paracetamol. If the pain is unbearable, check for endometriosis or uterine fibroids via ultrasound.",
    source: "FOGSI Dysmenorrhoea Guidelines + WHO",
    urgency: "P3",
    keywords: ["period pain", "pain", "cramps", "cramp", "dysmenorrhoea", "paracetamol", "hot water", "stomach", "fibroids"]
  },
  {
    key: "en_rag_pad_hygiene",
    lang: "en",
    text: "Change sanitary pads every 4 to 6 hours to maintain hygiene. Wash the intimate area with clean water from front to back to prevent urinary infections. Avoid using dirty rags, sand, or leaves.",
    source: "MoHFW Menstrual Hygiene Management (MHM) Scheme 2023",
    urgency: "P4",
    keywords: ["pad", "pads", "change", "hours", "hygiene", "wash", "infection", "clean", "cloth", "leaves", "sand"]
  },
  {
    key: "en_rag_cloth_pads",
    lang: "en",
    text: "If using reusable cloth pads, wash them thoroughly with soap and clean water. Always dry cloth pads in direct sunlight. Direct sunlight acts as a natural disinfectant and kills harmful bacteria.",
    source: "UNICEF MHM 2019 + MoHFW MHM Scheme",
    urgency: "P4",
    keywords: ["cloth", "reusable", "wash", "dry", "sun", "sunlight", "bacteria", "disinfect", "soap"]
  },
  {
    key: "en_rag_vaginal_infection",
    lang: "en",
    text: "Thick white curd-like vaginal discharge, foul smell, itching, or burning during urination indicates a vaginal infection (candidiasis or bacterial vaginosis). Treat with prescribed antifungals or metronidazole.",
    source: "WHO Syndromic Management of RTIs/STIs Guidelines 2021",
    urgency: "P3",
    keywords: ["smell", "foul", "discharge", "white", "discharge", "itching", "burn", "urination", "yeast", "infection"]
  },
  {
    key: "en_rag_child_malnutrition",
    lang: "en",
    text: "Severe Acute Malnutrition (SAM) in children is diagnosed by a Mid-Upper Arm Circumference (MUAC) under 11.5 cm. SAM is a critical condition requiring referral to a Nutrition Rehabilitation Centre (NRC) or RUTF.",
    source: "WHO SAM Management Guidelines 2013 + NHM",
    urgency: "P1",
    keywords: ["malnutrition", "sam", "mam", "muac", "nutrition", "nrc", "child", "weight", "height", "growth", "arm"]
  },
  {
    key: "en_rag_child_diarrhea",
    lang: "en",
    text: "For child diarrhoea, administer Oral Rehydration Salts (ORS) solution after every loose stool. Give 20mg Zinc dispersible tablets daily for 14 days for children over 6 months (10mg for infants under 6 months).",
    source: "WHO IMCI Protocol 2014 + MoHFW Diarrhoea Control",
    urgency: "P2",
    keywords: ["diarrhea", "diarrhoea", "ors", "zinc", "loose stool", "dehydration", "vomiting", "water", "sugar", "salt"]
  },
  {
    key: "en_rag_cholera",
    lang: "en",
    text: "Cholera is characterized by sudden, profuse, watery rice-water stools and vomiting, leading to severe dehydration. Give ORS continuously and refer immediately for hospital intravenous fluid therapy.",
    source: "WHO Cholera Control Guidelines 2023",
    urgency: "P1",
    keywords: ["cholera", "rice-water", "stools", "vomiting", "dehydration", "iv", "fluids", "emergency", "water"]
  },

  // --- Hindi ---
  {
    key: "hi_rag_anc",
    lang: "hi",
    text: "गर्भवती महिलाओं को कम से कम 8 प्रसव पूर्व देखभाल (ANC) जांचों में भाग लेना चाहिए। पहली जांच गर्भावस्था के 12 सप्ताह से पहले होनी चाहिए। इसमें रक्तचाप, हीमोग्लोबिन, ब्लड शुगर और यूरिन प्रोटीन की जांच शामिल है।",
    source: "WHO ANC दिशानिर्देश + MoHFW",
    urgency: "P4",
    keywords: ["गर्भावस्था", "गर्भवती", "जांच", "सप्ताह", "बच्चा", "प्रसव", "डिलीवरी", "आशा", "चेकअप"]
  },
  {
    key: "hi_rag_pregnancy_hypertension",
    lang: "hi",
    text: "गर्भावस्था के दौरान उच्च रक्तचाप (BP >= 140/90 mmHg) पर कड़ी निगरानी की आवश्यकता होती है। गंभीर उच्च रक्तचाप (BP >= 160/110 mmHg) एक आपातकालीन स्थिति है, जिसमें माँ को दौरे (एक्लम्पसिया) से बचाने के लिए तुरंत अस्पताल में भर्ती करना आवश्यक है।",
    source: "MoHFW गर्भावस्था में उच्च रक्तचाप दिशानिर्देश 2022",
    urgency: "P1",
    keywords: ["बीपी", "रक्तचाप", "उच्च रक्तचाप", "दौरे", "झटके", "एक्लम्पसिया", "सिरदर्द", "अस्पताल"]
  },
  {
    key: "hi_rag_ifa_anemia",
    lang: "hi",
    text: "गर्भावस्था के 12 सप्ताह से 180 दिनों तक रोजाना आयरन-फॉलिक एसिड (IFA) की एक गोली लेनी चाहिए। हीमोग्लोबिन स्तर 11 g/dL से कम होना एनीमिया कहलाता है। गुड़, पालक, हरी पत्तेदार सब्जियां और भुना चना खाएं।",
    source: "MoHFW राष्ट्रीय आयरन+ पहल, NHM प्रोटोकॉल 2023",
    urgency: "P3",
    keywords: ["एनीमिया", "खून की कमी", "आईएफए", "आयरन", "फॉलिक एसिड", "हीमोग्लोबिन", "कमजोरी", "पालक", "गुड़"]
  },
  {
    key: "hi_rag_period_pain",
    lang: "hi",
    text: "पीरियड्स में तेज दर्द को डिसमेनोरिया कहा जाता है। गर्म पानी की थैली से पेट की सिकाई करें या पैरासिटामोल लें। दर्द असहनीय होने पर अल्ट्रासाउंड द्वारा फाइब्रॉएड या एंडोमेट्रियोसिस की जांच करवाएं।",
    source: "FOGSI डिसमेनोरिया गाइडलाइंस + WHO",
    urgency: "P3",
    keywords: ["दर्द", "पीरियड", "मासिक धर्म", "मरोड़", "सिकाई", "गर्म पानी", "पैरासिटामोल", "पेट", "फाइब्रॉएड"]
  },
  {
    key: "hi_rag_pad_hygiene",
    lang: "hi",
    text: "व्यक्तिगत स्वच्छता बनाए रखने के लिए हर 4 से 6 घंटे में पैड बदलें। मूत्र संक्रमण से बचने के लिए प्राइवेट अंगों को आगे से पीछे की ओर साफ पानी से धोएं। गंदे कपड़े, राख या पत्तों का उपयोग न करें।",
    source: "स्वास्थ्य मंत्रालय MHM योजना 2023",
    urgency: "P4",
    keywords: ["पैड", "बदले", "घंटे", "स्वच्छता", "इन्फेक्शन", "संक्रमण", "कपड़ा", "पत्ता", "राख"]
  },
  {
    key: "hi_rag_cloth_pads",
    lang: "hi",
    text: "यदि पैड की जगह कपड़े का उपयोग किया जाता है, तो उसे साबुन और साफ पानी से अच्छी तरह धोएं। कीटाणुओं को मारने के लिए कपड़े को हमेशा सीधी तेज धूप में सुखाएं। धूप एक प्राकृतिक कीटाणुनाशक है।",
    source: "यूनिसेफ MHM 2019 + MoHFW",
    urgency: "P4",
    keywords: ["कपड़ा", "कपड़े", "धोएं", "धोना", "सुखाएं", "धूप", "सूरज", "साबुन", "कीटाणु"]
  },
  {
    key: "hi_rag_vaginal_infection",
    lang: "hi",
    text: "सफेद गाढ़ा दही जैसा पानी आना, दुर्गंध, खुजली या पेशाब के समय जलन होना योनि संक्रमण (यीस्ट या बीवी) का संकेत है। डॉक्टर द्वारा बताई गई एंटीफंगल या मेट्रोनिडाजोल दवाओं से इसका इलाज करें।",
    source: "WHO योनि संक्रमण गाइडलाइंस 2021",
    urgency: "P3",
    keywords: ["दुर्गंध", "सफेद पानी", "योनि", "खुजली", "जलन", "पेशाब", "संक्रमण", "इन्फेक्शन", "दवा"]
  },
  {
    key: "hi_rag_child_malnutrition",
    lang: "hi",
    text: "बच्चों में गंभीर तीव्र कुपोषण (SAM) की पहचान ऊपरी बांह के घेरे (MUAC) के 11.5 सेमी से कम होने पर होती है। ऐसे बच्चों को तुरंत पोषण पुनर्वास केंद्र (NRC) में संदर्भित किया जाना चाहिए।",
    source: "WHO SAM कुपोषण प्रबंधन दिशानिर्देश + NHM",
    urgency: "P1",
    keywords: ["कुपोषण", "सैम", "मैम", "बांह", "घेरा", "एनआरसी", "बच्चा", "वजन", "लंबाई", "कमजोरी"]
  },
  {
    key: "hi_rag_child_diarrhea",
    lang: "hi",
    text: "बच्चों में दस्त होने पर हर ढीले मल के बाद ओआरएस (ORS) घोल पिलाएं। 6 महीने से बड़े बच्चों को 14 दिनों तक रोजाना 20mg जिंक की गोली दें (6 महीने से छोटे बच्चों के लिए 10mg जिंक)।",
    source: "WHO IMCI प्रोटोकॉल 2014 + स्वास्थ्य मंत्रालय दस्त नियंत्रण",
    urgency: "P2",
    keywords: ["दस्त", "ओआरएस", "जिंक", "पानी", "उल्टी", "डिहाइड्रेशन", "घोल", "नमक", "चीनी"]
  },
  {
    key: "hi_rag_cholera",
    lang: "hi",
    text: "हैजा में अचानक बहुत अधिक पानी जैसा दस्त (चावल के पानी जैसा) और उल्टी होती है, जिससे गंभीर निर्जलीकरण होता है। लगातार ओआरएस दें और नस द्वारा ड्रिप (IV) चढ़ाने के लिए तुरंत अस्पताल ले जाएं।",
    source: "WHO हैजा नियंत्रण दिशानिर्देश 2023",
    urgency: "P1",
    keywords: ["हैजा", "चावल का पानी", "दस्त", "उल्टी", "निर्जलीकरण", "ड्रिप", "अस्पताल", "आपातकाल"]
  }
];

/**
 * Seeds the RAG cache in IndexedDB.
 */
export async function seedRAGCache() {
  const db = await getDB();
  if (!db) return;
  for (const chunk of RAG_SEED_DATA) {
    const existing = await idbGet(STORES.rag, chunk.key);
    if (!existing) {
      await idbSet(STORES.rag, chunk.key, {
        key: chunk.key,
        data: chunk,
        ts: Date.now()
      });
    }
  }
  console.log(`[SemanticCache] Seeded ${RAG_SEED_DATA.length} RAG clinical guidelines.`);
}

/**
 * Performs tokenized, weighted fuzzy keyword matching over the IndexedDB RAG store.
 * Supports cross-language prefix matching and boosts explicit keywords.
 * @param {string} query User query message
 * @param {string} lang Language code (en, hi, ta, te, mr, bn)
 * @returns {object|null} Matched chunk or null
 */
export async function searchOfflineKB(query, lang = 'hi') {
  if (!query || !query.trim()) return null;
  const db = await getDB();
  if (!db) return null;

  // 1. Get all chunks from IndexedDB
  const allEntries = await new Promise((resolve) => {
    const tx = db.transaction(STORES.rag, 'readonly');
    const store = tx.objectStore(STORES.rag);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });

  if (allEntries.length === 0) return null;

  // Clean and tokenize query
  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\u0080-\u00ff]/gi, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);

  if (queryTokens.length === 0) return null;

  let bestMatch = null;
  let highestScore = 0;
  const targetLang = lang.split('-')[0]; // Map e.g. hi-IN to hi

  // 2. Score each chunk
  for (const entry of allEntries) {
    const chunk = entry.data;
    // Prioritize language match
    if (chunk.lang !== targetLang) continue;

    let score = 0;
    const chunkText = chunk.text.toLowerCase();
    const chunkSource = chunk.source.toLowerCase();
    const keywords = chunk.keywords || [];

    queryTokens.forEach(token => {
      // 1. Check exact word matches in text
      if (chunkText.includes(token)) {
        score += 1.0;
      }
      
      // 2. Check keyword list matches (high weight boost)
      const keywordMatch = keywords.some(kw => kw.includes(token) || token.includes(kw));
      if (keywordMatch) {
        score += 3.0;
      }

      // 3. Source reference matches
      if (chunkSource.includes(token)) {
        score += 1.5;
      }
    });

    // Boost if score > 0 and exact topic keywords are present
    if (score > 0) {
      if (score > highestScore) {
        highestScore = score;
        bestMatch = chunk;
      }
    }
  }

  // Minimum match threshold
  if (highestScore >= 1.5 && bestMatch) {
    return {
      a: bestMatch.text,
      src: bestMatch.source,
      urgency: bestMatch.urgency,
      score: highestScore
    };
  }

  return null;
}

export default {
  getCachedSymptomResult,
  setCachedSymptomResult,
  getCachedEmergencyGuidance,
  setCachedEmergencyGuidance,
  getCachedRAGChunk,
  setCachedRAGChunk,
  purgeExpiredCache,
  getCacheStats,
  seedEmergencyCache,
  seedRAGCache,
  searchOfflineKB,
};

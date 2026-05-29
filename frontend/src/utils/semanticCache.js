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
};

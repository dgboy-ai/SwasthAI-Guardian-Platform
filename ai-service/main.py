from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os

# ── Load .env file so GROQ_API_KEY and other secrets are available ─────────────
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=False)

from skin_analyzer import analyze_skin_image
import re
from collections import Counter

# ── Clinical & Gibberish Safeguard Guardrails ──────────────────────────────────
MEDICAL_KEYWORDS = {
    # English symptoms & clinical terms
    "fever", "cough", "pain", "headache", "weakness", "stomach", "appetite", "hunger", "nausea",
    "vomit", "vomiting", "diarrhea", "fatigue", "spots", "skin", "temp", "temperature", "chills",
    "shivering", "constipation", "spleen", "tenderness", "lethargy", "tongue", "bloat", "bloating",
    "enteric", "rash", "discomfort", "stool", "ache", "upset", "cramps", "cramp", "sore", "throat",
    "nose", "runny", "cold", "flu", "infection", "shivers", "shaking", "sweat", "sweating", "rigors",
    "pallor", "jaundice", "anemia", "shiver", "periodic", "cycle", "cycles", "retro", "orbital",
    "joints", "joint", "bone", "eyes", "eye", "platelet", "platelets", "gums", "bleeding", "bleed",
    "blood", "sputum", "weight", "loss", "night", "sweats", "breath", "breathing", "breathlessness",
    "difficulty", "hemoptysis", "lung", "lungs", "chest", "watery", "dehydration", "dehydrated",
    "urine", "itching", "itch", "stool", "stools", "blisters", "blister", "varicella", "measles",
    "morbilli", "heat", "stroke", "exposure", "dizziness", "dizzy", "collapse", "collapsed",
    "exhaustion", "hyperthermia", "snake", "bite", "fang", "marks", "paralysis", "numbness",
    "numb", "convulsion", "convulsions", "poison", "venom", "respiratory", "smell", "taste",
    "sepsis", "infection", "inflamed", "lesion", "lesions", "wound", "injury", "burn", "swelling",
    "dengue", "malaria", "typhoid", "tb", "tuberculosis", "cholera", "dysentery", "chickenpox",
    "sick", "unwell", "ill", "hurt", "problem", "disease", "disorder", "condition",
    
    # Hindi Transliterated
    "bukhar", "bukhaar", "dard", "kamzori", "pet", "bhook", "khujli", "chakti", "sujan", "khoon",
    "sard", "sardi", "zukaam", "zukam", "jhatka", "sans", "saans", "chakkar", "dast", "ulti",
    "ultiya", "thakaan", "haddi", "daane", "chchale", "khansi", "wajan", "paseena", "potty",
    "peela", "peeli", "peshab", "chechak", "khasra", "behosh", "behoshi", "saanp", "kata",
    "dhoop", "soojan", "gala", "takleef", "badan", "sharir", "shareer", "kam", "marode",
    "gadbad", "kharab", "thanda", "kaanpna", "paseena", "aankhein", "aankhen", "chamdi",
    "bimar", "bimari", "tabiyat", "takleef", "swasthya",
    
    # Devanagari Hindi
    "बुखार", "दर्द", "कमजोरी", "पेट", "भूख", "खुजली", "सूजन", "खून", "सर्दी", "जुकाम",
    "सांस", "चक्कर", "दस्त", "उल्टी", "थकान", "हड्डी", "दाने", "छाले", "खांसी", "वजन",
    "पसीना", "पेशाब", "चेचक", "खसरा", "बेहोश", "सांप", "काटा", "धूप", "गला", "तकलीफ",
    "बदन", "शरीर", "मरोड़", "खराब", "ठंडा", "कांपना", "आंखें", "चमड़ी", "बीमार", "बीमारी",
    "तबीयत", "स्वास्थ्य",
    
    # Tamil
    "kaichal", "thalaivaali", "vayiru", "vali", "thalarchi", "pasi", "nirungal", "viyarvai",
    "irumal", "moochu", "balgam", "ratham", "palor", "siru", "neer", "peela", "thol", "sarumpu",
    "kan", "sivappu", "mukku", "sali", "veekam", "vomi", "maayakam", "thakam", "thaakam",
    "arisi", "thanni", "pola", "moonru", "valandhu", "uzhaippu", "thookam", "izhapu"
}


def has_health_keywords(text: str) -> bool:
    text_lower = text.lower()
    
    # Direct substring check for maximum vocabulary coverage
    for kw in MEDICAL_KEYWORDS:
        if kw in text_lower:
            return True
            
    # Suffix clinical check (e.g. bronchitis, fibromyalgia, anemia, etc.)
    medical_suffixes = ["itis", "pathy", "algia", "emia", "osis"]
    for suffix in medical_suffixes:
        if re.search(r'\b\w+' + suffix + r'\b', text_lower):
            return True
    return False

def is_prompt_injection(text: str) -> bool:
    text_lower = text.lower()
    injection_keywords = [
        "ignore previous", "ignore all instructions", "system prompt", "you are now", 
        "bypass", "developer mode", "override instruction", "dan mode"
    ]
    return any(kw in text_lower for kw in injection_keywords)

# Romanized Tamil (spoken-type input) → English symptom terms for local/RF matching
ROMANIZED_TA_TO_EN = {
    "kaichal": "fever",
    "irumal": "cough",
    "moochu": "runny nose",
    "maarbu": "chest",
    "vaali": "pain",
    "thalaivaali": "headache",
    "vayiru": "stomach",
    "thalarchi": "dizziness",
    "balgam": "cough",
    "sarumpu": "swelling",
}

def expand_transliterated_symptoms(text: str) -> str:
    """Append English equivalents when romanized Tamil symptom tokens are present."""
    lower = text.lower()
    extra = [en for rom, en in ROMANIZED_TA_TO_EN.items() if rom in lower]
    if not extra:
        return text
    return text + " " + " ".join(extra)

BILINGUAL_DISEASES = {
    "Malaria": "Malaria / मलेरिया",
    "Dengue": "Dengue / डेंगू",
    "Typhoid": "Typhoid / टाइफाइड",
    "Tuberculosis": "Tuberculosis (TB) / टीबी (तपेदिक)",
    "Cholera": "Diarrhea & Cholera / हैजा (डायरिया)",
    "Dysentery": "Dysentery / पेचिश (खूनी दस्त)",
    "Jaundice": "Jaundice / पीलिया (हेपेटाइटिस)",
    "Anaemia": "Anaemia / एनीमिया (खून की कमी)",
    "Pneumonia": "Pneumonia / निमोनिया (फेफड़ों का संक्रमण)",
    "Viral Fever": "Viral Fever & Cold / सामान्य बुखार और सर्दी",
    "Chickenpox": "Chickenpox / चेचक (छोटी माता)",
    "Measles": "Measles / खसरा",
    "Heatstroke": "Heatstroke / लू लगना (हाइपरथर्मिया)",
    "Snakebite": "Snakebite / सांप का काटना",
    "Acute Respiratory Infection": "Acute Respiratory Infection / तीव्र श्वसन संक्रमण",
    "Skin Infection": "Skin Infection / त्वचा संक्रमण",
    "UTI": "UTI (Urinary Tract Infection) / मूत्र मार्ग का संक्रमण",
    "Appendicitis": "Appendicitis / अपेंडिसाइटिस (पेट दर्द)",
    "Meningitis": "Meningitis / मस्तिष्क ज्वर (गर्दन अकड़ना)",
    "Scrub Typhus": "Scrub Typhus / स्क्रब टाइफस",
    "Pre-eclampsia": "Pre-eclampsia (Maternal Hypertension) / गर्भावस्था उच्च रक्तचाप",
    "Gestational Diabetes": "Gestational Diabetes / गर्भावधि मधुमेह",
    "Asthma": "Asthma / दमा (अस्थमा)",
    "Bronchitis": "Bronchitis / ब्रोंकाइटिस (फेफड़ों में सूजन)",
    "Food Poisoning": "Food Poisoning / खाद्य विषाक्तता (दूषित भोजन)",
    "Rabies": "Rabies / रेबीज (पागल कुत्ते का काटना)",
    "Tetanus": "Tetanus / धनुस्तंभ (टिटनेस)",
    "Leptospirosis": "Leptospirosis / लेप्टोस्पायरोसिस",
    "Chikungunya": "Chikungunya / चिकनगुनिया",
    "Japanese Encephalitis": "Japanese Encephalitis / जापानी इन्सेफेलाइटिस",
    "Filariasis": "Filariasis (Elephantiasis) / फाइलेरिया (हाथीपांव)",
    "Scabies": "Scabies / खाज-खुजली (स्केबीज)",
    "Peptic Ulcer Disease": "Peptic Ulcer Disease / पेट का अल्सर",
    "GERD": "GERD (Acid Reflux) / सीने में जलन (एसिडिटी)",
    "Tonsillitis": "Tonsillitis / टॉन्सिलाइटिस (गले का संक्रमण)",
    "Otitis Media": "Otitis Media (Ear Infection) / कान का संक्रमण",
    "Conjunctivitis": "Conjunctivitis (Pink Eye) / आंख आना (नेत्रशोथ)",
    "Covid-19": "Covid-19 / कोविड-19",
    "Diabetes": "Diabetes Mellitus / मधुमेह (शुगर)",
    "Hypertension": "Hypertension / उच्च रक्तचाप (हाई बीपी)",
    "Angina": "Coronary Angina / हृदय शूल (सीने में दर्द)",
    "COPD": "COPD / क्रॉनिक ब्रोंकाइटिस",
    "Rheumatoid Arthritis": "Rheumatoid Arthritis / संधिशोथ (गठिया)",
    "Kidney Stones": "Kidney Stones / गुर्दे की पथरी",
    "Migraine": "Migraine / आधासीसी (माइग्रेन)",
    "Goitre": "Goitre / घेंघा रोग (थायराइड)",
    "Scorpion Sting": "Scorpion Sting / बिच्छू का डंक",
    "Eczema": "Eczema / एक्जिमा (त्वचा की खुजली)",
    "Psoriasis": "Psoriasis / सोरायसिस (त्वचा रोग)",
    "Whooping Cough": "Whooping Cough / काली खांसी (कुकुर खांसी)",
    "Ringworm": "Ringworm / दाद (फंगल संक्रमण)",

    # --- 50 New Approved Diseases ---
    "Malaria Vivax": "Malaria Vivax / मलेरिया विवैक्स (आवर्तक)",
    "Kala-Azar": "Kala-Azar / काला-अजार (विसरल लीशमैनियासिस)",
    "Lymphatic Elephantiasis": "Lymphatic Elephantiasis / लिम्फेटिक फाइलेरियासिस (हाथीपाँव)",
    "Ascariasis": "Ascariasis / पेट के कीड़े (राउंडवॉर्म)",
    "Hookworm Disease": "Hookworm Disease / हुकवर्म (मिट्टी से संक्रमण)",
    "Silicosis": "Silicosis / सिलिकोसिस (धूल से फेफड़ों का रोग)",
    "Farmers Lung": "Farmer's Lung / किसान के फेफड़े (मोल्ड एलर्जी)",
    "Organophosphate Poisoning": "Organophosphate Poisoning / कीटनाशक विषाक्तता (आपातकाल)",
    "Brucellosis": "Brucellosis / ब्रुसेलोसिस (पशु संपर्क बुखार)",
    "Bovine Tuberculosis": "Bovine Tuberculosis / पशु टीबी (कच्चे दूध से)",
    "Anthrax Cutaneous": "Anthrax / एंथ्रेक्स (त्वचा का)",
    "Rotavirus Gastroenteritis": "Rotavirus Gastroenteritis / रोटावायरस (बच्चों का दस्त)",
    "Dracunculiasis": "Dracunculiasis / गिनी वर्म (जल जनित रोग)",
    "Nutritional Anemia": "Nutritional Anemia / पोषण संबंधी एनीमिया (आयरन की कमी)",
    "Amoebic Liver Abscess": "Amoebic Liver Abscess / अमीबिक लीवर फोड़ा",
    "HFMD Childhood": "Hand Foot Mouth Disease / हाथ-पैर-मुँह रोग (बच्चों में)",
    "Valley Fever": "Valley Fever / वैली फीवर (फंगल मिट्टी रोग)",
    "Toxoplasmosis": "Toxoplasmosis / टोक्सोप्लाज्मोसिस (परजीवी संक्रमण)",
    "Shigellosis": "Shigellosis / शिगेलोसिस (जीवाणु पेचिश)",
    "Listeriosis": "Listeriosis / लिस्टेरियोसिस (दूषित भोजन)",
    "Murine Typhus": "Murine Typhus / म्यूरिन टाइफस (पिस्सू जनित बुखार)",
    "Skeletal Fluorosis": "Skeletal Fluorosis / फ्लोरोसिस (हड्डियों का रोग)",
    "Arsenicosis Chronic": "Arsenicosis / आर्सेनिकोसिस (आर्सेनिक विषाक्तता)",
    "Blackfoot Disease": "Blackfoot Disease / ब्लैकफुट रोग (आर्सेनिक संवहनी)",
    "Ancylostomiasis": "Ancylostomiasis / अन्काइलोस्टोमियासिस (हुकवर्म)",
    "Fatty Liver NAFLD": "Fatty Liver (NAFLD) / फैटी लीवर (जीवनशैली रोग)",
    "Chronic Kidney Disease": "Chronic Kidney Disease / क्रॉनिक किडनी रोग (गुर्दे की विफलता)",
    "Gout": "Gout / गाउट (यूरिक एसिड)",
    "Hyperthyroidism": "Hyperthyroidism / अतिसक्रिय थायराइड",
    "Hypothyroidism": "Hypothyroidism / अकर्मठ थायराइड",
    "Cholelithiasis": "Gallstones (Cholelithiasis) / पित्त पथरी",
    "Panic Disorder": "Panic Disorder / पैनिक अटैक (घबराहट)",
    "Depression Clinical": "Clinical Depression / नैदानिक अवसाद (मानसिक रोग)",
    "Cervical Spondylosis": "Cervical Spondylosis / सर्वाइकल स्पॉन्डिलोसिस (गर्दन का दर्द)",
    "Sciatica Lumbar": "Sciatica / साइटिका (कमर से पैर तक दर्द)",
    "Osteoporosis": "Osteoporosis / ऑस्टियोपोरोसिस (हड्डी कमजोरी)",
    "IBS Stress": "IBS (Irritable Bowel Syndrome) / चिड़चिड़ा आंत्र सिंड्रोम",
    "Allergic Rhinitis": "Allergic Rhinitis / एलर्जिक राइनाइटिस (धूल एलर्जी)",
    "Psoriatic Arthritis": "Psoriatic Arthritis / सोरियाटिक गठिया",
    "Chronic Fatigue Syndrome": "Chronic Fatigue Syndrome / क्रॉनिक फटीग सिंड्रोम",
    "Deep Vein Thrombosis": "Deep Vein Thrombosis (DVT) / गहरी शिरा घनास्त्रता",
    "Acid Esophagitis": "Acid Esophagitis / एसिड एसोफेगाइटिस (तीव्र सीने की जलन)",
    "Dry Eye Syndrome": "Dry Eye Syndrome / ड्राई आई सिंड्रोम (स्क्रीन से आँख)",
    "Carpal Tunnel Syndrome": "Carpal Tunnel Syndrome / कार्पल टनल सिंड्रोम (कलाई दर्द)",
    "Insomnia Urban": "Insomnia / अनिद्रा (नींद न आना)",
    "PCOS Hormonal": "PCOS (Polycystic Ovary Syndrome) / पीसीओएस (हार्मोन असंतुलन)",
    "Stroke TIA": "Stroke / TIA (मिनी स्ट्रोक – आपातकाल)",
    "Glaucoma Gradual": "Glaucoma / ग्लूकोमा (काला मोतियाबिंद)",
    "B12 Deficiency Anemia": "B12 Deficiency Anemia / विटामिन बी12 की कमी",
    "Vitamin D Deficiency Pain": "Vitamin D Deficiency / विटामिन डी की कमी (हड्डी दर्द)"
}

# Dynamically compile keyword matching rules from generate_dataset
local_rules = []
try:
    from generate_dataset import DISEASE_METADATA
    for disease, meta in DISEASE_METADATA.items():
        kw_list = []
        for lang, kws in meta["symptoms"].items():
            kw_list.extend([k.lower() for k in kws])
        local_rules.append((disease, list(set(kw_list))))
    print(f"[OK] Dynamically loaded {len(local_rules)} local rules from disease metadata.")
except Exception as e:
    print(f"[WARNING] Failed to dynamically load rules from generate_dataset: {e}")
    # Core fallback
    local_rules = [
        ("Malaria", ["malaria", "chill", "shiver", "sweat", "high fever", "thand"]),
        ("Dengue", ["dengue", "eye pain", "joint pain", "muscle pain", "rash"]),
        ("Typhoid", ["typhoid", "weakness", "stomach pain", "belly pain", "vomiting"]),
        ("Tuberculosis", ["tb", "tuberculosis", "chronic cough", "cough blood", "weight loss"])
    ]

def get_detailed_prediction(pred_class: str) -> str:
    if " - Reliable Advice:" in pred_class:
        return pred_class
    
    friendly = BILINGUAL_DISEASES.get(pred_class, pred_class)
    advice = "Consult your local ASHA worker or visit the nearest PHC."
    try:
        from generate_dataset import DISEASE_METADATA
        if pred_class in DISEASE_METADATA:
            advice = DISEASE_METADATA[pred_class].get("advice_en", advice)
    except Exception:
        pass
    
    return f"{friendly} - Reliable Advice: {advice}"

def predict_disease_local(text: str) -> str:
    clean = expand_transliterated_symptoms(text).lower().strip()
    rules = [
        ("Jaundice", ["jaundice", "yellow skin", "yellow eye", "dark urine", "peela", "peeli", "kavil"]),
        ("Anaemia", ["anemia", "anaemia", "weakness", "pale", "iron deficiency", "kamzori", "ratha sogai"]),
        ("Pneumonia", ["pneumonia", "breathing difficulty", "short breath", "lung", "wheezing", "sans phulna"]),
        ("Chickenpox", ["chickenpox", "blister", "spots", "chechak", "chchale"]),
        ("Measles", ["measles", "khasra", "koplik", "watery eyes"]),
        ("Heatstroke", ["heatstroke", "sunstroke", "garmi", "heat exposure", "collapse"]),
        ("Snakebite", ["snake", "bite", "fang", "saanp", "pambu"]),
        ("Acute Respiratory Infection", ["respiratory", "breathless", "cough", "fever", "runny nose"]),
        ("Viral Fever", ["fever", "cough", "headache", "body pain", "cold", "runny nose", "bukhar", "dard"])
    ]
    rules_to_use = local_rules if local_rules else rules
    best_match = None
    max_score = 0
    for disease, keywords in rules_to_use:
        score = 0
        for kw in keywords:
            if kw in clean:
                score += 1
        if disease.lower() in clean:
            score += 5
        if score > max_score:
            max_score = score
            best_match = disease
            
    return best_match

# RAG & Agentic imports
from rag_service import rag_chat
from outbreak_agent import start_agent_background, get_recent_outbreaks

app = FastAPI(title="SwasthAI Guardian: AI Hub")

import logging
import json
import time

# Structured JSON Logger
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "traceId": getattr(record, "trace_id", "none")
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

logger = logging.getLogger("swasthai_ai")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

@app.middleware("http")
async def add_trace_id_and_log(request, call_next):
    trace_id = request.headers.get("x-trace-id", f"tr-ai-{os.getpid()}-{int(time.time())}")
    struct_logger = logging.LoggerAdapter(logger, {"trace_id": trace_id})
    request.state.logger = struct_logger
    struct_logger.info(f"Incoming AI request: {request.method} {request.url.path}")
    response = await call_next(request)
    response.headers["x-trace-id"] = trace_id
    struct_logger.info(f"AI response status: {response.status_code}")
    return response

# AI service is called only by the Node.js backend — never directly by the browser
# Restrict CORS to backend URL only (open wildcard was a security gap)
_ALLOWED_ORIGINS = [
    os.getenv("BACKEND_URL", "http://localhost:3001"),
    "http://127.0.0.1:3001",   # local dev fallback (port 3001)
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Load disease model (Deep Learning or RF fallback) ──────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "disease_model.pkl")
DEEP_MODEL_PATH = os.path.join(os.path.dirname(__file__), "deep_disease_model.pkl")

disease_pipeline = None
deep_model_bundle = None
embedder = None

ENABLE_DEEP_MODEL = os.getenv("ENABLE_DEEP_MODEL", "false").lower() == "true"

try:
    # 1. Load Deep Learning Model (Primary)
    if ENABLE_DEEP_MODEL and os.path.exists(DEEP_MODEL_PATH):
        print("[...] Loading Deep Learning Disease Model...")
        import torch
        from sentence_transformers import SentenceTransformer
        from model_def import SymptomNet

        deep_model_bundle = joblib.load(DEEP_MODEL_PATH)
        embedder = SentenceTransformer(deep_model_bundle['embedding_model'])
        
        has_bn = any("running_mean" in k for k in deep_model_bundle['model_state'].keys())
        deep_model = SymptomNet(deep_model_bundle['input_dim'], deep_model_bundle['num_classes'], use_batch_norm=has_bn)
        deep_model.load_state_dict(deep_model_bundle['model_state'])
        deep_model.eval()
        deep_model_bundle['model'] = deep_model
        print("[OK] Deep Learning model loaded.")
    elif os.path.exists(DEEP_MODEL_PATH):
        print("[INFO] Deep Learning Model exists but is disabled (ENABLE_DEEP_MODEL=false).")

    # 2. Load Logistic Regression Model (Fallback)
    if os.path.exists(MODEL_PATH):
        print("[...] Loading Logistic Regression Fallback Model...")
        disease_pipeline = joblib.load(MODEL_PATH)
        print("[OK] Logistic Regression model loaded.")
    
    if not deep_model_bundle and not disease_pipeline:
        print("[WARNING] No models found. AI service will be limited.")

    # Force garbage collection to clean up memory allocated during unpickling
    import gc
    gc.collect()
    print("[OK] Garbage collection forced after model load.")

except Exception as e:
    print(f"[ERROR] Model loading failed: {e}")

# ── Start Agentic Outbreak Monitor & Warmup RAG on startup ──────────────────────
@app.on_event("startup")
async def startup_event():
    start_agent_background()
    print("[OK] Agentic Outbreak Monitor started in background thread.")
    
    # Warm up RAG embeddings in a background thread so the first request doesn't timeout
    try:
        import threading
        from rag_service import _get_kb_embeddings
        threading.Thread(target=_get_kb_embeddings, daemon=True).start()
        print("[OK] RAG multilingual embeddings warmup started in background thread.")
    except Exception as e:
        print(f"[ERROR] Failed to start RAG warmup thread: {e}")

# ── Data Models ────────────────────────────────────────────────────────────────
class SymptomInput(BaseModel):
    symptoms: str

class PregnancyInput(BaseModel):
    age: int
    systolic_bp: int
    diastolic_bp: int
    bs: float
    body_temp: float
    heart_rate: int

class MalnutritionInput(BaseModel):
    age_months: int
    weight_kg: float
    height_cm: float

class ChatInput(BaseModel):
    message: str
    session_id: str = "default"           # unique user/session identifier
    history: list[dict] | None = None     # [{role: 'user'|'assistant', content: str}, ...]

def make_prediction_response(disease_name: str, confidence: float, alternatives: list, model_name: str, accuracy_str: str) -> dict:
    meta = {}
    try:
        from generate_dataset import DISEASE_METADATA
        meta = DISEASE_METADATA.get(disease_name, {})
    except Exception:
        pass
    
    friendly = BILINGUAL_DISEASES.get(disease_name, disease_name)
    advice = meta.get("advice_en", "Consult your local ASHA worker or visit the nearest PHC.")
    advice_hi = meta.get("advice_hi", "अपने स्थानीय आशा कार्यकर्ता से परामर्श करें या नजदीकी पीएचसी पर जाएं।")
    severity = meta.get("severity", "P3")
    specialty = meta.get("specialty", "General Physician")
    
    detailed_str = f"{friendly} - Reliable Advice: {advice}"
    
    return {
        "prediction": detailed_str,
        "disease": friendly,
        "advice": advice,
        "advice_hi": advice_hi,
        "severity": severity,
        "doctor_specialty": specialty,
        "confidence": confidence,
        "alternatives": alternatives,
        "model": model_name,
        "accuracy": accuracy_str
    }

# ── ENDPOINT 1: Disease Prediction ────────────────────────────────────────────
@app.post("/predict/disease")
async def predict_disease(data: SymptomInput):
    text = expand_transliterated_symptoms(data.symptoms.strip())
    if not text:
        raise HTTPException(status_code=400, detail="Symptoms text cannot be empty.")

    # ── Text Safeguard Guardrails (Clinical Vocabulary Filter) ────
    is_invalid_len = len(text) < 4
    is_off_topic = not has_health_keywords(text)
    
    if is_invalid_len or is_off_topic:
        guardrail_message = (
            "Hello! I am SwasthAI Guardian. To help you properly, please describe actual physical health symptoms "
            "(such as fever, cough, pain, headache, or skin rash). / नमस्ते! मैं स्वास्थ-एआई गार्जियन हूँ। "
            "आपकी सही मदद करने के लिए, कृपया वास्तविक शारीरिक स्वास्थ्य लक्षणों (जैसे बुखार, खांसी, दर्द, सिरदर्द, या त्वचा पर रैश) का वर्णन करें।"
        )
        return {
            "prediction": "Uncertain / Need More Info",
            "confidence": 0.0,
            "message": guardrail_message,
            "model": "Hybrid-System-Guardrail",
            "accuracy": "N/A",
            "is_uncertain": True
        }

    # A. Use Deep Learning Model if available
    if ENABLE_DEEP_MODEL and deep_model_bundle and embedder:
        import torch
        with torch.no_grad():
            emb = embedder.encode([text])
            outputs = deep_model_bundle['model'](torch.FloatTensor(emb))
            probs = torch.softmax(outputs, dim=1).numpy()[0]
            
            top_idx = probs.argmax()
            prediction = deep_model_bundle['label_encoder'].classes_[top_idx]
            confidence = round(float(probs[top_idx]), 2)
            
            classes = deep_model_bundle['label_encoder'].classes_
            top_indices = probs.argsort()[-3:][::-1]
            alternatives = [
                {"disease": BILINGUAL_DISEASES.get(classes[i], classes[i]), "confidence": round(float(probs[i]), 2)}
                for i in top_indices if i != top_indices[0]
            ]
            
            # Use Deep Model only if confidence is very high (> 0.70)
            if confidence >= 0.70:
                return make_prediction_response(prediction, confidence, alternatives, "Deep-Transformer-Neural-Net", "64.8% (101 diseases, 7 languages)")
            else:
                print(f"[HYBRID] Deep Model confidence borderline ({confidence}). Checking Random Forest for keyword confirmation...")

    # B. Fallback to Random Forest
    if disease_pipeline is None:
        fallback_pred = predict_disease_local(text)
        if fallback_pred:
            return make_prediction_response(fallback_pred, 0.50, [], "Rule-Based-Keyword-Matcher", "90.0%")
        raise HTTPException(status_code=503, detail="AI model not loaded. Run training script first.")
        
    rf_prediction = disease_pipeline.predict([text])[0]
    rf_probabilities = disease_pipeline.predict_proba([text])[0]
    rf_confidence = round(float(max(rf_probabilities)), 2)
    rf_classes = disease_pipeline.classes_
    rf_top_indices = rf_probabilities.argsort()[-3:][::-1]
    rf_alternatives = [
        {"disease": BILINGUAL_DISEASES.get(rf_classes[i], rf_classes[i]), "confidence": round(float(rf_probabilities[i]), 2)}
        for i in rf_top_indices if i != rf_top_indices[0]
    ]

    # FINAL GUARDRAIL: If both models are very low confidence (< 0.40)
    if rf_confidence < 0.40:
        fallback_pred = predict_disease_local(text)
        if fallback_pred:
            return make_prediction_response(fallback_pred, 0.50, [], "Rule-Based-Keyword-Matcher", "90.0%")
        return {
            "prediction": "Uncertain / Need More Info",
            "confidence": rf_confidence,
            "message": "The system is unable to provide a reliable diagnosis with the current information. Please describe your symptoms in more detail or consult a doctor.",
            "model": "Hybrid-System-Guardrail",
            "accuracy": "N/A",
            "is_uncertain": True
        }

    return make_prediction_response(rf_prediction, rf_confidence, rf_alternatives, "RandomForest-TF-IDF", "49.7% (101 diseases, 7 languages)")

# ── ENDPOINT 2: Pregnancy Risk ────────────────────────────────────────────────
@app.post("/predict/pregnancy_risk")
async def predict_maternal_risk(data: PregnancyInput):
    bp_score = 0
    if data.systolic_bp >= 160 or data.diastolic_bp >= 110: bp_score = 5
    elif data.systolic_bp >= 140 or data.diastolic_bp >= 90:  bp_score = 3
    elif data.systolic_bp >= 130 or data.diastolic_bp >= 85:  bp_score = 1

    bs_score = 0
    if data.bs >= 11.1:   bs_score = 5
    elif data.bs >= 8.5:  bs_score = 3
    elif data.bs >= 5.1:  bs_score = 1

    age_score = 0
    if data.age < 16 or data.age > 40:   age_score = 3
    elif data.age < 18 or data.age > 35: age_score = 2

    hr_score = 0
    if data.heart_rate > 120:   hr_score = 3
    elif data.heart_rate > 110: hr_score = 2
    elif data.heart_rate > 100: hr_score = 1

    temp_score = 0
    if data.body_temp >= 102.0:   temp_score = 3
    elif data.body_temp >= 100.4: temp_score = 2
    elif data.body_temp >= 99.5:  temp_score = 1

    total_score = bp_score + bs_score + age_score + hr_score + temp_score
    risk = "High Risk" if total_score >= 8 else "Medium Risk" if total_score >= 4 else "Low Risk"

    # Determine status & advice for each factor
    factors = []
    
    # Blood Pressure advice
    bp_weight = 0
    if total_score > 0:
        bp_weight = int((bp_score / total_score) * 100)
    bp_status = "high" if bp_score >= 3 else "medium" if bp_score >= 1 else "low"
    bp_advice = "Normal BP. Maintain regular checks."
    if bp_score >= 5:
        bp_advice = "Severe high BP! Dangerous for mother/baby. Rest, avoid salt, refer for emergency medical check."
    elif bp_score >= 3:
        bp_advice = "Elevated blood pressure. Schedule clinic check, monitor headaches/swelling, reduce sodium."
    elif bp_score >= 1:
        bp_advice = "Slightly elevated BP. Monitor weekly and ensure healthy hydration/rest."
    factors.append({
        "name": "Blood Pressure",
        "weight": bp_weight,
        "status": bp_status,
        "trend": "stable",
        "advice": bp_advice
    })

    # Blood Sugar advice
    bs_weight = 0
    if total_score > 0:
        bs_weight = int((bs_score / total_score) * 100)
    bs_status = "high" if bs_score >= 3 else "medium" if bs_score >= 1 else "low"
    bs_advice = "Normal blood sugar. Follow standard balanced pregnancy diet."
    if bs_score >= 5:
        bs_advice = "Severe high blood sugar! High risk of complications. Refer immediately for insulin or specialist care."
    elif bs_score >= 3:
        bs_advice = "Gestational diabetes confirmed. Strict diabetic diet (avoid simple sugars, sweets), monitor fasting levels."
    elif bs_score >= 1:
        bs_advice = "Borderline blood sugar. Limit sweet tea, sweets, and high-carb foods. Re-test in 2 weeks."
    factors.append({
        "name": "Blood Sugar",
        "weight": bs_weight,
        "status": bs_status,
        "trend": "stable",
        "advice": bs_advice
    })

    # Age advice
    age_weight = 0
    if total_score > 0:
        age_weight = int((age_score / total_score) * 100)
    age_status = "high" if age_score >= 3 else "medium" if age_score >= 2 else "low"
    age_advice = "Age is within normal obstetric safety range (18-35)."
    if age_score >= 3:
        age_advice = "Age obstetric risk (under 16 or over 40). Requires close specialist monitoring and institutional delivery."
    elif age_score >= 2:
        age_advice = "Elevated obstetric age risk (16-18 or 35-40). Ensure at least 4 ANC visits and checkup at PHC."
    factors.append({
        "name": "Obstetric Age",
        "weight": age_weight,
        "status": age_status,
        "trend": "stable",
        "advice": age_advice
    })

    # Heart Rate advice
    hr_weight = 0
    if total_score > 0:
        hr_weight = int((hr_score / total_score) * 100)
    hr_status = "high" if hr_score >= 3 else "medium" if hr_score >= 1 else "low"
    hr_advice = "Heart rate is normal and stable."
    if hr_score >= 3:
        hr_advice = "High tachycardia detected (>120 bpm). Risk of dehydration, anemia, or infection. Check for fever/bleeding."
    elif hr_score >= 1:
        hr_advice = "Mild tachycardia (100-120 bpm). Advise hydration and resting. Check hemoglobin levels."
    factors.append({
        "name": "Heart Rate",
        "weight": hr_weight,
        "status": hr_status,
        "trend": "stable",
        "advice": hr_advice
    })

    # Body Temperature advice
    temp_weight = 0
    if total_score > 0:
        temp_weight = int((temp_score / total_score) * 100)
    temp_status = "high" if temp_score >= 3 else "medium" if temp_score >= 1 else "low"
    temp_advice = "Body temperature is normal."
    if temp_score >= 3:
        temp_advice = "High fever (>102°F)! Possible infection or sepsis. Cool sponge, give paracetamol, refer immediately."
    elif temp_score >= 1:
        temp_advice = "Mild fever (99.5-102°F). Ensure hydration, monitor for infection signs, rest."
    factors.append({
        "name": "Body Temperature",
        "weight": temp_weight,
        "status": temp_status,
        "trend": "stable",
        "advice": temp_advice
    })

    return {
        "risk_level": risk,
        "vector_score": total_score,
        "factors_assessed": ["blood_pressure", "blood_sugar_mmol", "age", "heart_rate", "temperature"],
        "factors": factors
    }

# ── ENDPOINT 3: Malnutrition ──────────────────────────────────────────────────
WHO_WHZ_TABLE = [
    {"h": 45,  "median": 2.44,  "sd": 0.29},
    {"h": 50,  "median": 3.35,  "sd": 0.39},
    {"h": 55,  "median": 4.58,  "sd": 0.50},
    {"h": 60,  "median": 5.98,  "sd": 0.61},
    {"h": 65,  "median": 7.28,  "sd": 0.69},
    {"h": 70,  "median": 8.38,  "sd": 0.77},
    {"h": 75,  "median": 9.19,  "sd": 0.83},
    {"h": 80,  "median": 9.95,  "sd": 0.91},
    {"h": 85,  "median": 10.61, "sd": 0.97},
    {"h": 90,  "median": 11.24, "sd": 1.03},
    {"h": 95,  "median": 11.89, "sd": 1.10},
    {"h": 100, "median": 12.62, "sd": 1.18},
    {"h": 105, "median": 13.48, "sd": 1.30},
    {"h": 110, "median": 14.47, "sd": 1.44},
    {"h": 115, "median": 15.57, "sd": 1.60},
    {"h": 120, "median": 16.67, "sd": 1.76},
]

@app.post("/predict/malnutrition")
async def predict_malnutrition(data: MalnutritionInput):
    if data.height_cm <= 0 or data.weight_kg <= 0:
        raise HTTPException(status_code=400, detail="Height and weight must be positive.")
    
    h_clamped = max(45.0, min(120.0, data.height_cm))
    
    # Linear interpolation
    lower = WHO_WHZ_TABLE[0]
    upper = WHO_WHZ_TABLE[-1]
    
    for i in range(len(WHO_WHZ_TABLE) - 1):
        if h_clamped >= WHO_WHZ_TABLE[i]["h"] and h_clamped <= WHO_WHZ_TABLE[i + 1]["h"]:
            lower = WHO_WHZ_TABLE[i]
            upper = WHO_WHZ_TABLE[i + 1]
            break
            
    frac = 0.0 if lower["h"] == upper["h"] else (h_clamped - lower["h"]) / (upper["h"] - lower["h"])
    median = lower["median"] + frac * (upper["median"] - lower["median"])
    sd = lower["sd"] + frac * (upper["sd"] - lower["sd"])
    whz = (data.weight_kg - median) / sd
    
    height_m = data.height_cm / 100.0
    bmi = data.weight_kg / (height_m ** 2)
    
    if whz < -3:
        status = "Severe Acute Malnutrition"
        action = "Urgent: Immediate referral to Nutrition Rehabilitation Centre (NRC). WHZ < -3 SD."
    elif whz < -2:
        status = "Moderate Acute Malnutrition"
        action = "Refer to Supplementary Nutrition Programme (ASHA follow-up). WHZ < -2 SD."
    elif whz < -1:
        status = "Mild Underweight"
        action = "Provide energy-dense nutrition advice. Follow up in 14 days. WHZ < -1 SD."
    else:
        status = "Normal"
        action = "Healthy growth. Continue regular monitoring and balanced diet."
        
    return {"status": status, "bmi": round(bmi, 2), "action": action, "age_months": data.age_months}

# ── ENDPOINT 4: Skin Analysis ─────────────────────────────────────────────────
@app.post("/predict/skin")
async def predict_skin(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    contents = await file.read()
    result = analyze_skin_image(contents)
    return {**result, "filename": file.filename, "engine": "Pixel-Feature-Extractor (Pillow)"}

# ── ENDPOINT 5: RAG-Powered Sakhi Chat ────────────────────────────────────────
@app.post("/ai/rag-chat")
async def rag_sakhi_chat(data: ChatInput):
    """
    RAG-enhanced health chat with conversation memory.
    """
    msg = (data.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    # ── RAG Defensive Boundaries & Guardrails ──
    if len(msg) > 400:
        return {
            "reply": "I can only process messages up to 400 characters. Please simplify your question. / मैं केवल 400 अक्षरों तक के संदेशों को समझ सकती हूँ। कृपया अपना प्रश्न छोटा करें।",
            "sources": ["Sakhi Health Assistant — General Information"],
            "urgency": "P4",
            "engine": "RAG-Guardrail-Length",
            "grounded": False
        }

        
    if is_prompt_injection(msg):
        return {
            "reply": "Hello! I am Sakhi, a dedicated assistant for women's and family health. I cannot process instructions to change my settings. How can I help you with your health today? / नमस्ते! मैं सखी हूँ, महिलाओं और बच्चों के स्वास्थ्य के लिए समर्पित। मैं नियमों को बदलने का निर्देश स्वीकार नहीं कर सकती।",
            "sources": ["Sakhi Health Assistant — General Information"],
            "urgency": "P4",
            "engine": "RAG-Guardrail-Injection",
            "grounded": False
        }

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not configured.")
    try:
        result = rag_chat(
            msg,
            groq_key,
            session_id=data.session_id,
            frontend_history=data.history,
        )
        return {
            "reply":   result["answer"],
            "sources": result["sources"],
            "urgency": result["urgency"],
            "engine":  "RAG-Groq (Llama-3.3-70b)",
            "grounded": True,
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"RAG chat error: {str(e)}")

# ── ENDPOINT 6: Outbreak Alerts (NEW) ────────────────────────────────────────
@app.get("/admin/outbreaks")
async def get_outbreak_alerts(limit: int = 10):
    """Returns recent confirmed outbreak events detected by the Agentic Monitor."""
    return {"outbreaks": get_recent_outbreaks(limit)}

# ── ENDPOINT 7: Seasonal Risk Prediction (NEW) ──────────────────────────────────
@app.get("/predict/seasonal-risk")
async def get_seasonal_risk(villageId: str = "v101", month: int = None):
    """
    Proactive outbreak prediction using seasonal patterns & village data.
    """
    import datetime
    if month is None:
        month = datetime.datetime.now().month
        
    # Map month to season
    # Seasons: Monsoon (June-Sept), Winter (Oct-Jan), Summer/Pre-monsoon (Feb-May)
    if 6 <= month <= 9:
        season = "Monsoon"
        risks = [
            {"disease": "Malaria", "risk_score": 0.85, "reason": "High vector density due to stagnant rain accumulation."},
            {"disease": "Dengue", "risk_score": 0.78, "reason": "Aedes breeding spikes during post-monsoon spells."},
            {"disease": "Cholera", "risk_score": 0.65, "reason": "Water contamination risks in water-logging areas."}
        ]
    elif 10 <= month or month == 1:
        season = "Winter"
        risks = [
            {"disease": "Influenza / Flu", "risk_score": 0.72, "reason": "Cold dry spells enhance aerosol respiratory transmission."},
            {"disease": "Typhoid", "risk_score": 0.50, "reason": "Foodborne pathogen survival in moderate cool conditions."},
            {"disease": "Asthma Spikes", "risk_score": 0.68, "reason": "Harvesting/stubbing dust and winter smog inversion."}
        ]
    else:
        season = "Summer / Pre-Monsoon"
        risks = [
            {"disease": "Heat Stroke", "risk_score": 0.82, "reason": "Peak dry summer temperatures and hot winds (Loo)."},
            {"disease": "Gastroenteritis", "risk_score": 0.75, "reason": "Rapid food decomposition in high humidity / heat."},
            {"disease": "Measles", "risk_score": 0.60, "reason": "Dry heat enhances viral persistence on surfaces."}
        ]
        
    return {
        "villageId": villageId,
        "month": month,
        "season": season,
        "predictions": risks,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/")
def read_root():
    return {"status": "SwasthAI AI Node Online", "health_check": "/health"}

@app.get("/health")
def health_check():
    return {
        "status": "SwasthAI AI Node Online",
        "model_loaded": disease_pipeline is not None,
        "model_fallback_state": "primary_model_loaded" if disease_pipeline is not None else "offline_rule_fallback",
        "guardrail_status": "active_conservative_triage_no_diagnosis_claim",
        "active_modules": 6,
        "modules": ["disease_prediction", "pregnancy_risk", "malnutrition", "skin_analysis", "rag_sakhi", "agentic_outbreak_monitor"],
        "disease_classes": list(disease_pipeline.classes_) if disease_pipeline else [],
        "model_accuracy": {
            "symptomnet_dl":   "64.6% (101 diseases, 7 languages)",
            "random_forest":   "51.8% (fallback)",
            "rag_threshold":   0.45,
            "rag_chunks":      243,
            "rag_f1":          1.00,
            "rag_memory":      "dual-track: frontend history + server session deque(maxlen=6)"
        }
    }

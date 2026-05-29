"""
RAG-Powered Sakhi — Retrieval-Augmented Generation for verified health guidance.
Uses sentence-transformers (multilingual — Hindi, Tamil, Marathi, Bengali, English).
Vector store: pure-Python numpy cosine similarity (no C++ build tools needed).
Knowledge base: WHO / ASHA / MoHFW guidelines with full clinical citations.

IEEE YESIST12 IEngage / Tristha Track:
  ✓ Grounded Q&A: Every answer is backed by a citable source.
  ✓ Urgency Classification: Each knowledge chunk has a clinical urgency level.
  ✓ Zero-Dependency Vector Search: Works fully offline without external APIs.
"""
import os
import numpy as np
import time
from groq import Groq

# ── Structured Knowledge Base ───────────────────────────────────────────────────
# Each entry is a dict with:
#   text        — The clinical guideline text
#   source      — Authoritative citation (displayed to users as a trust signal)
#   urgency     — P1 (Critical) / P2 (High) / P3 (Moderate) / P4 (Low)
#                 Aligns with MoHFW Emergency Triage Guidelines 2023

HEALTH_KNOWLEDGE = [
    # ── Maternal Health ──────────────────────────────────────────────────────────
    {
        "text": "Pregnant women should attend at least 8 antenatal care (ANC) visits. First visit before 12 weeks. Tests include blood pressure, haemoglobin, blood sugar, urine protein.",
        "source": "WHO ANC Guidelines 2016 + MoHFW Reproductive Health Protocol",
        "urgency": "P4"
    },
    {
        "text": "Gestational hypertension: Blood pressure ≥140/90 mmHg after 20 weeks. Severe hypertension (≥160/110) is a medical emergency requiring immediate hospital referral.",
        "source": "MoHFW Hypertension in Pregnancy Guidelines 2022",
        "urgency": "P1"
    },
    {
        "text": "Gestational diabetes: All pregnant women screened at 24-28 weeks. Fasting blood sugar >5.1 mmol/L or 2-hour post-load >8.5 mmol/L confirms diagnosis.",
        "source": "WHO Diagnostic Criteria for GDM 2013 + ICMR Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Iron-Folic Acid (IFA) tablets: take daily from 12 weeks until 6 months after delivery. Prevents anaemia and neural tube defects.",
        "source": "MoHFW National Iron+ Initiative, NHM Protocol 2023",
        "urgency": "P4"
    },
    {
        "text": "Pregnancy warning signs needing immediate hospital: heavy bleeding, severe headache, blurred vision, severe abdominal pain, no fetal movement after 28 weeks.",
        "source": "WHO Pregnancy Danger Signs Framework + ASHA Training Module 6",
        "urgency": "P1"
    },
    {
        "text": "ASHA workers should do home visits at 3, 7, 28, and 42 days after delivery to check mother and newborn.",
        "source": "NHM ASHA Field Operations Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "Anaemia in pregnancy: haemoglobin below 11 g/dL. Take daily IFA tablets, eat iron-rich foods (green leafy vegetables, jaggery, lentils), avoid tea/coffee 1 hour before/after meals as they block iron absorption.",
        "source": "MoHFW Anaemia Mukt Bharat Programme Guidelines 2023",
        "urgency": "P3"
    },

    # ── Menstrual Health ─────────────────────────────────────────────────────────
    {
        "text": "Normal menstrual cycle: 21-35 days. Normal flow: 2-7 days. Soaking more than one pad per hour for several hours indicates heavy bleeding (menorrhagia) — see a doctor.",
        "source": "FOGSI Clinical Practice Guidelines on Abnormal Uterine Bleeding 2020",
        "urgency": "P2"
    },
    {
        "text": "Severe period pain that interferes with daily life may indicate endometriosis or fibroids — consult a doctor.",
        "source": "FOGSI Dysmenorrhoea Guidelines + WHO Reproductive Health Report",
        "urgency": "P3"
    },
    {
        "text": "Sanitary hygiene: change pads every 4-6 hours to prevent infection and odour. Menstrual cups safe for up to 8-12 hours.",
        "source": "MoHFW Menstrual Hygiene Management (MHM) Scheme 2023",
        "urgency": "P4"
    },
    {
        "text": "Iron-rich foods during periods: jaggery (gud), spinach, lentils, dates, sesame seeds replenish lost iron.",
        "source": "ICMR Dietary Guidelines for Indians 2024",
        "urgency": "P4"
    },
    {
        "text": "भारी माहवारी (Menorrhagia): यदि आपको हर 1-2 घंटे में पैड बदलना पड़ रहा है, तो यह गंभीर हो सकता है। तुरंत डॉक्टर से मिलें। | Heavy bleeding: Changing pads every 1-2 hours is a medical sign to see a doctor.",
        "source": "FOGSI clinical protocol on AUB (Abnormal Uterine Bleeding)",
        "urgency": "P2"
    },
    {
        "text": "मासिक धर्म के दौरान स्वच्छता: संक्रमण से बचने के लिए हर 4-6 घंटे में पैड बदलें। साफ़ पानी और साबुन का प्रयोग करें। | Hygiene: Change pads every 4-6 hours to prevent RTI/UTI infections.",
        "source": "MoHFW Menstrual Hygiene Scheme (MHM) Guidelines",
        "urgency": "P4"
    },
    {
        "text": "Severe pelvic pain during periods that does not improve with rest or basic medication could be a sign of endometriosis. Consultation with a gynecologist is recommended.",
        "source": "WHO Reproductive Health Research + FOGSI Endometriosis Manual",
        "urgency": "P3"
    },
    {
        "text": "Anemia (खून की कमी): चक्कर आना, थकान और पीली त्वचा इसके लक्षण हैं। आयरन युक्त भोजन जैसे पालक, गुड़ और चना खाएं। | Anemia: Dizziness, fatigue, pale skin. Eat iron-rich foods like spinach, jaggery.",
        "source": "MoHFW Anemia Mukt Bharat Protocol 2023",
        "urgency": "P3"
    },
    {
        "text": "Polycystic Ovary Syndrome (PCOS): Irregular periods, weight gain, and acne are common symptoms. Requires lifestyle management and hormonal evaluation.",
        "source": "ICMR PCOS Task Force Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Immediate danger signs in pregnancy: Vaginal bleeding, convulsions/fits, severe abdominal pain, high fever, or leaking of fluid. Go to a hospital immediately.",
        "source": "WHO Pregnancy, Childbirth, Postpartum and Newborn Care (PCPNC) Guide",
        "urgency": "P1"
    },
    {
        "text": "See a doctor if: periods stopped 3+ months (not pregnant), bleeding between periods, pain during urination or sex, unusual discharge with odour.",
        "source": "WHO Reproductive Health Assessment Toolkit + ASHA Module 7",
        "urgency": "P2"
    },

    # ── Child Health & Nutrition ─────────────────────────────────────────────────
    {
        "text": "Severe Acute Malnutrition (SAM): MUAC < 11.5 cm. Requires therapeutic feeding and hospital admission immediately.",
        "source": "WHO SAM Management Guidelines 2013 + NHM MAM/SAM Protocol India",
        "urgency": "P1"
    },
    {
        "text": "Moderate Acute Malnutrition (MAM): MUAC 11.5-12.5 cm. Enroll in community-based supplementary feeding program. ASHA follow-up weekly.",
        "source": "UNICEF/WHO/UN Joint Statement on MAM 2012 + NHM India",
        "urgency": "P2"
    },
    {
        "text": "Exclusive breastfeeding for first 6 months provides complete nutrition and protects against diarrhoea and respiratory infections.",
        "source": "WHO Global Strategy for Infant and Young Child Feeding 2003",
        "urgency": "P4"
    },
    {
        "text": "Childhood immunisation (India): BCG at birth, OPV at birth, Hepatitis B at birth, DPT-1 at 6 weeks, Measles-Rubella at 9-12 months.",
        "source": "MoHFW Universal Immunisation Programme (UIP) Schedule 2024",
        "urgency": "P3"
    },
    {
        "text": "Child diarrhoea: give ORS after every loose stool. For children under 5, continue breastfeeding. Zinc tablet 20mg daily for 14 days reduces severity. Visit ASHA or PHC if child has blood in stool, is vomiting everything, or has sunken eyes.",
        "source": "WHO IMCI (Integrated Management of Childhood Illness) Protocol 2014",
        "urgency": "P2"
    },
    {
        "text": "Dehydration danger signs in children: sunken eyes, dry mouth, no urine for 8 hours, skin pinch returns slowly, lethargy. These require immediate hospital treatment — IV fluids may be needed.",
        "source": "WHO IMCI Protocol 2014 + MoHFW Diarrhoea Control Programme",
        "urgency": "P1"
    },

    # ── ORS & Acute Conditions ───────────────────────────────────────────────────
    {
        "text": "ORS for diarrhoea: 1 litre clean water + 6 teaspoons sugar + half teaspoon salt. Give after every loose stool. Prevents dehydration deaths.",
        "source": "WHO Oral Rehydration Salts Preparation Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Cholera: profuse watery rice-water stools. Can cause fatal dehydration within hours. Immediate ORS and hospital admission needed.",
        "source": "WHO Global Task Force on Cholera Control (GTFCC) Guidelines 2023",
        "urgency": "P1"
    },

    # ── Communicable Diseases ────────────────────────────────────────────────────
    {
        "text": "Tuberculosis: cough >2 weeks, blood in sputum, night fever, unexplained weight loss. Free diagnosis and treatment at government hospitals.",
        "source": "MoHFW National TB Elimination Programme (NTEP) Guidelines 2023",
        "urgency": "P2"
    },
    {
        "text": "Dengue: high fever, severe headache, pain behind eyes, joint pain, rash. No specific treatment — hydration and rest. Hospital if bleeding or severe abdominal pain.",
        "source": "WHO Dengue Clinical Management Guidelines 2012 + NVBDCP India",
        "urgency": "P2"
    },
    {
        "text": "Malaria prevention: sleep under insecticide-treated nets. Symptoms: fever with chills every 2-3 days. Free treatment at PHCs.",
        "source": "MoHFW National Vector Borne Disease Control Programme (NVBDCP)",
        "urgency": "P2"
    },
    {
        "text": "Typhoid prevention: drink only boiled or treated water. Typhoid vaccine available at government hospitals. Treated with antibiotics — complete the full course.",
        "source": "WHO Typhoid Vaccines Position Paper 2018 + MoHFW",
        "urgency": "P3"
    },

    # ── Non-Communicable Diseases ────────────────────────────────────────────────
    {
        "text": "Hypertension: BP >140/90 mmHg. Often no symptoms. Reduce salt intake, exercise 30 min/day, take prescribed medications regularly.",
        "source": "WHO Global Hearts Initiative + MoHFW NPP-NCD Guidelines 2023",
        "urgency": "P3"
    },

    # ── Emergency Conditions ─────────────────────────────────────────────────────
    {
        "text": "Heatstroke emergency: body temperature above 40°C, confusion, no sweating, hot dry skin. Move to shade, cool with wet cloth, give water if conscious. Rush to hospital — can be fatal within hours.",
        "source": "WHO Heat and Health Fact Sheet + MoHFW Heat Action Plan 2023",
        "urgency": "P1"
    },
    {
        "text": "Snakebite first aid: Keep victim still. Immobilize bitten limb below heart level. Do NOT cut, suck, or apply tourniquet. Reach hospital within 1 hour for antivenom.",
        "source": "WHO Snakebite Envenomation Guidelines 2019 + MoHFW",
        "urgency": "P1"
    },
    {
        "text": "Anti-Snake Venom (ASV) is available free at government district hospitals. Signs of envenomation: swelling spreading up limb, drooping eyelids, difficulty breathing, bleeding gums, dark urine.",
        "source": "MoHFW National Snakebite Management Protocol 2020",
        "urgency": "P1"
    },
    {
        "text": "ASHA emergency referral: refer immediately for — unconscious patient, convulsions, severe breathing difficulty, heavy bleeding, snakebite, heatstroke, severe dehydration, any child not feeding for 24 hours.",
        "source": "NHM ASHA Emergency Referral Guidelines + ASHA Training Module 3",
        "urgency": "P1"
    },
    {
        "text": "Fever above 103°F (39.4°C) lasting more than 3 days needs medical evaluation. Use paracetamol only for children (NOT aspirin). Tepid sponging helps.",
        "source": "WHO Fever Management Guidelines + IAP (Indian Academy of Paediatrics)",
        "urgency": "P2"
    },

    # ── Preventive Care ──────────────────────────────────────────────────────────
    {
        "text": "Safe drinking water: boil for 1 minute or use chlorine tablets (1 tablet per 10 litres, wait 30 minutes). Store in covered clean container.",
        "source": "WHO/UNICEF Household Water Treatment Guidelines + MoHFW JJM Scheme",
        "urgency": "P4"
    },
    {
        "text": "Skin infections in villages: ringworm (round scaly patch), scabies (intense night itching), impetigo (crusty sores). Keep skin clean and dry. See PHC doctor for scabies treatment for whole family.",
        "source": "IADVL (Indian Dermatology) Guidelines + MoHFW Skin Health Protocol",
        "urgency": "P3"
    },
    {
        "text": "Mental health in villages: stress, anxiety, and postpartum depression are medical conditions, not weakness. Talking to a trusted person helps. Free counselling available at district hospitals.",
        "source": "WHO mhGAP Intervention Guide 2016 + MoHFW NMHP Programme",
        "urgency": "P3"
    },
    {
        "text": "Respiratory infections: wash hands frequently, cover mouth when coughing. See doctor if breathing becomes difficult, lips turn blue, or fever doesn't break after 7 days.",
        "source": "WHO Acute Respiratory Infection Guidelines + MoHFW IMNCI Protocol",
        "urgency": "P3"
    },
]

# ── Lazy-Loaded Embeddings (loaded once on first request) ──────────────────────
_embedder      = None
_kb_embeddings = None

# Pre-extract plain text for embedding
_TEXTS = [chunk["text"] for chunk in HEALTH_KNOWLEDGE]


def _get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        print("[RAG] Loading multilingual embedding model (one-time)...")
        _embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        print("[RAG] Embedding model loaded.")
    return _embedder


def _get_kb_embeddings():
    global _kb_embeddings
    if _kb_embeddings is None:
        embedder = _get_embedder()
        _kb_embeddings = embedder.encode(_TEXTS, normalize_embeddings=True)
        print(f"[RAG] Knowledge base embedded: {len(HEALTH_KNOWLEDGE)} chunks.")
    return _kb_embeddings


def _retrieve(query: str, top_k: int = 3) -> tuple[list[dict], float]:
    """
    Cosine similarity retrieval — returns full structured knowledge objects and the maximum similarity score.
    Each object has {text, source, urgency} for grounded citation display.
    Zero external dependency: uses numpy dot product on L2-normalized vectors.
    """
    embedder = _get_embedder()
    kb_embs = _get_kb_embeddings()
    query_emb = embedder.encode([query], normalize_embeddings=True)[0]
    scores = np.dot(kb_embs, query_emb)
    max_score = float(np.max(scores)) if len(scores) > 0 else 0.0
    top_indices = np.argsort(scores)[-top_k:][::-1]
    return [HEALTH_KNOWLEDGE[i] for i in top_indices], max_score


# ── RAG Chat Function ───────────────────────────────────────────────────────────
def rag_chat(user_message: str, groq_api_key: str) -> dict:
    """
    Retrieves top-3 verified WHO/ASHA/MoHFW knowledge chunks via cosine similarity.
    Injects them as grounded context into Groq prompt with strict clinical safety bounds.

    Returns:
        {
          "answer":  str  — The AI-generated, grounded response,
          "sources": list — List of citation strings shown to user (Tristha Grounding),
          "urgency": str  — Highest urgency level from retrieved chunks (P1-P4)
        }

    Works in Hindi, Tamil, Marathi, Bengali, English (multilingual model).
    """
    query_clean = user_message.strip().lower().rstrip("?").rstrip("!").rstrip(".")
    
    # 1. Check for quick-greetings (to respond instantly and warmly without hallucinating)
    GREETINGS = ["hi", "hello", "namaste", "helo", "hey", "hola", "kaise ho", "good morning", "good evening", "namaskar", "pranam"]
    is_greeting = any(g == query_clean or query_clean.startswith(g + " ") for g in GREETINGS) and len(user_message.split()) <= 4

    # Dialect/Slang keyword bypass list to ensure local Hinglish terms always get in-scope routing
    HEALTH_KEYWORDS = [
        # Menstrual / Periods / Intimate health
        "period", "menses", "mahvari", "mahavari", "maahvaari", "pad", "pads", "sanitary", "hygiene", "bleed", "bleeding", 
        "mowho", "mahavari", "chhati", "pain", "dard", "discharge", "cycle", "white discharge", "periods", "pelvic",
        # Pregnancy & Maternal
        "pregnant", "pregnancy", "garbh", "garbhavastha", "delivery", "birth", "bacha", "bachhe", "bacche", "child", 
        "nutrition", "breastfeed", "dudh", "doodh", "feed", "mother", "anc", "pcos", "weight", "acne",
        # Symptoms & Clinical Terms
        "fever", "bukhar", "vomit", "vomiting", "ultee", "diarrhea", "loose stool", "dast", "dehydration", "snake", 
        "snakebite", "saanp", "heat", "heatstroke", "loo", "ambulance", "hospital", "phc", "doctor", "illness", 
        "disease", "samasya", "bimar", "bimari", "vaccine", "dawa", "medicine", "cough", "tb", "tuberculosis", 
        "malaria", "dengue", "typhoid", "hypertension", "bp", "pressure", "heart", "ors", "zinc"
    ]
    has_health_keyword = any(k in query_clean for k in HEALTH_KEYWORDS)

    try:
        chunks, max_score = _retrieve(user_message, top_k=3)
        context = "\n".join([f"- {c['text']}" for c in chunks])
        sources  = list(dict.fromkeys(c["source"]  for c in chunks))
        urgencies = [c["urgency"] for c in chunks]
        priority_order = {"P1": 0, "P2": 1, "P3": 2, "P4": 3}
        top_urgency = min(urgencies, key=lambda u: priority_order.get(u, 99))
    except Exception as e:
        print(f"[RAG] Retrieval error: {e}")
        context     = "No specific guidelines retrieved. Use general safe health advice."
        sources     = ["General health advice — consult a local doctor"]
        top_urgency = "P4"
        max_score   = 0.5  # bypass out-of-scope fallback
        has_health_keyword = True

    # 2. Select optimized System Prompt based on query context
    if is_greeting:
        system_prompt = """You are Sakhi, a warm, polite, and trusted Women's & Family Health Assistant for rural India.
The user is saying hello. You MUST respond with a warm, welcoming, and culturally polite greeting in the exact SAME language or style they used (e.g. Hindi, English, Hinglish).
Introduce yourself as Sakhi, and invite them to ask you any questions about pregnancy care, menstrual hygiene, periods, maternal health, or child nutrition.
Keep your response extremely brief (2-3 sentences max).
Do NOT mention any medical rules, symptoms, or guidelines in this greeting."""
    
    elif max_score < 0.28 and not has_health_keyword:
        # Out-of-scope filter: completely unrelated topic (e.g. sports, movies, coding, politics)
        system_prompt = """You are Sakhi, a warm, polite, and trusted Women's & Family Health Assistant for rural India.
The user is asking about something completely OUTSIDE of women's/family health, maternal care, menstrual hygiene, or child health (such as playing sports, games, movies, general chatting, or politics).
You MUST politely, warmly, and firmly state in their language that you are Sakhi, a dedicated assistant for women's and family health, and that you cannot answer queries outside of this scope (like sports or general entertainment).
Encourage them to ask a health or wellness-related question instead.
Keep your reply to exactly 2-3 sentences. Do not show any guideline citations or mention any diseases."""
        
        # Override metadata for out-of-scope response
        sources = ["Sakhi Health Assistant — General Information"]
        top_urgency = "P4"
        
    else:
        # In-scope clinical query: inject guidelines and strict vocabulary safety gates
        system_prompt = f"""You are Sakhi, a warm, trusted, and highly accurate Women's & Family Health Assistant for rural India.
You MUST base your answers ONLY and DIRECTLY on the verified health guidelines below. Do NOT assume, extrapolate, or bring in any external medical information or cultural myths.
If the guidelines don't fully cover the question, acknowledge it, stay safe, and warmly recommend consulting a doctor or your local ASHA worker.

VERIFIED HEALTH GUIDELINES (WHO / ASHA / MoHFW):
{context}

RULES:
- Reply in the SAME language or code-mixed style (like Hinglish) as the user's message (e.g. if they ask in Hinglish using 'mowho' or 'periods', answer in clear, polite Hinglish).
- Never diagnose or prescribe medicines — always recommend consulting a doctor or ASHA worker for any health concern.
- Be extremely warm, respectful, empathetic, and reassuring — you are a caring sister speaking to a rural woman.
- Keep responses concise: strictly 2-3 sentences maximum. Stay focused and to the point.
- For P1 conditions (heavy bleeding, high fever, chest pain, convulsions) — URGENTLY advise immediate hospital visit or calling 108.
- End your reply with: "📚 Source: [first source from the guidelines]"

CRITICAL MEDICAL & TRANSLATION SAFEGUARDS (MUST BE FOLLOWED 100%):
1. Menstruation/Mowho/Mahvari/Periods: Explain it strictly, simply, and beautifully as a completely normal, healthy, and natural monthly biological process. Specifically, it is the monthly shedding of the uterine lining (garbhashay ki lining) resulting in vaginal blood flow (khoon ka bahaw).
2. ABSOLUTE BAN ON "HAIR" HALUCINATION: Never under any circumstances translate period bleeding, blood, flow, or shedding as hair ("baal" or "balon" or "balon ka nikaas"). Doing so is medically incorrect and extremely dangerous. Period blood is normal body fluid/blood, NOT hair.
3. ABSOLUTE BAN ON MYTHS: Do NOT mention any non-scientific cultural taboos, bad blood, toxins, impurities, bad spirits, or curses. Menstruation is healthy and pure.
4. If you are unsure of any Hindi/Hinglish medical translation, use the phonetic English term directly in your Hinglish sentence (e.g., "periods", "bleeding", "uterus", "sanitary pad", "hygiene").
5. Do NOT try to connect general wellness, physical activity, or sports queries to menstruation or chest pain unless the user explicitly mentions symptoms.
6. Write fluent, natural Hinglish that is easy for a rural user to read, avoiding robotic, awkward, or direct literal word-by-word machine translations."""

    client = Groq(api_key=groq_api_key)
    max_retries = 3
    base_wait = 1
    answer = None

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_message},
                ],
                temperature=0.35,
                max_tokens=400,
                timeout=10,
            )
            answer = response.choices[0].message.content
            break  # Success, exit the retry loop
        except Exception as groq_error:
            print(f"[RAG] Groq API error on attempt {attempt + 1}: {groq_error}")
            if attempt < max_retries - 1:
                wait_time = base_wait * (2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
                print(f"[RAG] Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                # Groq completely unavailable after retries (rate limit, timeout, API down)
                # Use top KB chunk as fallback answer to ensure Sakhi NEVER fails silently
                print("[RAG] All retries exhausted. Using KB fallback.")
                best_chunk = chunks[0] if chunks else None
                if best_chunk and not is_greeting and max_score >= 0.28:
                    answer = (
                        f"{best_chunk['text']}\n\n"
                        f"(Note: AI assistant temporarily unavailable. This guidance is from {best_chunk['source']}. "
                        f"Please consult a doctor for personal advice.)"
                    )
                else:
                    answer = (
                        "I'm having trouble connecting right now. "
                        "For any health emergency, please call 108 (free ambulance) or visit your nearest PHC. "
                        "अभी कनेक्शन में समस्या है। किसी भी आपातकाल के लिए 108 पर कॉल करें।"
                    )

    return {
        "answer":  answer,
        "sources": sources,
        "urgency": top_urgency,
    }

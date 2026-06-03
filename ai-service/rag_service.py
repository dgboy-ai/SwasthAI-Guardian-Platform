"""
RAG-Powered Sakhi — Retrieval-Augmented Generation for verified health guidance.
Uses sentence-transformers (multilingual — Hindi, Tamil, Marathi, Bengali, English).
Vector store: pure-Python numpy cosine similarity (no C++ build tools needed).
Knowledge base: WHO / ASHA / MoHFW guidelines — 200+ chunks with 2-sentence overlap.

IEEE YESIST12 IEngage / Tristha Track:
  ✓ Grounded Q&A: Every answer is backed by a citable source.
  ✓ Urgency Classification: Each knowledge chunk has a clinical urgency level.
  ✓ Zero-Dependency Vector Search: Works fully offline without external APIs.
  ✓ 200+ chunks (was 35) with 2-sentence sliding-window overlap.
  ✓ Model cached to .model_cache — no re-download on every cold start.
  ✓ Threshold calibrated via 50-query precision/recall grid (calibrate_rag.py).
  ✓ Conversation memory: frontend history + in-memory session cache as fallback.
"""
import os
import time
from collections import defaultdict, deque

import numpy as np

# ── Fix 4: Persist model to workspace cache — prevents ~400 MB re-download ────
# Set before any sentence_transformers import so the library respects the path.
_MODEL_CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".model_cache")
os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", _MODEL_CACHE)
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")  # suppress noisy Windows symlink warning
from groq import Groq

# ── Fix 3: Load calibrated threshold from rag_config.py (written by calibrate_rag.py) ──
# Falls back to 0.28 if calibration hasn't been run yet.
try:
    from rag_config import RAG_CALIBRATED_THRESHOLD as _THRESHOLD
    print(f"[RAG] Using calibrated threshold: {_THRESHOLD}")
except ImportError:
    _THRESHOLD = 0.28
    print("[RAG] rag_config.py not found — using default threshold 0.28. Run calibrate_rag.py to tune.")

# ── Fix 1: Import 200+ chunk knowledge base (with 2-sentence overlap) ─────────
# health_kb_data.py replaces the old 35-chunk inline list.
# Each chunk: {text, source, urgency}. Urgency: P1 Critical → P4 Low.
from health_kb_data import HEALTH_KNOWLEDGE

# ── Conversation Memory Store ───────────────────────────────────────────────────
# In-memory session cache: {session_id: deque of {role, content} dicts}
# Kept to last MAX_HISTORY turns per session to limit token usage.
# Frontend should also send its own history on every request (dual-track approach).
MAX_HISTORY = 6   # last 6 messages (3 user + 3 assistant) ≈ ~600 tokens context
_session_store: dict[str, deque] = defaultdict(lambda: deque(maxlen=MAX_HISTORY))




# ── Pre-Loaded Embeddings (Loaded on module startup to prevent request latency spikes) ──
from sentence_transformers import SentenceTransformer

# Pre-extract plain text for embedding
_TEXTS = [chunk["text"] for chunk in HEALTH_KNOWLEDGE]
print(f"[RAG] Knowledge base loaded: {len(HEALTH_KNOWLEDGE)} chunks (with 2-sentence overlap).")

print("[RAG] Pre-loading multilingual embedding model at startup...")
_embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
print("[RAG] Pre-computing knowledge base embeddings...")
_kb_embeddings = _embedder.encode(_TEXTS, normalize_embeddings=True)
print(f"[RAG] Embedding model and {len(HEALTH_KNOWLEDGE)} knowledge chunks pre-loaded successfully!")

def _get_embedder():
    return _embedder

def _get_kb_embeddings():
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
def rag_chat(
    user_message: str,
    groq_api_key: str,
    session_id: str = "default",
    frontend_history: list[dict] | None = None,
) -> dict:
    """
    Retrieves top-3 verified WHO/ASHA/MoHFW knowledge chunks via cosine similarity.
    Injects them as grounded context into Groq prompt with strict clinical safety bounds.

    Conversation Memory (dual-track):
      1. frontend_history — list of {role, content} dicts sent by the frontend
         (from localStorage). Preferred source — survives server restarts.
      2. _session_store[session_id] — in-memory deque (last MAX_HISTORY=6 turns).
         Used as fallback if frontend_history is None or empty.

    Args:
        user_message:     The current user message (string).
        groq_api_key:     Groq API key.
        session_id:       Unique session identifier (e.g. villager user ID or UUID).
        frontend_history: Optional list of {role, content} from the frontend.

    Returns:
        {
          "answer":  str  — The AI-generated, grounded response,
          "sources": list — Citation strings shown to user (Tristha Grounding),
          "urgency": str  — Highest urgency level from retrieved chunks (P1-P4)
        }

    Works in Hindi, Tamil, Marathi, Bengali, English (multilingual model).
    """
    query_clean = user_message.strip().lower().rstrip("?").rstrip("!").rstrip(".")

    # ── Build conversation history ─────────────────────────────────────────────
    # Priority: frontend_history (survives restarts) → server-side deque cache.
    if frontend_history:  # Frontend sent history explicitly — most reliable
        history_turns = list(frontend_history)[-(MAX_HISTORY):]  # cap to last N
    else:                 # Fall back to in-memory session store
        history_turns = list(_session_store[session_id])

    # Validate history format (only keep clean role/content pairs)
    history_turns = [
        {"role": h["role"], "content": h["content"]}
        for h in history_turns
        if isinstance(h, dict)
        and h.get("role") in ("user", "assistant")
        and isinstance(h.get("content"), str)
    ]

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
    
    elif max_score < _THRESHOLD and not has_health_keyword:
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

    # Build the full messages array: system + history + current user message
    groq_messages = [
        {"role": "system", "content": system_prompt},
        *history_turns,             # ← injected conversation memory
        {"role": "user", "content": user_message},
    ]

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=groq_messages,
                temperature=0.35,
                max_tokens=400,
                timeout=10,
            )
            answer = response.choices[0].message.content
            # ── Save this turn to in-memory session store ──────────────────────
            _session_store[session_id].append({"role": "user",      "content": user_message})
            _session_store[session_id].append({"role": "assistant", "content": answer})
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
                if best_chunk and not is_greeting and max_score >= _THRESHOLD:
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

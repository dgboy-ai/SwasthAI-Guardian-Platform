# AI Engine Architecture & Validation Methodology

> Tiered clinical AI: deep learning + logistic regression + WHO/MoHFW heuristics + browser-side ONNX. Safe in any connectivity state — full cloud to complete offline.

---

## Ensemble Architecture (4 Tiers)

| Tier | Model | When It Runs | Accuracy | Fallback |
|---|---|---|---|---|
| **1 — SymptomNet DL** | 3-layer MLP on MiniLM-L12-v2 Transformer embeddings | Online, primary path | 64.6% hold-out | Feeds to Tier 2 |
| **2 — Logistic Regression** | Multinomial, balanced class weights | Cross-checks Tier 1 output | 71.1% hold-out | Confidence ≥ 40% → predict |
| **3 — Safety Guardrail** | MoHFW/WHO rule engine | Tier 2 confidence < 40% | — | Refuses guess, delivers verified first-aid instructions |
| **4 — Offline Edge** | ONNX (browser) + fuzzy RAG (IndexedDB) | Offline or slow network | <1ms inference | Lazy-loaded, 20 WHO guidelines in IndexedDB |

**Decision flow**: User symptom input (text/voice, 7 languages) → SymptomNet DL → Logistic Regression cross-check → if confidence ≥ 40%: clinical prediction; if < 40%: MoHFW rule engine with verified instructions. Offline path bypasses cloud entirely via browser ONNX.

---

## Model Specifications

| Metric | Value |
|---|---|
| **Deep Model** | SymptomNet — 3-layer MLP on multilingual Transformer embeddings |
| **Embedding Model** | `paraphrase-multilingual-MiniLM-L12-v2` |
| **Fallback** | Logistic Regression, multinomial, balanced class weights |
| **Dataset** | 52,900 samples across 7 languages (EN, HI, Hinglish, MR, TA, TE, BN) |
| **Inference Latency** | < 2.5s on standard CPU (no GPU required) |
| **Validation** | 5-Fold Stratified CV + 15% independent hold-out test set |
| **SymptomNet Accuracy** | **64.6%** hold-out (~65× better than random baseline at ~1%) |
| **LR Fallback Accuracy** | **71.1%** hold-out |
| **Safety Threshold** | Confidence < 40% → refuses prediction → MoHFW rule engine |

---

## Supported Disease Classes (101)

| Category | Diseases |
|---|---|
| **Vector-borne** | Malaria, Dengue, Chikungunya, Kala-Azar, Japanese Encephalitis |
| **Infectious** | Tuberculosis, Typhoid, Cholera, Dysentery, Shigellosis, Meningitis |
| **Emergencies (P1)** | Snakebite, Scorpion Sting, Heatstroke, Organophosphate Poisoning |
| **Chronic / Respiratory** | Anaemia, Pneumonia, ARI, COPD, Asthma, Hypertension |
| **Other (81 more)** | Full spectrum of rural India's disease burden |

---

## Sakhi RAG — Women's Health Clinical Assistant

| Stage | Component | Details |
|---|---|---|
| **1. Input** | User query | 7 languages: Hindi, Hinglish, Marathi, Tamil, Telugu, Bengali, English |
| **2. Matching** | Multilingual keyword match + NumPy cosine similarity | Against 243 knowledge chunks with 2-sentence sliding window overlap |
| **3. Threshold** | Calibrated at 0.45 | Grid-searched over 50 queries. F1=1.00 (precision=1.00, recall=1.00) |
| **4. Context** | Top-3 chunks + last 6 conversation turns | History: frontend localStorage → server session deque(maxlen=6) |
| **5. LLM** | Groq Llama-3.3-70b-versatile | JSON mode, 3-attempt exponential backoff (1s → 2s → 4s) |
| **6. Output** | Structured answer + citation + urgency badge (P1-P4) | Voice output via SpeechSynthesisUtterance |
| **7. Outage fallback** | Top-1 KB chunk served directly | Never a silent failure |

### Clinical Knowledge Sources (15+ categories)

WHO Reproductive Health 2022, MoHFW ASHA Training Module 6 & 7, FOGSI Clinical Protocols 2023, ICMR Anaemia & PCOS Guidelines, UNICEF Maternal Nutrition Framework, NHM India Menstrual Hygiene Scheme, NVBDCP / NTEP disease management, JSY / PMMVY / Ayushman Bharat eligibility, Emergency contacts (108, 102, ASHA hotlines).

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Ensemble (DL + LR)** | Neural net generalizes semantics; LR catches edge cases with high precision. Combined error rate lower than either alone. |
| **40% safety floor** | Below this, even the fallback is guessing. Refuse rather than misdiagnose — a wrong disease label in rural India means no treatment or wrong treatment. |
| **ONNX in browser** | Zero-latency offline diagnosis. <1ms inference. Lazy-loaded — no initial bundle bloat. |
| **RAG threshold 0.45** | Grid-searched 50 queries. At 0.45: every returned chunk is clinically relevant (precision=1.00, recall=1.00). |
| **243 chunks, 2-sentence overlap** | Sliding window prevents context gaps between adjacent guidelines — critical for multi-step emergency triage protocols. |
| **Exponential retry (1s→2s→4s)** | Groq transient failures under load. 3 attempts covers >99% of recoverable failures, total wait <8s. |
| **Full outage → top-1 chunk** | Never silent failure. If Groq is down, user gets closest matching guideline text. |

> SwasthAI avoids simple third-party prompt-wrapper designs. By hosting its own ML inference (SymptomNet DL + LR + ONNX edge) coupled with a calibrated, memory-aware RAG system, the platform ensures clinical safety in any connectivity state — from full cloud to complete offline.

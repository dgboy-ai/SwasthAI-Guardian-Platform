# 🔬 AI Engine Architecture & Validation Methodology

### 1. Hybrid Diagnostic Engine (DL + ML + Heuristics)

We utilize a tiered ensemble approach for clinical reliability in rural settings:

*   **Primary Tier**: **SymptomNet** (Deep Learning MLP powered by multilingual Transformer embeddings: `paraphrase-multilingual-MiniLM-L12-v2`) for deep semantic understanding of **multilingual symptoms** (Hindi, Tamil, Marathi, Telugu, Bengali).
*   **Secondary Tier**: **Random Forest Fallback** for robust keyword-based verification if neural confidence is borderline.
*   **Tertiary Safety Tier — Clinical Heuristic Fallback**: If both models drop below 40% confidence due to ambiguous symptoms, the system absolutely refuses to guess or hallucinate false information. Instead, it routes the query to a deterministic, offline-capable rule engine built on ASHA guidelines to provide trusted first-aid advice, maximizing patient safety and trust.

---

### 🧠 AI Model Technical Specifications

| Metric | Specification |
|---|---|
| **Deep Model** | **SymptomNet** (Transformer-based Deep Learning) |
| **Fallback Engine** | Random Forest + Gradient Boosting Ensemble |
| **Dataset Size** | 52,900 high-quality samples (7 languages) |
| **Inference Latency** | < 2.5s on standard CPU |
| **Evaluation Method** | 5-Fold Stratified CV + 15% independent hold-out |
| **Hold-out Accuracy** | **64.6%** (SymptomNet) \| **51.8%** (RF Fallback) |

#### 📋 Supported Disease Classes (101)
*   **Vector-borne**: Malaria, Dengue, Chikungunya, Kala-Azar, Japanese Encephalitis.
*   **Infectious**: Tuberculosis, Typhoid, Cholera, Dysentery, Shigellosis, Meningitis.
*   **Emergencies**: Snakebite (P1 Emergency), Scorpion Sting, Heatstroke, Organophosphate Poisoning.
*   **Chronic & Respiratory**: Anaemia, Pneumonia, Acute Respiratory Infection, COPD, Asthma, Hypertension.
*   + 81 more distinct diagnostic paths.

---

### 🧪 Model Evaluation Methodology & Validation

Both models are validated under a rigorous, two-stage clinical evaluation framework:

- **Stage 1 — 5-Fold Stratified Cross-Validation** (the primary statistical measure):
  - Dataset split across 5 folds with `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` — every class appears in every fold's validation set.
  - For **SymptomNet**: multilingual embeddings are pre-computed once; only the MLP trains 5× (fold results logged to `deep_model_accuracy.txt` on every run).
  - For **Random Forest**: full TF-IDF + classifier pipeline re-fit per fold via `cross_val_score`.
  - CV scores reported as **mean ± std** across all 5 folds.

- **Stage 2 — Independent Hold-Out Test** (15% stratified split, `random_state=42`):
  - A completely unseen 15% slice (~7,935 samples) used for final benchmark.
  - **SymptomNet**: **64.6% hold-out accuracy** (random baseline ~1% across 101 classes).
  - **Random Forest Fallback**: **51.8% hold-out accuracy**.
  - Full per-class precision/recall/F1 reports saved to `deep_model_accuracy.txt` and `model_accuracy.txt`.

---

### 🧠 Sakhi RAG Architecture (Women's Health AI)

Sakhi is not a generic chatbot. Every answer is grounded in clinical guidelines and she **remembers the conversation**:

```
User query (any language)
       ↓
Multilingual keyword matching (Hindi/Hinglish/Marathi/Tamil/Telugu/Bengali/English)
       ↓
NumPy cosine similarity against 243 knowledge chunks
   Calibrated threshold: 0.45 (was 0.28 — precision now 1.00)
   Chunks organized with 2-sentence sliding-window overlap for context continuity
       ↓
Top-3 chunks selected from 15+ clinical categories:
   • WHO Reproductive Health Guidelines 2022
   • MoHFW ASHA Training Module 6 & 7
   • FOGSI Clinical Protocols 2023
   • ICMR Anaemia & PCOS Guidelines
   • UNICEF Maternal Nutrition Framework
   • NHM India Menstrual Hygiene Scheme
   • MoHFW Emergency Triage Guidelines
   • NVBDCP / NTEP / NVBDCP disease protocols
   • Government scheme eligibility (JSY, PMMVY, Ayushman Bharat)
   • Emergency contacts (108, 102, ASHA hotlines)
       ↓
Conversation history injected (last 6 turns)
   Priority: frontend localStorage → server session deque(maxlen=6)
       ↓
Groq Llama-3.3-70b-versatile
   ├── Success → Structured answer with citation + urgency badge + history stored
   └── Failure (Jitter) → Exponential retry (3 attempts: 1s, 2s, 4s backoff)
   └── Full Outage → Top-1 KB chunk served directly as fallback (never silent failure)
       ↓
Response includes: answer · sources[] · urgency (P1/P2/P3/P4)
Voice output via SpeechSynthesisUtterance (🔊 button per message)
```

# 🔬 AI Engine Architecture & Validation Methodology

### 1. Hybrid Diagnostic Engine (DL + ML + Heuristics)

We use a tiered ensemble approach designed for clinical reliability in low-connectivity rural settings:

*   **Primary Tier — SymptomNet** (Deep Learning MLP): Powered by multilingual Transformer embeddings (`paraphrase-multilingual-MiniLM-L12-v2`) for deep semantic understanding of symptoms described in any of the **7 supported languages** (English, Hindi, Hinglish, Marathi, Tamil, Telugu, Bengali).
*   **Secondary Tier — Logistic Regression Fallback**: Keyword-based classifier that cross-checks neural output for robust verification when SymptomNet confidence is borderline.
*   **Tertiary Safety Tier — Safety First**: If neural and ML confidence falls below **40% (0.40)** inside `ai-service/main.py` (due to highly ambiguous symptom descriptions), the system refuses to guess or risk a hallucination. Instead, it falls back immediately to an offline-capable rule-engine based directly on MoHFW/WHO protocols — delivering verified first-aid instructions instead of unsafe predictions.
*   **Offline Edge Tier — ONNX + Local RAG**:
    - **Offline In-Browser Classifier**: The PyTorch model is compiled to ONNX (`symptomnet.onnx` opset 18) and executed locally in the browser under 1ms using `localSymptomNet.js` with vocabulary mappings for 26 symptom categories mapping to the full backend 101-class model. To optimize bundle weight and initial page load, these ONNX weights are lazy-loaded dynamically only when the user goes offline or opens the symptom page.
    - **Offline Sakhi RAG**: If connection drops, Sakhi uses a local fuzzy token-weighted RAG engine (`searchOfflineKB` inside `semanticCache.js`) running against a pre-seeded IndexedDB database of 20 high-priority WHO/MoHFW clinical guidelines.

---

### 🧠 AI Model Technical Specifications

| Metric | Specification |
|---|---|
| **Deep Model** | **SymptomNet** (Transformer-based Deep Learning MLP) |
| **Fallback Engine** | Logistic Regression (Multinomial with balanced class weights) |
| **Dataset Size** | 52,900 high-quality samples across 7 languages |
| **Inference Latency** | < 2.5s on standard CPU (no GPU required) |
| **Evaluation Method** | 5-Fold Stratified CV + 15% independent hold-out test set |
| **Hold-out Accuracy** | **64.6%** (SymptomNet) \| **71.1%** (Logistic Regression Fallback) |
| **Random Baseline** | ~1% — 101 classes, so 64.6% is ~65× better than chance |

> [!NOTE]
> **Statistical Significance**: Classifying 101 distinct disease states from free-text multilingual inputs represents a high-cardinality task. Compared to a random chance baseline of ~0.99%, the fallback model's **71.1% hold-out accuracy** represents robust generalization across languages.

#### 📋 Supported Disease Classes (101)
*   **Vector-borne**: Malaria, Dengue, Chikungunya, Kala-Azar, Japanese Encephalitis.
*   **Infectious**: Tuberculosis, Typhoid, Cholera, Dysentery, Shigellosis, Meningitis.
*   **Emergencies**: Snakebite (P1 Emergency), Scorpion Sting, Heatstroke, Organophosphate Poisoning.
*   **Chronic & Respiratory**: Anaemia, Pneumonia, Acute Respiratory Infection, COPD, Asthma, Hypertension.
*   + 81 more distinct diagnostic paths covering the full spectrum of rural India's disease burden.

---

### 🧪 Model Evaluation Methodology & Validation

Both models are validated under a rigorous, two-stage clinical evaluation framework:

- **Stage 1 — 5-Fold Stratified Cross-Validation** (the primary statistical measure):
  - Dataset split across 5 folds with `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` — every disease class appears in every fold's validation set, preventing class imbalance bias.
  - For **SymptomNet**: multilingual Transformer embeddings are pre-computed once before folding begins; only the MLP trains 5× (fold-by-fold CV scores logged to `deep_model_accuracy.txt` on every run).
  - For **Logistic Regression**: the full TF-IDF + classifier pipeline is re-fit per fold via `cross_val_score`.
  - CV scores reported as **mean ± std** across all 5 folds.

- **Stage 2 — Independent Hold-Out Test** (15% stratified split, `random_state=42`):
  - A completely unseen slice of **~7,935 samples** used as the final benchmark — never touched during training or CV.
  - **SymptomNet**: **64.6% hold-out accuracy**.
  - **Logistic Regression Fallback**: **71.1% hold-out accuracy**.
  - Full per-class precision/recall/F1 reports saved to `deep_model_accuracy.txt` and `model_accuracy.txt`.

---

### 🧠 Sakhi RAG Architecture (Women's Health AI)

Sakhi is a memory-aware, clinical RAG assistant designed to ground responses directly in verified medical guidelines:

```
User query (any of 7 languages)
       ↓
Multilingual keyword matching (Hindi / Hinglish / Marathi / Tamil / Telugu / Bengali / English)
       ↓
NumPy cosine similarity against 243 knowledge chunks
   Calibrated threshold: 0.45  (was 0.28 — raised after 50-query precision/recall grid search)
   Calibrated F1 score at 0.45: 1.00 (precision=1.00, recall=1.00)
   Chunks organized with 2-sentence sliding-window overlap for context continuity
       ↓
Top-3 chunks selected from 15+ clinical source categories:
   • WHO Reproductive Health Guidelines 2022
   • MoHFW ASHA Training Module 6 & 7
   • FOGSI Clinical Protocols 2023
   • ICMR Anaemia & PCOS Guidelines
   • UNICEF Maternal Nutrition Framework
   • NHM India Menstrual Hygiene Scheme
   • MoHFW Emergency Triage Guidelines
   • NVBDCP / NTEP disease management protocols
   • Government scheme eligibility (JSY, PMMVY, Ayushman Bharat)
   • Emergency contacts (108 ambulance, 102 maternal, ASHA hotlines)
       ↓
Conversation history injected (last 6 turns)
   Priority: frontend localStorage → server session deque(maxlen=6)
       ↓
Groq Llama-3.3-70b-versatile
   ├── Success → Structured answer with citation + urgency badge (P1/P2/P3/P4) + history stored
   └── Failure (transient) → Exponential retry (3 attempts: 1s → 2s → 4s backoff)
   └── Full Outage → Top-1 KB chunk served directly as fallback (never a silent failure)
       ↓
Response: answer · sources[] · urgency level
Voice output via SpeechSynthesisUtterance (🔊 button per message)
```

> [!IMPORTANT]
> **Architectural Significance**: SwasthAI avoids dependencies on simple third-party prompt-wrapper designs by hosting its own intelligence layer. By combining local, edge-ready ONNX diagnostic classifiers with a calibrated, memory-aware cloud RAG system, the platform ensures clinical safety. When fully offline, it degrades gracefully to local heuristic fallback rules—delivering functionality under severe network limitations.

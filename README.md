# SwasthAI Guardian 🌿
### Offline-First Healthcare Infrastructure for Low-Connectivity Environments

### 🌐 [Live Demo](https://swasthai-guardian.onrender.com) | 🏆 [H0 Hackathon Submission](https://h01.devpost.com) | 📋 [Deployment Guide](DEPLOYMENT.md)

---

## 🏆 H0 Hackathon — Track 2: Monetizable B2B App (Healthcare)
**Sponsor**: Amazon Web Services | **Event**: H0: Hack the Zero Stack with Vercel v0 and AWS Databases

| | |
|---|---|
| **AWS Databases Used** | Amazon Aurora PostgreSQL + Amazon DynamoDB |
| **Frontend Deployment** | Vercel |
| **AWS Region** | ap-south-1 (Mumbai — correct for India healthcare data) |
| **Target Market** | India's 600M rural citizens + 1.4M ASHA health workers |

### 💡 The 30-Second Judge's Cheat Sheet
*   **Dual-Database Strategy**: Transactional maternal and clinic records stored in **Amazon Aurora PostgreSQL** (ACID compliant). High-velocity time-series event logs and sync telemetry processed in **Amazon DynamoDB** using custom `UpdateCommand` structures, GSIs, and TTLs.
*   **Production Offline-First Sync**: Frontline ASHA workers register pregnancies and child growth in zero-signal zones. Computes risk and growth classification instantly using client-side clinical heuristics. Queues entries inside an **IndexedDB transactional queue**, auto-syncing to PostgreSQL and logging sync performance to DynamoDB when a signal is found.
*   **Robust ML Triage Ensemble**: **SymptomNet** Deep Learning MLP with multilingual Transformer embeddings (`paraphrase-multilingual-MiniLM-L12-v2`) + **Random Forest Fallback** + deterministic ASHA-grounded **Clinical Heuristic Fallback** (zero-hallucination, 7 languages).
*   **Grounded RAG with Memory**: **Sakhi RAG** features **243 clinical chunks** (2-sentence overlap), a threshold **calibrated to 0.45** via grid search ($F_1=1.00$), and dual-track conversation memory.
*   **Autonomous Outbreak Radar**: Background agent (`OutbreakAgent`) runs every 30 minutes, analyzing clinical trends via Groq Llama-3.3-70B, preventing duplicate alerts via DynamoDB deduplication, and streaming live telemetry updates via SSE.

---

## 🚀 Production Infrastructure Upgrades (V1 vs. V2)

| Architectural Core | Legacy MVP Concept | V2 Production Architecture Stack |
| :--- | :--- | :--- |
| **Hybrid Diagnostic Engine (DL + ML)** | Basic Random Forest (RF) keyword engine (~88% accuracy). | Integrated **SymptomNet** (Deep Learning model using `paraphrase-multilingual-MiniLM-L12-v2` embeddings) with a **Random Forest fallback** and a safety **Heuristic Gate**. Test accuracy is **64.6%** (SymptomNet) and **51.8%** (RF Fallback) across 101 classes. |
| **Sakhi RAG (Retrieval-Augmented)** | Generic LLM chatbot (prone to hallucinations). 35 inline knowledge chunks, no memory. | **Grounded RAG system** with **243 knowledge chunks** (2-sentence overlap), calibrated threshold of **0.45** (F1=1.00), and full dual-track **conversation memory**. |
| **Hardened Offline-First Sync** | Basic local storage (required active connection). | **Offline Login** via pre-seeded credential hashes in zero-signal zones + local **Maternal & Child Assessment** caching inside an IndexedDB transactional sync queue with visual status indicators. |
| **Edge Image Compression** | Standard high-resolution uploads. | Integrated browser-side image compression on skin photo uploads. Automatically reduces high-res images (5MB+) down to `< 200KB` on-the-fly to guarantee successful uploads over 2G/3G connections. |
| **Agentic Outbreak Radar** | Manual outbreak reporting. | Autonomous agent scans village clinical data every 30 minutes, detects symptom clusters, and triggers live SSE alerts to Admins and local ASHA workers. |
| **API Resilience** | Standard API requests without failover. | Groq LLM client wrapped in 3-attempt exponential backoff retry loop (1s, 2s, 4s delays) with automatic failover to local WHO/ASHA knowledge base during API blackouts. |

---

## 🗄️ AWS Database Architecture — Deliberate Design Decisions

Most hackathon projects put all data into a single database. SwasthAI Guardian is architected like a real-world enterprise healthcare system:

| Feature | Amazon Aurora PostgreSQL | Amazon DynamoDB |
|---|---|---|
| **Role** | ACID compliance for medical records | Millisecond write latency for telemetry |
| **Rationale** | A corrupted pregnancy record could cost a life | A disease cluster must be written in <10ms regardless of concurrent village load |
| **Data Stored** | Users, symptoms, pregnancies, ambulances, schemes | Outbreaks, sync queues, village heartbeats, emergencies |
| **Access Pattern** | Transactional reads/writes, joins, aggregations | Append-only high-throughput streams, time-series |

```
ASHA Worker (offline zone)
  → IndexedDB Write Queue (browser)
  → Reconnect Trigger (auto-replay)
  → Aurora PostgreSQL (relational vitals) + DynamoDB (sync_restored telemetry log)
```

---

## 🔬 Judge API Access & Demo Credentials

```bash
# Full stack detailed status (AWS connections, DynamoDB schemas, AI modules)
GET https://swasthai-guardian.onrender.com/api/health/detailed

# Live application URL
https://swasthai-guardian.onrender.com

# Demo credentials: OTP mode → Enter any phone → OTP: 1234
# Roles (selectable on login): Villager (default) | NGO | Admin
```

---

<details>
<summary><b>🛠️ Click to Expand: Complete Database Schema & DynamoDB Table Design</b></summary>

### DynamoDB Table Design (Composite Keys + GSIs)

```
Table: outbreak_telemetry
  PK: villageId (HASH) + detectedAt (RANGE)   ← time-range queries per village
  GSI: disease-index → disease + detectedAt   ← cross-village disease queries

Table: sync_queues
  PK: deviceId (HASH) + queuedAt (RANGE)      ← all pending records per device
  GSI: status-index → status + queuedAt       ← fleet-level "all failed syncs"

Table: village_node_state
  PK: villageId (HASH)                        ← single-item heartbeat state
  TTL: expiresAt                              ← auto-expire stale nodes after 7 days

Table: emergency_streams
  PK: districtId (HASH) + streamId (RANGE)   ← all emergencies in a district
  GSI: priority-index → priority + streamId  ← critical-only filter
```

### DynamoDB Production Hardening (5 Fixes Applied)

| Fix | Before | After |
|---|---|---|
| **Scan → Query** | `scan('outbreak_telemetry')` — O(table-size) | `queryRecentAll()` with FilterExpression + `queryByVillage()` KeyCondition |
| **Dynamic districtId** | Hardcoded `'district_main'` | `getDistrictId(db, villageId)` — looks up real district from PostgreSQL |
| **Atomic UpdateCommand** | Full `PutCommand` (race condition risk) | `UpdateCommand` patches only 4 owned fields — upsert-safe |
| **GSI Validation** | Assumed GSIs existed on table presence | `DescribeTableCommand` + compares actual vs required GSI names at startup |
| **Idempotent TTL** | `setTimeout(() => UpdateTimeToLive(), 5000)` | `ensureTTL()` called directly; checks `ENABLED\|ENABLING` before setting |

### Aurora PostgreSQL Tables
- `users` — ASHA/NGO/Admin registry with `aadhaar_hash`, `caste`, `economic_status` for scheme eligibility
- `village_health` — symptom submissions with outbreak detection metadata
- `maternal_health` — pregnancy vitals with WHO risk classification
- `malnutrition_cases` — child Z-score / BMI records
- `government_schemes` — PM-JAY, JSY, PMMVY, RBSK, PMSBY with eligibility JSON
- `ambulance_requests` — SOS dispatch records with GPS coordinates
</details>

<details>
<summary><b>🔬 Click to Expand: AI Model Specifications & RAG Evaluation</b></summary>

### Hybrid Diagnostic Triage Specifications

| Metric | Specification |
|---|---|
| **Deep Model** | **SymptomNet** (3-layer MLP PyTorch Neural Network) |
| **Embeddings** | `paraphrase-multilingual-MiniLM-L12-v2` |
| **Dataset Size** | 52,900 high-quality samples (7 regional languages) |
| **Evaluation Method** | 5-Fold Stratified CV + 15% independent hold-out |
| **Hold-out Accuracy** | **64.6%** (SymptomNet) \| **51.8%** (RF Fallback) |
| **Language Range** | English, Hindi, Hinglish, Marathi, Tamil, Telugu, Bengali |

**Safety Guardrails**: Neural Threshold (**0.70**) · RF Threshold (**0.40**) · `is_uncertain` flag · **Clinical Heuristic Fallback** (7-language rule engine, zero-hallucination, ASHA-grounded advice)

### 🧪 Model Evaluation Methodology & Validation

Both models are validated under a rigorous, two-stage clinical evaluation framework:

- **Stage 1 — 5-Fold Stratified Cross-Validation**:
  - Dataset split across 5 folds with `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` — every class appears in every fold's validation set.
  - Multilingual embeddings are pre-computed once; only the MLP trains 5× (fold results logged to `deep_model_accuracy.txt` on every run).
  - Random Forest pipeline is re-fit per fold via `cross_val_score`.
  - CV scores reported as **mean ± std** across all 5 folds.

- **Stage 2 — Independent Hold-Out Test**:
  - A completely unseen 15% slice (~7,935 samples) used for final benchmark.
  - **SymptomNet**: **64.6% hold-out accuracy** (random baseline ~1% across 101 classes).
  - **Random Forest Fallback**: **51.8% hold-out accuracy**.
  - Full per-class reports saved to `deep_model_accuracy.txt` and `model_accuracy.txt`.

### 🧠 Sakhi RAG Engine Architecture

```
User query (any language)
       ↓
Cosine similarity against 243 knowledge chunks using NumPy
    Calibrated threshold: 0.45 (Precision=1.00, Recall=1.00, F1=1.00)
    Chunks organized with 2-sentence sliding-window overlap
       ↓
Top-3 chunks selected from 15+ clinical categories (WHO, MoHFW, FOGSI, UNICEF, etc.)
       ↓
Conversation history injected (last 6 turns from localStorage or session Cache)
       ↓
Groq Llama-3.3-70b-versatile
    ├── Success → Structured answer with citation + urgency badge
    └── Jitter / Outage → Exponential retry & fallback to top-1 KB chunk (never fails silent)
```
</details>

<details>
<summary><b>📂 Click to Expand: Codebase Repository Structure</b></summary>

```
SwasthAI-Guardian-Platform/
├── frontend/                     # React + Vite PWA
│   └── src/
│       ├── App.jsx               # Router + ConsentGate (DISHA modal)
│       ├── index.css             # Design system + mobile optimizations
│       ├── Admin/                # AdminDashboard.jsx
│       ├── NGO/                  # NGODashboard.jsx
│       ├── Villager/             # VillagerDashboard.jsx
│       ├── pages/                # Feature pages (13 active routes)
│       │   ├── SymptomCheckerPage.jsx
│       │   ├── SkinDiseaseCheckerPage.jsx
│       │   ├── AmbulancePage.jsx
│       │   ├── MenstrualHealth.jsx   ← Sakhi RAG + Voice I/O
│       │   ├── MaternalHealthPage.jsx ← Real vitals sliders
│       │   ├── ChildNutritionPage.jsx
│       │   └── LoginPage.jsx
│       ├── components/
│       │   ├── OfflineToast.jsx      ← YouTube-style offline banner
│       │   └── DiSHAConsentModal.jsx ← DISHA 2023 consent gate
│       ├── context/
│       │   ├── AuthContext.jsx       ← JWT + bcrypt auth
│       │   └── LanguageContext.jsx   ← 7-language i18n
│       └── services/
│           └── api.js                ← 8s timeout + error interceptor
│
├── backend/
│   ├── server.js                 # Express server, SQLite schema with auto-migration
│   ├── dynamodb.js               # DynamoDB client queries, updates & TTL validations
│   ├── eventDispatcher.js        # Event bus routing sync & emergency logs to DynamoDB
│   ├── db/
│   │   ├── schema.js             # PostgreSQL + SQLite schemas
│   │   └── seed.js               # Seed scripts with coordinates
│   └── routes/
│       ├── admin.js              # Admin endpoints & SSE live feed
│       ├── villager.js           # Villager endpoints, ambulance logs
│       └── ngo.js                # NGO pregnancy & child vitals endpoints
│
├── ai-service/
│   ├── main.py                   # FastAPI Hybrid Diagnostic Hub
│   ├── model_def.py              # SymptomNet PyTorch MLP definition
│   ├── deep_disease_model.pkl    # Trained PyTorch state & label encoders
│   ├── disease_model.pkl         # Trained Random Forest model
│   ├── rag_service.py            # Sakhi RAG service
│   ├── health_kb_data.py         # 243-chunk knowledge base
│   └── calibrate_rag.py          # RAG threshold calibration script
```
</details>

<details>
<summary><b>⚙️ Click to Expand: Complete Setup & Installation Guide</b></summary>

### Docker Deployment (Recommended)

```bash
# 1. Copy the env template and fill in your secrets
cp .env.example .env

# 2. Launch all 3 services with health-checked startup ordering
docker-compose up --build
```

| URL | Service |
|---|---|
| `http://localhost` | React Frontend (Nginx) |
| `http://localhost:5000` | Node.js Backend API |
| `http://localhost:8000` | FastAPI AI Microservice |

### Local Manual Setup

#### 1. AI Service
```bash
cd ai-service
pip install -r requirements.txt
python train_disease_model.py        # trains Random Forest fallback
python train_deep_model.py           # trains Deep Learning engine (requires ~500MB RAM)
python calibrate_rag.py              # calibrates RAG threshold (writes rag_config.py)
uvicorn main:app --reload --port 8000
```

#### 2. Backend API
```bash
cd backend
cp .env.example .env                 # set GROQ_API_KEY, JWT_SECRET, ALLOWED_ORIGINS
npm install
npm run dev                          # starts on port 5000
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev                          # opens http://localhost:5173
```
</details>

---

## 🎨 Feature Breakdown & Security

### 👨‍🌾 Villager Dashboard
*   **Symptom Checker**: Semantic voice input + hybrid ML (SymptomNet) with low-confidence failover to deterministic, offline clinical heuristics.
*   **Sakhi — Women's Health RAG**: Multilingual chat with dual-track memory, auto-speaks emergencies, and cites clinical sources.
*   **Skin Disease Checker**: Client-side canvas pixel assessment, image compression, and downloadable text reports.
*   **Emergency SOS**: Single-tap GPS coordinates dispatch, offline fallback numbers, and DynamoDB log routing.

### 🏥 NGO / ASHA Dashboard
*   **Maternal Health Tracker**: Interactive sliders for vitals mapping, instant MoHFW risk banner for high-BP, and auto-computed danger codes.
*   **Child Nutrition Monitor**: WHO Z-score calculations mapping SAM/MAM indicators.
*   **Offline Sync Queue**: Persists registrations to IndexedDB in zero-signal zones and replays requests automatically on reconnection.

### 🔐 Security & Privacy
*   **DISHA 2023 Consent Gate**: Bilingual consent modal mapping data-privacy requirements for healthcare storage.
*   **Security Audit Logs**: Express middleware logging reads/writes of sensitive data.
*   **Role-Based Access Control**: Strict routing filters protecting admin, NGO, and villager boundaries.

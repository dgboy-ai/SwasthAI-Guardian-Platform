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

---

> [!IMPORTANT]
> ### 📖 Technical Documentation & Codebase Index
> Jump directly to the detailed architecture logs, code reference maps, and setup guides:
> 
> *   **🗄️ AWS Database Designs**: [docs/database_architecture.md](docs/database_architecture.md) — Aurora schema, DynamoDB GSI tables, and query hardening models.
> *   **🔬 AI Architecture & Val**: [docs/ai_architecture.md](docs/ai_architecture.md) — PyTorch SymptomNet 5-Fold Stratified CV logs, metrics, and Sakhi RAG parameters.
> *   **⚙️ Setup & Dev Manual**: [docs/setup_guide.md](docs/setup_guide.md) — Docker Compose environments, env setups, and local dev guides.
> *   **📁 Complete Repository Map**: Check the [Repository Directory Map](#-repository-structure) below for file references.

---

### What changed after the submission period started (May 27, 2026):
> *Required disclosure under the "New & Existing Projects" rule*

- ✅ **AWS Aurora PostgreSQL** wired as primary database (replaced SQLite-only baseline)
- ✅ **Amazon DynamoDB** schema redesigned with composite keys + GSIs + TTL (4 tables)
- ✅ **OutbreakAgent** refactored: eliminated local SQLite storage, now writes to DynamoDB via backend
- ✅ **SSE live feed** (`/api/admin/live-feed`) — admin dashboard gets real-time ambulance/outbreak pushes
- ✅ **Ambulance handler** now writes to DynamoDB `emergency_streams` table on every dispatch
- ✅ **`/api/health/detailed`** added — shows full AWS connection state, DynamoDB schema, AI modules
- ✅ **CORS** updated to allow `*.vercel.app` domain automatically
- ✅ **`vercel.json`** upgraded with security headers (X-Frame-Options, XSS protection, asset caching)
- ✅ **`DEPLOYMENT.md`** created — shows district health officers how to deploy in under 2 hours
- ✅ **DynamoDB hardening** — Scan→Query optimization, atomic UpdateCommand, GSI validation, idempotent TTL
- ✅ **Sakhi RAG expanded** — 35 → **243 knowledge chunks** with 2-sentence sliding-window overlap
- ✅ **RAG threshold calibrated** — grid-searched 50 queries; optimal threshold **0.45** (F1=1.00)
- ✅ **Model cache** — `SENTENCE_TRANSFORMERS_HOME` persisted to `.model_cache/` (no ~400MB re-download)
- ✅ **Conversation memory** — Sakhi now remembers context across turns (dual-track: frontend history + server session cache)
- ✅ **Resilient Event Dispatcher** — Added database null-guards, automated 3-attempt retries for telemetry writes, and sanitized partition keys for emergencies.
- ✅ **Secure & Idempotent Seeding** — Blocked demo seeds in production environment (`NODE_ENV === 'production'`), added `ON CONFLICT DO NOTHING` / `INSERT OR IGNORE` idempotency, structured database sequence order, and dynamically resolved foreign keys.
- ✅ **RAM Optimization & Compatibility** — Configured lazy imports of `torch` and `sentence_transformers` (saving ~400MB RAM when deep model is disabled), resolved Windows unicode console crashes, and added backward-compatible conditional `BatchNorm1d` support to the MLP structure.
- ✅ **Inclusive Skin Analysis CV Triage** — Replaced rigid RGB rules with a tone-inclusive HSV skin detector (supporting melanin-rich skin down to 5% brightness), upgraded saturation analysis via NumPy vectorization, and expanded output to 5 ISIC-aligned dermatological classifications.
- ✅ **ASHA-to-PHC Referral Outcomes** — Integrated closed-loop tracking fields (`outcome`, `outcome_details`, `closed_at`) to monitor patient health outcomes.
- ✅ **Mission Indradhanush Immunization** — Created a vaccine scheduling and status tracking system (`vaccination_records`) for child immunization.
- ✅ **ASHA Performance Dashboard** — Exposed aggregated KPIs (completed referrals, pregnancies, vaccinations, emergency alerts) per worker for CMO district metrics.
- ✅ **Security Audit Logging** — Built audit logging middleware (`backend/middleware/audit.js`) to capture and audit access/updates on sensitive endpoints.
- ✅ **District Config Settings** — Added district-level configuration tables (`district_config`) allowing custom thresholds, contact numbers, and automation parameters.
- ✅ **SQLite Auto-Migrations** — Implemented dynamic schema check and table alterations in SQLite initialization to allow smooth developer reboots without data loss.
- ✅ **Mental Health PHQ-2 Screener** — Integrated a Patient Health Questionnaire-2 mental health triage system that auto-creates urgent ASHA referrals.
- ✅ **Passwordless QR-Code Login** — Enabled quick aadhaar/village-card QR scanning for passwordless villager login in low-connectivity zones.
- ✅ **Offline Sync-Health Logger** — Adds `POST /api/villager/sync-health` to track and write offline sync delays and telemetry to DynamoDB.

---

## 🚀 Production Infrastructure Upgrades (V1 vs. V2)

| Architectural Core | Legacy Concept | Production Architecture Stack |
| :--- | :--- | :--- |
| **Hybrid Diagnostic Engine (DL + ML)** | Basic Random Forest (RF) keyword engine (~88% accuracy). | Integrated **SymptomNet** (Deep Learning model using Transformer embeddings) with a **Random Forest fallback** for robust verification. Test accuracy is **64.6%** (SymptomNet) \| **51.8%** (RF Fallback) across 101 classes. |
| **Sakhi RAG (Retrieval-Augmented)** | Generic LLM chatbot (prone to hallucinations). 35 inline knowledge chunks, no memory. | **Grounded RAG system** with **243 knowledge chunks** (2-sentence overlap), calibrated threshold **0.45** (F1=1.00), and full conversation memory. |
| **Hardened Offline-First Sync** | Basic local storage (required active connection). | **Offline Login** via pre-seeded credential hashes + local **Maternal & Child Assessment** caching inside an IndexedDB transactional sync queue. |
| **Edge Image Compression** | Standard high-resolution uploads. | On-device `browser-image-compression` automatically reduces high-res images (5MB+) down to `< 200KB` on-the-fly to guarantee uploads over spotty connections. |
| **Agentic Outbreak Radar** | Manual outbreak reporting. | Autonomous background agent scans village clinical data every 30 minutes, detects symptom clusters, and triggers live SSE alerts to Admins and local ASHA workers. |
| **API Resilience** | Standard API requests without failover. | Groq LLM client wrapped in 3-attempt exponential backoff retry loop (1s, 2s, 4s delays) with automatic failover to local WHO/ASHA knowledge base during API blackouts. |

---

## 🏆 Why SwasthAI Is Architecturally Different

Most health apps call a third-party AI API and display the result. SwasthAI **owns its intelligence**, operates without a stable internet connection, and utilizes a robust, dual-database production-ready architecture:

1. **Dual-Database Strategy**: Transactional records mapped to **Amazon Aurora PostgreSQL** (ACID compliant) & high-velocity telemetry logs routed to **Amazon DynamoDB** (high-throughput NoSQL).
2. **Autonomous Agentic Outbreak Monitor**: scans clinical trends in PostgreSQL, uses LLM (Groq Llama-3.3-70B) reasoning to identify genuine clusters, writes to DynamoDB, and dispatches live EventSource notifications.
3. **Fully Production Offline-First Sync Queue**: Patient vitals are collected offline, queued in IndexedDB, and auto-synchronized to PostgreSQL (updating relational health state) and DynamoDB (telemetry logs) when connection returns.
4. **Sakhi RAG — Grounded & Memory-Aware**: 243 clinical chunks, 2-sentence overlap, calibrated threshold 0.45, and dual-track conversation memory.

---

## 🌐 Language Support & Mobile Optimizations

*   **7 Languages**: English, Hindi, Hinglish, Marathi, Tamil, Telugu, and Bengali switchable on-the-fly.
*   **Low-spec Mobile Optimization**: Built for ₹3,000–₹7,000 Android phones:
    *   `touch-action: manipulation` eliminates tap delays.
    *   `@media (prefers-reduced-motion: reduce)` disables animations.
    *   WCAG tap targets (minimum 44×44px).
    *   8-second Axios request timeout.

---

## 🔬 Judge API Access & Demo Credentials

```bash
# Full stack status (AWS connections, DynamoDB schema, AI modules)
GET https://swasthai-guardian.onrender.com/api/health/detailed

# Live application URL
https://swasthai-guardian.onrender.com

# Demo credentials: OTP mode → Enter any phone → OTP: 1234
# Roles (selectable on login): Villager (default) | NGO | Admin
```

---

## 📁 Repository Structure

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
│   ├── calibrate_rag.py          # RAG threshold calibration script
│   ├── outbreak_agent.py         # Autonomous 30-min epidemic scanner
│   ├── skin_analyzer.py          # On-device PIL pixel analysis
│   ├── train_deep_model.py       # Neural network training script
│   ├── train_disease_model.py    # RF model training script (800+ samples)
│   ├── test_guardrail.py         # Safety validation suite
│   ├── test_rural.py             # Rural stress testing script
│   └── requirements.txt
│
├── infra/
│   └── dynamodb-tables.md        # DynamoDB table schema reference
│
└── README.md
```

---

## 📜 Compliance & Standards

| Standard | Implementation |
|---|---|
| **DISHA 2023** | Digital Information Security in Healthcare Act — consent modal |
| **IT Act 2008** | Sensitive Personal Data Rules — JWT + role-based access |
| **WHO Guidelines** | Maternal, reproductive, malnutrition — cited in 243 RAG chunks |
| **MoHFW Protocols** | ASHA training modules — integrated into Sakhi knowledge base |
| **WCAG 2.5.5** | 44×44px minimum tap targets for accessibility |
| **NHM India** | National Health Mission protocols for menstrual hygiene and child nutrition |
| **FOGSI** | Reproductive health clinical protocols for PCOS, AUB, dysmenorrhoea |
| **NVBDCP / NTEP** | Vector-borne + TB disease management protocols in RAG knowledge base |

---

> *SwasthAI Guardian — Built for Bharat's villages, not just its cities.*
> *"We didn't build AI for doctors. We built it for the 600,000 villages that don't have one."*

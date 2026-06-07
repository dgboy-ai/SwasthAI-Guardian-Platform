# SwasthAI Guardian 🌿
### Offline-First Healthcare Infrastructure for Low-Connectivity Environments

### 🌐 [Live Demo](https://swasthai-guardian.onrender.com) | 🏆 [H0 Hackathon Submission](https://h01.devpost.com) | 📋 [Deployment Guide](DEPLOYMENT.md)

---

## 🏆 H0 Hackathon — Track 2: Monetizable B2B App (Healthcare)

SwasthAI is framed as a B2B district operations platform: the buyer is a district health office, NGO network, or public-health command center that needs ASHA workload visibility, outbreak proof, monthly CMO reporting, and auditable AWS-backed data flows.
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
> *   **🏗️ System & Database Designs**: [docs/system_architecture.md](docs/system_architecture.md) — End-to-end data flows, Mermaid ERD (Aurora PostgreSQL), DynamoDB composite key schemas, GSIs, access patterns, and local SQLite fallback details.
> *   **🔬 AI Architecture & Val**: [docs/ai_architecture.md](docs/ai_architecture.md) — PyTorch SymptomNet 5-Fold Stratified CV logs, metrics, and Sakhi RAG parameters.
> *   **⚙️ Setup & Dev Manual**: [docs/setup_guide.md](docs/setup_guide.md) — Docker Compose environments, env setups, and local dev guides.
> *   **📁 Complete Repository Map**: Check the [Repository Directory Map](#-repository-structure) below for file references.
> *   **📈 Build Changelog**: [CHANGELOG.md](CHANGELOG.md) — Chronological log of features, optimizations, and validations built during the hackathon.

---

### What changed after the submission period started (May 27, 2026):
> *Required disclosure under the "New & Existing Projects" rule*

**Core architectural additions (the big ones):**
- ✅ **AWS Aurora PostgreSQL** wired as the primary production database (replaced SQLite-only baseline)
- ✅ **Amazon DynamoDB** schema redesigned with composite keys, GSIs, and TTL across 4 tables
- ✅ **OutbreakAgent** refactored: now writes outbreak data to DynamoDB via backend API (no local SQLite)
- ✅ **SSE live feed** (`/api/admin/live-feed`) — admin dashboard receives real-time ambulance and outbreak alerts
- ✅ **Sakhi RAG expanded** — 35 → **243 knowledge chunks** with 2-sentence sliding-window overlap; threshold calibrated to **0.45** (F1=1.00)
- ✅ **Conversation memory** — Sakhi remembers context across turns (dual-track: frontend `localStorage` + server session cache)
- ✅ **Inclusive Skin Triage** — Replaced rigid RGB pixel rules with a tone-inclusive HSV skin detector that supports melanin-rich skin; output expanded to 5 ISIC-aligned dermatological classifications
- ✅ **Mental Health PHQ-2 Screener** — Patient Health Questionnaire-2 triage that auto-creates urgent ASHA referrals
- ✅ **Mission Indradhanush Immunization** — Vaccine scheduling and status tracking (`vaccination_records`) for India's child immunization program
- ✅ **Passwordless QR-Code Login** — Aadhaar/village-card QR scanning for quick villager login in zero-connectivity zones

<details>
<summary>📋 Full technical hardening log (15 more items)</summary>

- ✅ **Ambulance handler** now writes every SOS dispatch to DynamoDB `emergency_streams` table
- ✅ **`/api/health/detailed`** — exposes full AWS connection state, DynamoDB schema status, and AI module readiness
- ✅ **Admin Production Evidence panel** — shows Aurora/DynamoDB status, region, table names, pool counts, production readiness, and latest telemetry writes directly in the UI
- ✅ **Judge/demo auth labeling** — demo credentials remain usable for evaluation, while production auth is documented as backend OTP/password verification with issued tokens; the production replacement path is encrypted device credential cache or WebAuthn/device-bound refresh tokens
- ✅ **CORS** updated to auto-allow all `*.vercel.app` origins
- ✅ **`vercel.json`** upgraded with security headers (X-Frame-Options, XSS protection, asset caching)
- ✅ **`DEPLOYMENT.md`** created — district health officers can self-deploy in under 2 hours
- ✅ **DynamoDB hardening** — district/time `Query` access for command-center outbreak proof, atomic `UpdateCommand`, GSI validation at startup, idempotent TTL handling
- ✅ **Model cache** — `SENTENCE_TRANSFORMERS_HOME` pinned to `.model_cache/` so the 400MB transformer model is never re-downloaded on restart
- ✅ **Resilient Event Dispatcher** — database null-guards, 3-attempt retries for telemetry writes, sanitized DynamoDB partition keys
- ✅ **Secure & Idempotent Seeding** — demo seeds blocked in production (`NODE_ENV === 'production'`); `ON CONFLICT DO NOTHING` idempotency; foreign keys dynamically resolved
- ✅ **RAM Optimization** — lazy `torch` / `sentence_transformers` imports save ~400MB RAM when deep model is disabled; backward-compatible `BatchNorm1d` for older PyTorch
- ✅ **ASHA-to-PHC Referral Outcomes** — closed-loop tracking (`outcome`, `outcome_details`, `closed_at`) so every referral has a follow-up
- ✅ **ASHA Performance Dashboard** — aggregated KPIs (referrals, pregnancies, vaccinations, emergency alerts) per worker for CMO district reporting
- ✅ **Security Audit Logging** — `backend/middleware/audit.js` captures all reads/writes on sensitive endpoints
- ✅ **District Config Settings** — `district_config` table allows district-level custom thresholds and emergency contact numbers
- ✅ **SQLite Auto-Migrations** — dynamic `ALTER TABLE` checks on startup; zero data loss on developer reboots
- ✅ **Offline Sync-Health Logger** — `POST /api/villager/sync-health` records offline sync delays to DynamoDB telemetry

</details>

---

## 🚀 Production Infrastructure Upgrades (Initial Baseline vs. Current Upgrades)

| Architectural Core | Pre-Submission Baseline | Production Upgrades |
| :--- | :--- | :--- |
| **Hybrid Diagnostic Engine (DL + ML)** | Simple Random Forest on a 50-class, English-only dataset (~88% accuracy on that simpler task). | **SymptomNet** (Transformer-based Deep Learning) + Random Forest fallback — evaluated on **101 disease classes** across 7 languages. Hold-out accuracy: **64.6%** (SymptomNet) \| **51.8%** (RF). For context, random chance across 101 classes = ~1%. |
| **Sakhi RAG (Retrieval-Augmented)** | Generic LLM chatbot prone to hallucinations. 35 inline knowledge chunks, no memory across turns. | **Grounded RAG system** with **243 clinical knowledge chunks** (2-sentence sliding-window overlap), calibrated retrieval threshold **0.45** (F1=1.00), and full 6-turn conversation memory. |
| **Hardened Offline-First Sync** | Basic local storage that required an active internet connection to function. | **Judge/demo Offline Login** via pre-seeded credential hashes + **Maternal & Child Assessment** caching inside an IndexedDB transactional sync queue. Production path: encrypted device credential cache or WebAuthn/device-bound refresh token. |
| **Edge Image Compression** | Standard high-resolution uploads that failed on slow connections. | On-device `browser-image-compression` shrinks images from 5MB+ down to **< 200KB automatically**, making skin scan uploads viable over 2G/EDGE networks. |
| **Agentic Outbreak Radar** | Manual reporting — a health worker had to notice and file a report. | Autonomous background agent scans village clinical data **every 30 minutes**, clusters symptoms using Groq LLM reasoning, and pushes real-time SSE alerts to admins and ASHA workers. |
| **API Resilience** | No failover — an LLM outage meant a broken experience. | Groq client wrapped in a **3-attempt exponential backoff loop** (1s → 2s → 4s). On full outage: falls back silently to WHO/ASHA knowledge base — never fails the user. |

---

## 🏆 Why SwasthAI Is Architecturally Different

Most health apps call a third-party AI API and display the result. SwasthAI **owns its intelligence**, operates without a stable internet connection, and utilizes a robust, dual-database production-ready architecture:

1. **Dual-Database Strategy**: Transactional records mapped to **Amazon Aurora PostgreSQL** (ACID compliant) & high-velocity telemetry logs routed to **Amazon DynamoDB** (high-throughput NoSQL).
2. **Autonomous Agentic Outbreak Monitor**: scans clinical trends in PostgreSQL, uses LLM (Groq Llama-3.3-70B) reasoning to identify genuine clusters, writes to DynamoDB, and dispatches live EventSource notifications.
3. **Fully Production Offline-First Sync Queue**: Patient vitals are collected offline, queued in IndexedDB, and auto-synchronized to PostgreSQL (updating relational health state) and DynamoDB (telemetry logs) when connection returns.
4. **Sakhi RAG — Grounded & Memory-Aware**: 243 clinical chunks, 2-sentence overlap, calibrated threshold 0.45, and dual-track conversation memory.

---

## 🌐 Language Support & Mobile Optimizations

*   **7 Languages**: English, Hindi, Hinglish, Marathi, Tamil, Telugu, and Bengali — switchable on-the-fly without a page reload.
*   **Low-spec Mobile Optimization**: Purpose-built for the ₹3,000–₹7,000 Android phones used in rural India:
    *   Tap delays eliminated so the UI feels instant, even on older hardware.
    *   Animations auto-disabled for users who have reduced-motion accessibility enabled.
    *   All interactive buttons meet WCAG 2.5.5 minimum touch target size (44×44px).
    *   All API calls cap at 8 seconds — preventing indefinite loading spinners on slow connections.

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

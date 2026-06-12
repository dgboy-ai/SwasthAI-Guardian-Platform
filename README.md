# SwasthAI Guardian 🌿
### Offline-First Healthcare Infrastructure for Low-Connectivity Environments

### 🌐 [Live Demo](https://swasthai-guardian-platform.onrender.com) | 📋 [Deployment Guide](DEPLOYMENT.md)


---

## 🌿 Executive Overview

SwasthAI Guardian is a production-grade, offline-first B2B operations and epidemiologic intelligence platform built for rural public health networks. It bridges the gap between remote, disconnected frontline health workers (ASHA) and district command centers. By transforming low-connectivity clinical logs into real-time, auditable telemetry streams, the platform replaces slow paper-based tracking, automates infectious outbreak forecasting, and ensures closed-loop emergency dispatches.

---

## ⚡ Core Technical Pillars

* **Durable Offline-First Sync**: Backed by a browser-side transactional IndexedDB sync queue. Clinical logs and patient vitals are collected offline and replayed automatically once a connection is detected, using Last-Write-Wins (LWW) resolution and batch idempotency to prevent duplication.
* **Decoupled Cloud Architecture**: Implements a deliberate database allocation strategy. Relational operations (users, medical records, referrals) are committed to **Amazon Aurora PostgreSQL** for ACID compliance, while time-series metrics and event logs (outbreak alerts, dispatches, sync trails) are routed through **Amazon DynamoDB** for high-throughput scaling.
* **Hybrid Edge-to-Cloud AI**: Combines local, browser-side neural classification (SymptomNet compiled to ONNX) and offline fuzzy guidelines retrieval with a centralized FastAPI service running autonomous spatial outbreak clustering and clinical Sakhi RAG.

---

## 👥 Operational Stakeholders

* **Frontline ASHA Workers**: Access mobile-first, low-latency vital assessments, child immunization trackers, and emergency SOS triggers fully offline.
* **District Command Centers (CMO)**: Monitor Varanasi-aligned live epidemiologic risk heatmaps, receive autonomous outbreak warnings, and generate compliance reports.
* **NGOs & Sponsors**: Evaluate performance analytics, vaccination completions, and closed-loop referral outcomes on real-time B2B dashboards.

---

## 🛠️ Infrastructure Overview

| Component | Technology | Role & Deployment |
| :--- | :--- | :--- |
| **Relational Database** | Amazon Aurora PostgreSQL | Relational system of record (ACID), ap-south-1 |
| **NoSQL Telemetry** | Amazon DynamoDB | Time-series event logging & telemetry, ap-south-1 |
| **Frontend Platform** | Vercel | Vite-based Progressive Web App (PWA) |
| **AI Microservices** | FastAPI (Python) + Render | SymptomNet MLP, Sakhi RAG, & Outbreak Agent |

---

## 📖 Technical Documentation & Codebase Index

Jump directly into the detailed architecture logs, code reference maps, and setup guides below:

| Technical Guide | Focus & Key Highlights | Quick Link |
| :--- | :--- | :--- |
| **🏗️ System & Database Designs** | End-to-end data flows, database ERDs, DynamoDB composite key schemas, GSIs, access patterns, and SQLite fallbacks. | **[View System Arch ↗](docs/system_architecture.md)** |
| **🔬 AI Architecture & Val** | SymptomNet 5-Fold Stratified CV, RAG calibration parameters, and ISIC skin triage. | **[View AI Arch ↗](docs/ai_architecture.md)** |
| **🔌 Offline Sync Strategy** | IndexedDB queue replay, idempotency keys, and Last-Write-Wins (LWW) rules. | **[View Sync Strategy ↗](docs/offline_sync_strategy.md)** |
| **📁 Complete Repository Map** | Directory-by-directory tree layout, file roles, and component descriptions. | **[View Repo Map ↗](docs/repository_map.md)** |
| **📈 Build Changelog** | Chronological log of features, optimizations, and validations built during development. | **[View Changelog ↗](CHANGELOG.md)** |
| **⚙️ Setup & Dev Manual** | Local dev environments, environment variables setup, and Docker compose guides. | **[View Setup Guide ↗](docs/setup_guide.md)** |
| **📐 Architecture Diagram** | SVG layout mapping Vercel, Aurora PostgreSQL, DynamoDB, and FastAPI. | **[View SVG Diagram ↗](docs/architecture-diagram.svg)** |

---

## 🚀 Production Infrastructure Upgrades (Initial Baseline vs. Current Upgrades)

| Architectural Core | Pre-Submission Baseline | Production Upgrades |
| :--- | :--- | :--- |
| **Hybrid Diagnostic Engine (DL + ML)** | Simple Random Forest on a 50-class, English-only dataset (~88% accuracy on that simpler task). | **SymptomNet** (Transformer-based Deep Learning) + Logistic Regression fallback — evaluated on **101 disease classes** across 7 languages. Hold-out accuracy: **64.6%** (SymptomNet) \| **71.1%** (Logistic Regression). For context, random chance across 101 classes = ~1%. *(Note: SymptomNet is disabled by default on the Render Live Demo to fit under the 512MB RAM free-tier limit, using the 71.1% Logistic Regression model. Set `ENABLE_DEEP_MODEL=true` in your `.env` to enable it locally).* |
| **Sakhi RAG (Retrieval-Augmented)** | Generic LLM chatbot prone to hallucinations. 35 inline knowledge chunks, no memory across turns. | **Grounded RAG system** with **243 clinical knowledge chunks** (2-sentence sliding-window overlap), calibrated retrieval threshold **0.45** (F1=1.00), and full 6-turn conversation memory. |
| **Hardened Offline-First Sync** | Basic local storage that required an active internet connection to function. | **Judge/demo Offline Login** via pre-seeded credential hashes (hashed securely using SHA-256 for local storage protection) + **Maternal & Child Assessment** caching inside an IndexedDB transactional sync queue. Production path: encrypted device credential cache or WebAuthn/device-bound refresh token. |
| **Edge Image Compression** | Standard high-resolution uploads that failed on slow connections. | On-device `browser-image-compression` shrinks images from 5MB+ down to **< 200KB automatically**, making skin scan uploads viable over 2G/EDGE networks. |
| **Agentic Outbreak Radar** | Manual reporting — a health worker had to notice and file a report. | Autonomous background agent scans village clinical data **every 30 minutes**, clusters symptoms using Groq LLM reasoning, and pushes real-time SSE alerts to admins and ASHA workers. |
| **API Resilience** | No failover — an LLM outage meant a broken experience. | Groq client wrapped in a **3-attempt exponential backoff loop** (1s → 2s → 4s). On full outage: falls back silently to WHO/ASHA knowledge base — never fails the user. |

---

## 🏆 Why SwasthAI Is Architecturally Different

Most health apps call a third-party AI API and display the result. SwasthAI **owns its intelligence**, operates without a stable internet connection, and utilizes a robust, dual-database production-ready architecture:

1. **Dual-Database Strategy**: Transactional records mapped to **Amazon Aurora PostgreSQL** (ACID compliant) & high-velocity telemetry logs routed to **Amazon DynamoDB** (high-throughput NoSQL). These layers are decoupled via an **Event Dispatcher** pattern that ensures non-blocking writes and includes an in-memory mock fallback to guarantee zero initial configuration for judge sandbox runs.
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
GET https://swasthai-guardian-platform.onrender.com/api/health/detailed

# Live application URL
https://swasthai-guardian-platform.onrender.com

# Demo credentials: OTP mode → Enter any phone → OTP: 1234
# Roles (selectable on login): Villager (default) | NGO | Admin
```

---

## 📁 Repository Structure

The codebase is organized into three primary modules. For a complete directory-by-directory tree and file description list, see the **[Repository Directory Map](docs/repository_map.md)**.

```
SwasthAI-Guardian-Platform/
├── frontend/                     # React + Vite PWA (13+ offline-first routes)
├── backend/                      # Express.js REST API & Event Dispatcher
├── ai-service/                   # FastAPI SymptomNet MLP, Sakhi RAG & Outbreak Agent
├── docs/                         # Technical architectures & design documentations
└── DEPLOYMENT.md                 # Cloud setup guide (Aurora + DynamoDB + Vercel)
```

---

## 📜 Compliance & Standards

| Standard | Implementation |
|---|---|
| **DISHA 2023** | Digital Information Security in Healthcare Act (India) — active consent modal gate |
| **DPDP Act 2023** | Digital Personal Data Protection Act (India) — automated backend logging PII redaction layer |
| **IT Act 2008** | Sensitive Personal Data Rules — JWT + role-based and village-scoped IDOR access controls |
| **HIPAA Aligned** | Health Insurance Portability and Accountability Act (US) — strict TLS 1.3 encryption, AWS KMS data-key encryption at rest, security audit logging, IAM least-privilege endpoints |
| **WHO Guidelines** | Maternal, reproductive, malnutrition — cited in 243 RAG chunks |
| **MoHFW Protocols** | ASHA training modules — integrated into Sakhi knowledge base |
| **WCAG 2.5.5** | 44×44px minimum tap targets for accessibility |
| **NHM India** | National Health Mission protocols for menstrual hygiene and child nutrition |
| **FOGSI** | Reproductive health clinical protocols for PCOS, AUB, dysmenorrhoea |
| **NVBDCP / NTEP** | Vector-borne + TB disease management protocols in RAG knowledge base |


---

<details>
<summary><b>🛠️ Project Feature Evolution & Architecture Hardening Log</b></summary>
<br/>

The following is a detailed log of the key architectural milestones, feature developments, and system hardening updates implemented during the development lifecycle:

### Core architectural additions (the big ones):
- **ONNX In-Browser SymptomNet & Local RAG** — Compiled the neural network to ONNX format, running fully offline in-browser diagnostic classification. Pre-seeded IndexedDB RAG database with clinical guidelines and built a fuzzy token-weighted RAG engine to power completely offline Sakhi queries.
- **Secure Offline Credentials Cache** — Replaced insecure base64 credential encoding with proper client-side SHA-256 hashing inside `AuthContext.jsx` for cached offline users.
- **Active Health Watchdog Monitor** — Added a background watchdog loop in `server.js` verifying AI service health and Outbreak Agent scans, broadcasting alerts via SSE, and displaying warning banners in the Admin Dashboard on failures.
- **AWS Aurora PostgreSQL** wired as the primary production database (replaced SQLite-only baseline)
- **Amazon DynamoDB** schema redesigned with composite keys, GSIs, and TTL across 5 tables
- **OutbreakAgent** refactored: now writes outbreak data to DynamoDB via backend API (no local SQLite)
- **SSE live feed** (`/api/admin/live-feed`) — admin dashboard receives real-time ambulance and outbreak alerts
- **Sakhi RAG expanded** — 35 → **243 knowledge chunks** with 2-sentence sliding-window overlap; threshold calibrated to **0.45** (F1=1.00)
- **Conversation memory** — Sakhi remembers context across turns (dual-track: frontend `localStorage` + server session cache)
- **Inclusive Skin Triage** — Replaced rigid RGB pixel rules with a tone-inclusive HSV skin detector that supports melanin-rich skin; output expanded to 5 ISIC-aligned dermatological classifications
- **Mental Health PHQ-2 Screener** — Patient Health Questionnaire-2 triage that auto-creates urgent ASHA referrals
- **Mission Indradhanush Immunization** — Vaccine scheduling and status tracking (`vaccination_records`) for India's child immunization program
- **Passwordless QR-Code Login** — Aadhaar/village-card QR scanning for quick villager login in zero-connectivity zones
- **Explainable AI (XAI) Pregnancy Risk Panel** — Dynamic breakdown of maternal contributor weights (blood pressure, blood sugar, etc.), trend velocity tracking, and WHO/MoHFW specific advice guidelines
- **Pediatric Skin Triage (Child Mode)** — Auto-escalation of red-flag symptoms (breathing difficulty, high fever, lethargy) directly to emergency status, soft-phrased triage categories, and child-safe safety advice (cautioning against adult steroid/cosmetic creams)
- **NGO Impact Analytics & B2B Monthly Reports** — Real-time grant-proof dashboard for NGOs/CSR partners: referral closure rates, vaccination completion rates, Risk Watchlist (high-risk pregnancies, overdue vaccinations, emergency cases), Top Performers leaderboard, and Recommended Actions engine. PDF export via browser print.
- **Predictive Village Risk Intelligence (Early Warning System — Layer 2)** — Dual-layer public health intelligence: Layer 1 (Outbreak Radar) detects active clusters; Layer 2 (new) *forecasts elevated village risk before outbreaks begin* using a weighted 4-signal engine (symptom trend growth 40%, nearby outbreak proximity 25%, NVBDCP Indian seasonal calendar 20%, referral backlog 15%). District-level heatmap for admins, XAI contributor breakdown, health category risk flags, actionable prevention checklist, and an Intervention Impact Forecast simulator showing projected risk reduction from vaccination drives, referral closure, and combined interventions.

### Full technical hardening log:
- **Decoupled Event Dispatcher with Retry** — Decoupled relational PostgreSQL writes from NoSQL telemetry, dispatching async events (e.g. `emergency_triggered`) with an automatic 3-attempt database retry loop.
- **PII Redaction Layer Fix** — Removed payload mutation checks from the frontend and consolidated all sensitive PII filters to the backend logging layer to preserve query context.
- **Unified 403 Forbidden Errors** — Standardized backend auth policy failures to return generic `Access Denied` codes, blocking leakage of user roles or village scope parameters.
- **Lazy-Loaded ONNX Assets** — Paged ONNX binaries dynamically only when a user accesses the symptom scanner offline, reducing initial bundle weight.
- **Ambulance handler** now writes every SOS dispatch to DynamoDB `emergency_streams` table
- **`/api/health/detailed`** — exposes full AWS connection state, DynamoDB schema status, and AI module readiness
- **Admin Production Evidence panel** — shows Aurora/DynamoDB status, region, table names, pool counts, production readiness, and latest telemetry writes directly in the UI
- **Judge/demo auth labeling** — demo credentials remain usable for evaluation, while production auth is documented as backend OTP/password verification with issued tokens; the production replacement path is encrypted device credential cache or WebAuthn/device-bound refresh tokens
- **CORS** updated to auto-allow all `*.vercel.app` origins
- **`vercel.json`** upgraded with security headers (X-Frame-Options, XSS protection, asset caching)
- **`DEPLOYMENT.md`** created — district health officers can self-deploy in under 2 hours
- **DynamoDB hardening** — district/time `Query` access for command-center outbreak proof, atomic `UpdateCommand`, GSI validation at startup, idempotent TTL handling
- **Model cache** — `SENTENCE_TRANSFORMERS_HOME` pinned to `.model_cache/` so the 400MB transformer model is never re-downloaded on restart
- **Resilient Event Dispatcher** — database null-guards, 3-attempt retries for telemetry writes, sanitized DynamoDB partition keys
- **Secure & Idempotent Seeding** — demo seeds blocked in production (`NODE_ENV === 'production'`); `ON CONFLICT DO NOTHING` idempotency; foreign keys dynamically resolved
- **RAM Optimization** — lazy `torch` / `sentence_transformers` imports save ~400MB RAM when deep model is disabled; backward-compatible `BatchNorm1d` for older PyTorch (Note: SymptomNet is disabled by default on Render's 512MB RAM tier to prevent OOM crashes, utilizing the 71.1% accurate Logistic Regression model instead)
- **ASHA-to-PHC Referral Outcomes** — closed-loop tracking (`outcome`, `outcome_details`, `closed_at`) so every referral has a follow-up
- **ASHA Performance Dashboard** — aggregated KPIs (referrals, pregnancies, vaccinations, emergency alerts) per worker for CMO district reporting
- **Security Audit Logging** — `backend/middleware/audit.js` captures all reads/writes on sensitive endpoints
- **District Config Settings** — `district_config` table allows district-level custom thresholds and emergency contact numbers
- **SQLite Auto-Migrations** — dynamic `ALTER TABLE` checks on startup; zero data loss on developer reboots
- **Offline Sync-Health Logger** — `POST /api/villager/sync-health` records offline sync delays to DynamoDB telemetry

</details>

---


> *SwasthAI Guardian — Built for Bharat's villages, not just its cities.*
> *"We didn't build AI for doctors. We built it for the 600,000 villages that don't have one."*

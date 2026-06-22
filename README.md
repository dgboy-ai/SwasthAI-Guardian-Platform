# SwasthAI Guardian 🌿
### Offline-First Healthcare Infrastructure for Low-Connectivity Environments

### 🌐 [Live Demo](https://swasth-ai-guardian-platform.vercel.app) | 📋 [Deployment Guide](DEPLOYMENT.md)


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
| **Hardened Offline-First Sync** | Basic local storage that required an active internet connection to function. | **Demo Offline Login** via pre-seeded credential hashes (hashed securely using SHA-256 for local storage protection) + **Maternal & Child Assessment** caching inside an IndexedDB transactional sync queue. Production path: encrypted device credential cache or WebAuthn/device-bound refresh token. |
| **Edge Image Compression** | Standard high-resolution uploads that failed on slow connections. | On-device `browser-image-compression` shrinks images from 5MB+ down to **< 200KB automatically**, making skin scan uploads viable over 2G/EDGE networks. |
| **Agentic Outbreak Radar** | Manual reporting — a health worker had to notice and file a report. | Autonomous background agent scans village clinical data **every 30 minutes**, clusters symptoms using Groq LLM reasoning, and pushes real-time SSE alerts to admins and ASHA workers. |
| **API Resilience** | No failover — an LLM outage meant a broken experience. | Groq client wrapped in a **3-attempt exponential backoff loop** (1s → 2s → 4s). On full outage: falls back silently to WHO/ASHA knowledge base — never fails the user. |

---

## 🏆 Why SwasthAI Is Architecturally Different

Most healthcare apps simply call a third-party LLM API and display the output. SwasthAI **owns its intelligence**, runs offline, and employs a production-grade dual-database architecture:

| Pillar | Core Mechanics | Production & Evaluation Value |
| :--- | :--- | :--- |
| **💾 Decoupled Dual-DB** | **Amazon Aurora PostgreSQL** (ACID Clinical Profiles) + **Amazon DynamoDB** (High-throughput Telemetry). | Decoupled via an asynchronous Event Dispatcher pattern. Features a local SQLite/mock fallback for instant, zero-config evaluations. |
| **🤖 Autonomous Agent** | Background daemon queries PostgreSQL symptom clusters to predict and classify imminent outbreaks using Groq Llama-3.3-70B. | Runs asynchronously every 30m; predicts clusters, auto-deduplicates alerts in DynamoDB, and broadcasts real-time Server-Sent Events (SSE). |
| **🔌 Offline-First Sync** | Transactional client-side **IndexedDB Sync Queue** caches patient vitals and reports during cellular outages. | Replays automatically upon reconnection. Idempotency keys and Last-Write-Wins (LWW) rules guarantee zero database duplication. |
| **🧠 Grounded RAG** | Low-latency local semantic search engine indexing 243 WHO/MoHFW clinical guideline chunks. | Calibrated threshold (0.45, F1=1.00) and a 6-turn conversation memory prevent model hallucinations. |

---

## 🌐 Language Support & Mobile Optimizations

*   **7 Languages**: English, Hindi, Hinglish, Marathi, Tamil, Telugu, and Bengali — switchable on-the-fly without a page reload.
*   **Low-spec Mobile Optimization**: Purpose-built for the ₹3,000–₹7,000 Android phones used in rural India:
    *   Tap delays eliminated so the UI feels instant, even on older hardware.
    *   Animations auto-disabled for users who have reduced-motion accessibility enabled.
    *   All interactive buttons meet WCAG 2.5.5 minimum touch target size (44×44px).
    *   All API calls cap at 8 seconds — preventing indefinite loading spinners on slow connections.

---

## 🔬 API Access & Demo Credentials

```bash
# Full stack status (AWS connections, DynamoDB schema, AI modules)
GET https://swasthai-guardian-platform.onrender.com/api/health/detailed

# Live application URL
https://swasth-ai-guardian-platform.vercel.app

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

## 🛠️ Feature Evolution & Technical Hardening

The following details the key architectural milestones, feature developments, and system hardening updates implemented during the development cycle:

### 🌟 Core Engineering Achievements

*   **📱 Edge Intelligence & Zero-Connectivity Tools**:
    *   **ONNX In-Browser SymptomNet**: Runs local PyTorch neural classification offline under 1ms.
    *   **Offline Guidelines RAG**: Local fuzzy RAG in `semanticCache.js` querying WHO/MoHFW guidelines.
    *   **Secure Offline Credentials**: SHA-256 client-side credentials hashing for local session verification.
    *   **Aadhaar QR-Code Login**: Swift passwordless login in zero-signal zones via device camera scan.

*   **🤖 Epidemic Forecasting & Real-Time Alerts**:
    *   **Predictive Early Warning System**: Forecasts village risk using symptom trend velocity, nearby clusters, and NVBDCP seasonal signals.
    *   **Intervention Simulator**: CMOs can simulate risk reductions (referral closures, vaccination drives) on heatmaps.
    *   **Autonomous Agentic Outbreak Loop**: Checks trends every 30m, dedupes via DynamoDB, and dispatches SSE.

*   **🏥 B2B Operational Dashboards**:
    *   **ASHA Workload queues**: Unified dashboard showing high-risk cases, missed vaccines, and offline sync logs.
    *   **Closed-Loop Referrals**: Outcomes, follow-ups, and closure metrics tracked to the individual patient level.
    *   **NGO Impact Analytics**: Grant-proof dashboard reporting vaccination completions and KPI analytics.

### 🔒 Core Technical Hardening Log

*   **⚡ Decoupled Event Dispatcher**: Decouples write paths with an out-of-band queue and **3-attempt database retry loop** for DynamoDB.
*   **🛡️ Production-Grade Security**:
    *   **PII Redaction**: Redacts PII in the backend logging layer to preserve query context.
    *   **Unified Auth Policy**: Standardized IDOR prevents user role or village scope leakage.
    *   **Detailed Health Endpoint**: `/api/health/detailed` and Admin Panel expose live AWS/database connection checks.
*   **⚙️ AWS Storage & Backend Optimizations**:
    *   **DynamoDB Hardening**: Startup GSI validation, atomic updates (`UpdateCommand`), and idempotent TTL handling.
    *   **Model Caching**: Pinned sentence transformer home saves ~400MB RAM when the deep model is idle.
    *   **SQLite Migration Layer**: Dynamic `ALTER TABLE` checks on startup; zero data loss on developer reboots.
    *   **Offline Sync-Health Logger**: `POST /api/villager/sync-health` records offline sync delays to DynamoDB telemetry.

---

> *SwasthAI Guardian — Built for Bharat's villages, not just its cities.*
> *"We didn't build AI for doctors. We built it for the 600,000 villages that don't have one."*

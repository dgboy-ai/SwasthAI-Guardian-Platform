# SwasthAI Guardian

### Offline-First Rural Health Platform · 3-Layer Microservice · Amazon Aurora PostgreSQL + Amazon DynamoDB

[**Live Demo**](https://swasth-ai-guardian-platform.vercel.app) · [**Deployment Guide**](DEPLOYMENT.md) · [**Architecture Diagram**](architecture_diagram.svg) · [**Judge's Guide**](docs/judge_guide.md) · [**Changelog**](CHANGELOG.md)

---

## The Problem → The Solution

| The Problem | The Solution |
|--------------|--------------|
| 600 million rural Indians with no digital health infrastructure | Offline-first PWA works in zero-signal zones, ~4MB installable, QR-shareable |
| ASHA workers manage 1,000+ families using paper registers | Real-time telemetry pipeline to Amazon Aurora PostgreSQL + DynamoDB |
| Disease outbreaks detected 2 weeks late — after the infection spreads | Autonomous AI outbreak agent scans clinical data every 30 minutes via Groq Llama-3.3-70b, pushes SSE alerts |
| Maternal deaths from high-risk BP/Hb readings that never leave a notebook | WHO protocol risk classification computed instantly in-browser, escalated via SSE to district CMO |
| Child malnutrition data sits in un-audited registers, never aggregated | Offline WHO Z-score calculator + auto-sync to Aurora for district-wide SAM/MAM tracking |
| Cloud health apps are useless in villages without internet | ONNX model runs in-browser, IndexedDB queues maternal/SOS/child records, auto-replays on reconnect |
| District medical officers have no early warning system | Predictive 5-factor village risk intelligence with per-village heatmap and XAI breakdown |

SwasthAI Guardian is an offline-first B2B health operations platform connecting villagers, ASHA workers, district CMOs, and NGO networks on a single AWS-backed intelligence layer.

**101 disease classes** · **7 Indian languages** · **600M addressable population** · **5 DynamoDB tables / 7 GSIs** · **52,900 training samples** · **Sub-10ms DynamoDB writes**

---

## Architecture

<img src="architecture_diagram.svg" alt="SwasthAI Guardian Platform Architecture" width="100%" />

---

## 3-Layer Microservice Architecture

SwasthAI Guardian is built as three independently deployable, fault-isolated services. If the AI service goes down, the backend continues serving auth, records, and ambulance requests without interruption. If the backend is unreachable, the frontend PWA continues running symptom checks, SOS queuing, and maternal/child calculations locally.

**Layer 1 — React PWA (Vercel)**
Offline-first progressive web application built with React 18, Vite, and Tailwind CSS. Runs SymptomNet ONNX inference in-browser (sub-millisecond) for zero-latency symptom triage without any network request. Caches 20+ government health schemes in localStorage with a 6-hour TTL. Queues maternal health records, child nutrition scores, ambulance SOS requests, and emergency reports to IndexedDB for automatic replay when connectivity returns. Full 7-language UI (Hindi, English, Marathi, Tamil, Telugu, Bengali, Hinglish) with Web Speech API voice input and TTS output. Installable as a ~4MB PWA on any Android or Chrome device, shareable via QR code.

**Layer 2 — Express API Gateway (Render, 2-worker cluster)**
Node.js Express server running in cluster mode (2 workers) for concurrent request handling. Handles JWT-based authentication with bcrypt password hashing and phone OTP fallback. Serves REST API endpoints for all villager, ASHA, and admin operations. Runs server-sent events (SSE) for real-time outbreak alerts, pad request notifications, and ambulance dispatch streaming. WebSocket for live ambulance telemetry. Connects to Amazon Aurora PostgreSQL via a `pg.Pool` with 20 maximum connections for ACID-compliant relational queries. Connects to Amazon DynamoDB for high-throughput event writes and telemetry queries across 5 tables with 7 GSIs.

**Layer 3 — FastAPI AI Service (Render)**
Python FastAPI microservice hosting the complete AI stack. SymptomNet deep learning MLP (multilayer perceptron, 64.6% accuracy over 101 disease classes) and Logistic Regression fallback (71.1% accuracy) for symptom classification. Sakhi Grounded RAG engine with 243 knowledge chunks from WHO, MoHFW, FOGSI, ICMR, and UNICEF across 15+ clinical categories, calibrated retrieval threshold of 0.45 (F1=1.00), and full conversation memory. Autonomous outbreak detection agent that queries PostgreSQL every 30 minutes and classifies symptom clusters via Groq Llama-3.3-70b with 3-attempt exponential backoff. Skin disease image analyzer with client-side pixel guardrails and server-side Pillow validation. Clinical safety guardrail that routes uncertain predictions to offline heuristic rules rather than guessing.

---

## Key Features by Role

### Villager

| # | Feature | Description |
|---|---------|-------------|
| 1 | **AI Symptom Checker** | 101-class ONNX model runs offline in-browser; voice input in 7 languages; severity triage with location recommendations |
| 2 | **Ambulance SOS** | One-tap emergency dispatch with GPS; IndexedDB queue when offline; 60-second cooldown; 108 fallback number |
| 3 | **Sakhi Women's Health AI** | Grounded RAG chatbot with 243 WHO/MoHFW clinical chunks; full conversation memory; offline fallback via fuzzy local KB |
| 4 | **Camera Pad Requests** | Selfie capture — AI gender verification — GPS geocoding — SSE broadcast to ASHA with photo and map link |
| 5 | **Voice Assistant + 7 Languages** | Speak symptoms in Hindi, English, Marathi, Tamil, Telugu, Bengali, Hinglish; auto-fills forms; TTS read-out |

### ASHA / NGO Worker

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Maternal Health Tracking** | Register pregnancies; WHO risk classification (BP/Hb/weight thresholds); operates fully offline with IndexedDB queue |
| 2 | **Child Nutrition Screening** | WHO WHZ-score for SAM/MAM/Normal classification; weight, height, MUAC; zero internet required |
| 3 | **AI-Powered Outbreak Alerts** | Real-time SSE notifications from autonomous outbreak agent; containment status; action plan generator |
| 4 | **Smart Task Manager** | AI-prioritized daily tasks with route suggestions; clinical notes; visit and mark-done workflow |
| 5 | **Impact Analytics** | Animated KPIs (pregnancies, screenings, emergencies); health score breakdown; sync queue manager with manual trigger |

### District Admin

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Command Center** | 15-tab district hub: live KPI gauges, SSE telemetry, trend charts, data provenance badges on every metric |
| 2 | **Autonomous Outbreak Radar** | AI-driven detection every 30 minutes via Groq Llama; simulate outbreaks; issue district-wide alerts; confidence scores |
| 3 | **Predictive Risk Intelligence** | 5-factor per-village risk model (symptom trend, outbreak proximity, seasonal calendar, referral backlog); CRITICAL/HIGH/MEDIUM/LOW with XAI breakdown |
| 4 | **B2B API Key Management** | Create/revoke tenant-scoped `sk_live_*` keys; 3 permission levels; per-tenant usage tracking; 6-district isolation |
| 5 | **Live System Verification** | `/verify` panel confirms Aurora PostgreSQL health, DynamoDB table schemas with GSIs, AI service latency — all live |

---

## Why Two AWS Databases?

| Workload | Database | Rationale |
|----------|----------|-----------|
| Patient records, user auth, referrals, B2B analytics | **Amazon Aurora PostgreSQL** | ACID compliance, relational JOIN queries, `pg.Pool(20)` connection pooling, SERIAL PKs, TIMESTAMPTZ precision |
| Outbreak telemetry, sync queues, emergency streams, village heartbeats, audit logs | **Amazon DynamoDB** | High-throughput writes, PAY_PER_REQUEST scaling, 7 GSIs across 5 tables, TTL auto-expire on 3 tables, sub-ms latency for SOS streams |

Both databases are live in `ap-south-1` (Mumbai) and independently verifiable in real-time at `/verify` — connection pool status, table item counts, GSI schemas, TTL configurations, and query latency. Every data point in the admin dashboard carries a provenance badge indicating which database served it.

---

## Infrastructure Stack

| Component | Platform | Details |
|-----------|----------|---------|
| Frontend PWA | **Vercel** (edge, free tier) | React 18 + Vite, service worker, ~4MB PWA, route-based code splitting, OG tags for sharing |
| Backend API | **Render** (free tier, 2 workers) | Node.js Express, native cluster module, SSE/WebSocket, health-checked graceful boot |
| AI Service | **Render** (free tier) | Python FastAPI, Groq Llama-3.3-70b, ONNX Runtime, fully isolated from backend |
| Container Orchestration | **Docker Compose** | Nginx reverse proxy service, health-checked boot ordering (AI first, then backend), bridge network |
| Proxy & Load Balancing | **Nginx** (custom config) | Upstream backend round-robin with `max_fails=3` and `fail_timeout=10s`, SSE/WebSocket proxying, 1-year static asset caching with gzip, 20s connect and 30s read timeouts for cold-start tolerance |
| Relational Database | **Amazon Aurora PostgreSQL** | ACID transactions, `pg.Pool(20)`, parameterized queries, stored procedures for B2B aggregate analytics |
| NoSQL Telemetry Store | **Amazon DynamoDB** | PAY_PER_REQUEST billing, 5 tables each with purpose-built GSIs, TTL auto-expire on 3 tables (outbreak data, sync queues, emergency streams) |
| AI Inference | **Groq Cloud** | Llama-3.3-70b-versatile for Sakhi RAG and outbreak classification, sub-2s inference, 3-attempt exponential backoff on transient failures |

---

## B2B API Key System

Admins generate tenant-scoped API keys for partner NGOs, district health departments, and research partners. Each key is prefixed with `sk_live_` followed by 32 random hex characters and stored as a bcrypt hash in PostgreSQL with a VARCHAR(80) column. Keys are scoped to a single district — data from Varanasi never leaks to Lucknow. Usage tracking records `usage_count`, `last_used_at`, and `rate_limit` on every request, providing Stripe-ready billing data.

```bash
curl -H "x-api-key: sk_live_abc123..." \
  https://swasthai-guardian-platform-0jsb.onrender.com/api/b2b/me
```

| Endpoint | Description |
|----------|-------------|
| `GET /api/b2b/me` | Key metadata, tenant district, permission level, usage stats |
| `GET /api/b2b/villages` | Village health data (name, population, pregnancies, malnutrition, outbreak status) scoped to tenant |
| `GET /api/b2b/analytics` | Aggregate counts — villages, pregnancies, symptoms checked, ambulance requests, users |
| `GET /api/b2b/ambulances` | Recent ambulance requests per tenant with status, priority, and timestamps (7-day window) |
| `GET /api/b2b/outbreaks` | DynamoDB outbreak telemetry scoped to tenant district (48-hour window, includes confidence scores) |

Multi-tenancy spans 6 districts — **Varanasi, Lucknow, Sehore, Bhopal, Indore, Pune** — each fully isolated with district-scoped queries. The B2B Usage Dashboard displays per-tenant API call volume, village coverage, record counts, and user counts with animated counters rising from zero on page load. The API Keys admin panel supports create, revoke, rotate, and copy-to-clipboard operations with three permission levels: Read, ReadWrite, and Admin.

---

## What's Under the Hood

**Autonomous Outbreak Agent** — A background Node.js daemon (`backend/services/outbreakAgent.js`) polls the PostgreSQL `symptom_checker` table every 30 minutes via `setInterval`. When it detects a localized symptom cluster (e.g. 5+ cases of fever or diarrhea in one village), it sends the cluster data to Groq Llama-3.3-70b for classification with 3-attempt exponential backoff (1s, 2s, 4s). The agent writes confirmed outbreaks to DynamoDB's `outbreak_telemetry` table (TTL: 90 days) and broadcasts SSE events to all connected admin and ASHA dashboards in real time. Confidence scores, agent reasoning traces, and detection timestamps are displayed in the AI Intelligence admin view. Administrators can also trigger simulated outbreaks from the UI to test field response workflows.

**Hybrid Edge-to-Cloud AI** — A three-tier fallback architecture ensures clinical decisions never silently fail. Tier 1 (online): SymptomNet deep learning MLP (multilingual Transformer embeddings, 64.6% hold-out accuracy, 101 disease classes). Tier 2 (online): Logistic Regression keyword classifier with TF-IDF vectorization (71.1% hold-out accuracy). Tier 3 (offline): deterministic rule engine based on MoHFW/WHO ASHA protocols — no model confidence required. The ONNX-compiled SymptomNet model (opset 18, ~800KB) runs in-browser via `localSymptomNet.js` for instant offline predictions. Sakhi RAG is grounded in 243 clinical chunks with 2-sentence sliding-window overlap, calibrated threshold of 0.45 (precision=1.00, recall=1.00 from a 50-query grid search), and falls back to the top KB chunk when Groq is unavailable — never a silent failure.

**Production-Grade Infrastructure** — Nginx reverse proxy is configured with distinct upstream blocks: `upstream backend` for `/api/*` and `/ws/*` routes (round-robin, `max_fails=3`, `fail_timeout=10s`) and a separate frontend block for `/*`. SSE and WebSocket connections use a 24-hour proxy timeout to prevent mid-session disconnects. Cold-start tolerance parameters (20s `proxy_connect_timeout`, 30s `proxy_read_timeout`) handle Render's free-tier wake-up latency. The backend runs Node.js native cluster mode with 2 workers for multi-core utilization. All Docker containers run as non-root users (`USER node`, `USER 1000`). Static assets are served with `Cache-Control: public, max-age=31536000, immutable`, gzip compression, and security headers including `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security: max-age=31536000`.

**Offline Sync Engine** — Six named IndexedDB queues (`maternal`, `child`, `ambulance`, `symptom`, `emergency`, `records`) each store pending operations with a client-generated UUID (`clientRequestId`) for idempotency. On the `online` event, the frontend drains queues sequentially and the server deduplicates via unique constraints on `client_request_id` columns in PostgreSQL. Three conflict resolution rules: Reject-Duplicate for immutable clinical observations (first write wins), Last-Write-Wins for ambulance status transitions (latest timestamp wins), and Accumulate for telemetry counters (merge values). Offline password authentication uses pre-seeded SHA-256 hashes cached in localStorage — the client compares entered password hash against the cached hash when the backend is unreachable, enabling full offline login for demo credentials across all three roles.

**Camera-Verified Pad Request Flow** — A 3-step privacy-first welfare distribution system. Step 1: The villager captures a live selfie via `getUserMedia` with a face-guide overlay. Step 2: The image is sent to `/api/detect-gender` for AI gender verification — male captures are rejected, preventing misuse. Step 3: On verification, the pad request form activates with auto-populated GPS coordinates (reverse-geocoded via OpenStreetMap Nominatim to a village address). The complete payload — selfie image, verified badge, GPS coordinates, and village name — is broadcast via SSE to the ASHA dashboard. ASHA workers see each request as a card with thumbnail, camera-verified badge, and a clickable Google Maps link. Approve and deliver actions complete the fulfillment loop.

**Compliance & Security** — DISHA 2023 consent modal gates all villager data collection with one-time device-specific consent (enforced via localStorage). DPDP Act 2023 compliance with data residency in AWS ap-south-1 (Mumbai). Aadhaar numbers are SHA-256 hashed with unique per-record salt — never logged, cached, or transmitted in plaintext. DynamoDB tables are encrypted at rest with AWS KMS. HTTP security is enforced by Helmet.js (CSP, HSTS, X-Frame-Options, X-Content-Type-Options). Rate limiting at 100 requests per minute per IP via `express-rate-limit`. JWT tokens with bcrypt password hashing (10 salt rounds). All user inputs validated through Zod schemas before reaching database queries. Parameterized SQL (pg-promise) prevents injection attacks. Client-side PII redaction strips names, phone numbers, and addresses from symptom descriptions before they reach the LLM. Immutable audit trails are written to DynamoDB's `security_audit_logs` table with 7-year retention.

---

## Quick Reference

| Guide | What It Covers |
|-------|----------------|
| [System Architecture](docs/system_architecture.md) | ERDs, DynamoDB access patterns, GSI schemas, 5-table design with TTL policies |
| [AI Architecture](docs/ai_architecture.md) | Model validation methodology, 5-fold cross-validation results, RAG calibration grid search |
| [Offline Sync Strategy](docs/offline_sync_strategy.md) | IndexedDB queue architecture, client-server idempotency, 3 conflict resolution rules |
| [Judge's Guide](docs/judge_guide.md) | Step-by-step walkthrough for evaluators covering B2B, technical, and impact tracks |
| [Deployment Guide](DEPLOYMENT.md) | AWS setup, Docker Compose configuration, multi-worker scaling, production hardening |
| [Setup Guide](docs/setup_guide.md) | Local development with SQLite fallback, environment variables, Docker one-command startup |
| [Repository Map](docs/repository_map.md) | Full directory tree, file role descriptions, naming conventions |

---

*SwasthAI Guardian — Built for Bharat's villages, not just its cities.*
*"We didn't build AI for doctors. We built it for the 600,000 villages that don't have one."*

# System Architecture — SwasthAI Guardian Platform

> Cloud-native rural health intelligence on **Amazon Aurora PostgreSQL**, **Amazon DynamoDB**, and **FastAPI AI agents**. Four tiers designed for zero-connectivity resilience, ACID medical records, and millisecond outbreak alerts.

---

## Architecture Overview

| Tier | Platform | Role | AWS Integration |
|---|---|---|---|
| **Client Edge** | Vercel · React 18 · Vite PWA | Offline-first clinical UI with ONNX browser inference | S3 pre-signed photo uploads |
| **API Gateway** | Render · Express.js · Node 20 | REST API, WebSocket telemetry, SSE alerts, B2B gateway | Aurora pool + DynamoDB SDK |
| **AI Service** | Render · FastAPI · Python 3.11 | SymptomNet, RAG-Sakhi, OutbreakAgent, clinical guardrails | Groq Cloud (external LLM) |
| **Data Layer** | **Aurora PostgreSQL** + **DynamoDB** | ACID medical records + NoSQL telemetry event store | AWS ap-south-1 · IAM auth |

**End-to-end flow**: Villager/ASHA (phone OTP) → React PWA → Express API → Aurora (medical data) + DynamoDB (telemetry) + AI Service (diagnosis/outbreak detection). Offline submissions queue to IndexedDB and auto-replay on reconnect.

---

## Why Two Databases?

| | **Amazon Aurora PostgreSQL** | **Amazon DynamoDB** |
|---|---|---|
| **Chosen for** | ACID compliance — a corrupted pregnancy record could cost a life | Millisecond writes — a disease cluster must be recorded instantly |
| **Data stored** | Users, pregnancies, symptoms, referrals, vaccinations, schemes | Outbreak telemetry, sync queues, village heartbeats, emergency streams |
| **Access pattern** | Relational joins, aggregations, transactional | Append-only streams, time-series, key-value lookups |
| **Scaling** | Vertical — db.t3.micro → r6g.large | Horizontal — PAY_PER_REQUEST, unlimited |
| **Connection** | `pg.Pool { max: 20 }` · SSL · 30s timeout | AWS SDK v3 · IAM keys |

---

## Aurora PostgreSQL Tables

| Table | Key Columns | Purpose |
|---|---|---|
| **users** | phone (UK), role, name, aadhaarHash, villageId (FK) | Login, role-based access, Aadhaar (SHA-256, never plaintext) |
| **village_health** | villageId (PK), name, population, districtId, lat/lng | Village registry with outbreak alert flag |
| **pregnancy_data** | name, trimester, riskLevel, BP, heart rate | Maternal health tracking with WHO risk classification |
| **symptoms** | villageId (FK), disease, confidence, model_used | Patient symptom submissions with AI prediction |
| **referrals** | patient_name, priority, status | Hospital referral tracking (routine/urgent/high) |
| **ambulance_requests** | name, location, priority, status, request_type | SOS ambulance + pad request routing |
| **vaccination_records** | child_name, vaccine_name, status | Mission Indradhanush immunization schedule |
| **government_schemes** | 20 MoHFW schemes with eligibility JSON | Ayushman Bharat, JSY, PMMVY, RBSK, PMSBY + 15 more |
| **malnutrition_data** | child measurements, WHO Z-score, SAM/MAM | Child malnutrition classification (WHO Z-scores) |
| *(10 more)* | audit_logs, api_keys, district_config, asha_performance, otps, refresh_tokens, revoked_tokens, skin_logs, ngo_reports, village_bulk_uploads |

> **Note on Table Count:** An additional 20th database table (`twilio_receipts`) operates purely as an internal background logging utility for SMS delivery statuses. It is excluded from the 19 core application tables shown in the system architecture diagram.

---

## DynamoDB — 5 Tables, 7 GSIs

| Table | PK | SK | GSIs / TTL | Use Case |
|---|---|---|---|---|
| **outbreak_telemetry** | villageId | detectedAt | 3 GSIs: disease, district-time, gsikey-time | AI-detected outbreak clusters |
| **sync_queues** | deviceId | queuedAt | 1 GSI: status-index | Offline sync logs during outages |
| **village_node_state** | villageId | — | 1 GSI: all-nodes · TTL: 7 days | Live heartbeat map, auto-expires stale |
| **emergency_streams** | districtId | streamId | 2 GSIs: priority, district-date | SOS ambulance audit trail |
| **security_audit_logs** | actor | timestamp | None (access isolation) · no TTL | DISHA 2023 compliance audit trail |

### Production Hardening

| Fix | Naive | Production |
|---|---|---|
| **Scan → Query** | Full table Scan | `district-time-index` Query — bounded reads |
| **Dynamic districtId** | Hardcoded `'district_main'` PK | `getDistrictId()` resolves real district via Aurora join before every write |
| **Atomic UpdateCommand** | PutCommand (race conditions) | UpdateCommand — patches 4 fields, safe under concurrent writes |
| **GSI Validation** | Assumed GSIs exist (silent failures) | DescribeTableCommand on startup — fails loudly if missing |
| **Idempotent TTL** | setTimeout (duplicate runs) | ensureTTL() checks ENABLED/ENABLING — safe on restart |

---

## Key Differentiators

**1. Offline-First PWA** — ONNX SymptomNet runs in-browser with zero network. IndexedDB queues submissions during outages and auto-replays on reconnect. SHA-256 local auth works offline. 7-language voice I/O. Photos compress to <200KB for 2G.

**2. Autonomous Outbreak Agent** — Every 30 minutes, the OutbreakAgent queries Aurora for village symptom clusters → sends to Groq Llama-3.3-70b (JSON mode, 3-attempt exponential backoff) → if confidence ≥ 70%: checks DynamoDB 24h dedup → POSTs alert → DynamoDB write + SSE broadcast → admin sees live Outbreak Radar with AI reasoning trace.

**3. B2B API Gateway** — Admin generates `sk_live_*` keys scoped to `tenantId = districtId`. All queries enforce `WHERE "districtId" = ?`. Usage tracked per request. Endpoints: `/api/b2b/villages`, `/api/b2b/analytics`, `/api/b2b/ambulances`, `/api/b2b/outbreaks`.

**4. Predictive Risk Engine** — 4-signal weighted model: Symptom Trend Growth (40%) + Outbreak Proximity (25%) + NVBDCP Seasonal Calendar (20%) + Referral Backlog (15%). Output: Village Risk Score 0-100 with district heatmap (GREEN → AMBER → RED) and XAI contributor bars.

---

## Runtime Resilience (Free Tier)

Both services run on Render free tier (spindown after 15 min idle). The backend auto-falls back to SQLite when Aurora is paused:

- **Cold start**: Aurora 30s timeout → SQLite fallback → full schema + demo data seeded. Aurora resumes → transparent reconnect → db swapped at runtime.
- **Health endpoint**: `{"db": "connected" | "SQLite fallback" | "degraded", "dynamodb": "connected" | "mock"}`

---

> Rural health infrastructure cannot afford data corruption or high cloud costs. Aurora PostgreSQL guarantees ACID safety for every medical record. DynamoDB PAY_PER_REQUEST provides millisecond outbreak alerting with zero provisioning. Together — hospital-grade data integrity at village-scale cost.

# SwasthAI Guardian

Offline-First Rural Health Platform · 3-Layer Microservice · Amazon Aurora + DynamoDB

[Live Demo](https://swasth-ai-guardian-platform.vercel.app) · [Deploy Guide](DEPLOYMENT.md) · [Judge's Guide](docs/judge_guide.md) · [Changelog](CHANGELOG.md)

![AWS Aurora](https://img.shields.io/badge/AWS-Aurora%20PostgreSQL-FF9900?logo=amazonaws) ![AWS DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-FF9900?logo=amazonaws) ![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![FastAPI](https://img.shields.io/badge/Python-FastAPI-009688?logo=fastapi) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker) ![Groq](https://img.shields.io/badge/Groq-Llama--3.3--70b-F55036?logo=groq)

**Team ID:** `team_ZuoCZ7nsvWVIrutn3eqmYdQD`

---

Over 650 million rural Indians lack access to quality healthcare. Here's what SwasthAI Guardian does about it:

| The Problem | The Solution |
|---|---|
| ASHA workers manage 1,000+ families with paper registers. Data never leaves the notebook. | Real-time telemetry into Amazon Aurora PostgreSQL + DynamoDB. Every village, digitized. |
| Disease outbreaks detected 2 weeks late — after the infection spreads. | Autonomous AI agent scans clinical data every 30 min via Groq Llama-3.3-70b. SSE alerts instantly. |
| Cloud apps useless where internet doesn't reach. | ONNX runs in-browser. IndexedDB queues auto-sync on reconnect. Works in zero-signal zones. |
| District officers have no early warning system. | Predictive 5-factor risk intelligence with per-village heatmap and XAI breakdown. |

**101 disease classes** · **7 Indian languages** · **5 DynamoDB tables / 7 GSIs** · **52,900 training samples**

**Explore in 2 minutes:** Open the [Live Demo](https://swasth-ai-guardian-platform.vercel.app) → pick any role card (offline login, no backend needed) → explore the dashboard. For the full experience, try all three roles: Villager (symptom checker, SOS), ASHA (maternal tracking, outbreak alerts), Admin (command center, B2B API keys, live infrastructure monitor).

---

## Quick Reference

| Guide | What It Covers |
|---|---|
| [System Architecture](docs/system_architecture.md) | ERDs, DynamoDB access patterns, GSI schemas, TTL policies |
| [AI Architecture](docs/ai_architecture.md) | 5-fold CV results, RAG calibration (threshold 0.45, F1=1.00) |
| [Offline Sync Strategy](docs/offline_sync_strategy.md) | IndexedDB queues, idempotency, conflict resolution |
| [Judge's Guide](docs/judge_guide.md) | Walkthrough for B2B, technical, and impact tracks |
| [Deployment Guide](DEPLOYMENT.md) | Docker Compose, multi-worker scaling, cold-start tuning |
| [Setup Guide](docs/setup_guide.md) | Local dev with SQLite, env vars, one-command startup |
| [Repository Map](docs/repository_map.md) | Directory tree, file roles, naming conventions |
| [DynamoDB Tables](infra/dynamodb-tables.md) | Table schemas, PK/SK design, GSI access patterns |

---

## Architecture & Infrastructure

<img src="architecture_diagram.svg" alt="Architecture" width="100%" />

| Layer | Platform | What It Handles |
|---|---|---|
| **React PWA** | Vercel | ONNX offline inference (101 diseases), 7-language voice UI, IndexedDB queues, ~4MB PWA |
| **Express API** | Render (2 workers) | JWT auth, REST + SSE + WebSocket, Aurora PostgreSQL + DynamoDB |
| **FastAPI AI** | Render | SymptomNet MLP (64.6%), LR fallback (71.1%), Sakhi RAG (F1=1.00), outbreak agent |
| **Nginx Proxy** | Docker | Reverse proxy, round-robin load balancing, 24h SSE timeout, cold-start tolerance |
| **Aurora PostgreSQL** | AWS ap-south-1 | Patient records, auth, referrals, B2B analytics (ACID, parameterized queries) |
| **DynamoDB** | AWS ap-south-1 | Outbreak telemetry, sync queues, emergency streams, audit logs (5 tables, 7 GSIs) |

---

## Key Features by Role

### Villager

| Feature | What It Does |
|---|---|
| **AI Symptom Checker** | 101 disease classes, ONNX offline in-browser, voice in 7 languages, severity triage |
| **Ambulance SOS** | One-tap GPS dispatch, offline IndexedDB queue, 60s cooldown, 108 fallback |
| **Sakhi Women's Health AI** | RAG chatbot, 243 WHO/MoHFW chunks, conversation memory, offline fallback |
| **Camera Pad Requests** | Selfie → gender verify → GPS geocode → SSE to ASHA with photo + map |
| **Voice + 7 Languages** | Hindi, English, Marathi, Tamil, Telugu, Bengali, Hinglish |

### ASHA / NGO Worker

| Feature | What It Does |
|---|---|
| **Maternal Health** | Pregnancy tracking, WHO risk classification, fully offline |
| **Child Nutrition** | WHO Z-score (SAM/MAM/Normal), offline, MUAC tracking |
| **Outbreak Alerts** | Real-time SSE from autonomous agent, containment status, action plans |
| **Smart Tasks** | AI-prioritized visits, route suggestions, clinical notes |
| **Impact Analytics** | Animated KPIs, health scores, sync queue manager |

### District Admin

| Feature | What It Does |
|---|---|
| **Command Center** | 15-tab district hub, live SSE telemetry, provenance badges on every metric |
| **Outbreak Radar** | AI detection every 30min via Groq, simulate outbreaks, confidence scores |
| **Risk Intelligence** | 5-factor village risk model, XAI breakdown, prevention checklists |
| **B2B API Keys** | Tenant-scoped keys, 3 permission levels, 6-district isolation, usage tracking |
| **Live Infrastructure Monitor** | Real-time Aurora + DynamoDB health, GSIs, AI latency from production |

---

## B2B API Key System

Tenant-scoped `sk_live_` keys lock to exactly one district. Read / ReadWrite / Admin permissions. Per-request usage tracking ready for consumption-based billing.

```bash
curl -H "x-api-key: sk_live_abc123..." \
  https://swasthai-guardian-platform-0jsb.onrender.com/api/b2b/me
```

| Endpoint | Response |
|---|---|
| `GET /api/b2b/me` | Key metadata, tenant, permissions, usage |
| `GET /api/b2b/villages` | Village health data scoped to tenant |
| `GET /api/b2b/analytics` | Aggregate counts by district |
| `GET /api/b2b/ambulances` | Recent requests (7-day window) |
| `GET /api/b2b/outbreaks` | DynamoDB outbreak telemetry (48h window) |

6 districts: Varanasi, Lucknow, Sehore, Bhopal, Indore, Pune. Fully isolated. Admin panel supports create, revoke, rotate, copy-to-clipboard.

---

## What's Under the Hood

| Component | How It Works | Why It Matters |
|---|---|---|
| **Outbreak Agent** | Polls PostgreSQL every 30min → Groq Llama classifies symptom clusters → writes to DynamoDB (TTL 90d) → SSE pushes alerts to admin + ASHA dashboards | Catches outbreaks **weeks before manual reporting**. 3-attempt exponential backoff. UI can simulate outbreaks for real-time drill exercises. |
| **Edge AI** | 3-tier fallback: SymptomNet DL (64.6%) → Logistic Regression (71.1%) → offline WHO/MoHFW heuristic. ONNX in-browser sub-ms. Sakhi RAG: 243 chunks, threshold 0.45, F1=1.00 | **Clinical decisions never silently fail.** When Groq is unreachable, the top KB chunk serves as fallback. Entire symptom checker works with zero internet connectivity. |
| **Sync Engine** | 4 IndexedDB queues (maternal, child, ambulance, symptoms). Client UUID idempotency. Auto-drains on reconnect. | 3 conflict rules: Reject-Duplicate (clinical), LWW (ambulance), Accumulate (telemetry). SHA-256 offline password auth works without backend. |
| **Pad Request** | Selfie capture → `/api/detect-gender` verification → GPS reverse geocode → SSE broadcast to ASHA with photo + Google Maps link | **Privacy-first welfare distribution.** 3-step camera-gated flow blocks male misuse. ASHA sees thumbnail, verified badge, map link. Approve/deliver loop. |
| **Security** | DISHA 2023 consent, DPDP Act, Aadhaar hash (unique salt), AWS KMS encryption, Helmet.js, rate limiting (100/min/IP), Zod validation, PII redaction, 7-year immutable audit trails | Production-grade compliance. Every security layer has a counterpart in the codebase. |

---

*SwasthAI Guardian — Built for Bharat's villages, not just its cities.*
*"We didn't build AI for doctors. We built it for the 600,000 villages that don't have one."*

[Judge's Guide](docs/judge_guide.md) · [Devpost](https://devpost.com/software/swasthai-guardian)

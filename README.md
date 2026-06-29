# SwasthAI Guardian

Offline-First Rural Health Platform · 3-Layer Microservice · Amazon Aurora + DynamoDB

[Live Demo](https://swasth-ai-guardian-platform.vercel.app) · [Deploy Guide](DEPLOYMENT.md) · [Judge's Guide](docs/judge_guide.md) · [Changelog](CHANGELOG.md)

![AWS Aurora](https://img.shields.io/badge/AWS-Aurora%20PostgreSQL-FF9900?logo=amazonaws) ![AWS DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-FF9900?logo=amazonaws) ![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![FastAPI](https://img.shields.io/badge/Python-FastAPI-009688?logo=fastapi) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker) ![Groq](https://img.shields.io/badge/Groq-Llama--3.3--70b-F55036?logo=groq)

---

Over 650 million rural Indians lack access to quality healthcare. ASHA workers manage 1,000+ families with paper registers. Disease outbreaks are detected two weeks late — after the infection spreads. Cloud apps fail where internet doesn't reach. SwasthAI Guardian solves this with an offline-first PWA that works in zero-signal zones, powered by an autonomous AI outbreak agent, real-time telemetry into Amazon Aurora PostgreSQL + DynamoDB, and a 3-layer microservice architecture deployed via Docker Compose.

**101 disease classes** · **7 Indian languages** · **5 DynamoDB tables / 7 GSIs** · **52,900 training samples**

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

_[Full diagram → docs/system_architecture.md](docs/system_architecture.md)_

| Layer | Platform | What It Handles |
|---|---|---|
| **React PWA** | Vercel | ONNX offline inference (101 diseases), 7-language voice UI, IndexedDB queues, ~4MB PWA |
| **Express API** | Render (2 workers) | JWT auth, REST + SSE + WebSocket, Aurora PostgreSQL + DynamoDB |
| **FastAPI AI** | Render | SymptomNet MLP (64.6%), LR fallback (71.1%), Sakhi RAG (F1=1.00), outbreak agent |
| **Nginx Proxy** | Docker | Reverse proxy, round-robin load balancing, 24h SSE timeout, cold-start tolerance |
| **Aurora PostgreSQL** | AWS ap-south-1 | Patient records, auth, referrals, B2B analytics (ACID, pg.Pool(20)) |
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
| **Outbreak Agent** | Polls PostgreSQL every 30min → Groq Llama → DynamoDB (TTL 90d) → SSE alerts | Catches outbreaks weeks before manual reporting. UI can simulate outbreaks for drills. |
| **Edge AI** | 3-tier fallback: DL (64.6%) → LR (71.1%) → offline WHO heuristic | Never silent failure. ONNX in-browser sub-ms. RAG falls back to top chunk when Groq is down. |
| **Sync Engine** | 6 IndexedDB queues, client UUID idempotency, auto-drain on reconnect | 3 conflict rules: Reject-Duplicate, LWW, Accumulate. SHA-256 offline auth. |
| **Pad Request** | Selfie → gender detect → GPS → SSE to ASHA with photo + Google Maps link | 3-step camera-gated flow. Blocks abuse. Approve/deliver loop. |
| **Security** | DISHA 2023, DPDP Act, Aadhaar hash, KMS, Helmet, rate limit, Zod, PII redaction, 7-year audit trails | Production-grade compliance on every layer. |

---

*SwasthAI Guardian — Built for Bharat's villages, not just its cities.*
*"We didn't build AI for doctors. We built it for the 600,000 villages that don't have one."*

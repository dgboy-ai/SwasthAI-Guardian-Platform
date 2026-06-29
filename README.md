# SwasthAI Guardian
### Amazon Aurora PostgreSQL + Amazon DynamoDB · Vercel · Offline-First Rural Health AI

[**Live Demo**](https://swasth-ai-guardian-platform.vercel.app) · [**Deployment Guide**](DEPLOYMENT.md) · [**Architecture Diagram**](architecture_diagram.svg) · [**Changelog**](CHANGELOG.md)

---

## The Problem

Over 600 million Indians live in rural villages. Frontline health workers (ASHAs) serve them using paper registers. Disease outbreaks are detected two weeks late — after the infection has spread. Most villages lack reliable internet, making cloud-dependent health apps useless.

## The Solution

SwasthAI Guardian is an offline-first B2B health operations platform connecting villagers, ASHA workers, district CMOs, and NGOs on a single AWS-backed intelligence layer. It replaces paper records with real-time telemetry, detects outbreaks before they spread, and works fully offline in zero-signal zones.

**101 disease classes** · **7 Indian languages** · **600M addressable population** · **5 DynamoDB tables / 7 GSIs** · **Sub-10ms writes**

---

## Architecture

<img src="architecture_diagram.svg" alt="SwasthAI Guardian Platform — Production Architecture" width="100%" />

---

## Production-Ready, Not a Demo

> **Dual AWS database architecture** — Amazon Aurora PostgreSQL (ACID medical records) and Amazon DynamoDB (high-throughput telemetry, PAY_PER_REQUEST, TTL auto-expire). Live provisioned in ap-south-1 (Mumbai). Verified in real-time at `/verify` — connection status, pool health, item counts, GSI schemas, query latency.
>
> **Self-host in one command** — `docker compose up --build -d` launches Nginx reverse proxy + Node.js cluster load balancing + FastAPI AI service with health-checked boot ordering.
>
> **Offline-first by design** — password login, symptom checker (local ONNX), ambulance SOS, maternal/child records, government schemes, and menstrual health all work without any internet connection or backend server.

## Why Two AWS Databases?

| Workload | Database | Rationale |
|---|---|---|
| Patient records, user auth, referrals, B2B analytics | **Amazon Aurora PostgreSQL** | ACID compliance, relational JOIN queries, `pg.Pool(20)` |
| Outbreak telemetry, sync queues, emergency streams, village heartbeats, audit logs | **Amazon DynamoDB** | High-throughput writes, PAY_PER_REQUEST scaling, 10-way sharded GSIs, TTL auto-expire |

Both databases are live in ap-south-1 and independently verifiable at `/verify`.

## B2B API Key System

Admins generate tenant-scoped `sk_live_*` API keys for partner NGOs and district health departments. Each key restricts data access to a single district and tracks usage (`usage_count`, `last_used_at`) for Stripe-ready billing.

```bash
curl -H "x-api-key: sk_live_abc123..." https://swasthai-guardian-platform-0jsb.onrender.com/api/b2b/me
```

| Endpoint | Description |
|---|---|
| `GET /api/b2b/me` | Key metadata, tenant, permissions |
| `GET /api/b2b/villages` | Village health data scoped to tenant |
| `GET /api/b2b/analytics` | Aggregate counts (villages, pregnancies, symptoms) |
| `GET /api/b2b/ambulances` | Recent ambulance requests per tenant |
| `GET /api/b2b/outbreaks` | DynamoDB outbreak telemetry (7-day window) |

## What's Under the Hood

- **Autonomous outbreak agent** — background daemon queries PostgreSQL symptom clusters every 30 minutes, classifies via Groq Llama-3.3-70B (3-attempt exponential backoff), deduplicates in DynamoDB, pushes SSE alerts to admin dashboards
- **Hybrid edge-to-cloud AI** — SymptomNet ONNX model runs in-browser offline; FastAPI service handles deep learning inference, Grounded RAG (243 WHO/MoHFW chunks, threshold 0.45, F1=1.00), and skin image analysis when online
- **Nginx reverse proxy + Node.js cluster** — production-grade load balancing with WebSocket/SSE proxying, 1-year static asset caching, cold-start timeouts, non-root containers

## Compliance

**DISHA 2023** · **DPDP Act 2023** · **IT Act 2008** · **WHO Guidelines** · **MoHFW Protocols** · **NHM India** · **FOGSI** · **NVBDCP / NTEP**

---

## Quick Reference

| Guide | What It Covers |
|---|---|
| [System Architecture](docs/system_architecture.md) | ERDs, DynamoDB access patterns, GSI schemas |
| [AI Architecture](docs/ai_architecture.md) | Model validation, RAG calibration, dataset |
| [Offline Sync Strategy](docs/offline_sync_strategy.md) | IndexedDB queue, conflict resolution rules |
| [Judge's Guide](docs/judge_guide.md) | Step-by-step walkthrough for evaluators |
| [Deployment Guide](DEPLOYMENT.md) | AWS setup, Docker, multi-worker scaling |
| [Setup Guide](docs/setup_guide.md) | Local dev, env vars, Docker Compose |

---

*SwasthAI Guardian — Built for Bharat's villages, not just its cities.*
*"We didn't build AI for doctors. We built it for the 600,000 villages that don't have one."*

# 🏗️ System & Database Architecture — SwasthAI Guardian Platform

This document describes the high-level system architecture and database design decisions of the SwasthAI Guardian Platform, illustrating how offline-first clients, backend APIs, relational databases, NoSQL event stores, and AI microservices interact.

---

## 🏗️ High-Level Architectural Flow

The diagram below details the end-to-end data lifecycle, displaying how offline inputs sync dynamically and route to AWS databases:

```mermaid
graph TB
    subgraph Client Layer [Client-Side App - Vercel / PWA / Android]
        UI[React UI Page / Guided Mode]
        LS[Local Storage & IndexedDB]
        SQ[Offline Sync Queue]
    end

    subgraph CDN & Hosting Layer
        Vercel[Vercel Serverless Hosting]
    end

    subgraph Application Backend [Render.com / AWS ECS Node.js API]
        Express[Express.js App Router]
        Auth[JWT / OTP Auth Middleware]
        Audit[Audit Logging Middleware]
        ED[EDA - Event Dispatcher]
    end

    subgraph AI Service [FastAPI Microservice]
        SymptomNet[SymptomNet MLP Classifier]
        RAG[Sakhi RAG Chatbot - Llama 3.3]
        OutbreakAgent[Outbreak Agent Outbreak detection]
    end

    subgraph Data Layer [AWS Cloud Datastore]
        Aurora[(Amazon Aurora PostgreSQL - Transactional SQL)]
        Dynamo[(Amazon DynamoDB - High-Throughput NoSQL)]
        S3[(AWS S3 - Skin Condition Images)]
    end

    %% Client and CDN Interactions
    UI --> Vercel
    UI --> LS
    UI -->|Online| Express
    LS --> SQ
    SQ -->|Resumed Connection Replay| Express

    %% Backend Router & Middlewares
    Express --> Auth
    Auth --> Audit
    Audit -->|Async Write| Aurora
    Express --> ED

    %% Relational Queries
    Express -->|Transactional CRUD| Aurora
    ED -->|Maternal & Referral Events| Aurora

    %% Telemetry & Streams
    Express -->|Telemetry & Heartbeats| Dynamo
    ED -->|Emergency Streams & Sync Logs| Dynamo

    %% AI Service Interactions
    Express -->|Symptom Inference / Speech Check| SymptomNet
    Express -->|Conversational RAG request| RAG
    OutbreakAgent -->|Read cluster telemetry| Dynamo
    OutbreakAgent -->|Write detected outbreak alert| Aurora
    OutbreakAgent -->|Push critical alerts| Express
    
    %% Skin Analyzer
    Express -->|Analyze Skin Image| S3
```

---

## 📦 Component Roles

1. **Client Layer (Vercel / PWA / Android)**:
   - Built with React & Vite, hosted on Vercel. 
   - Uses an **Offline Event Replay Engine** powered by IndexedDB to log events (symptoms, pregnancies, emergencies) when offline and replay them automatically on reconnection.
   - Leverages on-device image compression (shrinking high-res image inputs to `<200KB` on-the-fly) to support reliable uploads on slow 2G/EDGE networks.
   
2. **Backend API Service (Express.js)**:
   - Handles route validation, auth checks, and asynchronous audit logs.
   - Hosts the local **Event Dispatcher** which processes events like `symptom_submitted`, `emergency_triggered`, and `maternal_alert` out-of-band to keep route speeds fast.

3. **AI Microservice (FastAPI + Python)**:
   - **SymptomNet**: A multi-layered MLP Neural Network that evaluates symptom inputs with a heuristic local rules model acting as a fallback if the network is busy/offline.
   - **Sakhi Chatbot**: A Retrieval-Augmented Generation (RAG) assistant running Llama-3.3-70B over an expanded 243-chunk multilingual clinical database.
   - **Outbreak Agent**: An asynchronous process that scans DynamoDB telemetry logs, groups them by village cluster, and automatically issues outbreak alerts into Aurora Postgres.

---

## 🗄️ Database Strategy & AWS Design Decisions

Most apps use one database for everything. SwasthAI uses a hybrid approach: a local **SQLite** database as an offline edge node and local development fallback, paired with a dual **AWS Cloud** configuration in production.

### The Local/Edge Database Strategy (SQLite Fallback)
To ensure the app remains fully functional with zero initial setup for judges or developers, and to simulate offline client-side sync environments, SwasthAI utilizes an embedded **SQLite** engine. 
* **Local Dev & Evaluation**: When run locally without AWS credentials, the backend automatically boots with SQLite, using the exact same schema structure as our production Aurora database.
* **Production**: When deployed to cloud environments, the backend dynamically connects to **Amazon Aurora PostgreSQL** via the `DATABASE_URL` connection pool.

---

### The AWS Production Database Strategy (Aurora + DynamoDB)

| | Amazon Aurora PostgreSQL | Amazon DynamoDB |
|---|---|---|
| **Why chosen** | ACID compliance for permanent medical records | Millisecond write latency for high-velocity telemetry |
| **The stakes** | A corrupted pregnancy record could cost a life — ACID transactions are non-negotiable | A disease cluster alert must be written in < 10ms regardless of how many villages are reporting simultaneously |
| **Access pattern** | Transactional reads/writes, relational joins, aggregations | Append-only high-throughput streams, time-series queries |
| **Data stored** | Users, symptom submissions, pregnancies, ambulance requests, government schemes | Outbreak alerts, offline sync queues, village heartbeats, emergency dispatch logs |
| **Billing model** | Provisioned capacity (db.t3.micro → scales to r6g.large) | PAY_PER_REQUEST — auto-scales to millions of writes with zero provisioning |

---

### DynamoDB Table Design (Composite Keys + GSIs)

**Purpose-Built Schema**: We designed every DynamoDB table around its query pattern to prefer bounded `Query` calls for judged command-center proof and operational views, avoiding cross-partition scans for the main outbreak telemetry path:

```
Table: outbreak_telemetry
  PK: villageId (HASH) + detectedAt (RANGE)   ← time-range queries per village
  GSI: disease-index → disease + detectedAt   ← cross-village disease trend queries

Table: sync_queues
  PK: deviceId (HASH) + queuedAt (RANGE)      ← all pending records per device
  GSI: status-index → status + queuedAt       ← fleet-level "show all failed syncs" view

Table: village_node_state
  PK: villageId (HASH)                        ← single-item heartbeat/last-seen state
  TTL: expiresAt                              ← auto-purge stale nodes after 7 days (no cron needed)

Table: emergency_streams
  PK: districtId (HASH) + streamId (RANGE)          ← durable append-only event stream
  GSI: district-date-index → districtDateBucket + timestamp
                                                   ← bounded district/day command-center query
  GSI: priority-index → priority + streamId         ← critical-only P1 filter for admin dashboards
```

---

### DynamoDB Production Hardening (5 Fixes Applied)

| Fix | Before (naive) | After (production-grade) |
|---|---|---|
| **Scan → Query** | Broad table reads for command-center proof | `outbreak_telemetry.district-time-index` and `emergency_streams.district-date-index` provide bounded district/time `Query` access |
| **Dynamic districtId** | Hardcoded `'district_main'` as partition key for all records | `getDistrictId(db, villageId)` — resolves the real district via PostgreSQL join before every DynamoDB write |
| **Atomic UpdateCommand** | Full `PutCommand` on every update — race condition risk under concurrent writes | `UpdateCommand` patches only 4 owned fields — safe to call in parallel, never overwrites concurrent writes |
| **GSI Validation** | Assumed GSIs existed at runtime (silent failure if missing) | `DescribeTableCommand` on startup — compares actual vs. required GSI names; fails loudly if missing |
| **Idempotent TTL** | `setTimeout(() => UpdateTimeToLive(), 5000)` — could run multiple times | `ensureTTL()` checks for `ENABLED\|ENABLING` state before calling — idempotent and safe to re-run |

---

### The Agentic Outbreak Loop (What No Other Submission Has)

This is a fully autonomous AI agent running as a background service — not a dashboard a human checks:

```
Every 30 minutes →
  OutbreakAgent queries Aurora PostgreSQL for village symptom clusters
  → Sends cluster JSON to Groq Llama-3.3-70b with JSON mode + 3-attempt exponential backoff
  → If LLM confidence ≥ 70%:
      Checks DynamoDB to ensure no duplicate alert exists for this village in the last 24h
      → POST to /api/admin/outbreak-alert (fails loudly at startup if AGENT_SECRET is missing)
      → Backend writes to DynamoDB outbreak_telemetry (villageId + detectedAt, with districtId for district-time GSI)
      → SSE broadcast to all connected admin dashboard sessions
      → Admin sees live Outbreak Radar update with AI reasoning trace and disease name
```

---

### PostgreSQL Schema Reference

The relational database models the full lifecycle of a rural patient's health journey:

* **`users`** — Demographic records with Aadhaar hashes (never plaintext), caste/BPL status for automatic government scheme eligibility matching.
* **`village_health`** — Patient symptom submissions linked to district geography (lat/lng + districtId) for outbreak detection.
* **`maternal_health`** — Clinical pregnancy metrics (blood pressure, blood sugar, weight, trimester) with dynamic risk-level classification (Low / Medium / High).
* **`malnutrition_cases`** — Child height/weight measurements mapped to SAM (Severe Acute Malnutrition) and MAM (Moderate Acute Malnutrition) WHO classifications.
* **`government_schemes`** — Structured JSON metadata for rural health schemes (JSY, PMMVY, Ayushman Bharat) with eligibility query parameters.
* **`ambulance_requests`** — SOS emergency event triggers with coordinate-based tracking and outcome logging.
* **`vaccination_records`** — Mission Indradhanush immunization schedule and status tracking per child.
* **`district_config`** — Per-district custom thresholds, emergency contact numbers, and automation parameters.

---

> **Why this matters to AWS Judges**: Rural health infrastructure cannot afford either data corruption or high cloud costs. By routing critical medical records to ACID-compliant **Aurora PostgreSQL** and streaming high-frequency alerts to **DynamoDB (on-demand)**, we guarantee 100% data durability and single-digit millisecond latency while keeping operating costs close to zero.

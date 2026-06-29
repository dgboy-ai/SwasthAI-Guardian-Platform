# System Architecture — SwasthAI Guardian Platform

> Cloud-native rural health intelligence built on **Amazon Aurora PostgreSQL**, **Amazon DynamoDB**, and **FastAPI AI agents**. Four-tier architecture designed for zero-connectivity resilience, ACID medical records, and millisecond outbreak alerts.

---

## 30-Second Architecture Overview

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#10b981', 'secondaryColor': '#f59e0b', 'tertiaryColor': '#8b5cf6', 'primaryBorderColor': '#065f46', 'secondaryBorderColor': '#b45309', 'tertiaryBorderColor': '#6d28d9', 'lineColor': '#6b7280', 'fontSize': '13px', 'background': '#f8fafc' }}}%%
graph TB
    subgraph Users["👥 End Users"]
        V["Villager<br/><i>Phone OTP login</i>"]
        A["ASHA Worker<br/><i>9876543211</i>"]
        N["NGO Admin"]
        D["District CMO Admin"]
    end

    subgraph Frontend["🌐 FRONTEND — Vercel Edge"]
        REACT["React 18 + Vite PWA<br/>Tailwind · Framer Motion · Recharts"]
        PWA["Service Worker<br/>Offline-first cache"]
        ONNX["ONNX SymptomNet<br/>Browser-side inference"]
    end

    subgraph Backend["⚙️ BACKEND — Express.js / Node"]
        API["REST API + WebSocket + SSE<br/>JWT · bcrypt · IDOR Policy Engine"]
        DISPATCH["Event Dispatcher<br/>3-retry DLQ safeguard"]
        WATCH["Health Watchdog<br/>30s Aurora + DynamoDB checks"]
        B2B["B2B API Gateway<br/><i>sk_live_* keys · tenant isolation</i>"]
    end

    subgraph AI["🧠 AI SERVICE — FastAPI / Python 3.11"]
        SNET["SymptomNet-DL<br/>101 diseases · 64.6% acc"]
        RAG["RAG-Sakhi<br/>243 chunks · 7 languages"]
        OA["OutbreakAgent<br/>Groq Llama-3.3-70b · 30min loop"]
        SKIN["SkinAnalyzer<br/>PregnancyRisk · MalnutritionDet"]
    end

    subgraph AWS["☁️ AWS CLOUD — ap-south-1 (Mumbai)"]
        AURORA["Amazon Aurora PostgreSQL<br/>ACID · 15+ tables · db.t3.micro"]
        DYNAMO["Amazon DynamoDB<br/>PAY_PER_REQUEST · 5 tables · 7 GSIs"]
    end

    Users -->|HTTPS / WSS| Frontend
    Frontend -->|REST API| Backend
    Frontend -->|"Offline → IndexedDB → auto-replay"| Backend
    Backend -->|"Transactional SQL"| AURORA
    Backend -->|"Telemetry streams"| DYNAMO
    Backend -->|"Clinical triage"| AI
    OA -->|"Poll clusters / POST alert"| Backend

    classDef user fill:#f0fdf4,stroke:#16a34a,color:#14532d
    classDef frontend fill:#d1fae5,stroke:#10b981,color:#064e3b
    classDef backend fill:#fef3c7,stroke:#f59e0b,color:#78350f
    classDef ai fill:#ede9fe,stroke:#8b5cf6,color:#4c1d95
    classDef aws fill:#ffedd5,stroke:#f97316,color:#7c2d12
    class V,A,N,D user
    class Frontend,PWA,REACT,ONNX frontend
    class Backend,API,DISPATCH,WATCH,B2B backend
    class AI,SNET,RAG,OA,SKIN ai
    class AWS,AURORA,DYNAMO aws
```

---

## Tier Breakdown

| Tier | Platform | Core Role | AWS Integration |
|---|---|---|---|
| **Client Edge** | Vercel · React 18 · Vite PWA | Offline-first clinical UI with ONNX browser inference | S3 pre-signed URLs for photo upload |
| **API Gateway** | Render · Express.js · Node 20 | REST API, WebSocket telemetry, SSE alerts, B2B gateway | Aurora connection pool + DynamoDB SDK |
| **AI Service** | Render · FastAPI · Python 3.11 | SymptomNet, RAG-Sakhi, OutbreakAgent, clinical guardrails | Groq Cloud (external LLM) |
| **Data Layer** | **Amazon Aurora PostgreSQL** + **Amazon DynamoDB** | ACID medical records + NoSQL telemetry event store | AWS ap-south-1 · IAM auth |

---

## AWS Data Architecture

### Why Two Databases?

| | **Amazon Aurora PostgreSQL** | **Amazon DynamoDB** |
|---|---|---|
| **Chosen for** | ACID compliance — a corrupted pregnancy record could cost a life | Millisecond writes — a disease cluster must be recorded instantly |
| **Access pattern** | Relational joins, aggregations, transactional reads/writes | Append-only streams, time-series queries, key-value lookups |
| **Data stored** | Users, pregnancies, symptoms, referrals, vaccinations, schemes | Outbreak telemetry, sync queues, village heartbeats, emergency streams |
| **Scaling** | Vertical — db.t3.micro → r6g.large | Horizontal — PAY_PER_REQUEST, unlimited throughput |
| **Connection** | `pg.Pool { max: 20 }` · SSL · 30s connection timeout | AWS SDK v3 · IAM keys · `ap-south-1` |

### Aurora PostgreSQL Schema (Core Clinical Tables)

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#f97316', 'primaryBorderColor': '#9a3412', 'lineColor': '#9ca3af', 'fontSize': '12px' }}}%%
erDiagram
    users {
        int id PK
        string phone UK "Login identifier"
        string role "villager | ngo | admin"
        string name
        string villageId FK
        string aadhaarHash "SHA-256, never plaintext"
        boolean verified
    }
    village_health {
        string villageId PK "V101, V102..."
        string name
        int population
        int pregnant_women
        int malnutrition_cases
        string districtId
        float lat
        float lng
        string outbreakAlert
        timestamp lastUpdated
    }
    pregnancy_data {
        int id PK
        string name "Patient name"
        int trimester "1, 2, or 3"
        string riskLevel "Low | Medium | High"
        int systolic_bp
        int diastolic_bp
        int heart_rate
        string villageId FK
        timestamp createdAt
    }
    symptoms {
        int id PK
        string villageId FK
        string symptoms "Fever, Headache..."
        string disease "Predicted disease"
        float confidence "0.0 - 1.0"
        string model_used "SymptomNet-DL | LR"
        string client_request_id UK "Idempotency key"
        timestamp createdAt
    }
    referrals {
        int id PK
        string patient_name
        string villageId FK
        string reason
        string priority "routine | urgent | high"
        string status "pending | in_progress | completed"
    }
    ambulance_requests {
        int id PK
        string name
        string location
        string priority
        string status "pending | assigned | dispatched"
        string request_type "ambulance | pad_request"
        timestamp createdAt
    }
    vaccination_records {
        int id PK
        string child_name
        string vaccine_name
        string villageId FK
        string status "given | scheduled"
        date given_date
        date scheduled_date
    }

    users ||--o{ pregnancy_data : "has"
    users ||--o{ symptoms : "reports"
    village_health ||--o{ symptoms : "contains"
    village_health ||--o{ referrals : "generates"
    village_health ||--o{ ambulance_requests : "requests"
    village_health ||--o{ vaccination_records : "tracks"
```

> **15+ tables total** — includes `government_schemes` (20 MoHFW schemes), `district_config`, `api_keys`, `audit_logs`, `otps`, `malnutrition_data`, `asha_performance`, and more. Full schema: `backend/db/schema.js`.

### DynamoDB — 5 Tables, 7 GSIs, PAY_PER_REQUEST

| Table | PK | SK | GSIs / TTL | Purpose |
|---|---|---|---|---|
| **`outbreak_telemetry`** | `villageId` | `detectedAt` | `disease-index` · `district-time-index` · `gsikey-time-index` | AI-detected outbreak clusters by disease, district, and time range |
| **`sync_queues`** | `deviceId` | `queuedAt` | `status-index` | Offline client sync logs during signal outages |
| **`village_node_state`** | `villageId` | — | `all-nodes-index` · TTL: 7 days | Live village heartbeat map — auto-expires stale nodes |
| **`emergency_streams`** | `districtId` | `streamId` | `priority-index` · `district-date-index` | P1 SOS ambulance audit trail with chronological paging |
| **`security_audit_logs`** | `actor` | `timestamp` | None (access isolation) · TTL: indefinite | DISHA 2023 compliance — cross-actor scanning blocked |

### Production Hardening Applied

| Fix | Naive Approach | Production Implementation |
|---|---|---|
| **Scan → Query** | `Scan` on entire table | `district-time-index` Query — bounded reads at scale |
| **Dynamic districtId** | Hardcoded `'district_main'` as PK | `getDistrictId(db, villageId)` resolves real district via Aurora join before every DynamoDB write |
| **Atomic UpdateCommand** | `PutCommand` (race conditions) | `UpdateCommand` — patches only 4 owned fields, safe under concurrent writes |
| **GSI Validation** | Assumed GSIs exist (silent failures) | `DescribeTableCommand` on startup — fails loudly if GSI missing |
| **Idempotent TTL** | `setTimeout(() => ...)` (duplicate runs) | `ensureTTL()` checks `ENABLED|ENABLING` — safe to re-run on every restart |

---

## Key Differentiators

### 1. Offline-First PWA with Browser-Side AI
ONNX SymptomNet runs in-browser with zero network. IndexedDB queues all submissions during signal outages and auto-replays on reconnect. SHA-256 local auth works offline. 7-language voice I/O for non-literate users. Photos compress to <200KB for 2G uploads.

### 2. Autonomous Outbreak Agent (Closed-Loop)
Every 30 minutes: OutbreakAgent queries Aurora for village symptom clusters → sends to Groq Llama-3.3-70b (JSON mode, 3-attempt exponential backoff) → if confidence ≥ 70%: checks DynamoDB 24h dedup → POSTs alert → DynamoDB write + SSE broadcast → Admin dashboard shows live Outbreak Radar with AI reasoning trace.

### 3. B2B API Gateway with Tenant Isolation
Admin panel generates `sk_live_*` keys scoped to `tenantId = districtId`. All queries enforce `WHERE "districtId" = ?`. Usage tracking (`usage_count` + `last_used_at`) per request. Endpoints: `/api/b2b/villages`, `/api/b2b/analytics`, `/api/b2b/ambulances`, `/api/b2b/outbreaks`. B2BUsageDashboard for partner NGOs.

### 4. Predictive Village Risk Intelligence
4-signal weighted engine: Symptom Trend Growth (40%) + Outbreak Proximity (25%) + NVBDCP Seasonal Calendar (20%) + Referral Backlog (15%). Output: Village Risk Score 0-100 with district-wide heatmap (GREEN → AMBER → RED) and XAI contributor bars in the admin dashboard.

---

## Runtime Resilience (Free Tier Architecture)

Since both services run on Render free tier (spindown after 15 min idle), the backend automatically falls back to **SQLite** with zero data loss when Aurora is paused:

```text
Cold start:
  Aurora 30s timeout → SQLite fallback → full schema + demo data seeded
  Aurora resumes → transparent reconnect → db swapped back at runtime
```

Health endpoint: `{"db": "connected" | "SQLite fallback" | "degraded", "dynamodb": "connected" | "mock"}`

---

> **Why this matters**: Rural health infrastructure cannot afford data corruption or high cloud costs. Aurora PostgreSQL guarantees ACID safety for every pregnancy record and medical referral. DynamoDB PAY_PER_REQUEST provides millisecond outbreak alerting with zero provisioning. Together, they deliver hospital-grade data integrity at village-scale cost.

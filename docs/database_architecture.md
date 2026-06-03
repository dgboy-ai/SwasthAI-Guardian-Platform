# 🗄️ AWS Database Architecture — Deliberate Design Decisions

Most apps use one database for everything. SwasthAI uses two in production with very different purposes, utilizing a local **SQLite** database as an offline edge node and local development fallback:

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

Each table is designed around its dominant query pattern — not as a generic key-value store:

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
  PK: districtId (HASH) + streamId (RANGE)   ← all SOS events in a district, ordered
  GSI: priority-index → priority + streamId  ← critical-only P1 filter for admin dashboards
```

---

### DynamoDB Production Hardening (5 Fixes Applied)

| Fix | Before (naive) | After (production-grade) |
|---|---|---|
| **Scan → Query** | `scan('outbreak_telemetry')` — reads the entire table every time (O(table-size)) | `queryRecentAll()` with FilterExpression + `queryByVillage()` KeyConditionExpression — O(result-set) |
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
      → Backend writes to DynamoDB outbreak_telemetry (composite key: villageId + detectedAt)
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

> **Why this matters**: A corrupt pregnancy record in a rural PHC can mean a mother delivers without the care she needed. A disease cluster that takes 48 hours to reach an admin — instead of 30 seconds — can let an outbreak spread to a neighbouring village. The dual-database architecture exists because of those two different failure modes.

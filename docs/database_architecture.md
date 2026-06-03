# 🗄️ AWS Database Architecture — Deliberate Design Decisions

### Why Two Databases? (Not Just One)

Most apps use one database for everything. SwasthAI uses two with very different purposes:

| | Amazon Aurora PostgreSQL | Amazon DynamoDB |
|---|---|---|
| **Why chosen** | ACID compliance for medical records | Millisecond write latency for telemetry |
| **Rationale** | A corrupted pregnancy record could cost a life | A disease cluster must be written in <10ms regardless of concurrent village load |
| **Access pattern** | Transactional reads/writes, joins, aggregations | Append-only high-throughput streams, time-series |
| **Data stored** | Users, symptoms, pregnancies, ambulances, schemes | Outbreaks, sync queues, village heartbeats, emergencies |
| **Billing** | Provisioned (db.t3.micro → scale to r6g.large) | PAY_PER_REQUEST (auto-scales to millions) |

### DynamoDB Table Design (Composite Keys + GSIs)

```
Table: outbreak_telemetry
  PK: villageId (HASH) + detectedAt (RANGE)   ← time-range queries per village
  GSI: disease-index → disease + detectedAt   ← cross-village disease queries

Table: sync_queues
  PK: deviceId (HASH) + queuedAt (RANGE)      ← all pending records per device
  GSI: status-index → status + queuedAt       ← fleet-level "all failed syncs"

Table: village_node_state
  PK: villageId (HASH)                        ← single-item heartbeat state
  TTL: expiresAt                              ← auto-expire stale nodes after 7 days

Table: emergency_streams
  PK: districtId (HASH) + streamId (RANGE)   ← all emergencies in a district
  GSI: priority-index → priority + streamId  ← critical-only filter
```

### DynamoDB Production Hardening (5 Fixes Applied)

| Fix | Before | After |
|---|---|---|
| **Scan → Query** | `scan('outbreak_telemetry')` — O(table-size) | `queryRecentAll()` with FilterExpression + `queryByVillage()` KeyCondition |
| **Dynamic districtId** | Hardcoded `'district_main'` | `getDistrictId(db, villageId)` — looks up real district from PostgreSQL |
| **Atomic UpdateCommand** | Full `PutCommand` (race condition risk) | `UpdateCommand` patches only 4 owned fields — upsert-safe |
| **GSI Validation** | Assumed GSIs existed on table presence | `DescribeTableCommand` + compares actual vs required GSI names at startup |
| **Idempotent TTL** | `setTimeout(() => UpdateTimeToLive(), 5000)` | `ensureTTL()` called directly; checks `ENABLED\|ENABLING` before setting |

### The Agentic Outbreak Loop (What No Other Submission Has)

```
Every 30 minutes →
  OutbreakAgent queries Aurora for village symptom clusters
  → Calls Groq Llama-3.3-70b with JSON mode & 3-attempt exponential backoff
  → If confidence ≥ 70%: checks DynamoDB to ensure no duplicate alert was sent for this village in the last 24h
  → POST to /api/admin/outbreak-alert (fails loudly on startup if AGENT_SECRET is missing in production)
  → Backend writes to DynamoDB outbreak_telemetry (composite key: villageId + detectedAt)
  → SSE broadcast to all connected admin dashboards
  → Admin sees real-time Outbreak Radar update with AI reasoning trace
```

### PostgreSQL Database Schema Reference
The system utilizes a structured relational database with the following core entities:
* `users`: Demographic records tracking Aadhaar hashes, castes, and economic status indicators for government scheme matching.
* `village_health`: Patient symptom submissions, local district mapping, and geographical coordinates.
* `maternal_health`: Clinical pregnancy metrics (vitals, blood sugar, blood pressure) classifying risk level dynamically.
* `malnutrition_cases`: Child height/weight parameters mapping SAM/MAM outcomes.
* `government_schemes`: Structural JSON metadata containing eligibility queries for rural schemes.
* `ambulance_requests`: SOS emergency event triggers and coordinate-based tracking.

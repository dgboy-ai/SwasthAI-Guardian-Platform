# 🔍 SwasthAI Guardian Platform — Full Codebase Audit

> Performed on: `c:\projects\SwasthAI-Guardian-Platform`  
> Scope: Backend (Node.js/Express), AI Service (FastAPI/Python), Frontend (React/Vite), Infrastructure (Docker, AWS), Security

---

## 🔴 Critical Issues

---

### 1. **Live API Keys Committed to Git**
**Files:** `backend/.env`, `frontend/.env`, `ai-service/.env`

| Field | Detail |
|---|---|
| **Why it matters** | The Groq API key (`gsk_HQFOW...`) is hardcoded in 3 `.env` files that are committed to the GitHub repository. Anyone with repo access can use it to run up API costs or exhaust the rate limit before the hackathon demo. |
| **Hackathon impact** | If the key is rotated before the live demo, the entire RAG + Sakhi AI will go silent. Also violates hackathon submission security review. |
| **Production impact** | Critical. Key exposure = unauthorized API billing, potential account termination. |
| **Recommended fix** | 1. Rotate the Groq API key immediately. 2. Add `**/.env` to `.gitignore` globally. 3. Use GitHub Secrets / AWS Secrets Manager. 4. Use `.env.example` (already exists) as the template, never store real values in committed files. |
| **Priority** | 🔴 **HIGH — Do first** |

---

### 2. **Hardcoded JWT Secret — Production-Wide Weak Token**
**File:** `backend/server.js` line 420, 471, 486

```js
jwt.sign(..., process.env.JWT_SECRET || 'swasthai_secret_2026', ...)
jwt.verify(token, process.env.JWT_SECRET || 'swasthai_secret_2026')
```

| Field | Detail |
|---|---|
| **Why it matters** | If `JWT_SECRET` env var is not set (e.g. cold deploy, missing env), the system falls back to the publicly known string `swasthai_secret_2026`. An attacker can forge admin JWTs using this string. |
| **Hackathon impact** | Judge security review will flag this. It also means any audience member watching the demo could forge an admin token live. |
| **Production impact** | Total authentication bypass — any user can escalate to admin role. |
| **Recommended fix** | Replace fallback with `process.env.JWT_SECRET` only, with a hard crash (`throw new Error(...)`) at startup if it is missing. Never allow a default secret in production code paths. |
| **Priority** | 🔴 **HIGH** |

---

### 3. **Broken Database Initializer — `pool` Used Before Declaration**
**File:** `backend/server.js` lines 170, 280, 294, 318 etc.

```js
// Line 170 — Inside the IIFE at the bottom:
await pool.query(`CREATE TABLE IF NOT EXISTS users...`)
```

| Field | Detail |
|---|---|
| **Why it matters** | The `pool` variable (the raw `pg.Pool` instance) is only scoped inside the `pgAvailable` IIFE (`testPool`) but referenced later as `pool` throughout the schema init block (lines 170–407) and in routes like `/api/auth/profile` (line 500), `/api/ngo/village`, `/api/schemes`, `/api/admin/clusters`, etc. The `pool` name is never exported from the connection block, meaning all these `pool.query()` calls will throw `ReferenceError: pool is not defined` at runtime when PostgreSQL is connected. |
| **Hackathon impact** | The entire PostgreSQL/Aurora path is broken. Under hackathon judging with a real DB URL, the backend will crash on startup with a `ReferenceError`. |
| **Production impact** | Complete production backend failure. The app only accidentally works because it silently falls back to SQLite. |
| **Recommended fix** | Export the pool from the connection block: `let pool; ... pool = testPool; db = {...}`. Then all subsequent `pool.query()` calls work correctly. Alternatively unify all DB calls through the `db` wrapper object consistently. |
| **Priority** | 🔴 **HIGH** |

---

### 4. **SQLite WAL Files Committed — Database State in Git**
**File:** `backend/swasthai_guardian.sqlite`, `backend/swasthai_guardian.sqlite-shm`, `backend/swasthai_guardian.sqlite-wal`

| Field | Detail |
|---|---|
| **Why it matters** | The live SQLite database file (69 KB) including WAL (Write-Ahead Log, 103 KB) is committed to the repository. This contains real user registrations, symptom logs, and health records. WAL files in a corrupt/partial-write state will crash `better-sqlite3` on startup. |
| **Hackathon impact** | Stale data or a corrupt WAL could prevent the backend from starting cleanly at demo time. |
| **Production impact** | PII/PHI data committed to source control is a DPDP Act 2023 / HIPAA-equivalent violation. |
| **Recommended fix** | 1. Add `*.sqlite`, `*.sqlite-shm`, `*.sqlite-wal` to `.gitignore`. 2. Remove the files from git history: `git rm --cached backend/swasthai_guardian.sqlite*`. 3. The `backend/.gitignore` exists but must be checked for these patterns. |
| **Priority** | 🔴 **HIGH** |

---

### 5. **Offline Auth Bypass — ANY Credentials Accepted When Network Is Down**
**File:** `frontend/src/context/AuthContext.jsx` lines 200–201

```js
// 🌐 Fast-path: strictly offline — Allow ANY credential to work
if (!navigator.onLine && identifier && password) return createOfflineSession();
```

| Field | Detail |
|---|---|
| **Why it matters** | When the device is offline, literally any username + any password combination will log in with ANY role the user claims. The OTP path has the same vulnerability (line 263). This means a malicious user on an offline network can log in as `admin` with password `abc`. |
| **Hackathon impact** | While it looks like a feature ("offline resilience"), security judges will flag this as a critical authentication bypass. |
| **Production impact** | Complete role-based access bypass when offline — any user can claim admin or NGO role. Health data of all villages is exposed. |
| **Recommended fix** | Offline login must ONLY work for users whose credentials are in the local `offline_users` cache, and role must be matched from the cache — not from the request body. Remove the `mockUser` creation fallback (lines 186–197). Add a hard-fail if credentials don't match the cache. |
| **Priority** | 🔴 **HIGH** |

---

### 6. **Demo OTP `1234` Hardcoded in Production Auth Route**
**File:** `backend/server.js` line 461

```js
const isDemoOtp = (otp === '1234');
```

| Field | Detail |
|---|---|
| **Why it matters** | Anyone who knows the phone number of any registered user can log into their account using OTP `1234`. This is not gated by `NODE_ENV`. It is always active. |
| **Hackathon impact** | Demo convenience at the cost of being a known universal backdoor in production. |
| **Production impact** | Full account takeover for any user whose phone number is known. |
| **Recommended fix** | Gate this with `if (process.env.NODE_ENV !== 'production' && otp === '1234')`. For production, remove entirely and implement real OTP via Twilio/AWS SNS. |
| **Priority** | 🔴 **HIGH** |

---

### 7. **Aadhaar Salt Hardcoded in Source Code**
**File:** `backend/server.js` line 523

```js
const hash = crypto.createHash('sha256').update(aadhaar + (process.env.AADHAAR_SALT || 'swasthai_aadhaar_2026')).digest('hex');
```

| Field | Detail |
|---|---|
| **Why it matters** | The Aadhaar hash uses a publicly visible salt. If the database is ever leaked, an attacker can precompute rainbow tables for all 12-digit Aadhaar numbers using this known salt. |
| **Hackathon impact** | Judges looking at DPDP compliance will mark this as a violation. |
| **Production impact** | Effectively breaks the irreversibility guarantee of the hash. |
| **Recommended fix** | `AADHAAR_SALT` must be a required env var with no default. Use a cryptographically random 32-byte salt stored securely in AWS Secrets Manager. |
| **Priority** | 🔴 **HIGH** |

---

### 8. **Outbreak Cluster Query Uses `pool.query` (not `db`)  — Exclusive PostgreSQL Dependency**
**File:** `backend/server.js` lines 1292–1304

```js
const rows = await pool.query(`SELECT "villageId", COUNT(*) ... string_agg(...)`)
```

| Field | Detail |
|---|---|
| **Why it matters** | `string_agg()` is PostgreSQL-only. If the backend falls back to SQLite, this endpoint crashes with `no such function: string_agg`. The agentic monitor would stop working and the admin outbreak dashboard would break. Additionally, `pool` is the raw pg Pool (which may be undefined — see Issue #3 above). |
| **Hackathon impact** | If judged on a local/SQLite environment, the outbreak monitoring feature is entirely broken. |
| **Recommended fix** | Use `GROUP_CONCAT` for SQLite or abstract this query behind a DB-agnostic helper. |
| **Priority** | 🔴 **HIGH** |

---

### 9. **Hardcoded Agent Secret — Weak Internal API Security**
**Files:** `backend/server.js` lines 1288, 1310; `ai-service/outbreak_agent.py` line 19

```js
process.env.AGENT_SECRET || 'swasthai_agent_internal_2026'
```

| Field | Detail |
|---|---|
| **Why it matters** | The `/api/admin/clusters` and `/api/admin/outbreak-alert` endpoints are exposed HTTP routes secured only by a shared secret. The default value is public. Any machine that can reach the backend can inject fake outbreak alerts. |
| **Recommended fix** | No default fallback. Require env var. Add IP allowlisting (restrict to AI service container). |
| **Priority** | 🔴 **MEDIUM-HIGH** |

---

### 10. **Malnutrition Query Uses Unquoted Column Names (SQLite/PostgreSQL Mismatch)**
**File:** `backend/server.js` line 917–920

```js
'SELECT id, childName, ageMonths, weight, height, status, villageId FROM malnutrition_data ...'
```

| Field | Detail |
|---|---|
| **Why it matters** | The schema defines columns as `"childName"`, `"ageMonths"`, `"villageId"` (quoted, PostgreSQL-style). The select query omits quotes. In PostgreSQL, unquoted identifiers are lowercased, so these become `childname`, `agemonths` — which don't exist. This query fails silently in PostgreSQL. |
| **Recommended fix** | Quote all mixed-case column names consistently: `"childName"`, `"ageMonths"`, `"villageId"`. |
| **Priority** | 🔴 **MEDIUM** |

---

## 🟡 Improvement Opportunities

---

### 11. **No Request Body Size Limit — DoS Vector**
**File:** `backend/server.js` line 61

```js
app.use(express.json()); // No limit!
```

| Field | Detail |
|---|---|
| **Why it matters** | Without a body size limit, an attacker can POST megabytes of JSON to any route (including unauthenticated `/api/auth/register`), causing memory exhaustion. |
| **Recommended fix** | `app.use(express.json({ limit: '100kb' }))` |
| **Priority** | 🟡 **High** |

---

### 12. **No Rate Limiting on Non-Auth Endpoints**
**File:** `backend/server.js`

| Field | Detail |
|---|---|
| **Why it matters** | `authLimiter` is applied only to OTP login. Routes like `/api/villager/symptoms`, `/api/villager/ambulance`, `/api/health-assistant` have no rate limiting. A single attacker can spam 1000 AI calls/second, exhausting the Groq API quota before the demo. |
| **Recommended fix** | Add a global API rate limiter (e.g. 100 req/min per IP) and a per-user limiter on the AI endpoints (e.g. 10 req/min). |
| **Priority** | 🟡 **High** |

---

### 13. **OTP Not Deleted After Use — Replay Attack Window**
**File:** `backend/server.js` line 463–468

| Field | Detail |
|---|---|
| **Why it matters** | After a successful OTP login, the OTP record is never deleted from the `otps` table. It remains valid for the full 5-minute window and can be reused (replay attack). |
| **Recommended fix** | After successful verification: `await db.run('DELETE FROM otps WHERE phone = ? AND otp = ?', [phone, otp])` |
| **Priority** | 🟡 **High** |

---

### 14. **`/api/health` Leaks Internal Pool Metrics Without Auth**
**File:** `backend/server.js` lines 1435–1446

```js
connections: pool.totalCount,
idleConnections: pool.idleCount,
```

| Field | Detail |
|---|---|
| **Why it matters** | This public unauthenticated endpoint reveals internal infrastructure metrics (connection pool counts). Also crashes if `pool` is undefined (SQLite mode). |
| **Recommended fix** | Return only `{ status: 'ok', uptime }` publicly. Move DB metrics behind auth + admin role check. |
| **Priority** | 🟡 **Medium** |

---

### 15. **Groq API Key Exposed in Frontend `.env`**
**File:** `frontend/.env` line 6: `VITE_GROQ_API_KEY=gsk_...`

| Field | Detail |
|---|---|
| **Why it matters** | Any Vite env var prefixed `VITE_` is bundled into the JavaScript that is served to browsers. The Groq API key is publicly visible in the built `dist/` JS bundle. |
| **Hackathon impact** | Inspecting the browser source reveals the key. |
| **Recommended fix** | All LLM calls must go through the backend. Never put API keys in `VITE_` env vars. Remove `VITE_GROQ_API_KEY` entirely. |
| **Priority** | 🟡 **High** |

---

### 16. **`disease_model.pkl` (26MB) Committed to Git — Repo Bloat**
**File:** `ai-service/disease_model.pkl` (26.5 MB)

| Field | Detail |
|---|---|
| **Why it matters** | Large binary files in Git inflate clone time and storage. GitHub has a 50MB soft limit and a 100MB hard limit per file. Future model updates will make this worse. |
| **Recommended fix** | Use Git LFS or store models in S3/ECR. Add `*.pkl` to `.gitignore` and load from S3 on startup (add a `download_model.sh` script). |
| **Priority** | 🟡 **Medium** |

---

### 17. **Cluster Module Incompatible with Render/Vercel Free Tier**
**File:** `backend/server.js` lines 23–34

```js
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) cluster.fork();
```

| Field | Detail |
|---|---|
| **Why it matters** | Render Free tier is single-threaded. Forking N workers on a 1-CPU container means only one worker is ever useful, but all fork overhead is paid. On AWS Lambda / ECS Fargate single-vCPU tasks, this causes unnecessary startup delay. |
| **Recommended fix** | Gate cluster forking: `const numWorkers = Math.max(1, process.env.NODE_CLUSTER_WORKERS || numCPUs - 1)`. For containerized deployments, set `NODE_CLUSTER_WORKERS=1`. |
| **Priority** | 🟡 **Medium** |

---

### 18. **No Pagination on Admin/NGO Data Endpoints**
**Files:** `backend/server.js` lines 906, 914, 1214, 1259

```js
'SELECT * FROM pregnancy_data ORDER BY id DESC'  // No LIMIT
```

| Field | Detail |
|---|---|
| **Why it matters** | All maternal, malnutrition, and ambulance records are returned in full on every load. At 1000+ records, this causes timeout on 2G networks and excessive memory use. |
| **Recommended fix** | Add `LIMIT 50 OFFSET ?` with cursor-based pagination. Return a `total` count. |
| **Priority** | 🟡 **Medium** |

---

### 19. **No Input Sanitization on Free-Text Fields**
**Files:** `backend/server.js` — symptom, name, location fields

| Field | Detail |
|---|---|
| **Why it matters** | User-provided strings (symptoms, patient name, location) are stored and returned directly without sanitization. A stored XSS payload in a symptom field would execute in any admin dashboard that renders it as HTML. |
| **Recommended fix** | Use `DOMPurify` on the frontend and `validator.js` on the backend for all free-text inputs before storage. |
| **Priority** | 🟡 **Medium** |

---

### 20. **RAG Knowledge Base Is Static In-Memory — Not Updatable Without Redeploy**
**File:** `ai-service/rag_service.py`

| Field | Detail |
|---|---|
| **Why it matters** | All 40+ health knowledge chunks are hardcoded in Python. Adding a new WHO guideline requires a code change and full redeployment of the AI service. |
| **Hackathon impact** | Limits extensibility score in judging. |
| **Recommended fix** | Store KB chunks in DynamoDB or a JSON file on S3. Load at startup. Allow admin to add/update via API without redeployment. |
| **Priority** | 🟡 **Low-Medium** |

---

### 21. **No Structured Logging or Observability**
**Files:** All services use `console.log` / `print`

| Field | Detail |
|---|---|
| **Why it matters** | `console.log` has no log levels, no structured fields, no trace IDs. On AWS CloudWatch, unstructured logs are unsearchable. When something breaks in production, root cause analysis is extremely difficult. |
| **Recommended fix** | Use `pino` (Node.js) and `structlog` (Python). Emit JSON logs with fields: `level`, `service`, `requestId`, `userId`, `villageId`, `durationMs`. |
| **Priority** | 🟡 **Medium** |

---

### 22. **No Error Boundary on Frontend — Any Page Crash Kills the Whole App**
**File:** `frontend/src/App.jsx`

| Field | Detail |
|---|---|
| **Why it matters** | There are no React Error Boundaries wrapping route-level components. If `GuidedHealthcareMode.jsx` (74 KB!) throws a runtime error, the entire app goes blank — no error message, just a white screen. |
| **Recommended fix** | Wrap each `<Route>` element in a `<ErrorBoundary>` component that shows a friendly fallback UI. |
| **Priority** | 🟡 **Medium** |

---

### 23. **No CI/CD Pipeline — Manual Deployment Only**
**Files:** No `.github/workflows/` directory

| Field | Detail |
|---|---|
| **Why it matters** | There is no automated testing, linting, or deployment pipeline. Every code change is deployed manually. A broken commit can go straight to production undetected. |
| **Recommended fix** | Add a GitHub Actions workflow: `on: push` → lint → test → Docker build → push to ECR → deploy to ECS. Even a minimal pipeline improves hackathon judging on "technical rigor". |
| **Priority** | 🟡 **Medium** |

---

### 24. **`fix.js` and `fix_padding.js` Scripts in Root — Dev Artifacts**
**Files:** `fix.js` (1.1 KB), `fix_padding.js` (1.4 KB) in project root

| Field | Detail |
|---|---|
| **Why it matters** | These appear to be one-off patch scripts left in the root after a debugging session. They are committed to Git and visible to judges examining the repo. They signal messy development practices. |
| **Recommended fix** | Delete both files or move to a `/scripts/dev` directory. |
| **Priority** | 🟡 **Low** |

---

### 25. **Outbreak Agent Uses Synchronous `time.sleep()` — Blocks on Python GIL**
**File:** `ai-service/outbreak_agent.py` line 153

```python
time.sleep(CHECK_INTERVAL_SECONDS)
```

| Field | Detail |
|---|---|
| **Why it matters** | The outbreak agent runs in a daemon thread using blocking `time.sleep(1800)`. In Python, this holds the GIL during sleep on some implementations. Using `asyncio` + FastAPI's background tasks would be cleaner and more reliable. |
| **Recommended fix** | Use FastAPI's `BackgroundTasks` or `APScheduler` for the periodic agent loop. |
| **Priority** | 🟡 **Low** |

---

### 26. **DynamoDB Tables Not Created Programmatically — Missing IaC**
**File:** `backend/dynamodb.js`

| Field | Detail |
|---|---|
| **Why it matters** | The DynamoDB tables (`outbreak_telemetry`, `sync_queues`, `village_node_state`, `emergency_streams`) are never created by the application or any IaC script. They must exist beforehand. A fresh AWS account deployment will silently fall back to mock mode without surfacing an error. |
| **Recommended fix** | Add a startup check that creates tables using `CreateTableCommand` if they don't exist, or provide a CloudFormation/Terraform template. |
| **Priority** | 🟡 **Medium** |

---

### 27. **`/api/admin/outbreaks` Proxies AI Service — Extra Latency + SPOF**
**File:** `backend/server.js` lines 1334–1339

| Field | Detail |
|---|---|
| **Why it matters** | The admin outbreaks endpoint calls the AI service, which reads from its local SQLite. This adds an extra HTTP hop + a 5s timeout chain. If the AI service is down, the admin sees nothing, even though outbreak data also exists in PostgreSQL. |
| **Recommended fix** | Serve outbreak data directly from PostgreSQL's `village_health.outbreakAlert` field. Use the AI service data only as a supplement. |
| **Priority** | 🟡 **Low-Medium** |

---

## 🟢 Strengths — Do Not Change

| # | Area | Why It's Strong |
|---|---|---|
| 1 | **Hybrid DB Architecture** | PostgreSQL/Aurora with automatic SQLite fallback is elegantly implemented. The `db` abstraction wrapper is clean and well-structured. |
| 2 | **Offline-First Auth** | The `offline_users` cache + `navigator.onLine` check is a genuine offline-resilience pattern well-suited for rural 2G networks. |
| 3 | **RAG + Exponential Backoff** | The 3-attempt exponential backoff (1s, 2s, 4s) on Groq + KB fallback when Groq fails is excellent. Sakhi never fails silently. |
| 4 | **Medical Guardrails** | Both the AI service and backend have multi-layer gibberish detection + health keyword filtering. The "no hair translation" and myth-ban rules in the Sakhi prompt are genuinely innovative clinical safety features. |
| 5 | **Verhoeff Aadhaar Checksum** | Implementing the official UIDAI checksum algorithm for Aadhaar validation (not just format check) shows deep domain knowledge. |
| 6 | **Multilingual Support (5 languages)** | The symptom keyword lists cover English, Hindi (Devanagari + transliterated), Tamil, Telugu, and Bengali. This is exceptional coverage for a hackathon project. |
| 7 | **Event-Driven DynamoDB Architecture** | The `eventDispatcher.js` pattern decouples transactional writes (PostgreSQL) from real-time telemetry (DynamoDB) cleanly. |
| 8 | **Ambulance Deduplication** | The 60-second cooldown on repeat ambulance requests prevents accidental double-dispatch. |
| 9 | **Agentic Outbreak Monitor** | The autonomous background agent (Groq-classified, 70% confidence threshold, 30-min polling) is a genuine differentiator. No other hackathon project likely has an LLM-powered epidemiology agent. |
| 10 | **Lazy Loading + 2G Timeout** | Code splitting with `React.lazy()` and 8s axios timeout with offline fallback messaging is appropriate for the target demographic. |
| 11 | **Helmet.js + CORS Whitelisting** | Security headers via Helmet and origin-based CORS validation show production awareness. |
| 12 | **Role-Based Access Control** | The `auth` + `checkRole()` middleware pattern is correctly applied and consistent across all sensitive routes. |
| 13 | **bcrypt Password Hashing** | `bcrypt.hash(password, 10)` with `bcrypt.compare()` is correctly implemented — no timing attack exposure. |
| 14 | **DISHA Consent Modal** | The per-device data consent modal (`DiSHAConsentModal`) addresses India's Digital Personal Data Protection Act 2023 obligations. |
| 15 | **Government Schemes with Eligibility Filtering** | Personalized scheme eligibility filtering by age, gender, and BPL status using DB-level SQL predicates is a standout feature. |

---

## 📊 Priority Matrix Summary

| Priority | Count | Issues |
|---|---|---|
| 🔴 Must Fix (Blockers) | 8 | API keys in git, JWT fallback, pool not defined, SQLite in git, offline auth bypass, demo OTP in prod, Aadhaar salt, string_agg incompatibility |
| 🟡 Should Fix (Competitive) | 17 | Body size limit, rate limiting, OTP replay, health route leak, Groq key in Vite, model.pkl in git, cluster mode, pagination, XSS, RAG static KB, logging, error boundaries, CI/CD, dev scripts, time.sleep, DynamoDB IaC, proxy SPOF |
| 🟢 Keep As-Is | 15 | All strengths listed above |

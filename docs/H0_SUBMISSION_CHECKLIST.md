# H0 Hackathon - Winning Submission Checklist (SwasthAI Guardian)

**Event:** H0: Hack the Zero Stack with Vercel v0 and AWS Databases  
**Primary track:** Track 2 - Monetizable B2B App (Healthcare)  
**Secondary prize targets:** Best Technical Implementation, Most Impactful, Most Original, Best Design  
**Deadline:** 30 Jun 2026 @ 5:30am IST  

---

## Submission Rule Compliance

| Item | Status | Judge-safe acceptance check |
|------|--------|-----------------------------|
| Public GitHub + license | [ ] | Repo public, license visible, README explains H0 work completed after May 27, 2026 |
| Text description | [ ] | Explicitly names Aurora PostgreSQL and DynamoDB, and explains why each database is used |
| Demo video | [ ] | **Less than 3 minutes**; public YouTube preferred; no copyrighted music or third-party trademarks |
| Published Vercel app URL | [ ] | Frontend is deployed on Vercel or v0.app, not only Render |
| Vercel Team ID | [ ] | Added to Devpost submission |
| Architecture diagram | [ ] | Shows Vercel frontend, backend API, AI service, Aurora PostgreSQL, DynamoDB tables, and data flows |
| AWS storage proof screenshots | [ ] | Vercel storage/config screenshot plus AWS Aurora/RDS and DynamoDB console screenshots |
| Test access | [ ] | Demo credentials work and app is available free for judges through the judging period |
| Bonus content | [ ] | Public blog/video/post says it was created for H0 Hackathon and uses `#H0Hackathon` |

---

## 0.1% Judge Trust Fixes

These are the highest-leverage gaps found in the codebase audit. Complete these before polishing any new feature.

| Priority | Gap | Why judges care | Action |
|----------|-----|-----------------|--------|
| P0 | AWS proof can be confused with mock mode | H0 judges are AWS database specialists; they will look for deliberate, real database integration | Add an Admin "Production Evidence" panel that calls `/api/health/detailed` and shows `production_ready`, Aurora status, DynamoDB status, table names, region, and latest telemetry writes |
| P0 | Vercel permissions block marketed features | `frontend/vercel.json` currently disables camera, microphone, and geolocation while the app uses skin scan, voice, and SOS GPS | Change `Permissions-Policy` to allow camera, microphone, and geolocation for the deployed app |
| P0 | PWA icon assets are missing | `frontend/vite.config.js` references icon files that do not exist in `frontend/public`; installability can fail | Add `favicon.ico`, `apple-touch-icon.png`, `mask-icon.svg`, `icon-192.png`, and `icon-512.png`; run Lighthouse PWA check |
| P0 | Demo video checklist was over 3 minutes | Official rules say judges are not required to watch beyond 3 minutes | Use the 2:40 script below and keep final video under 2:55 |
| P1 | UI has static "Connected" database copy | Static database badges can look like marketing instead of proof | Bind admin database badges to `/api/health/detailed`; show "mock" or "SQLite fallback" honestly if not production |
| P1 | Offline demo credentials weaken security perception | Plain demo password caches in localStorage can make reviewers doubt production maturity | Label offline auth as "Judge Demo Mode"; document production replacement: encrypted device credential cache or WebAuthn/device-bound refresh token |
| P1 | DynamoDB cross-village dashboards still use Scan | AWS judges will notice scaling shortcuts | Add a district/date access pattern: `districtId#dateBucket` GSI or daily aggregation table for outbreak and emergency dashboards |
| P1 | AI claims need safety framing | Healthcare claims must feel calibrated, not overpromised | Use "triage support, not diagnosis"; show confidence, alternatives, uncertainty refusal, and ASHA/PHC escalation |
| P2 | No clear full-stack automated smoke suite | Craftsmanship criterion rewards repeatable verification | Add smoke tests for auth, health, symptom write, ambulance write, DynamoDB feed, RAG fallback, offline queue replay, and role access |

---

## Code-Level Audit Backlog

Use this section when assigning implementation tasks. Each item names the likely files to inspect first.

| Priority | Area | Files to inspect first | Detailed fix |
|----------|------|------------------------|--------------|
| P0 | Vercel browser permissions | `frontend/vercel.json` | Current `Permissions-Policy` blocks `camera`, `microphone`, and `geolocation`. Update policy so deployed Vercel app can use skin scan, voice input, and ambulance GPS. Then test those three flows on the Vercel domain. |
| P0 | PWA asset integrity | `frontend/vite.config.js`, `frontend/public/` | Add all referenced icon assets or update references to existing assets. Confirm `manifest.webmanifest` and service worker assets load without 404s. |
| P0 | Live AWS status in UI | `frontend/src/Admin/AdminDashboard.jsx`, `frontend/src/services/adminService.js`, `backend/server.js` | Add frontend call to `/api/health/detailed`. Replace hardcoded database status cards with API-backed status. Show `connected`, `mock`, or `SQLite fallback` exactly. |
| P0 | Judge proof panel | `frontend/src/Admin/AdminDashboard.jsx`, `backend/routes/admin.js` | Add a "Production Evidence" panel showing Aurora status, DynamoDB status, region, table names, pool counts, `production_ready`, recent request traces, and last telemetry event timestamps. |
| P1 | DynamoDB production access pattern | `backend/dynamodb.js`, `backend/routes/admin.js`, `backend/eventDispatcher.js` | Add district/time query support for dashboard views. Avoid relying on cross-partition Scan for the main command-center proof. Consider `districtId` + `detectedAt` GSI or daily rollup table. |
| P1 | Offline sync idempotency | `frontend/src/utils/offlineSyncQueue.js`, `backend/routes/villager.js`, `backend/routes/ngo.js` | Add `syncBatchId` and per-record `clientRequestId`. Backend should ignore duplicates and return existing record ID. This is strong real-world craftsmanship. |
| P1 | Demo auth safety | `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/LoginPage.jsx`, `backend/config.js`, `backend/routes/auth.js` | Keep demo auth usable, but label it as judge/demo mode. Avoid implying localStorage password cache is production security. Document production auth path clearly. |
| P1 | Admin procurement workflow | `frontend/src/Admin/AdminDashboard.jsx`, `backend/routes/admin.js` | Add district onboarding checklist: upload villages, assign ASHA workers, configure outbreak threshold, verify AWS storage, export first district report. |
| P1 | Monthly CMO report polish | `backend/routes/admin.js`, `frontend/src/services/adminService.js`, `frontend/src/Admin/AdminDashboard.jsx` | Surface `/admin/district-report` in UI with preview and export. Add note: "Generated from Aurora records + DynamoDB telemetry." |
| P1 | ASHA workload queue | `frontend/src/NGO/NGODashboard.jsx`, `backend/routes/ngo.js` | Show pending referrals, high-risk pregnancies, missed vaccinations, pad requests, SOS items, and pending sync count in one operational queue. |
| P1 | AI health proof | `ai-service/main.py`, `backend/server.js`, `frontend/src/pages/MonitoringDashboard.jsx` | Show disease model loaded, RAG chunks, retrieval threshold, model fallback state, and guardrail status. Keep clinical wording conservative. |
| P2 | Smoke tests | `backend/package.json`, `frontend/package.json`, new test files | Add minimal tests or scripts that prove the judged flows work. Prioritize health, auth, symptom submit, ambulance submit, DynamoDB feed, and role protection. |
| P2 | Docs consistency | `README.md`, `devpost_submission.md`, `PITCH.md`, `docs/system_architecture.md` | Remove conflicting video duration claims. Align pitch around B2B district operations. Make database claims match live proof. |

---

## H0 Scoring Strategy

The judging rubric has four main criteria. Optimize each one deliberately.

### Technological Implementation

Target judge reaction: "This team made deliberate database and architecture decisions, not just a generated UI."

- [ ] Show Aurora PostgreSQL as the relational system of record:
  - users and roles
  - village registry
  - pregnancy records
  - malnutrition records
  - symptoms
  - referrals
  - ambulance requests
  - district reports
- [ ] Show DynamoDB as the event and telemetry plane:
  - `outbreak_telemetry`
  - `sync_queues`
  - `village_node_state`
  - `emergency_streams`
- [ ] Demonstrate at least one live action that writes to both layers.
- [ ] Explain why not one database:
  - Aurora for ACID medical/operational records.
  - DynamoDB for high-write, time-sensitive telemetry and status streams.
- [ ] Mention production hardening:
  - JWT auth and roles.
  - audit logs.
  - rate limits.
  - data validation.
  - SSE live feed.
  - offline queue replay.
  - AI fallback.
- [ ] Avoid any production demo where DynamoDB is in mock mode or Aurora is SQLite fallback.

### Design

Target judge reaction: "The frontend is designed around the backend and operational workflow."

- [ ] First screen in demo should be the command center or demo page, not a generic landing page.
- [ ] Make status states meaningful:
  - green only for API-verified connected.
  - amber for degraded/mock/fallback.
  - red for unavailable.
- [ ] Use compact dashboards for administrators:
  - live events
  - unresolved work
  - risk by village
  - sync health
  - report exports
- [ ] Use mobile-first task screens for ASHA workers and villagers:
  - large tap targets
  - low text density
  - offline status
  - clear next action
- [ ] Keep the product visually credible for government/NGO buyers: practical, trustworthy, readable, not toy-like.
- [ ] Run one manual pass on mobile viewport for login, ambulance, skin scan, maternal form, child nutrition, and admin dashboard.

### Impact And Real-World Applicability

Target judge reaction: "This could actually help a real field health operation."

- [ ] Make the beneficiary chain explicit:
  - villager gets triage/help
  - ASHA worker gets queue and workflows
  - district admin gets live intelligence
  - NGO/PHC gets referrals and reports
- [ ] Show low-connectivity value:
  - offline queue
  - reconnect sync
  - sync telemetry
  - mobile PWA
- [ ] Show that the platform handles follow-through:
  - referral status
  - outcome closure
  - vaccination records
  - monthly reports
- [ ] Avoid presenting the project as "AI diagnoses villagers." Present it as "AI-assisted triage and operations intelligence with human escalation."

### Originality

Target judge reaction: "The insight is bigger than a health chatbot."

- [ ] Core original idea: disconnected village activity becomes live, auditable district intelligence.
- [ ] Emphasize agentic outbreak detection as operational intelligence, not just an alert.
- [ ] Emphasize dual database use as a product design:
  - relational state plus event streams.
- [ ] Emphasize rural constraints:
  - voice
  - multilingual
  - image compression
  - offline queue
  - low-cost phones
- [ ] Use a phrase like:
  - "SwasthAI is not a hospital app scaled down. It is a field-health operations layer built from the village upward."

---

## Prize-by-Prize Attack Plan

| Prize | What judges need to see | What to build/show |
|-------|--------------------------|--------------------|
| Top 3 B2B SaaS | Buyer, workflow, monetization, repeatable deployment | District command center, onboarding, configurable thresholds, reports, ASHA performance, pricing narrative |
| Best Technical Implementation | Deliberate database model, production readiness, verifiable architecture | Live AWS proof, dual writes, DynamoDB access patterns, smoke tests, architecture diagram |
| Most Impactful | Meaningful problem and credible field adoption | Offline ASHA workflows, multilingual voice, emergency/referral closure, rural health reporting |
| Most Original | Fresh insight beyond standard app pattern | Village work as telemetry, outbreak intelligence, hybrid offline/online health ops |
| Best Design | Designed around users and data flows | Admin cockpit, ASHA task queue, clean status states, mobile field UX, no misleading mock status |

---

## Exact Demo Flow To Prove Dual Database Value

This is the strongest possible sequence for the live video and judging test.

1. Admin opens command center.
2. Production Evidence panel loads `/api/health/detailed`.
3. Panel shows:
   - Aurora PostgreSQL connected.
   - DynamoDB connected.
   - `production_ready: true`.
   - four DynamoDB tables.
4. Villager logs in.
5. Villager sends one SOS ambulance request.
6. Backend writes to Aurora table `ambulance_requests`.
7. Backend writes to DynamoDB table `emergency_streams`.
8. Admin live feed updates through SSE.
9. ASHA dashboard shows pending ambulance/referral work.
10. Admin exports or previews a district report.

If this sequence works smoothly, the project feels like production software rather than a feature collage.

---

## Data Model Talking Points

Use these in the architecture diagram, Devpost text, and demo narration.

### Aurora PostgreSQL

Use Aurora for durable relational health operations:

- `users`: role-based registry for villagers, ASHA/NGO users, and admins.
- `village_health`: village registry, population, health indicators, district mapping.
- `symptoms`: clinical triage history and model outputs.
- `ambulance_requests`: emergency and pad request workflow.
- `pregnancy_data`: maternal health records and risk levels.
- `malnutrition_data`: child nutrition assessments.
- `referrals`: ASHA-to-PHC follow-up loop.
- `vaccination_records`: child immunization tracking.
- `audit_logs`: sensitive action trail.
- `district_config`: per-district operational settings.

Why Aurora: ACID guarantees, joins, reports, foreign-key-like workflows, and reliable records for health operations.

### DynamoDB

Use DynamoDB for time-sensitive events and operational telemetry:

- `outbreak_telemetry`: outbreak events keyed by village and time, plus disease index.
- `sync_queues`: offline queue replay telemetry by device and status.
- `village_node_state`: village connectivity/sync state with TTL.
- `emergency_streams`: high-priority SOS and emergency event stream.

Why DynamoDB: high write throughput, low latency, flexible event payloads, serverless scaling, and operational stream patterns.

---

## Architecture Diagram Requirements

The final diagram should show these exact arrows:

- Vercel React PWA -> Express API over REST.
- Vercel React PWA -> Express API over SSE for admin live feed.
- Express API -> Aurora PostgreSQL for users, records, referrals, reports.
- Express API -> DynamoDB for emergency streams, sync telemetry, outbreak telemetry, node state.
- Express API -> FastAPI AI service for disease, pregnancy, malnutrition, skin, and RAG.
- FastAPI Outbreak Agent -> Express API `/api/admin/clusters`.
- FastAPI Outbreak Agent -> Express API `/api/admin/outbreak-alert`.
- Admin dashboard -> `/api/health/detailed` for production evidence.

Diagram labels should include:

- AWS Region: `ap-south-1`.
- Vercel frontend deployment.
- Aurora PostgreSQL.
- DynamoDB table names.
- Offline IndexedDB queue in browser.
- RAG/AI service as auxiliary, not primary database.

---

## Verification Commands

Run these before recording and before submitting. Replace URLs with deployed hosts.

```bash
curl https://<backend>/api/health
curl https://<backend>/api/health/detailed
```

Expected health proof:

```text
production_ready: true
aurora_postgresql.status: connected
dynamodb.status: connected
```

Frontend build:

```bash
cd frontend
npm install
npm run build
```

Backend install/start smoke:

```bash
cd backend
npm install
npm start
```

AI service smoke:

```bash
cd ai-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Manual browser checks:

- [ ] Vercel app opens.
- [ ] Login works.
- [ ] Admin dashboard loads.
- [ ] Production Evidence loads.
- [ ] Ambulance request succeeds.
- [ ] DynamoDB feed changes after event.
- [ ] ASHA dashboard sees pending work.
- [ ] Offline queue UI does not crash.

---

## Risk Register

| Risk | Severity | Symptom | Mitigation |
|------|----------|---------|------------|
| Live API shows SQLite/mock | Critical | `/api/health/detailed` says SQLite fallback or mock DynamoDB | Fix env vars before recording; do not submit AWS proof until `production_ready` is true |
| Vercel blocks camera/mic/GPS | Critical | Skin scan, voice, or SOS location fails only on deployed app | Fix `Permissions-Policy`; test deployed domain |
| PWA icons 404 | High | Install prompt fails or Lighthouse PWA score drops | Add missing assets and verify manifest |
| Demo video exceeds 3 minutes | High | Judges may stop watching | Keep script 2:40 and final edit under 2:55 |
| Static "Connected" labels contradict API | High | UI says connected while API says mock | Bind labels to real health endpoint |
| AI overclaims diagnosis | High | Healthcare judges distrust clinical safety | Use triage language, confidence, uncertainty refusal, ASHA escalation |
| DynamoDB Scan criticism | Medium | AWS judges see scan-backed dashboard | Add GSI/rollup plan or implementation and explain access patterns |
| Offline demo auth looks insecure | Medium | localStorage password cache hurts trust | Label as demo mode and document production auth path |
| Too many features in video | Medium | Judges miss core database story | Use admin-first 2:40 flow |
| No Vercel proof | Critical | Submission violates platform requirement | Deploy frontend on Vercel and screenshot project/team config |

---

## Day-by-Day Execution Plan

### Day 1 - Trust And Compliance

- [ ] Fix Vercel permissions for camera/microphone/geolocation.
- [ ] Add missing PWA icons.
- [ ] Deploy frontend to Vercel.
- [ ] Deploy backend with Aurora and DynamoDB env vars.
- [ ] Verify `/api/health/detailed` is production-ready.
- [ ] Capture first AWS proof screenshots.

### Day 2 - Production Evidence

- [ ] Add Admin Production Evidence panel.
- [ ] Replace static DB connected labels with live health state.
- [ ] Add latest telemetry timestamps.
- [ ] Test one ambulance action creates Aurora + DynamoDB records.
- [ ] Record a short internal proof clip.

### Day 3 - B2B SaaS Polish

- [ ] Add or polish district onboarding flow.
- [ ] Surface district config.
- [ ] Polish monthly district report preview/export.
- [ ] Add ASHA workload queue improvements.
- [ ] Tighten dashboard copy around buyer value.

### Day 4 - Technical Prize Polish

- [ ] Add DynamoDB GSI/rollup improvement or document a clear access pattern.
- [ ] Add smoke tests or at least executable verification scripts.
- [ ] Add idempotency keys for offline queue replay if time allows.
- [ ] Add AI service health proof and conservative clinical labels.

### Day 5 - Submission Package

- [ ] Finalize Devpost description.
- [ ] Export architecture diagram.
- [ ] Record under-3-minute video.
- [ ] Publish bonus blog/post/video.
- [ ] Final clean-browser test.
- [ ] Submit.

---

## B2B SaaS Winning Framing

Position SwasthAI as a **District Health Operations Command Center**, not just a villager health chatbot.

| B2B buyer | Pain | Product proof to show |
|-----------|------|-----------------------|
| District CMO / public health office | Late outbreak visibility, paper reports, poor ASHA follow-up | Admin command center, live outbreak telemetry, district report export, ASHA performance |
| NGO healthcare operator | Field workers lose data in low-connectivity villages | Offline queue, ASHA dashboard, maternal/child workflows, sync telemetry |
| Hospital / PHC network | Referrals arrive late or without context | Referral workflow, emergency feed, risk triage, closure outcome tracking |
| State health program team | Hard to audit scheme eligibility and coverage | Government schemes matching, vaccination records, district config, CSV exports |

**One-line product thesis:**  
SwasthAI turns disconnected village health work into auditable district intelligence using Vercel, Aurora PostgreSQL, and DynamoDB.

---

## Product Improvements To Reach Top 3 B2B

| Priority | Improvement | Target prize criterion |
|----------|-------------|------------------------|
| P0 | Add "District Onboarding" flow: upload villages CSV, assign ASHA workers, set outbreak threshold, confirm AWS storage | B2B SaaS, real-world applicability |
| P0 | Add "Production Evidence" admin panel with live Aurora/DynamoDB proof and last-write timestamps | Technical implementation |
| P1 | Add procurement-ready dashboard cards: unresolved referrals, emergency SLA, ASHA sync lag, outbreak risk by village, monthly CMO report | B2B SaaS, design |
| P1 | Add explicit tenant/district configuration UX for `district_config` | Monetizable SaaS |
| P1 | Add role-scoped ASHA workload queue: pending referrals, high-risk pregnancies, missed vaccinations, pending syncs | Impact, design |
| P1 | Add monthly report export preview with "generated from Aurora + DynamoDB" footnote | B2B SaaS, AWS proof |
| P2 | Add pricing narrative in Devpost: district license + NGO deployment + support package | Monetizability |
| P2 | Add an implementation metrics page: API latency, DynamoDB writes, Aurora counts, queue replay duration | Technical implementation |

---

## Technical Implementation Prize Push

Use this as the engineering punch list.

- [ ] Replace or supplement cross-village DynamoDB scans with a production access pattern:
  - Option A: `districtId` partition key + `detectedAt` sort key GSI.
  - Option B: `districtId#YYYY-MM-DD` date bucket GSI.
  - Option C: daily `district_health_rollups` table for dashboard aggregates.
- [ ] Add an integration endpoint or admin panel card that proves a single demo action wrote to both:
  - Aurora PostgreSQL: clinical/emergency/referral record.
  - DynamoDB: telemetry/event stream record.
- [ ] Add idempotency keys for offline queue replay so duplicate reconnects do not create duplicate clinical records.
- [ ] Add `x-device-id` and `syncBatchId` to offline queue records and show them in DynamoDB telemetry.
- [ ] Add backend smoke tests for `/api/health/detailed`, `/api/auth/login-otp`, `/api/symptoms`, `/api/ambulance`, `/api/admin/dynamo-feed`.
- [ ] Add AI service health proof: model loaded, RAG chunks, threshold, and fallback state.
- [ ] Add deployment guardrail: in production, fail or clearly warn if `production_ready` is false before demo.

---

## Design Prize Push

The best design angle is not a flashy landing page. It is a calm, credible, high-density operations cockpit.

- [ ] Make the first demo screen the Admin Command Center, not a marketing page.
- [ ] Add a compact system status strip: Vercel, Aurora, DynamoDB, AI service, SSE clients, offline queue.
- [ ] Use live status colors only when backed by real API state.
- [ ] Reduce static demo labels in production dashboards; surface real counts first.
- [ ] Ensure all mobile forms fit without text overlap: login, ambulance, skin scan, maternal vitals, child nutrition.
- [ ] Verify camera, microphone, geolocation, and PWA install prompt on the deployed Vercel URL.
- [ ] Add a judge-friendly "Demo Path" button that walks through Villager -> ASHA -> Admin without hiding real data flows.

---

## Impact And Originality Push

Use these points in Devpost and the video.

- [ ] Impact: "Built for ASHA workers in low-connectivity villages, not for urban hospital desktops."
- [ ] Impact: Show offline ASHA data capture, reconnect sync, district visibility, and referral closure.
- [ ] Originality: "Village health work becomes event streams and operational intelligence."
- [ ] Originality: Dual database design is not decorative:
  - Aurora PostgreSQL stores ACID clinical records, users, referrals, maternal/child data.
  - DynamoDB stores high-throughput event streams, emergency telemetry, sync queue status, village node state.
- [ ] Safety: "The AI refuses uncertain diagnoses and routes to ASHA/PHC escalation."
- [ ] Equity: Mention multilingual support, voice input, offline queue, low-bandwidth image compression, and rural mobile ergonomics.

---

## Production AWS Proof Checklist

On the deployed API host, set:

```env
DATABASE_URL=postgresql://...@<aurora-endpoint>:5432/postgres
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
NODE_ENV=production
JWT_SECRET=...
AGENT_SECRET=...
AADHAAR_SALT=...
ALLOW_DEMO_OTP=true
```

Run seed once if needed:

```bash
cd backend
node seed.js
```

Verify:

```bash
curl https://<your-api>/api/health/detailed
```

Expected:

- [ ] `databases.aurora_postgresql.status` is `"connected"`
- [ ] `databases.dynamodb.status` is `"connected"`
- [ ] `production_ready` is `true`
- [ ] `databases.dynamodb.tables` lists `outbreak_telemetry`, `sync_queues`, `village_node_state`, `emergency_streams`
- [ ] At least one ambulance/SOS action creates an Aurora record and a DynamoDB `emergency_streams` item
- [ ] At least one outbreak/demo telemetry event creates a DynamoDB `outbreak_telemetry` item

---

## Required Screenshots For Devpost

- [ ] Vercel project overview showing deployed frontend URL.
- [ ] Vercel environment/config screen proving frontend API wiring.
- [ ] AWS Aurora/RDS console showing cluster/database in `ap-south-1`.
- [ ] DynamoDB console showing the four tables and GSIs.
- [ ] `/api/health/detailed` response showing `production_ready: true`.
- [ ] Admin dashboard "Production Evidence" panel.
- [ ] Architecture diagram with backend components and database arrows.

---

## Judge-Safe Live URLs

| Check | URL |
|-------|-----|
| Vercel app | `https://<your-vercel-app>.vercel.app` |
| Stack health | `https://<backend>/api/health/detailed` |
| Basic health | `https://<backend>/api/health` |
| Demo page | `https://<your-vercel-app>.vercel.app/demo` |

### Demo Logins

| Role | Login | OTP / password |
|------|-------|----------------|
| Villager | `9876543210` | OTP `1234` or `Demo@1234` |
| ASHA / NGO | `9876543211` | OTP `1234` or `Demo@1234` |
| Admin | `admin@swasthai.in` or `9876543212` | OTP `1234` or `Demo@1234` |
| New ASHA signup | Any valid form data | Passcode `ASHA2026`, password 6+ chars |

Keep the Devpost testing instructions honest: demo OTP is enabled for evaluation; production auth would use real OTP provider/device-bound auth.

---

## 2:40 Demo Video Script

**Hard limit:** final video must be under 3 minutes.

1. **0:00-0:15 - Problem and buyer**  
   "District health teams and NGOs cannot see village risks in time because ASHA work happens offline, on paper, and across low-connectivity areas."

2. **0:15-0:35 - Admin Command Center first**  
   Show dashboard with live status strip. Say: "This is a district health operations command center."

3. **0:35-0:55 - AWS proof**  
   Open Production Evidence or `/api/health/detailed`. Show Aurora connected, DynamoDB connected, `production_ready: true`, and table names.

4. **0:55-1:25 - Villager event**  
   Log in as villager. Submit symptom or SOS ambulance request. Mention Aurora stores clinical/emergency record.

5. **1:25-1:50 - DynamoDB telemetry**  
   Return to admin or monitoring view. Show live emergency/outbreak/sync event in DynamoDB feed and SSE/admin update.

6. **1:50-2:15 - ASHA/NGO workflow**  
   Log in as ASHA. Show pending request, maternal/child record, referral, or vaccination follow-up.

7. **2:15-2:30 - Offline-first proof**  
   Show queued record or sync health concept: data captured offline, replayed later, telemetry logged.

8. **2:30-2:40 - Close**  
   "SwasthAI turns disconnected village health work into auditable district intelligence using Vercel, Aurora PostgreSQL, and DynamoDB."

---

## If The API Fails During Recording

- Do not pretend mock data is production.
- Say: "The application has a judge demo mode for UI continuity, but the required AWS proof is the live `/api/health/detailed` endpoint and AWS console screenshots."
- Use the Judge Evaluation Toolkit only after showing the real stack proof.
- Re-record the AWS proof section if `production_ready` is not `true`.

---

## Do Not Show Unless Tested After Latest Deploy

- [ ] Brand-new user registration mid-demo.
- [ ] Monitoring Dashboard offline simulation.
- [ ] Camera skin scan on Vercel if permissions policy is not fixed.
- [ ] Voice input on Vercel if microphone permission is not fixed.
- [ ] GPS ambulance on Vercel if geolocation permission is not fixed.
- [ ] Any screen that says "Connected" without live API backing.

---

## Devpost Writing Checklist

- [ ] Lead with B2B buyer: district health offices, NGOs, PHCs.
- [ ] Explain monetization: district SaaS license, NGO deployments, support/onboarding, analytics/reporting tier.
- [ ] Explain why Aurora: relational health records, referrals, users, maternal/child data, reports.
- [ ] Explain why DynamoDB: high-throughput telemetry, emergency streams, outbreak events, offline sync status.
- [ ] Explain Vercel: fast deploy, PWA frontend, edge-friendly static assets, mobile-first access.
- [ ] Explain safety: triage support, uncertainty refusal, ASHA escalation, audit logs.
- [ ] Explain impact: rural India, ASHA workers, low-connectivity environments, multilingual/voice access.
- [ ] Explain originality: offline field work becomes real-time district intelligence.

---

## Bonus Content Plan

Publish up to three public pieces for bonus points. Each must say it was created for the H0 Hackathon and include `#H0Hackathon` when shared socially.

| Content | Angle | Status |
|---------|-------|--------|
| Blog / dev.to | Building an offline-first district health SaaS with Vercel, Aurora PostgreSQL, and DynamoDB | [ ] |
| LinkedIn post | Why rural health needs event-driven telemetry, not another chatbot | [ ] |
| Short YouTube architecture video | Aurora for records, DynamoDB for telemetry, Vercel for mobile PWA | [ ] |

---

## API Routes Aligned For Code Reviewers

All frontend services should match backend mounts under `/api`:

- Villager: `/symptoms`, `/ambulance`, `/my-history`, `/villager/pad-request`, `/villager/sync-health`, `/villager/phq2`
- NGO: `/ngo/maternal`, `/ngo/malnutrition`, `/ngo/stats`, `/ngo/residents`, `/ngo/pads`, `/ngo/referrals`, `/ngo/vaccinations`
- Admin: `/admin/users`, `/admin/analytics`, `/admin/dynamo-feed`, `/admin/district-report`, `/admin/asha-performance`, `/health/detailed`

---

## Final Pre-Submit Gate

Do not submit until every line below is true:

- [ ] Vercel app opens from a clean browser profile.
- [ ] Demo credentials work for Villager, ASHA, and Admin.
- [ ] `/api/health/detailed` shows Aurora connected and DynamoDB connected.
- [ ] A demo action creates both a relational record and a telemetry event.
- [ ] Demo video is under 3 minutes.
- [ ] Architecture diagram and AWS screenshots are uploaded.
- [ ] Devpost text clearly says which AWS Databases were used.
- [ ] No untested feature is shown in the video.

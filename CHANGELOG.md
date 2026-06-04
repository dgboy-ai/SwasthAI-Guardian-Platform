# Changelog — SwasthAI Guardian Platform

All notable changes and feature developments completed during the hackathon window are documented in this file chronologically.

---

## June 4, 2026
### Added
- **Scoped Outbreak Alerts Route**: Added `GET /api/ngo/outbreaks` route supporting server-side `villageId` filtering, securing local outbreak telemetry access and eliminating the need for `admin` level roles on the NGO dashboard.
- **Client-Side Image Compression & Camera Capture**: Integrated `navigator.mediaDevices.getUserMedia` for live camera capture on the Symptom Checker, alongside canvas-based compression (downscaling and compressing to ≤200KB) to prevent high-payload Express body parser limit failures.
- **Audio Context Optimization**: Refactored the dashboard's emergency buzzer to use a single `AudioContext` instance, avoiding browser-enforced resource limits.
- **Refined Status Updates**: Optimized dashboard requests to selectively re-fetch only the modified list (triage vs resources), preventing redundant network overhead.
- **Sakhi Chatbot Persistence & Offline Triage**: Enabled `sessionStorage` chat history caching, refactored offline clinical keyword triage to matching local tips, and dynamically scaled voice synthesis length according to triage urgency levels.
- **Speech Recognition Lang-Chain Fallback**: Implemented an automated fallback language chain (e.g., Hindi -> English -> Tamil etc.) for the browser Web Speech API to maximize transcription compatibility on rural devices.

---

## June 3, 2026
### Added
- **ASHA-to-PHC Referral Outcomes**: Integrated closed-loop tracking fields (`outcome`, `outcome_details`, `closed_at`) to fully close the care referral loop.
- **Mission Indradhanush Immunization Tracking**: Created a child vaccination tracking system (`vaccination_records` table) for monitoring scheduled vs administered shots.
- **ASHA Performance Dashboard**: Exposed aggregated KPIs (completed referrals, pregnancies tracked, vaccinations, emergency alerts) per worker for CMO district metrics.
- **Security Audit Logging**: Created asynchronous Express middleware (`backend/middleware/audit.js`) to capture access and updates on sensitive database endpoints.
- **District Config Settings**: Created a per-district threshold override database (`district_config`) allowing CMOs to toggles auto-ambulances and override contact numbers.
- **SQLite Database Auto-Migrations**: Implemented SQLite-specific dynamic column check and alter migrations in `backend/db/schema.js` to ensure older local development sqlite databases auto-update cleanly on reboot.
- **DynamoDB GSI Query Route**: Built `GET /api/admin/outbreaks/disease-search` executing QueryCommand against `disease-index` GSI.
- **Offline Sync-Health Logger**: Added `POST /api/villager/sync-health` logging sync telemetry to DynamoDB.
- **Mental Health PHQ-2 Screener**: Added `POST /api/villager/phq2` triage screener that auto-creates urgent ASHA referrals on depression risk.
- **QR-Code Scan Login**: Added passwordless `POST /api/auth/qr-login` allowing auth by scanning Aadhaar or Village Card QR payloads.
- **Resilient Event Dispatcher**: Hardened with relational database null-guards during startup, automated 3-attempt retries for telemetry writes, and sanitized partition key values for emergency streams.
- **Secure & Idempotent Database Seeding**: Blocked demo seeds in production environment (`NODE_ENV === 'production'`), added SQL `ON CONFLICT DO NOTHING` / `INSERT OR IGNORE` constraints to inserts, structured table dependencies (villages -> users -> clinical tables), and queried user IDs dynamically.
- **AI RAM Optimization & Windows Port Compatibility**: Integrated lazy imports of `torch` and `sentence_transformers` (saving ~400MB RAM when deep model is disabled), resolved Windows Unicode console logging crashes, and added backward-compatible conditional `BatchNorm1d` support to the MLP structure.
- **Inclusive Skin Analysis CV Triage**: Refactored the skin CV pipeline to use a tone-inclusive HSV skin tone detector (supporting melanin-rich skin down to 5% brightness), upgraded saturation analysis via NumPy, and expanded outputs to 5 ISIC-aligned dermatological classifications (Melanoma Risk, Eczema, Tinea, Contact Dermatitis, Normal).

---

## June 2, 2026
### Added
- **Pregnancy Tracking Reference**: Added `recorded_by` relation linking maternal records to registered ASHA users.
- **OTP Retention Optimization**: Built daily background OTP deletion routines inside Express to automatically expire and prune older logs.
- **Structured Heuristics Database**: Partitioned rule outputs inside the relational database, splitting plain-text models into `disease`, `advice`, `confidence`, and `model_used`.
- **Government Schemes Aadhaar e-KYC**: Added customized e-KYC checklists and documents checks for schemes like PM-JAY, JSY, and PMMVY.

---

## June 1, 2026
### Added
- **SymptomNet Deep Learning Classifier**: Integrated deep-learning MLP classifier as the primary symptom evaluator.
- **LLM Outbreak Processing**: Enabled Groq-powered LLaMA-3.3-70B model with strict JSON schema enforcement to classify symptom clusters into formatted output alerts.

---

## May 31, 2026
### Added
- **Offline Event Replay Engine**: Designed IndexedDB queues on the client that replay write events automatically when internet connection resumes.
- **District Simulation Observability**: Built live system charts illustrating local node heartbeat connectivity, queue sizes, and sync delays.

---

## May 30, 2026
### Added
- **Dual-Database Layer (PostgreSQL + DynamoDB)**: Moved relational operational data to Amazon Aurora and event streams to Amazon DynamoDB.
- **SSE Real-time Emergency Feed**: Enabled Server-Sent Events (SSE) from the Node.js backend to push incoming alerts instantly to admin dispatch monitors.

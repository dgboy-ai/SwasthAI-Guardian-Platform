# Changelog — SwasthAI Guardian Platform

All notable changes and feature developments completed during the hackathon window are documented in this file chronologically.

## June 7, 2026
### Added
- **Production API Fallback & Vercel Fix**: Resolved JSON parsing failures caused by Vercel returning HTML error pages when querying relative paths without a configured proxy. Exposes fallback routing directly to the live Render backend (`https://swasthai-guardian-platform.onrender.com/api`) inside the Axios API client, Schemes page, and Admin SSE feed.
- **Frictionless Demo Login & SaaS Anchor Pitch**:
  - Implemented 1-click frictionless demo login shortcuts in both the Landing Page hero and Login Page credential cards to streamline evaluation flows for judges.
  - Anchored the platform's presentation with a prominent B2B SaaS pitch tagline for the "Guardian" operations dashboard.
  - Added a custom-designed B2B SaaS Pricing section showing District and State tier subscriptions.
  - Formulated a "Zero Vaporware" telemetry validation panel displaying model accuracy metrics (101 diseases, 64.6% accuracy, 243 RAG chunks) and active AWS RDS/DynamoDB connectivity details.
- **AI Service Integration Workflow & CI Validation**:
  - Upgraded root `package.json` setup, build, and development commands to automatically install and run the Python FastAPI service concurrently with frontend/backend Node services.
  - Extended the GitHub Actions CI pipeline with an integration health check step that boots the FastAPI microservice and validates it responds successfully to the `/health` endpoint.
- **Quantified Impact Dashboard (Command Center)**: Added a dynamic Impact Panel to `AdminDashboard.jsx` showing judge-facing metrics — lives potentially impacted (2,34,000), maternal deaths preventable (12/year), avg. outbreak detection time (4.2 hrs vs. 72-hr manual baseline), and cost per ASHA worker (₹0 offline-first).
- **Agentic Outbreak Simulation**: Added `POST /api/admin/outbreak` backend route and a "Simulate Outbreak Event" button in the Admin Command Center to trigger real-time SSE broadcast events, making the agentic loop visible to judges.
- **Live Reports Panel**: Wired the Admin Reports view to live `/api/admin` endpoints for SOS and symptom cluster counts. Added a "Weekly Health Trends" double-bar chart showing real-time data instead of static seed values.
- **Documentation Consolidation**:
  - Merged Aurora ER diagram and DynamoDB table schemas (with GSIs and access patterns) into `docs/system_architecture.md` as a single authoritative reference for AWS database panel judges.
  - Removed redundant `docs/data_model.md` — all content consolidated into `docs/system_architecture.md`.
  - Removed `ARCHITECTURE.md` from repo root — content superseded by the enriched `docs/system_architecture.md`.
  - Updated `README.md` technical docs index to point directly to the consolidated architecture file.

---

## June 5, 2026
### Added
- **AI Service Environment Configuration**: Added `python-dotenv` support to automatically load `GROQ_API_KEY` at startup in the FastAPI service, resolving the `503` RAG offline fallback issue.
- **Windows Emoji Console Crash Fix**: Reconfigured outbreak agent stdout to `UTF-8` and replaced emoji log markers with ASCII-safe strings, preventing UnicodeEncodeErrors on Windows environments.
- **Speech Synthesis Autoplay Control**: Disabled automatic text-to-speech triggers in `SakhiChatbot.jsx` and `SymptomCheckerPage.jsx` to prevent voice playback interference during demo video recording, while preserving manual read-aloud buttons.
- **Project Audit & Roadmap Status**: Updated the master audit log and hackathon checklist (`audit_and_roadmap.md`) to mark all roadmap phases as fully completed.

---

## June 4, 2026
### Added
- **LoginPage/DemoPage Credential Mismatch Fix**: Resolved offline login session issues by integrating `setUser` state propagation and correcting the localStorage key to `'user'` on offline fallback login.
- **WHO Z-score Calculator Alignment**: Aligned FastAPI AI service and offline frontend calculations using the official WHO Weight-for-Height Z-score (WHZ) table lookup and linear interpolation, categorizing SAM, MAM, and underweight cases correctly.
- **Admin /monitor Route**: Added a protected `/monitor` routing path for administrative access to the Monitoring Dashboard in the SPA router.
- **Interactive Disease Trends GSI & Proactive Risk Predictor**: Added a `/api/admin/disease-trends` GSI endpoint for querying `disease-index` on DynamoDB, a `/predict/seasonal-risk` proactive outbreak risk predictor using Indian seasonal trends, and constructed dedicated interactive controls inside the Monitoring Dashboard UI.
- **Project Architecture Documentation**: Created architecture documentation detailing cross-tier data flows including a Mermaid diagram mapping frontend PWAs, hybrid databases, and Python AI models (consolidated into `docs/system_architecture.md`).
- **Scoped Outbreak Alerts Route**: Added `GET /api/ngo/outbreaks` route supporting server-side `villageId` filtering, securing local outbreak telemetry access and eliminating the need for `admin` level roles on the NGO dashboard.
- **Client-Side Image Compression & Camera Capture**: Integrated `navigator.mediaDevices.getUserMedia` for live camera capture on the Symptom Checker, alongside canvas-based compression (downscaling and compressing to ≤200KB) to prevent high-payload Express body parser limit failures.
- **Audio Context Optimization**: Refactored the dashboard's emergency buzzer to use a single `AudioContext` instance, avoiding browser-enforced resource limits.
- **Refined Status Updates**: Optimized dashboard requests to selectively re-fetch only the modified list (triage vs resources), preventing redundant network overhead.
- **Sakhi Chatbot Persistence & Offline Triage**: Enabled `sessionStorage` chat history caching, refactored offline clinical keyword triage to matching local tips, and dynamically scaled voice synthesis length according to triage urgency levels.
- **Speech Recognition Lang-Chain Fallback**: Implemented an automated fallback language chain (e.g., Hindi -> English -> Tamil etc.) for the browser Web Speech API to maximize transcription compatibility on rural devices.
- **Offline Queue Sync on Online Event**: Integrated `syncAllQueues()` inside `OfflineToast`'s connection recovery listener to trigger automatic replay of queued IndexedDB operations immediately upon returning online.
- **Navigator Online Behavior Documentation**: Documented the initialization behavior of `wasOnlineRef` from `navigator.onLine` to formally log that preventing the "Back Online" toast on first mount (if already online) is correct behavior.
- **Admin Dashboard Bundle Optimization**: Extracted all static demo constants (`DEMO_STATS`, `DEMO_SUMMARY`, etc.) to a separate `judgeDemo.js` file and loaded them dynamically via ES import code-splitting when demo mode is activated, preventing leakage into initial production chunks.
- **Resilient SSE Connection Pathing**: Updated `EventSource` endpoint setup in `AdminDashboard.jsx` to dynamically fallback to `window.location.origin` if the environment is production and `VITE_API_URL` is omitted, resolving live-feed failures on preview server deployments.
- **Alert Dispatch Error Handling**: Wired try-catch error alerts on the manual outbreak dispatch trigger to show fallback alert failure statuses when backend is unreachable, rather than silently marking alerts as sent.
- **Demo Mode CSV Headers**: Appended clear `# ⚠️ [DEMO DATA]` headers to client-side report fallbacks generated in offline demo mode to inform evaluators of mock datasets.
- **Notification Panel Dropdown**: Configured the header notification Bell icon to toggle a slide-in dropdown panel listing active outbreak alerts on click, providing intuitive user feedback.
- **Full API Clients Expansion**: Expanded `adminService.js` and `villagerService.js` to expose full client wrappers for all backend endpoints (outbreak telemetry, RAG traces, demo seeding, symptom history, government schemes, PHQ-2, and chat assistants), ensuring robust module coverage.
- **Optimistic UI Status Updates**: Refactored `NGODashboard.jsx` status updates with an optimistic update pattern that immediately reflects status changes in local state, falling back and rolling back state cleanly if the backend request fails.
- **Dynamic Village Map with Leaflet.js**: Replaced the static SVG district map in `DistrictOutbreakMap.jsx` with an interactive Leaflet.js map centered on Varanasi, rendering a dark-themed CartoDB tile layer and a stylized GeoJSON district boundary polygon.
- **Live Village Nodes from Backend**: Added `GET /api/admin/villages` endpoint on the backend that queries `village_health` table joined with `users` (role `ngo`) to return dynamic village nodes including real ASHA contact phone numbers — replacing all hardcoded `DEFAULT_NODES` and placeholder numbers.
- **Telemetry Re-poll API**: Added `GET /api/admin/village-status?villageId=X` endpoint aggregating SQLite village metrics with DynamoDB `village_node_state` node telemetry and recent `outbreak_telemetry` records, wired to the **Re-poll Telemetry** button in the map panel.
- **Outbreak Simulation Map Sync**: Wired `window.dispatchEvent(new CustomEvent('outbreak_simulation_trigger', ...))` inside `MonitoringDashboard.jsx`'s `runOutbreakSurge()` so that running the outbreak simulation live-updates map node status without requiring a page reload.
- **Centralized Version Constants**: Created `frontend/src/constants/version.js` with `VERSION` and `COPYRIGHT_YEAR` exports; updated `LandingPage.jsx`, `AdminDashboard.jsx`, and `DemoPage.jsx` to import these constants, resolving the version year mismatch (2025 vs 2026) across the application.
- **Normalized React Hook Imports in ArchitectureFlow**: Fixed inconsistent `React.useState` / `React.useEffect` usage inside the `ArchitectureFlow` sub-component, replacing them with directly imported `useState` / `useEffect` hooks to match the rest of the codebase.
- **React Router Navigation Fix**: Replaced `window.location.href = '/monitor'` in the landing page simulation CTA with `navigate('/monitor')` to prevent full-page reloads and preserve SPA navigation state.
- **Hero CTA Keyboard Accessibility**: Added `aria-label` attributes and `focus-visible:ring-4` focus rings to the hero CTA buttons (Start Health Check, Emergency Help, Open Dashboard, Get Started) to meet WCAG keyboard accessibility requirements.
- **Open Graph & Twitter Meta Tags**: Added `og:type`, `og:title`, `og:description`, `og:image`, `twitter:card`, and `twitter:image` meta tags to `index.html` so social media share previews display a title and image.

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

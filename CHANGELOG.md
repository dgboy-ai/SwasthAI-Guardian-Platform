# Changelog — SwasthAI Guardian Platform

All notable changes and feature developments completed during the project development window are documented in this file chronologically.

## June 18, 2026 — Final Dashboard Section Order Correction
### Changed
- **ASHADashboard section order corrected**: Fixed `renderDashboardGrid()` so Today's Tasks + Quick Add Record appear immediately after the Status Row (Village Info, ASHA Worker, Offline Mode), before Active Outbreak Alert. Physically moved the Two-Column grid JSX block (Today's Tasks + Quick Add, lines 614–724) above Active Outbreak Alert (lines 726–752) in the render sequence. No CSS order, flex-order, or grid-order used.

### Correct Final Section Order
```
Status Row → Today's Tasks + Quick Add Record → Active Outbreak Alert →
AI Priority Center → Health Command Center → Live Field Impact →
Monthly Impact + Health Trends → Resource Allocation + Community Risk Heatmap →
Health Summary Cards → Sync Status → Village Analytics → Program Performance
```

### Modified Files
- `frontend/src/NGO/ASHADashboard.jsx`: Moved Two-Column grid (Today's Tasks + Quick Add) above Active Outbreak Alert, AI Priority Center, and Health Command Center in `renderDashboardGrid()`.

---

## June 17, 2026 — ASHA Workflow Information Hierarchy Reorder
### Changed
- **ASHADashboard section reorder for improved ASHA Worker workflow**: Reordered `renderDashboardGrid()` so ASHA workers see their daily work immediately after login. Section order updated to: Status Row → Today's Tasks + Quick Add Record → Active Outbreak Alert → AI Priority Center → Health Command Center → Live Field Impact → Monthly Impact + Health Trends → Resource Allocation + Risk Heatmap → Health Summary Cards → Sync Status → Village Analytics → Program Performance.
- **UI improvements to Today's Tasks**: Added `ring-1 ring-emerald-100/50` container highlight and `border-l-[3px] border-l-emerald-400/60` left-edge accent on active task cards. Priority badge enlarged to `text-[10px]` with more padding. Action buttons ("Visit Now", "Mark Done") increased to `px-5 py-3` with `shadow-md` for immediate visual prominence.

### Modified Files
- `frontend/src/NGO/ASHADashboard.jsx`: Reordered sections so actionable items appear first; enhanced Today's Tasks container and task card styling.

---

## June 17, 2026 — Maternal Care Visual Rendering Fix
### Fixed
- **Maternal Health Page faded/washed-out appearance**: Changed page background from `bg-[#F8FAFC]` (slate-50, a very light cool gray) to `bg-white`. The cool gray background created a visual perception of a semi-transparent overlay covering the entire page, making it look washed out and disabled. No actual opacity overlay was found — the `showForm` modal overlay was properly guarded and only rendered on user interaction. The fix aligns the page background with the pure white card backgrounds and other pages in the app for a clean, fully-opaque appearance.

### Modified Files
- `frontend/src/pages/MaternalHealthPage.jsx`: Root div background changed from `bg-[#F8FAFC]` to `bg-white`.

---

## June 17, 2026 (Round 4 — Finalist-Grade Healthcare SaaS Dashboard)
### Added
- **Health Command Center**: Replaced Executive Health Score card and standalone HealthScoreBreakdown component with a single unified premium command center. Features a large SVG circular ring gauge (82/100) on the left with overall health status, trend indicator (+4% vs last month), and village info. Right side displays 4 KPI metric cards (Vaccination, Maternal Health, Child Nutrition, Disease Risk) in a 2×2 grid with lucide-react icons, compact progress bars, trend arrows, and status badges (Excellent/Good/Fair/Low).
- **AI Priority Center**: Replaced emoji-based AI Health Assistant list with 4 premium actionable priority cards: High Risk Pregnancy (red, with AlertTriangle icon), Fever Cluster (orange, Thermometer icon), Malnutrition Follow-up (amber, Heart icon), and Vaccination Due (green, Shield icon). Each card includes risk badge, clinical summary, and primary action button with hover states. Grid layout: 1-col mobile → 2-col tablet → 4-col desktop.

### Changed
- **Professional Top Command Bar**: Upgraded desktop header with pill-style status indicators (Date, Live/Offline pulse, Sync time, AWS Live) in bordered badge containers with subtle shadows. Added `focus:ring-2 focus:ring-emerald-500/20` to global search input. Consistent `backdrop-blur-md bg-opacity-95` across both desktop and mobile headers. Sync button uses refined emerald-50/emerald-700 color scheme with hover state.
- **Card Quality & Micro-interactions**: All 4 health summary KPI cards (SOS, Pregnancy, Malnutrition, Pad Requests) upgraded from emoji icons to lucide-react professional icons (Ambulance, Heart, Baby, HeartHandshake) with `group-hover` brightness transitions on icon containers. Added `hover:bg-slate-100` transitions to Monthly Impact stat boxes and Program Performance cards. Village Analytics cards gained `group-hover:brightness-95` icon feedback. Risk Heatmap rows added `hover:brightness-95` effect.
- **HealthScoreBreakdown Component**: Complete rewrite as Health Command Center with LEFT/RIGHT responsive layout (stacks vertically on mobile). 112px score ring, 4 metric cards, all data preserved.

### Removed
- **Duplicate Health Score Section**: Removed 100-line inline Executive Healthcare Intelligence Card that duplicated data now in Health Command Center. Eliminated redundant ring gauge, mini progress bars, and KPI overlay that overlapped with the component.

### Modified Files
- `frontend/src/NGO/components/HealthScoreBreakdown.jsx`: Complete rewrite as Health Command Center with 2-column layout (score ring + 4 metric cards).
- `frontend/src/NGO/ASHADashboard.jsx`: Replaced Executive card + HealthScoreBreakdown call with single Health Command Center; replaced AI Health Assistant with AI Priority Center; upgraded desktop/mobile headers; upgraded 4 health summary cards to lucide icons; added hover/transition micro-interactions to Village Analytics, Monthly Impact, Risk Heatmap, Program Performance sections.

---

## June 17, 2026 (Round 3 — Product Polish & Branding Overhaul)
### Added
- **BrandLogo Component**: New reusable `BrandLogo` component (`NGO/components/BrandLogo.jsx`) with 3 size variants (sm/md/lg), heart icon, and "SwasthAI / EMPOWERING RURAL BHARAT" subtitle.
- **Village Analytics Dashboard Section**: New real product feature sections replacing hackathon judge panels — includes Village Analytics overview cards (Villages Covered, Active Patients, Health Workers, Monthly Checkups), Monthly Impact Summary, Health Trends (Maternal, Child Nutrition, Disease Surveillance, Emergency Response), Resource Allocation with progress bars, Community Risk Heatmap, and Program Performance metrics.
- **User Profile Dropdown**: Top-right profile menu with Profile, Settings, and Logout — consistent across desktop sidebar and mobile header.

### Changed
- **Branding Overhaul**: All branding standardized to "SwasthAI / EMPOWERING RURAL BHARAT" across Navbar, Footer, Login, Register, ASHA Dashboard (sidebar, mobile header, loading screen, mobile drawer). Removed all "GUARDIAN" and "ASHA Field Center" references.
- **Health Score Section — Compact 2-Column Layout**: Restructured Village V101 Health Score card into a compact 2-column layout (score ring + progress bars on left, 2x2 KPI cards on right), reducing vertical height by ~40%. Progress bars given `max-w-[180px]` to prevent full-width stretching. Tooltips removed. Mobile renders as single-column stack.
- **Dashboard Header**: Collapsed sidebar branding reduced to centered icon-only; loading screen uses BrandLogo.

### Removed
- **Hackathon/Judge Sections**: Removed `JudgeDemoMode`, `JudgePanel`, and `LiveImpactCounter` components from dashboard. Removed demo state management (`demoScenario`, `demoMode`, `handleDemoSimulation`). Removed unused imports.
- **Unused Imports**: Cleaned up `OfflineFirstHealth`, `LiveImpactCounter`, `JudgeDemoMode`, `JudgePanel` imports.

### Fixed
- **React Build Error — Parentheses Balance**: Fixed missing closing parenthesis in nested ternary `.map()` callback (line 957) — added third `)` to match `(tasks.map(task => ( ... )))` nesting. Fixed extra closing parenthesis in Program Performance metrics map (line 1176).

### Modified Files
- `frontend/src/NGO/ASHADashboard.jsx`: Branding replacement, removed judge sections, added real product features, compacted health score section, fixed paren bugs.
- `frontend/src/NGO/components/BrandLogo.jsx`: New reusable brand component.
- `frontend/src/components/Navbar.jsx`: Branding updated.
- `frontend/src/components/Footer.jsx`: Branding updated.
- `frontend/src/pages/LoginPage.jsx`: Branding updated.
- `frontend/src/pages/RegisterPage.jsx`: Branding updated.

---

## June 17, 2026 (Round 2 — Hackathon Judge-Upgrade)
### Added
- **Live Impact Counter**: New `LiveImpactCounter` component with 6 animated stats (Pregnancies: 24, Children: 156, Symptoms: 418, Emergencies: 37, Villagers: 1428, Lives Saved: 860+) using framer-motion count-up animation on mount. Dark-themed gradient card matching Judge Demo Mode style.
- **Judge Panel (Why SwasthAI Wins)**: New `JudgePanel` collapsible accordion component listing 6 key differentiators (Offline-First, AI Triage, Resilient Sync, Real-Time Dashboard, Emergency Response, Judge-Ready Demo Mode) with icons, descriptions, and a footer summary. Expands/collapses with framer-motion animation.
- **Judge Demo Mode — Clickable Scenarios**: Rewrote `JudgeDemoMode` from sequential run-all to 5 individual clickable scenario cards (High Risk Pregnancy, Malnutrition Crisis, Disease Outbreak, Emergency SOS, Offline Sync) plus a "Run All" button. Each scenario independently updates dashboard state and shows completion status. Added "Show All/Collapse" toggle for responsive layout.
- **Malnutrition Demo Scenario**: New `malnutrition` scenario in `handleDemoSimulation` that adds 2 new SAM/MAM child records and fires a nutrition alert notification.
- **Offline-First Healthcare — Seeded Demo Data**: Enhanced `OfflineFirstHealth` with a `demoData` prop. When active, displays realistic seeded values (Maternal: 47, Child Nutrition: 112, Symptom Reports: 89, Ambulance: 14, Pending Queue: 3) with progress bars per category, a sync health progress bar (97% — Excellent), and a "Demo Data" badge.
- **Voice Assistant — Demo Commands**: Enhanced `VoiceAssistantFAB` with 5 hardcoded Hindi/English demo commands when Web Speech API is unavailable. Commands simulate pregnancy, symptom, and nutrition registrations with AI response text. Added collapsible "Try Demo Commands" section and "AI Response" confirmation box. Auto-detects speech support and surfaces demo mode hint.
- **Smart Task Manager — Priority & AI Recommendations**: Enhanced `SmartTaskManager` with due time, distance, suggested route, AI recommendation text, and clinical note display. 4 action buttons renamed to "Start Visit", "Reschedule", "Mark Complete", "Escalate" with priority color coding (HIGH RISK, FOLLOW-UP, URGENT, NORMAL).
- **Emergency Response — Visual Workflow Steps**: Enhanced `EmergencyResponseWorkflow` with a 6-step visual workflow progress bar (SOS Received → Patient Identified → Ambulance Assigned → ETA Generated → Hospital Alerted → Case Closed) that updates live during dispatch simulation. Driver contact number added.
- **Outbreak Response — Containment Progress**: Enhanced `OutbreakResponseCenter` with total cases count, risk summary, containment progress bar with +Update button, and tabbed UI for Villages / Actions / Checklist views. Heat-level indicators (red/orange/amber dots) on village rows.
- **Live Field Impact — Animated Counters**: Enhanced `LiveFieldImpact` to use framer-motion `AnimatedValue` hooks that count up from 0 to target on mount, plus staggered entry animation per card.
- **Health Score Breakdown — Dynamic Props**: Enhanced `HealthScoreBreakdown` to accept optional `categories` and `score` props for future dynamic updates.
### Modified Files
- `frontend/src/NGO/ASHADashboard.jsx`: Added imports for LiveImpactCounter, JudgePanel, Stethoscope; added demoScenario state, demoMetrics; enhanced handleDemoSimulation with malnutrition + notification support; added LiveImpactCounter and JudgePanel sections to dashboard grid.
- `frontend/src/NGO/components/JudgeDemoMode.jsx`: Rewritten with clickable scenario cards, showAll toggle, independent completion tracking.
- `frontend/src/NGO/components/OfflineFirstHealth.jsx`: Added demoData prop, seeded stats, progress bars, sync health indicator.
- `frontend/src/NGO/components/VoiceAssistantFAB.jsx`: Added 5 demo commands, AI responses, auto-detect demo mode.
- `frontend/src/NGO/components/SmartTaskManager.jsx`: Added priority colors, due time, route, AI rec, renamed actions.
- `frontend/src/NGO/components/EmergencyResponseWorkflow.jsx`: Added 6-step visual workflow progress bar, driver contact.
- `frontend/src/NGO/components/OutbreakResponseCenter.jsx`: Added containment progress, tabbed UI, heat indicators.
- `frontend/src/NGO/components/HealthScoreBreakdown.jsx`: Added dynamic categories/score props.
- `frontend/src/NGO/components/LiveFieldImpact.jsx`: Added AnimatedValue counter, framer-motion entry.
### New Files
- `frontend/src/NGO/components/LiveImpactCounter.jsx`: Animated impact counter with 6 stats.
- `frontend/src/NGO/components/JudgePanel.jsx`: "Why SwasthAI Wins" collapsible judge panel.
### Build
- `npm run build`: ✓ built in 50.70s — zero errors, zero warnings.

### Branding Restored to Original SwasthAI Guardian
- **ASHADashboard.jsx** — Mobile header branding: "Rural Health Network" → "ASHA Field Center" to match the desktop sidebar
- **ASHADashboard.jsx** — Mobile menu sidebar branding: unified from plain "SwasthAI Guardian" text to split "SwasthAI" / "GUARDIAN" (with green highlight) matching the desktop sidebar treatment; subtitle remains "ASHA Field Center"
- **Footer.jsx** — Removed "Empowering Rural Bharat" tagline, replaced with "Rural Health Network" for consistent brand voice
- Original icon (`Heart`), original spacing, and original color palette (`#059669` green) preserved everywhere
- No dashboard features, workflows, modals, or responsiveness affected

### Responsive Polish & Executive Health Intelligence Card
- **Executive Healthcare Intelligence Card**: Completely redesigned the "Village V101 – Health Score" section into a compact executive intelligence card with:
  - SVG circular progress ring (82/100) with stroke-dasharray animation
  - 4 KPI mini cards: Population Served (1,428), High Risk Cases (12), Vaccination Coverage (91%), Active Alerts (3) — 2-col mobile, 4-col desktop
  - Trend indicator with `TrendingUp` icon: Health Score +4 this month
  - Compact progress bars for Vaccination, Maternal Health, Child Nutrition, Disease Risk — 2-col grid
  - "Risk: Medium" badge in header using SwasthAI amber palette
  - Footer with `Clock` timestamp and village location
  - Zero empty white space, production healthcare dashboard styling
- All icon imports verified (Activity, Bell, Shield, Clock, TrendingUp all pre-existing in lucide-react imports)
- `HealthScoreBreakdown` component preserved below for expanded detail view

## June 17, 2026
### Added
- **AI Health Assistant Panel**: Enhanced existing AI Daily Priority with "AI Health Assistant" card featuring actionable buttons for high-risk pregnancy, fever verification, malnutrition follow-up, and vaccination due list. All buttons wired to dashboard state.
- **Health Score Breakdown**: Added new `HealthScoreBreakdown` component below Health Score card with SVG ring gauge, 4-category progress bars (Vaccination 91%, Maternal Health 78%, Child Nutrition 74%, Disease Risk 32%), color-coded trend indicators, and percentage changes.
- **Live Field Impact Dashboard**: New `LiveFieldImpact` component with 5 live KPI cards: pregnancies monitored (24), children screened (156), symptoms checked today (18), emergency responses (7), villagers served/month (412) with live pulse indicator.
- **Voice-First ASHA Workflow**: Floating microphone FAB button (`VoiceAssistantFAB`) supporting Hindi, Marathi, and English speech recognition. Voice input for symptom entry, pregnancy updates, and nutrition records with language selector.
- **Emergency Response Workflow**: Enhanced SOS modal with `EmergencyResponseWorkflow` component showing patient details, distance, nearest ambulance (AMB-042, 2.3km, 7min ETA), dispatch button with GPS progress, estimated response time, and resolution timeline.
- **Outbreak Response Center**: Enhanced outbreak modal with `OutbreakResponseCenter` component showing affected villages (4 villages with case counts), heat levels, risk status, 5-step suggested action plan, and field verification checklist with checkboxes.
- **Smart Task Management**: Enhanced task modal with `SmartTaskManager` component supporting Complete, Reschedule (1-day delay), Escalate to PHC, and Assign Follow-up actions with loading states and toast confirmations.
- **Offline-First Healthcare Status**: New `OfflineFirstHealth` component showing pending records breakdown (Maternal, Child, Ambulance, Symptoms), sync queue count, last sync timestamp, local IndexedDB connection status, and retry sync button.
- **Judge Demo Mode**: New `JudgeDemoMode` card with "Run Live Demo" button that sequentially simulates: new pregnancy case with high BP, fever outbreak with +8 cases, emergency SOS with chest pain, and offline sync recovery. Auto-populates all dashboards.
- **Loading Skeleton**: 600ms initial loading screen with animated brand logo and "Loading ASHA Dashboard..." text for polished startup experience.
- **Real-World Polish**: All 8 new components connected to dashboard state. No empty states, no dead buttons. Responsive on mobile/tablet/desktop. Professional healthcare UI matching existing design system.
### Fixed & Optimized
- **8 New Component Files**: Created under `frontend/src/NGO/components/` — `HealthScoreBreakdown.jsx`, `LiveFieldImpact.jsx`, `VoiceAssistantFAB.jsx`, `JudgeDemoMode.jsx`, `EmergencyResponseWorkflow.jsx`, `OutbreakResponseCenter.jsx`, `SmartTaskManager.jsx`, `OfflineFirstHealth.jsx`.
- **ASHADashboard.jsx Integration**: Added 200+ lines of integration code including new state variables, voice handler, demo simulation handler, new dashboard sections, enhanced modals, floating FAB, and loading skeleton.
- **Modified Files**:
  - `frontend/src/NGO/ASHADashboard.jsx`
  - `frontend/src/NGO/components/HealthScoreBreakdown.jsx` (new)
  - `frontend/src/NGO/components/LiveFieldImpact.jsx` (new)
  - `frontend/src/NGO/components/VoiceAssistantFAB.jsx` (new)
  - `frontend/src/NGO/components/JudgeDemoMode.jsx` (new)
  - `frontend/src/NGO/components/EmergencyResponseWorkflow.jsx` (new)
  - `frontend/src/NGO/components/OutbreakResponseCenter.jsx` (new)
  - `frontend/src/NGO/components/SmartTaskManager.jsx` (new)
  - `frontend/src/NGO/components/OfflineFirstHealth.jsx` (new)
  - `frontend/src/CHANGELOG.md`

## June 14, 2026
### Fixed & Optimized
- **Villager Dashboard & Guided Care Mode Cleanup**:
  - Removed "Guided Care Mode" dashboard containers and tracking modules from both desktop and mobile layouts in `VillagerDashboard.jsx` to streamline the user experience.
  - Permanently deleted 5 obsolete/unused workflow frontend files (`SakhiWorkflow.jsx`, `PregnancyWorkflow.jsx`, `FeverWorkflow.jsx`, `EmergencyWorkflow.jsx`, `ChildWorkflow.jsx`) and empty subdirectories to clean up the workspace.
  - Re-validated the Vite production environment compiler (`npm run build`), ensuring zero broken dependency imports or runtime errors.
- **Critical useEffect Import Crash (App.jsx)**:
  - Added missing `useEffect` import to line 1 of `frontend/src/App.jsx` — the entire app crashed on mount for every user because `useEffect()` was `undefined`.
- **AdminDashboard NaN Bug**:
  - Fixed `Math.max(0, undefined)` producing `NaN` values in `getLiveReport()` when `defaultRep` nested paths were missing — now defaults to `0` via `?.` optional chaining on every access.
- **6 Unhandled Promise Rejections (Backend Routes)**:
  - Wrapped `auth.js` routes (`/request-otp`, `/login-otp`, `/login-password`) in try-catch blocks.
  - Wrapped `ngo.js` maternal and malnutrition DB inserts (`INSERT INTO pregnancy_data`, `INSERT INTO malnutrition_data`) in try-catch blocks — these were previously outside any error handler.
  - Wrapped `villager.js` symptom duplicate-check query in try-catch with empty catch that falls through to fresh evaluation.
- **SymptomChecker Infinite Spinner Hang**:
  - Moved `res.send()` in `villager.js` `/symptoms` route to fire **before** DynamoDB telemetry writes (now fire-and-forget `.then().catch()`). On the Render demo with no AWS credentials, the SDK's credential chain resolution was blocking the response indefinitely.
  - Added 25-second safety timeout (`loadingSafeTimer`) in `SymptomCheckerPage.jsx` that force-clears the loading state — insurance against any hang in cache/offline/error paths.
  - Added missing `req.onblocked` handler in `semanticCache.js` IndexedDB `getDB()` — if another tab blocks the DB, resolves to `null` (memory fallback) instead of hanging forever.
- **Vercel API Proxy (vercel.json)**:
  - Added `/api/(.*)` rewrite rule targeting `https://swasthai-guardian-platform-0jsb.onrender.com/api/$1` so Vercel-deployed frontend can reach the backend without CORS preflight on every request.
- **AdminDashboard Logout Button**:
  - Added "Secure Logout" button at the bottom of the admin sidebar with collapsed-mode icon support; calls `useAuth().logout()` + navigates to `/login`.
- **ERD Mermaid Diagram Syntax Fixes**:
  - Replaced unsupported `UNIQUE` keyword with `UK` (parse error).
  - Removed quoted field comments with pipe characters (`"villager | ngo | admin"`, `"Low | High | Critical"`) causing "Expecting ATTRIBUTE_WORD, got COMMENT".
  - Fixed `users ||--o| village_health` → `users }o--|| village_health` (wrong cardinality — many users share one village).
- **Flow Graph Mermaid Fix**:
  - Changed bare `subgraph CDN & Hosting Layer` to `subgraph CDN and Hosting Layer [CDN & Hosting Layer]` with display brackets to prevent `&` rendering issues.
- **DEPLOYMENT.md VITE_API_URL Fix**:
  - Fixed missing `/api` suffix in Vercel deployment step — value was `https://swasthai-backend.onrender.com` but all backend routes require `/api/*` prefix.
- **README.md Missing Doc Links**:
  - Added links to `docs/offline_sync_strategy.md` and `docs/architecture-diagram.svg` in the technical documentation index.

### Added
- **Villager Dashboard Premium Redesign & Dynamic Localization**:
  - Replaced the overly-technical streaks, statistics, and SVGs of the HealthRing with a dynamic, checkable daily habit `WellnessCard` checklist tailored for rural villagers.
  - Connected habit completion rates to an animated status emoji indicator (`😊`, `😐`, `😕`, `🙏`) that reacts dynamically to progress.
  - Standardized greetings and content to support dynamic English/Hindi translation states (switching between `"Namaste"` vs `"Welcome"` and adapting all cards/descriptions).
  - Integrated dynamic dual "SwasthAI" branding text widgets at the top header of the mobile phone viewport layout.
- **Architecture Diagram (SVG)**:
  - Created `docs/architecture-diagram.svg` covering all 4 layers (Client, Backend, AI Service, Data) with every architecture-required arrow: Vercel→Express (REST+SSE), Express→Aurora PostgreSQL, Express→DynamoDB (5 tables with PK/SK/GSI), Express→FastAPI AI, Outbreak Agent↔Express, plus AWS Region `ap-south-1` label and legend.

## June 13, 2026
### Fixed & Optimized
- **Outbreak Radar View Design & Color Optimization**:
  - Switched Leaflet map layout to Voyager light mode tiles with stylized, white-bordered circle markers and light-themed tooltips.
  - Standardized component outer padding to `pl-8 pr-6 py-6` and removed child inline offsets, resolving telemetry alignment shifts.
  - Repositioned the absolute "Live Surveillance Area Map" title badge to `top-3.5` to prevent text clipping from overflow parent rules.
  - Polished action controls by styling all interactive buttons as solid-colored, pill-shaped (`rounded-full`) targets.
  - Replaced scale transforms in alert pulse animations with opacity toggles to eliminate container resizing jitter.
  - Replaced the label "Outbreak Response Cockpit" with "Outbreak Response Console" for refined dashboard terminology.
- **Outbreak Agent Watchdog Heartbeat**:
  - Fixed an offline reporting bug in `outbreak_agent.py` by introducing an idle telemetry report (`system-check` scan payload) when zero active symptom clusters are processed.
  - Ensures the background scanning daemon consistently refreshes its watchdog timestamp at the backend, preventing false offline warnings in the admin alert panel.
- **Admin Dashboard Integrity**:
  - Reverted and preserved the dark-slate design of the main dashboard and the production evidence panel components to keep them untouched.
- **PII Redaction Layer Fix**:
  - Removed `redactPII` import and interceptor call from `frontend/src/services/api.js` — backend `piiRedactor.js` handles it at the logging layer, preserving full query context for API calls.
- **403 Information Leak Prevention**:
  - Replaced 5 leaky 403 error messages in `backend/middleware/policy.js` with generic `"Access Denied."` — stripped `villageId`, role, and resource-existence details from error responses.
- **ONNX SymptomNet Lazy Loading**:
  - Removed static `import` of `symptomNetMeta.js` (~3–5MB, 109K lines) from `localSymptomNet.js`. Now uses dynamic `import()` on first `predictSymptomsOffline()` call, reducing initial bundle weight.
  - Added `await` in both callers (`SymptomCheckerPage.jsx`, `SymptomChecker.jsx`).
- **Rate Limiter on OTP Endpoint**:
  - Added `authLimiter` (15 requests per 15 minutes) to `POST /request-otp` in `auth.js` — same limiter already in place on `/login-otp`, `/login-password`, and `/qr-login`.
- **Global Error Handler & API 404 Catch-All**:
  - Added `app.use((err, req, res, next))` error-handling middleware and `app.all('/api/*')` 404 catch-all in `server.js` — prevents Node process crashes on unhandled errors and returns clean JSON for unknown API routes.
- **Zod Validation on /skin-log**:
  - Added `SkinLogSchema` validation in `villager.js` — validates `condition`, `severity`, `rednessPercent`, `irregularPercent` before DB write.
- **AdminDashboard Fallback Honesty**:
  - Changed `.catch()` handler from faking `production_ready: true` + fake DynamoDB tables → honest `production_ready: false` + `status: 'unavailable'` when API call fails.
- **DemoPage Tour Wording**:
  - Changed "launch the self-guided tour" (dead link) → "click 'Try This →' to jump straight into the live dashboard".

### Added
- **Documentation Cleanup**:
  - Added `security_audit_logs` (5th DynamoDB table) to `infra/dynamodb-tables.md` and `DEPLOYMENT.md` step 1.2.
  - Added B2B monetization sentence (per-district subscription ₹50K–₹2L/year) to `README.md`.

## June 12, 2026
### Fixed & Optimized
- **REST API Robustness, 404 Handlers & Global Error Catcher**:
  - Implemented a JSON-safe 404 fallback for all unknown `/api/*` requests in `server.js`.
  - Added a global Express error-handling middleware to catch and log unhandled throws, preventing Node process crashes and returning clean JSON structures.
  - Wrapped OTP and password validation handlers inside `routes/auth.js` in try-catch blocks to guarantee robust request processing.
- **Unified Documentation Indexing & Repository Map**:
  - Restructured the project's documentation hierarchy, creating a separate dedicated [docs/repository_map.md](docs/repository_map.md) referencing every module file and component.
  - Updated [README.md](README.md) to integrate the new repository index, significantly streamlining the presentation for AWS technical reviewers.
- **Technical Architecture Accuracy Alignment**:
  - Documented previously unlisted backend capabilities in `docs/system_architecture.md` including the Dead Letter Queue (DLQ) file writes, `dlq_alert` SSE broadcasts, `policy.js` IDOR rule checker, and the background Health Watchdog Monitor.
  - Corrected `offline_sync_strategy.md` to reference `clientUpdatedAt` as the exact database field mapping for Last-Write-Wins (LWW) conflict resolution.
  - Updated `setup_guide.md` to align with the Logistic Regression fallback model and documented the `ENABLE_DEEP_MODEL` environment parameter.
  - Expanded the submission proof checklist in `docs/SUBMISSION_CHECKLIST.md` to include `security_audit_logs` as the 5th DynamoDB table configuration.
- **Offline Credential Hash Safety**:
  - Replaced the insecure `btoa()` base64 encoder with a robust, pure JavaScript SHA-256 implementation inside `AuthContext.jsx` for hashing offline user credentials stored in `localStorage`.
- **System Monitoring Watchdog & SSE Alerts**:
  - Implemented a background watchdog monitoring loop in `server.js` running on a 30-second interval to check the health of the AI service and monitor the Outbreak Agent heartbeat scans.
  - Configured SSE stream in `admin.js` to broadcast a `service-alert` event immediately when a service goes down or recovers.
  - Added a state-driven warning banner in the Admin Dashboard (`AdminDashboard.jsx`) to display active service failure alerts to administrators in real-time.
- **Unification of 403 Forbidden Responses**:
  - Unified all authorization check failures in `backend/middleware/policy.js` to return a generic `{ code: 'ACCESS_DENIED', message: 'Access Denied.' }` status payload, preventing leaks of internal user roles or village assignment status.
- **Calibrated RAG Threshold Alignment**:
  - Hardcoded the calibrated threshold `0.45` as the default fallback in `ai-service/rag_service.py` to ensure high retrieval quality when `rag_config.py` is missing or not deployed.
- **Symptom Checklist & Offline Mismatch Resolution**:
  - Expanded the frontend checkbox checklist options from 11 to 26 symptoms in both `SymptomCheckerPage.jsx` and `SymptomChecker.jsx` to map to the full capability of the 101-class model.
  - Linked `predictSymptomsOffline()` local model inference into the offline catch blocks of both UIs, allowing full in-browser triage when the network is offline.
  - Integrated `symptomIdToText` vocabulary mappings for all 26 symptoms to match key labels inside the browser's `localSymptomNet.js` / `symptomNetMeta.js`.
- **Duplicate Gibberish Detection Cleanup**:
  - Removed redundant `is_gibberish` checks and function definition in `ai-service/main.py`, optimizing CPU cycles by relying entirely on the first-stage Node.js validation guardrails in `aiValidator.js`.
- **Production SSL Database Safety**:
  - Configured secure-by-default SSL connection validation (`rejectUnauthorized: true`) in database configurations.
- **Cluster WebSocket Robustness & Warnings**:
  - Added warning indicators and structural comments regarding WebSocket telemetry persistence limitations in Node.js cluster-fork setups.
- **Robust Rule-Based Symptom Matching**:
  - Updated `predictDiseaseLocal` in `backend/routes/villager.js` to process token negations (e.g. "no fever") and prioritize longer, more specific multi-word symptom matches.
- **Request Body Size Limits**:
  - Implemented a separate `5MB` request limit for skin image triage uploads, while keeping standard JSON requests locked at a secure `10KB`.
- **Last-Write-Wins (LWW) Sync Policy**:
  - Configured maternal and child sync endpoints to resolve conflicts using replayed client-side timestamps (`clientUpdatedAt`).
- **Offline Registration Credentials Cache**:
  - Aligned local credentials cache keys in `AuthContext.jsx` to permit offline registered villagers to log in without internet connection.

### Added
- **Public Demo Mode (/demo route)**:
  - Redesigned the public `/demo` route into a high-fidelity self-guided tour experience.
  - Replaced the static card grid layout with interactive, glassy role tabs: **Villager**, **ASHA Worker**, and **Admin**.
  - Added high-contrast, glowing "Try This →" CTA buttons that bypass manual authentication checks, dynamically logging the user in using pre-seeded sandbox credentials and automatically routing them to their respective role dashboards.
- **Floating Language Select on Auth Pages**:
  - Integrated floating, glassmorphic language selector dropdowns at the top right of the forms in `LoginPage.jsx` and `RegisterPage.jsx`.
  - Empowers evaluators to test multilingual translation flows (Hindi, English, Marathi, Tamil, Telugu, and Bengali) directly from the authentication gates.
  - Aligned all "Sign In" text references to "Log In" to match the file naming convention (`LoginPage.jsx`) for semantic consistency.
  - Added a visual badge on the login page's credentials helper card to explicitly prompt evaluators to test offline login behavior by disconnecting their internet connection.
  - Implemented an intelligent offline warning banner on `RegisterPage.jsx` notifying users that registration requires a database write connection, prompting them to redirect to the Login page and use cached demo credentials if offline.
- **Real-Time Symptom → DynamoDB Telemetry Trace**:
  - Upgraded the backend `/symptoms` route handler in `routes/villager.js` to synchronously write symptom telemetry to the `outbreak_telemetry` table in DynamoDB.
  - Returns PostgreSQL database insert timestamp (`dbWriteTimestamp`), DynamoDB write timestamp (`dynamoDbWriteTimestamp`), and outbreak agent notification trigger status back in the HTTP response.
  - Developed a high-fidelity, real-time **Live AWS Telemetry Trace** timeline inside the Symptom Checker results card view (`SymptomCheckerPage.jsx`).
  - Added safe fallbacks for offline modes (capturing queue state to IndexedDB), displaying trace logs showing step-by-step telemetry validation.
- **Next-Gen Offline-First RAG & ML Execution**:
  - Compiled PyTorch `SymptomNet` model to `symptomnet.onnx` (opset 18) and generated `symptomNetMeta.js` holding model weights/biases and precomputed 384-dimensional embeddings for 115 multi-lingual symptom keywords.
  - Implemented `localSymptomNet.js` browser-side inference engine, executing model classification fully offline in the browser in under 1ms.
  - Pre-seeded IndexedDB `rag` store with 20 multi-lingual WHO/MoHFW clinical guideline chunks.
  - Implemented token-weighted fuzzy RAG query matching `searchOfflineKB` inside `semanticCache.js` for the `SakhiChatbot.jsx` chatbot to retrieve relevant guidelines offline.
- **Persistent Live AWS Proof Header**:
  - Surfaced a high-visibility, real-time AWS Stack Proof banner permanently at the top of the main area in `AdminDashboard.jsx` (visible on load and across all sub-views).
  - Displays live connectivity for Aurora Serverless PostgreSQL and Amazon DynamoDB, region (ap-south-1), connection pool size, and global SSE listeners count.
- **Real-Time Outbreak Heatmap**:
  - Replaced static markers in `DistrictOutbreakMap.jsx` with dynamic Varanasi-aligned risk circle heat maps.
  - Dynamically configured colors, opacity, and radius based on the risk score calculated from `/admin/heatmap-data`.
- **Interactive "Watch Sync" Walkthrough**:
  - Built a step-by-step interactive sync guide modal in `MonitoringDashboard.jsx` triggered via a "Watch Sync" button.
  - Guides evaluators through simulating a network outage, queuing maternal records in IndexedDB offline, verifying queue states, reconnecting, and auto-syncing.
- **ASHA & NGO Dispatch Upgrades**:
  - Upgraded Express server to support WebSocket upgrades on path `/api/telemetry` for live ambulance simulation.
  - Implemented dynamic route location interpolation on `/api/villager/ambulance` to broadcast live coordinates every 3 seconds.
  - Created `liveTelemetry.js` WebSocket client and integrated a real-time tracking panel in the Admin Command Center dashboard.
  - Created `audioAlerts.js` leveraging Web Audio API oscillators and gains to play high-fidelity emergency sirens (P1), warnings (P2), and standard chime alerts.
  - Connected synthesized alerts to SSE stream updates inside the Admin and ASHA/NGO dashboards.
  - Built a state-based Peer-to-Peer Relay simulator modal inside `MonitoringDashboard.jsx` allowing local Bluetooth record sharing and proxy sync to AWS.
- **Outbreak Agent Timeline UI**:
  - Created a vertical scan log timeline in `AIIntelligenceView.jsx` to trace Groq Llama-3.3 decisions.
  - Updated `outbreak_agent.py` to transmit scan telemetry heartbeats to the new `POST /api/admin/agent-scan` endpoint.

## June 11, 2026
### Added
- **Child Nutrition Dashboard Refinement**:
  - Revamped `ChildNutritionPage.jsx` with a modern status-colored border system, compact key metrics grid cards, and a persistent action dock optimized for mobile views.
- **Role-Based Routing Adjustments**:
  - Updated access controls in `App.jsx` to permit `ngo` (ASHA) role users to access the pediatric skin scanner route (`/skin-disease`), improving field diagnostic capabilities.
- **SQL Aggregation Strict Mode Fix**:
  - Corrected SQL queries in `backend/routes/ngo.js` to run under strict `GROUP BY` configurations by ensuring select fields match group conditions correctly.
- **Admin UI Polish & Data Visualizations**:
  - Upgraded font sizes and legibility across admin metrics cards in `CommandCenterView.jsx` and `ProductionEvidencePanel.jsx`.
  - Replaced flag emoji references with clean SVG vectors, resolved profile clickability, and shortened pool labels (e.g. `"PG Pool"`).
- **Vulnerability Risk Intelligence Visual Upgrades**:
  - Redesigned the epidemiological details and risk metrics panel in `PredictiveRiskView.jsx` to include professional health gradient meters and color-coded status indicator borders.
- **AWS Database Cloud Integration (Aurora PostgreSQL & DynamoDB)**:
  - Configured and deployed production-ready Amazon Aurora PostgreSQL Serverless v2 cluster (`swasthai-cluster`) running under custom budget caps (0.5 to 1.0 ACUs) to optimize credits.
  - Initialized all relational tables (symptoms, pregnancy, malnutrition, referrals, vaccinations, audit logs) on AWS database cluster via automated Node.js backend migrations.
  - Bootstrapped and optimized 4 Amazon DynamoDB tables (`outbreak_telemetry`, `sync_queues`, `village_node_state`, `emergency_streams`) on AWS with correct composite primary keys, TTL policies (`expiresAt`), and Global Secondary Indexes (`disease-index`, `district-time-index`, `status-index`, `priority-index`, `district-date-index`) to prevent table scans.
  - Implemented production-grade AWS IAM credential authentication policies (`AmazonDynamoDBFullAccess` for `swasthai-app-user`) to secure data transfers.
  - Successfully executed remote seeding operations, populating the live cloud database with default operational datasets.
  - Custom-configured deployment metadata settings (district: `Gwalior`, state: `Madhya Pradesh`) in environment configurations to target localized regional deployment.
- **User Authentication & Sign-in Upgrades**:
  - Enhanced registration input validation (`RegisterSchema`) using Zod preprocess guards to convert empty string fields (`""`) to `null`, preventing validation errors on optional phone/email fields.
  - Expanded password-based login (`/auth/login-password`) to accept `username` as a valid identifier in addition to `phone` and `email`, fixing sign-in issues for accounts created with customized usernames.
- **Symptom Checker UI Polish, Responsive optimization & Evaluation Sandbox**:
  - Integrated a premium **Evaluation Testing Sandbox** quick-fill scenarios panel to instantly populate and test mild (cold), moderate (dehydration), and severe (cardiac) presets with matching symptoms and descriptions.
  - Added interactive **Speech-to-Text Voice Input Simulations** (English & Hindi) that dynamically render voice recording animations and transcribe text word-by-word, verifying regional natural language processing.
  - Revamped the "Analyze Symptoms" action button with vibrant green pulses and interactive hover states when active, replacing the gray appearance with a high-fidelity visual cue.
  - Implemented responsive mobile tabs (`lg:hidden`) separating inputs, checklist selection, and results to guarantee zero vertical scrolling on mobile phones.
  - Constrained layout height (`lg:h-[calc(100vh-185px)] lg:overflow-hidden`) on desktop and laptop viewports to prevent page-level vertical scrollbars and provide clean, inner card scroll containers.
  - Added automated preset execution logic inside `handleQuickFill` to automatically run diagnostic analysis and switch tabs to the results view on trigger.
- **Pre-Demo Production Bug Fixes**:
  - Replaced native browser `alert()` popups with a custom DOM-based toast notification engine (`showToast`) in Admin dashboards (Command Center, Outbreak Radar, AI Intelligence).
  - Resolved dynamic class purge issues in `NGODashboard.jsx` stats grid cards (e.g. `bg-${item.color}-50`) by mapping colors statically to prevent Tailwind from removing them during production builds.
  - Eliminated a duplicate inline `<footer>` tag rendering on the `LandingPage.jsx`.
  - Corrected the Landing Page CTA button path from `/monitor` (restricted admin path causing redirects) to `/demo` (public Demo Hub).

## June 10, 2026
### Added
- **Explainable AI (XAI) Maternal Pregnancy Risk Panel**:
  - Implemented mathematical weight contribution scoring and WHO/MoHFW specific guidelines inside `ai-service/main.py`.
  - Added SQLite/PostgreSQL cross-compatible table columns (`pregnancy_data` table) and auto-migrations on server boot.
  - Implemented matching local fallback XAI calculator logic in backend routes (`ngo.js`) for reliable offline demo runs.
  - Built risk velocity trends, contributing factor cards, indicator badges, and clinical advice boxes in the SPA frontend (`MaternalHealthPage.jsx`).
- **Pediatric Skin Triage Scanner (Child Mode)**:
  - Linked the child nutrition panel shortcut (`/skin-disease?childMode=true`) to the primary computer vision camera scanner.
  - Designed pediatric safety disclaimers, red-flag emergency checks (fever, breathing difficulty, lethargy), and automatic urgent escalation overrides.
  - Adapted triage outcome recommendation text to child-safe advice protocols (e.g. skin hydration, pediatric consults, avoiding adult steroid creams).
  - Softened screening vocabulary to "AI Triage Screening" and "Suggested Triage" to present clinical triage as screening assistance instead of diagnostics.
  - Integrated the **multilingual Interactive Bedside Glass Test (Glass Triage) Guide** directly inside the Pediatric Scanner layout, supporting English, Hindi, Marathi, Tamil, Telugu, Bengali, and Hinglish. It outlines step-by-step instructions (Press Firmly, Observe Blanching, Safety Interpretation) to help users screen for non-blanching emergency indicators.
- **NGO Impact Analytics & Monthly Reports (B2B Focus)**:
  - Developed the B2B NGO analytics backend endpoint `/api/ngo/impact-report` calculating core metrics, outcome percentages (referrals closed, vaccination completion), emergency times, risk watchlists, and village/ASHA leaderboards.
  - Configured a comprehensive **Funding Impact Snapshot** displaying total rural beneficiaries reached for B2B grant proposals.
  - Integrated report generation with audit logs inside the database.
  - Built the `Impact Analytics` interactive tab inside `NGODashboard.jsx` showcasing real-time B2B metrics, MoM trends, and recommended actions.
  - Engineered zero-dependency PDF report printing styles inside `index.css` via custom `@media print` CSS overrides for clean, professional PDF exports.
- **Predictive Village Risk Intelligence (Early Warning System) — Layer 2**:
  - Designed and implemented a **dual-layer public health intelligence architecture**:
    - Layer 1 (existing): Outbreak Radar — "What is happening right now?"
    - Layer 2 (new): Predictive Village Risk Intelligence — "What may happen next?"
  - Built a weighted, multi-signal **Village Health Risk Score engine** (0–100) using:
    - Symptom trend growth (40%): 7-day vs prior 7-day symptom count delta
    - Nearby outbreak cluster activity (25%): DynamoDB `outbreak_telemetry` within 14 days
    - Indian seasonal risk calendar (20%): NVBDCP-sourced month-by-month vector/waterborne/respiratory risk scoring
    - Open referral backlog (15%): pending/assigned referral count per village
  - Added `GET /api/ngo/village-risk` endpoint (NGO-scoped) with XAI contributor breakdown, health category flags, trend direction, recommended actions, and intervention impact forecast.
  - Added `GET /api/admin/district-risk-heatmap` endpoint — district-wide ranking of all villages by risk score.
  - Added `GET /api/admin/village-risk/:villageId` endpoint — admin unscoped single-village risk drilldown.
  - Created new `PredictiveRiskView.jsx` Admin component:
    - District risk heatmap with color-coded village cards (GREEN/YELLOW/ORANGE/RED) sorted by score descending
    - Village drilldown panel with XAI contributor bars, health category flag cards, and recommended actions checklist
    - **Intervention Impact Forecast simulator** showing projected score reduction for: vaccination drive, referral closure, combined interventions
    - Dual-layer architecture explainer banner
    - Filter bar by risk level (ALL / CRITICAL / HIGH / MEDIUM / LOW)
  - Added `Risk Intelligence` nav item with `NEW` badge to Admin Dashboard sidebar
  - Added `🔮 Risk Forecast` tab to NGO Dashboard with:
    - Large animated risk score gauge with level color coding
    - Trend direction indicator (↑ Increasing / ↓ Improving / → Stable)
    - XAI contributor breakdown bars (4 factors with % weights and progress animation)
    - Health category risk flags (Vector-Borne, Respiratory, Waterborne, Maternal Health)
    - Recommended prevention actions checklist
    - Collapsible Intervention Impact Forecast simulator
  - Fully offline-capable with graceful demo fallback — works in Demo Tour Mode
  - Zero new data sources required — all signals reuse existing `symptoms`, `referrals`, `village_health`, and DynamoDB tables
  - Frontend production build: ✓ built in 8.57s — zero errors


## June 8, 2026
### Added
- **Centralized Role-Based Access Control & IDOR Prevention**:
  - Created centralized [policy.js](file:///c:/projects/SwasthAI-Guardian-Platform/backend/middleware/policy.js) middleware offering standard security filters (`checkRole`, `enforceVillageScope`, `enforceReferralAccess`, `enforceAmbulanceAccess`).
  - Secured all backend routers (`routes/admin.js`, `routes/ngo.js`, `routes/villager.js`) to restrict non-admin users strictly to their tenant scope and prevent cross-village data leakage.
- **Idempotency Key Enforcement & Replay De-duplication**:
  - Modified [schema.js](file:///c:/projects/SwasthAI-Guardian-Platform/backend/db/schema.js) to include `client_request_id` columns, migrations, and unique indexes on `referrals` and `vaccination_records` tables for PostgreSQL and SQLite.
  - Implemented deduplication logic in `POST /referral`, `POST /vaccinations`, and `POST /villager/phq2` endpoints to prevent duplicate entries during offline sync replays. Derived auto-referrals are uniquely keyed (`ref-${clientRequestId}`) to guarantee deduplication.
- **SSE Tenant Scoping & Live Feed Security**:
  - Updated the `/live-feed` stream in `routes/admin.js` to look up the connecting user's role and village scope to resolve their `districtId`.
  - Configured `broadcastToAdmins` to filter outgoing events, ensuring scoped administrative clients only receive events matching their assigned village or district.
- **Universal AI Output & Fallback Schema Compliance**:
  - Enforced schema validation using `validateAiOutput` on both the success and fallback/offline paths for `/symptoms`, `/predict/seasonal-risk`, `/health-assistant`, `/maternal`, and `/malnutrition` endpoints, preventing unvalidated fallback responses.
- **Sensitive PII Log Scrubbing**:
  - Introduced `redactSensitiveData` inside `server.js` logger middleware to automatically redact demographic data (names, phones, emails, passwords, tokens) from logged metadata objects.
  - Scrubbed patient names and specific house addresses from event listener console logs in [eventDispatcher.js](file:///c:/projects/SwasthAI-Guardian-Platform/backend/eventDispatcher.js).
- **Background Task Monitoring & Alerting (Demo Reliability)**:
  - Enabled the event dispatcher to publish live `dlq_alert` events over the admin SSE stream immediately upon routing failed events to the Dead-Letter Queue.
  - Added a diagnostic route `GET /api/admin/dlq` restricted to `admin` role to check DLQ file contents.
- **Admin View Modularization**:
  - Refactored the massive [AdminDashboard.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/AdminDashboard.jsx) (~1,800 lines of code) by extracting all sub-views and telemetry panels into standalone components inside a new [components](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components) directory.
  - Extracted [CommandCenterView.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/CommandCenterView.jsx), [OutbreakRadarView.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/OutbreakRadarView.jsx), [AmbulanceFeedView.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/AmbulanceFeedView.jsx), [OfflineVillagesView.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/OfflineVillagesView.jsx), [AIIntelligenceView.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/AIIntelligenceView.jsx), [ReportsView.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/ReportsView.jsx), [SystemStatusView.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/SystemStatusView.jsx), and [MaternalNutritionView.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/MaternalNutritionView.jsx).
- **Route Access Protection Bypass for Admins**:
  - Upgraded the `ProtectedRoute` gatekeeper in [App.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/App.jsx) to permit users with the `"admin"` role to bypass specific route restrictions and access NGO pages (`/ngo/maternal`, `/ngo/child-nutrition`) directly.
- **Dynamic Node Sync Status Table**:
  - Upgraded the Offline Villages monitoring tab from a static screen to a live connection grid showing device names, connection states, pending queues, and relative heartbeat times.
- **AI View Telemetry & Stability Enhancements**:
  - Upgraded [AIIntelligenceView.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/AIIntelligenceView.jsx) and [AIReasoningTrace.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/Admin/components/AIReasoningTrace.jsx) to display high-fidelity mock grounding queries, latency times, and document sources for robust offline and demo runs.
  - Implemented optional chaining (`?.`) guards across all extracted views to prevent runtime TypeErrors when AWS databases are not connected.
- **Production RAM Optimizations & OOM Fix**:
  - Replaced the memory-heavy Random Forest model (487MB on disk and ~800MB RAM overhead) with a **Multinomial Logistic Regression model**. The new model achieves **71.1% accuracy** (a 19.3% boost over the 51.8% RF fallback) and is only **5.5MB** on disk, allowing the FastAPI service to boot under Render's strict 512MB RAM Free Tier.
  - Implemented **pre-computed RAG embeddings** (`kb_embeddings.npy` — 373KB) for the 243 health chunks, eliminating the need to load PyTorch and `sentence-transformers` on startup (saving ~700MB RAM).
  - Integrated the **free Hugging Face Inference API** for query vectorization, backed by a robust token-based **Jaccard similarity fallback** for offline resilience.
  - Updated RAG and model documentation in `docs/ai_architecture.md` and the master `README.md`.
- **Frontend UI & State Harmonization**:
  - Wrapped Navbar offline alert banners in standard max-width layouts for centered desktop alignment.
  - Unified simulated network state triggers between the `Navbar` toggle, local storage keys, and the `OfflineToast` notifications.
- **CI Workflow and Docker Tweaks**:
  - Adjusted `.github/workflows/ci.yml` and the server startup test configurations to run the uvicorn health check cleanly.
- **Government Schemes Page Fix**:
  - Restored `<Navbar />` rendering on the Government Schemes Page and transitioned all direct `fetch` operations to the proxy-configured Axios `api` client to resolve CORS blocks and loading states.

## June 7, 2026
### Added
- **Production API Fallback & Vercel Fix**: Resolved JSON parsing failures caused by Vercel returning HTML error pages when querying relative paths without a configured proxy. Exposes fallback routing directly to the live Render backend (`https://swasthai-guardian-platform-0jsb.onrender.com/api`) inside the Axios API client, Schemes page, and Admin SSE feed.
- **Frictionless Demo Login & SaaS Anchor Pitch**:
  - Implemented 1-click frictionless demo login shortcuts in both the Landing Page hero and Login Page credential cards to streamline evaluation flows for evaluators.
  - Anchored the platform's presentation with a prominent B2B SaaS pitch tagline for the "Guardian" operations dashboard.
  - Added a custom-designed B2B SaaS Pricing section showing District and State tier subscriptions.
  - Formulated a "Zero Vaporware" telemetry validation panel displaying model accuracy metrics (101 diseases, 64.6% accuracy, 243 RAG chunks) and active AWS RDS/DynamoDB connectivity details.
- **AI Service Integration Workflow & CI Validation**:
  - Upgraded root `package.json` setup, build, and development commands to automatically install and run the Python FastAPI service concurrently with frontend/backend Node services.
  - Extended the GitHub Actions CI pipeline with an integration health check step that boots the FastAPI microservice and validates it responds successfully to the `/health` endpoint.
- **Quantified Impact Dashboard (Command Center)**: Added a dynamic Impact Panel to `AdminDashboard.jsx` showing evaluation-facing metrics — lives potentially impacted (2,34,000), maternal deaths preventable (12/year), avg. outbreak detection time (4.2 hrs vs. 72-hr manual baseline), and cost per ASHA worker (₹0 offline-first).
- **Agentic Outbreak Simulation**: Added `POST /api/admin/outbreak` backend route and a "Simulate Outbreak Event" button in the Admin Command Center to trigger real-time SSE broadcast events, making the agentic loop visible to evaluators.
- **Live Reports Panel**: Wired the Admin Reports view to live `/api/admin` endpoints for SOS and symptom cluster counts. Added a "Weekly Health Trends" double-bar chart showing real-time data instead of static seed values.
- **Documentation Consolidation**:
  - Merged Aurora ER diagram and DynamoDB table schemas (with GSIs and access patterns) into `docs/system_architecture.md` as a single authoritative reference for AWS database evaluation.
  - Removed redundant `docs/data_model.md` — all content consolidated into `docs/system_architecture.md`.
  - Removed `ARCHITECTURE.md` from repo root — content superseded by the enriched `docs/system_architecture.md`.
  - Updated `README.md` technical docs index to point directly to the consolidated architecture file.

---

## June 5, 2026
### Added
- **AI Service Environment Configuration**: Added `python-dotenv` support to automatically load `GROQ_API_KEY` at startup in the FastAPI service, resolving the `503` RAG offline fallback issue.
- **Windows Emoji Console Crash Fix**: Reconfigured outbreak agent stdout to `UTF-8` and replaced emoji log markers with ASCII-safe strings, preventing UnicodeEncodeErrors on Windows environments.
- **Speech Synthesis Autoplay Control**: Disabled automatic text-to-speech triggers in `SakhiChatbot.jsx` and `SymptomCheckerPage.jsx` to prevent voice playback interference during demo video recording, while preserving manual read-aloud buttons.
- **Project Audit & Roadmap Status**: Updated the master audit log and project roadmap checklist (`audit_and_roadmap.md`) to mark all roadmap phases as fully completed.

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
- **Admin Dashboard Bundle Optimization**: Extracted all static demo constants (`DEMO_STATS`, `DEMO_SUMMARY`, etc.) to a separate `demoTourData.js` file and loaded them dynamically via ES import code-splitting when demo mode is activated, preventing leakage into initial production chunks.
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

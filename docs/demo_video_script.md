# SwasthAI Guardian — Demo Video Script

**Track:** B2B SaaS · AWS Databases  
**Duration:** 3 minutes (180 seconds)  
**URL:** `https://swasthai-guardian-platform-0jsb.onrender.com` (deployed on Vercel + Render)

---

## Section 1: The Problem (0:00 – 0:20)

| Time | Visual (Screen) | Audio (Voiceover) | Transition / Cut |
|------|-----------------|-------------------|------------------|
| 0:00–0:05 | **IntroFlow splash** — animated logo, "SwasthAI Guardian" fades in with tagline "National Rural Health Intelligence Platform" | _Music fades in. Voiceover: "India's 600 million rural citizens depend on 1.4 million ASHA workers with paper registers and no AI."_ | Fade from black |
| 0:05–0:12 | **IntroFlow Language Selection** — 6 language cards (Hindi, English, Bengali, Marathi, Tamil, Telugu) pulse subtly | _"Village clinics lack specialists. Outbreaks spread undetected. Ambulance dispatch has no real-time tracking."_ | Smooth scroll down on same page |
| 0:12–0:20 | **IntroFlow Services overview** — grid of 6 service icons: AI Diagnosis, Ambulance SOS, Maternal Health, Child Nutrition, Government Schemes, Offline-First | _"SwasthAI Guardian is a B2B platform that solves all of this with AI-powered disease surveillance, offline-first medical access, and autonomous outbreak detection."_ | Fade to next screen |

---

## Section 2: App in Action — Villager (0:20 – 0:50)

| Time | Visual (Screen) | Audio (Voiceover) | Transition / Cut |
|------|-----------------|-------------------|------------------|
| 0:20–0:25 | **Demo Page** (`/demo`) — Three role tabs shown: Villager, ASHA Worker, Admin. Cursor clicks **Villager**, then clicks **"Try This →"** button. | _"Let's take the villager perspective first. One click demo login — no credentials needed."_ | Cursor click → instant transition |
| 0:25–0:30 | **Villager Dashboard** — Namaste greeting, SOS card (red), Health Alert (amber), 4 service cards grid (Check Symptoms, My Records, Women & Pregnancy, Government Schemes), Health Snapshot bar (85% score). | _"Ramesh sees his personalized dashboard: SOS ambulance, village health alerts, and quick access to all services. All in his local language."_ | Smooth appear (page load) |
| 0:30–0:38 | **Symptom Checker** (`/symptoms`) — Cursor selects 3 symptoms: "Fever", "Headache", "Body Ache", then clicks **"Check Symptoms"**. AI result appears with disease name, severity badge, and recommendations. | _"He describes his symptoms — fever, headache, body ache. The AI checks against 101 diseases and returns an instant diagnosis with severity."_ | Page transition (click on "Check Symptoms" card) |
| 0:38–0:45 | **Ambulance SOS** (`/ambulance`) — Cursor types location, selects emergency type "Accident", clicks **"Send SOS"**. Live ETA counter and 108 fallback number show. | _"If it's an emergency, he can trigger an ambulance SOS. GPS captures his location, a WebSocket broadcast alerts nearby ASHA workers, and government 108 is the fallback."_ | Page transition (click on SOS card) |
| 0:45–0:50 | **Government Schemes** (`/schemes`) — List of 20+ schemes with eligibility badges. Cursor clicks one scheme to see detail page. | _"And he can check which government health schemes he's eligible for — all in one place."_ | Page transition (click on "Government Schemes" card) |

---

## Section 2: App in Action — ASHA Worker / NGO (0:50 – 1:10)

| Time | Visual (Screen) | Audio (Voiceover) | Transition / Cut |
|------|-----------------|-------------------|------------------|
| 0:50–0:55 | **Demo Page** — Cursor clicks **ASHA Worker** tab, clicks **"Try This →"**. | _"Now the ASHA worker's view. This is where the B2B platform really shines."_ | Quick edit cut |
| 0:55–1:00 | **NGO Dashboard** (`/ngo`) — Triage feed showing P1–P4 request cards, priority badges (CRITICAL, HIGH, MODERATE, LOW), Accept/Start/Complete buttons. | _"Requests come in with rule-based triage — P1 critical to P4 low. She can accept, start, and complete each case."_ | Page appear |
| 1:00–1:05 | **Maternal Health** (`/ngo/maternal`) — Pregnancy records with risk badges (High/Medium/Low), WHO-protocol vitals sliders. | _"Maternal risk assessment uses WHO thresholds to flag high-risk pregnancies. Data queues to IndexedDB when offline."_ | Page transition |
| 1:05–1:10 | **Child Nutrition** (`/ngo/child-nutrition`) — Child records with WHO WHZ classification: SAM (red), MAM (amber), Normal (green). | _"Child malnutrition detection uses WHO Z-scores — Severe Acute Malnutrition flagged in red. This is clinical-grade."_ | Page transition |

---

## Section 2: App in Action — Admin Command Center (1:10 – 1:50)

| Time | Visual (Screen) | Audio (Voiceover) | Transition / Cut |
|------|-----------------|-------------------|------------------|
| 1:10–1:15 | **Demo Page** — Cursor clicks **Admin** tab, clicks **"Try This →"**. | _"Finally, the Admin Command Center — built for district health officers."_ | Quick cut |
| 1:15–1:22 | **Admin Dashboard — Command Center** (`/admin`) — Sidebar with 10 views. Focus on main area: KPI gauges (pregnancies, malnutrition, emergency count), weekly trends chart (symptoms vs emergencies), outbreak alert cards with AI confidence badges. | _"The Command Center shows live KPIs, trend charts, and AI-generated recommendation cards — each with confidence scores from the autonomous outbreak loop."_ | Page load |
| 1:22–1:30 | **Admin — Toggle Demo Mode** — Cursor clicks the "Demo Tour" toggle in sidebar (bottom left). New seeded data populates. | _"Evaluators can toggle demo mode to see rich seeded data — pregnancies, outbreaks, ambulance requests — even if the live database is empty."_ | Cursor clicks toggle, data updates in place |
| 1:30–1:38 | **Admin — Outbreak Radar** (`#outbreak` view) — Outbreak cards list: "Cholera Outbreak Cluster" (94% confidence), "Dengue Outbreak Risk", "Typhoid Signal Detected". Cursor clicks **"Simulate Outbreak"** button. | _"The Outbreak Radar shows autonomous AI detections. We can simulate a new outbreak event — it writes to DynamoDB and pushes via SSE to all connected admin clients in real time."_ | Sidebar click → view transition |
| 1:38–1:42 | **Admin — AI Intelligence** (`#ai` view) — AI reasoning traces with Groq Llama-3.3-70b confidence scores and pattern analysis. | _"Every AI decision is transparent — the Groq-powered reasoning trace shows exactly how the model classified each outbreak."_ | Sidebar click → view transition |
| 1:42–1:50 | **Admin — System Status** (`#system` view) — 4-panel stack health: Aurora PostgreSQL, DynamoDB, AI Service, Service Worker/IndexedDB. Shows production_ready badge. | _"The System Status view proves the entire AWS stack is live — Aurora PostgreSQL, DynamoDB PAY_PER_REQUEST, the AI service, and the PWA offline layer."_ | Sidebar click → view transition |

---

## Section 3: AWS Database Choices (1:50 – 2:20)

| Time | Visual (Screen) | Audio (Voiceover) | Transition / Cut |
|------|-----------------|-------------------|------------------|
| 1:50–1:55 | **Architecture Diagram** (`docs/architecture-diagram.svg`) — Full SVG showing React (Vercel) → Express API (Render) → FastAPI AI (Render) → Aurora PostgreSQL + DynamoDB. | _"Let me explain our database architecture. We use two AWS databases — each chosen for its specific strength."_ | Full-screen title card: "AWS Database Architecture" |
| 1:55–2:05 | **Aurora PostgreSQL** — Screen capture of Aurora table schema (from `backend/db/schema.js`): `villagers`, `pregnancies`, `child_records`, `health_requests`, `ambulance_requests`, `symptom_logs`, `government_schemes`, plus RLS. Then brief live query if possible. | _"Amazon Aurora PostgreSQL stores all relational data — villager records, pregnancy tracking, child nutrition, government schemes. We use it for complex queries like 'find all high-risk pregnancies in a district' with JOINs across 7 tables. The SQL schema includes row-level security for multi-tenant isolation."_ | Cut to schema screenshot, then to live query |
| 2:05–2:15 | **DynamoDB** — Screen capture of 4 DynamoDB tables: `outbreak_telemetry`, `village_node_state`, `sync_queues`, `emergency_streams`. Show `PK` = `DISTRICT#time-index` with `SK` patterns. Then show DynamoDB items with sample data. | _"Amazon DynamoDB handles our real-time and event-driven workloads. Four tables: outbreak_telemetry for the autonomous outbreak loop, sync_queues for offline-to-online reconciliation, emergency_streams for ambulance SOS events, and village_node_state for village-level status. PAY_PER_REQUEST means zero provisioning — perfect for unpredictable rural health traffic."_ | Cut to DynamoDB table list, then item view |
| 2:15–2:20 | **Side-by-side comparison card** — Text overlay: "Aurora: Relational integrity, complex queries, JOINs" vs "DynamoDB: Real-time events, offline sync, serverless scaling". | _"Aurora for relational integrity and complex clinical queries. DynamoDB for real-time events and serverless scaling. Together, they power a production-ready rural health platform."_ | Static card, camera holds |

---

## Section 4: So What — B2B Impact & Submission (2:20 – 3:00)

| Time | Visual (Screen) | Audio (Voiceover) | Transition / Cut |
|------|-----------------|-------------------|------------------|
| 2:20–2:30 | **Demo Page — Impact Stats** — 4 impact counters: "600M+ Rural Indians", "1.4M ASHA Workers", "17 Diseases", "6 Languages". Live Aurora DB stats show: Villages, Pregnancies, Diagnoses Today, SOS Requests. | _"The impact: this platform serves 600 million rural Indians through 1.4 million ASHA workers. It diagnoses 17 diseases in 6 Indian languages — all verified by live database counts from Aurora PostgreSQL."_ | Cut to Demo Page scrolled to impact section |
| 2:30–2:42 | **Demo Page — B2B Monetization** — 3 pricing tiers: "NGO Starter (Free)", "District Command (₹15,000/month)", "State Enterprise (Custom)". Cursor highlights District Command badge "Recommended". | _"Our B2B SaaS model: NGO Starter is free for community setups. District Command at ₹15,000 per month unlocks the autonomous outbreak AI loop, live SSE admin feed, and custom threshold configurations. State Enterprise offers multi-district scaling with dedicated Aurora cluster pools."_ | Scroll down on Demo Page |
| 2:42–2:50 | **Monitoring Dashboard** (`/monitor`) — AWS stack health: 6 stack indicators (Aurora, DynamoDB, SW, IndexedDB, Express, FastAPI), live latency gauge <200ms, event stream scrolling, district simulation panel. | _"The monitoring dashboard proves production readiness: full stack health with real-time latency metrics, event streams, and even a district simulation engine for load testing."_ | Page transition |
| 2:50–2:55 | **Admin — Issue District Alert** — Cursor clicks "Issue District Alert" button. Confirmation toast appears. Then **Download District CMO Report** — CSV downloads. | _"Admins can issue district-wide alerts and download CMO-ready CSV reports — built for real government workflows."_ | Cursor actions on already-visible Admin view |
| 2:55–3:00 | **Closing Card** — Logo centered, tagline: "SwasthAI Guardian — Health Intelligence for Rural India", URL, "Track 2 · B2B SaaS · AWS Databases". Fade to black. | _"SwasthAI Guardian: AI-powered health intelligence for rural India. Built for B2B, powered by AWS."_ | Fade to black |

---

## Appended Section: AWS Console Proofs (Optional, 0:30)

If evaluators require AWS Console screenshots to verify database usage, insert these between 2:15 and 2:20 as a cutaway:

| Time | Visual | Audio |
|------|--------|-------|
| 2:15–2:20 | **AWS Console — RDS Dashboard** showing Aurora PostgreSQL cluster running, region `ap-south-1`, instance class `db.r6g.large`, status "Available" | _"Aurora PostgreSQL cluster in ap-south-1 with Multi-AZ deployment — production grade."_ |
| 2:20–2:25 | **AWS Console — DynamoDB Tables** listing all 4 tables with `PAY_PER_REQUEST` billing mode, item counts visible | _"DynamoDB PAY_PER_REQUEST tables with real items — outbreak telemetry, sync queues, emergency streams, and village state."_ |
| 2:25–2:30 | **AWS Console — DynamoDB Explore Table Items** showing one outbreak_telemetry item with `PK`, `SK`, `disease`, `confidence`, `detectedAt` fields | _"Each outbreak record has a composite key of district and timestamp, enabling GSI queries for regional health analytics."_ |

---

## Screen Flow Diagram

```
[SECTION 1: PROBLEM]
  IntroFlow Splash ──► Language Selection ──► Services Overview
          0:00                0:05                   0:12

[SECTION 2: APP IN ACTION]
  ┌─ Villager Path ───────────────────────────────────────────┐
  │  Demo Page (click Villager) ──► Dashboard ──► Symptoms   │
  │      0:20                       0:25          0:30        │
  │  ──► Ambulance SOS ──► Schemes                            │
  │      0:38              0:45                               │
  └──────────────────────────────────────────────────────────┘
  ┌─ ASHA Path ───────────────────────────────────────────────┐
  │  Demo Page (click ASHA) ──► NGO Dashboard ──► Maternal   │
  │      0:50                     0:55             1:00       │
  │  ──► Child Nutrition                                      │
  │      1:05                                                 │
  └──────────────────────────────────────────────────────────┘
  ┌─ Admin Path ───────────────────────────────────────────────┐
  │  Demo Page (click Admin) ──► Command Center               │
  │      1:10                      1:15                        │
  │  ──► Outbreak Radar ──► AI Intel ──► System Status        │
  │      1:30               1:38           1:42               │
  └──────────────────────────────────────────────────────────┘

[SECTION 3: AWS DB CHOICE]
  Architecture Diagram ──► Aurora Schema ──► DynamoDB Tables
        1:50                  1:55                 2:05
  ──► Side-by-Side Comparison
        2:15

[SECTION 4: SO WHAT]
  Impact Stats ──► B2B Pricing ──► Monitoring Dashboard
      2:20            2:30              2:42
  ──► District Alert ──► Closing Card
      2:50               2:55
```

---

## Recording Instructions

### Environment Setup
- **Browser:** Chrome/Edge incognito window (1920×1080)
- **URL:** `https://swasthai-guardian-platform-0jsb.onrender.com`
- **Recording tool:** OBS Studio or built-in screen recorder
- **FPS:** 30
- **Resolution:** 1920×1080

### Seeded Demo Data
The app comes with pre-seeded data:
- **Villager:** Phone `9876543210` / Password `Demo@1234`
- **ASHA Worker:** Phone `9876543211` / Password `Demo@1234`
- **Admin:** Email `admin@swasthai.in` / Password `Demo@1234`
- **Demo Tour Toggle:** In Admin sidebar (bottom-left toggle), seeds 30+ records

### Cursor Movement Tips
- Move cursor deliberately and slowly — no frantic movements
- Use hover delays of 0.5s before clicking
- Keep cursor on the element being described
- Use Windows "Show cursor location" (Control Panel → Mouse → Pointer Options → Show location of pointer) if available

### Audio Tips
- Speak slowly and clearly — aim for 150 words per minute
- Use a USB microphone or good headset
- Record audio separately if needed, then sync in editing
- Background music: subtle, low-volume ambient (royalty-free)

### Editing Notes
- Cut out page loading times (use freeze-frame or quick fade)
- Add subtle zoom-in (105%) on click targets for emphasis
- Text overlays for key metrics (e.g., "600M+", "PAY_PER_REQUEST")
- Final card should hold for 3 seconds minimum

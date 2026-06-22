# SwasthAI Guardian: Integrated Rural Health Platform

> **Note on Evaluation:** Our attached demo video showcases the V1 foundation of our platform. Below is the documentation for our **V3 Production Upgrade**, which introduces Grounded RAG, Offline Login, Local Offline Maternal/Child Sync, Autonomous Outbreak Agent, NGO B2B Impact Analytics, and the Predictive Village Risk Intelligence Early Warning System. Check GitHub Readme.md for full changelog.

A production-grade, AI-powered B2B district health operations platform for rural India. It connects villagers, ASHA health workers, NGOs, and district health offices through real machine learning, offline-first workflows, regional language support, and live AWS database proof.

---

## Inspiration

Over 65% of India’s population resides in rural areas, yet access to healthcare infrastructure remains severely limited. We were inspired by ASHA (Accredited Social Health Activist) workers who tirelessly serve these communities under challenging circumstances, often relying on manual paper records, facing poor cellular connectivity, and having limited clinical tools.

Our goal was to build a scalable, AI-powered digital health ecosystem that bridges this gap—providing villagers with immediate, accessible medical guidance in their native language, while equipping frontline workers and district authorities with real-time, proactive data to stop outbreaks before they become epidemics.

---

## What it does

**SwasthAI Guardian** is an offline-first, role-based healthcare platform connecting Villagers, ASHA/NGO workers, and Hospital Administrators into a single unified ecosystem.

### 🚀 Technical Differentiation (V1 to V2 Evolution)

Most health applications simply call a third-party AI API and display the result. SwasthAI owns its intelligence and operates securely, even without a stable internet connection:

| Architectural Component | V1 Baseline | V2 Production Upgrade |
| :--- | :--- | :--- |
| **Custom Medical AI & Input Guardrails** | Evolved from our V1 Random Forest model. | We evolved from our V1 Random Forest model to **SymptomNet**, a Deep Learning MLP powered by multilingual Transformer embeddings (paraphrase-multilingual-MiniLM-L12-v2), evaluated on a reserved test set across **101 disease classes** in 7 languages: **64.6% SymptomNet accuracy** and **51.8% Random Forest fallback accuracy** versus ~1% random chance. The output is framed as triage support with confidence scores and alternatives, plus clinical text guardrails for keyboard mashing, repeated character spam, and off-topic conversations. |
| **Deterministic Clinical Heuristic Fallback** | Standard AI endpoint prone to unsafe certainty under high uncertainty. | If the neural models are uncertain (< 40% confidence) due to ambiguous symptoms, the system refuses to present a disease guess as reliable. Instead, it routes the query to a deterministic, offline-capable rule engine built on ASHA guidelines. It maps known rural symptom clusters to conservative first-aid guidance, and if undetermined, advises the villager to consult their local ASHA worker or nearest PHC. |
| **"Sakhi" Women's Health AI** | Generic conversational LLM chatbot. | Our private conversational AI for women's health is now powered by a **Grounded RAG** system with **243 knowledge chunks** (2-sentence sliding-window overlap, 15+ clinical categories) from WHO/MoHFW/FOGSI/ASHA/UNICEF sources. The retrieval threshold is **calibrated to 0.45** via a 50-query precision/recall grid search (F1=1.00). Sakhi now has **full conversation memory** — dual-track (frontend localStorage history + server-side session cache), so she remembers context across turns. Every answer cites its source and fails over to the top KB chunk if Groq is unavailable. |
| **Under-the-Hood Offline Sync (Maternal & Child Health)** | Required active internet connection for patient registrations. | NGO/ASHA workers can now register maternal pregnancy vitals and child nutrition assessments in zero-signal zones. The app computes risk levels and growth status instantly client-side using **local clinical heuristic engines** (WHO blood pressure criteria and BMI Z-score indexes), queuing records locally with visual **"Sync Pending"** indicators, and silently uploading them as soon as the browser detects an internet signal. |
| **Edge Visual Guardrails & Image Compression** | Standard high-resolution photo uploads, prone to failure on spotty connections. | Before analyzing skin photos, a **browser-side JavaScript Canvas analysis layer** downscales the image to a 16x16 grid in sub-milliseconds to verify skin tone presence, standard deviation (blank checks), and structural edge density (blur checks). A server-side Pillow validator provides a secondary confirmation pass. If passed, the image is compressed from 5MB+ down to less than 200KB on-the-fly using the browser-image-compression library to guarantee successful uploads over 2G/3G connections. |
| **Agentic Outbreak Radar (Layer 1)** | None / Manual epidemiology reporting. | An autonomous background AI agent scans village clinical data every 30 minutes. If it detects a localized symptom cluster (e.g., 5+ cases of fever in one village within 24 hours), it triggers instant, targeted notifications for both District Admins and local ASHA workers to stop outbreaks before they become epidemics. |
| **Predictive Village Risk Intelligence (Layer 2)** | Outbreak alerts only — no proactive risk forecasting. | A new Early Warning System forecasts elevated village-level health risk *before outbreaks begin*, using a transparent weighted engine: symptom trend growth (40%), nearby outbreak proximity (25%), Indian seasonal NVBDCP calendar (20%), and referral backlog (15%). Admins see a district-wide risk heatmap; each village has a drilldown with XAI contributor drilldown, health category flags, recommended prevention actions, and an Intervention Impact Forecast simulator showing projected risk reduction. NGO workers see their village's Risk Forecast tab. Works offline with graceful demo fallback. |
| **Hardened Offline-First Login** | Required active network signal to log in. | We engineered a clearly labeled **Demo Offline Login**. Demo credentials are pre-seeded into a local credential-hash cache on the first page load for evaluation. Production replacement is documented as encrypted device credential cache or WebAuthn/device-bound refresh tokens; the app displays visible offline/demo mode labeling so this is not mistaken for production security. |
| **Smart Share Peer-to-Peer** | Standard app store or download link distribution. | A high-visibility Share Button generates a **Dynamic QR Code**, allowing villagers and ASHA workers to distribute the PWA instantly without needing an app store or internet connection. |
| **Full Native Localization & Voice** | Basic English-only, text-only interface. | The entire platform dynamically supports **7 languages natively** (English, Hindi, Hinglish, Marathi, Tamil, Telugu, and Bengali) with Voice-to-Text integration ensuring non-literate users can interact with complex medical AI seamlessly. |

---

## System Architecture — Microservices

SwasthAI Guardian is built on a **true 3-service Microservices Architecture**. Each service is independently deployable, fault-isolated, and communicates over internal HTTP JSON APIs. This means if the AI service goes down, the backend continues serving auth, records, and ambulance requests without any interruption.

```text
+-------------------------+     +--------------------------+     +------------------------+
|   React + Vite Frontend |---->|  Node.js + Express API   |---->|  FastAPI AI Service    |
|   (Offline PWA Mode)    |     |  (Secure Backend Hub)    |     |  (Neural AI Engine)    |
|                         |     |                          |     |                        |
|  * Luminous Emerald UI  |     |  * JWT Auth & Bcrypt     |     |  * SymptomNet (64.6%)  |
|  * 7-Language i18n      |     |  * Cluster Load Balance  |     |  * Grounded RAG (Sakhi)|
|  * Offline Login/Sync   |     |  * SQLite (Offline Sync) |     |  * Edge Photo Guardrail|
|  * Voice Input/Output   |     |  * Target Alert Routing  |     |  * Outbreak Agent Loop |
|  * Smart Share QR       |     |  * DISHA 2023 Compliant  |     |  * Clinical Text Guard |
+-------------------------+     +--------------------------+     +------------------------+
```

---

## AWS Database Architecture

SwasthAI Guardian uses a **deliberate dual-database strategy** — each database chosen for what it does best:

| Layer | Database | Why |
|-------|----------|-----|
| **Transactional Health Records** | Amazon Aurora PostgreSQL | ACID compliance, relational joins across users/records/schemes, SERIAL PKs, TIMESTAMPTZ precision |
| **Event Streams & Telemetry** | Amazon DynamoDB | Infinitely scalable writes, no schema rigidity for outbreak events, sub-ms latency for SOS streams |

---

## Core Features

### 👨 Villager Features

*   **AI Symptom Checker** with multilingual voice input, **101-class SymptomNet/RF evaluation metrics**, confidence display, alternatives, uncertainty refusal, and ASHA/PHC escalation.
*   **Clinical Input Filters** under-the-hood to reject gibberish, spam, and non-health topics.
*   **Sakhi Women's Health AI** powered by Grounded RAG using WHO/MoHFW guidelines.
*   **Skin Disease Scanner** with image-based Edge AI assessment and skin tone/blur/blank verification guardrails.
*   **Emergency Ambulance System** with GPS and offline fallback queueing support.
*   **Sanitary Pad Request System** for private, discreet NGO/ASHA assistance.
*   **Voice Input & Voice Output** seamless support.
*   **Offline PWA Support** with Install-to-Home-Screen functionality.
*   **Multilingual Support** for Hindi, Marathi, Tamil, Telugu, Bengali, and English.

---

### 🏥 NGO / ASHA Worker Features

*   **Maternal Health Tracker** with offline registration, real vital sliders, and in-browser WHO risk alerts.
*   **Child Nutrition Monitor** with Z-score, BMI, and malnutrition analysis operating entirely offline.
*   **Village Health Dashboard** for local population health statistics.
*   **AI Outbreak Alerts** for disease cluster detection in assigned villages.
*   **🔮 Risk Forecast Tab** — AI-powered predictive village risk score (0–100) with XAI contributor breakdown (symptom surge, seasonal risk, nearby outbreaks, referral backlog), health category flags, recommended prevention actions, and Intervention Impact Forecast simulator.
*   **📊 Impact Analytics & B2B Monthly Reports** — Grant-proof dashboard with referral closure rates, vaccination completion rates, Risk Watchlist, Top Performers leaderboard, Recommended Actions engine, and PDF export.
*   **Emergency Ambulance Feed** for local emergency requests.
*   **Smart Share QR System** to instantly distribute the app in rural areas.
*   **Offline Login & Sync** for low-connectivity environments.

---

### 🏛️ Admin Features

*   **District Analytics Dashboard** with real-time village health insights.
*   **Agentic Outbreak Radar (Layer 1)** for autonomous epidemic detection — identifies active clusters every 30 minutes.
*   **🗺️ Predictive Village Risk Intelligence (Layer 2)** — District-wide risk heatmap with color-coded village cards (GREEN→RED), sorted by risk score. Click any village to open a drilldown with XAI contributor bars, intervention impact forecast, and recommended actions. Complements the Outbreak Radar with proactive early warning signals.
*   **Village Registry Management** for ASHA/NGO worker assignments.
*   **CSV Export System** for compliant government health reporting.
*   **Emergency Request Monitoring** with dynamic ambulance feeds.
*   **DISHA 2023 Compliant Data Management** with built-in consent modal.
*   **Role-Based Access Control & Secure Reporting**.

---

## How we built it

### Frontend
- React 18 + Vite PWA (deployed on Vercel)
- Tailwind CSS (Luminous Emerald design system)
- Service Workers + IndexedDB offline write queue (auto-replay on reconnect)
- Progressive Web App (PWA) — full installability on Android/Chrome
- Route-based code splitting via `React.lazy()` for Vercel edge performance

### Backend
- Node.js + Express API (multi-core clustered with Node.js `cluster` module)
- **Amazon Aurora PostgreSQL** — all transactional, relational data:
  - User registry with role-based ASHA hierarchy
  - Pregnancy vitals & child nutrition records (SERIAL PKs, TIMESTAMPTZ)
  - Government welfare scheme eligibility tables (PM-JAY, JSY, PMMVY, RBSK, PMSBY)
  - Aadhaar-verified identity with Verhoeff checksum + SHA-256 hash storage
  - DISHA 2023 audit logs
- **Amazon DynamoDB** — all event-driven, high-throughput telemetry:
  - `outbreak_telemetry` — village symptom cluster event streams
  - `sync_queues` — offline record replay tracking per village
  - `village_node_state` — real-time connectivity status per village node
  - `emergency_streams` — SOS ambulance audit trails
- Event-Driven Architecture (`eventDispatcher.js`) with 5 event types:
  `symptom_submitted`, `outbreak_detected`, `sync_restored`, `emergency_triggered`, `maternal_alert`
- JWT Authentication + Bcrypt password hashing
- `pg.Pool` connection pool (max 20 connections) with live pool health metrics endpoint

### AI Services & Guardrails
- Python FastAPI Microservice
- Transformer Embeddings + SymptomNet Neural Network
- Random Forest Fallback Model (Tier 2 Safety)
- FastAPI Test Suite
- Groq-powered Llama 3.3-70b (RAG) + Llama-3.1-8b-instant (Outbreak Agent)
- Grounded RAG Architecture (**243 chunks**, calibrated threshold 0.45, F1=1.00)
- Sakhi **Conversation Memory** (frontend localStorage + server session cache)
- Autonomous Outbreak Detection Agent (30-min scan interval)
- 52,900 samples multilingual dataset generator across 101 classes

---

## Challenges we ran into

*   **Failsafe AI Protection:** Handling real-world noisy inputs, spam, keyboard mashes, and non-skin image uploads securely to keep cloud costs low and clinical safety absolute.
*   **Complex Client-Side Clinical Heuristics:** Translating medical Z-score growth indicators and pregnancy risk classifications to browser-side vanilla Javascript so assessments function without an internet connection.
*   **Hardening Offline Authentication:** Creating a reliable local fallback login cache (`swasthai_offline_user_cache` in localStorage) that safely handles demo credentials, roles, OTP verification, and session states in zero-signal zones without gateway errors. An `online/offline` event listener drives automatic reconnection sync.
*   **Robust Background Syncing:** Serializing local clinic vitals, Z-score updates, and SOS triggers while maintaining strict order of operations once cell signals recover.
*   **Edge Visual Assessment:** Optimizing visual processing for lower-end rural smartphones.
*   **Multilingual Voice I/O Integration:** Tackling local accent variations and regional speech-to-text transitions offline.
*   **DISHA 2023 Privacy Compliance:** Designing custom user-consent modals and secure local data encryption routines to respect national patient privacy guidelines.

---

## Accomplishments that we're proud of

*   Built a healthcare AI triage-support engine evaluated on a reserved test set across **101 distinct disease classes**: **64.6% SymptomNet accuracy** and **51.8% Random Forest fallback accuracy**, with confidence and uncertainty guardrails.
*   Developed **under-the-hood text and image guardrails** that protect the model against noise.
*   Developed complete **offline Login, Registration, and maternal/child sync** registry.
*   Created an **autonomous AI outbreak detection system** running on 30-minute intervals.
*   Built a **Predictive Village Risk Intelligence engine** — a transparent, weighted 4-signal forecasting system (symptom trends, seasonal NVBDCP calendar, outbreak proximity, referral backlogs) giving India's health system proactive early warning before epidemics begin.
*   Delivered **B2B NGO Impact Analytics** with grant-proof metrics, leaderboards, risk watchlists, and PDF exports.
*   Achieved **100% multilingual translation key synchronization (366 unique keys)** across **7 Indian languages** (including Hinglish) with voice interaction.
*   Designed a highly polished, production-grade offline-first PWA.
*   Built a **V2 Clinical Heuristic Fallback** that refuses uncertain disease guesses and returns conservative ASHA-grounded next steps when models are uncertain.

---

## What we learned

We learned that in rural technology, accessibility is just as critical as technological sophistication. Grounding AI in verified clinical data (RAG), enabling offline access, and removing literacy barriers via voice interaction are the true keys to making healthcare inclusive. 

We also learned how proactive AI systems can shift medical response from reactive triage to active epidemic prevention.

---

## What's next for SwasthAI Guardian

*   **National ABDM Integration:** Link village health records with India’s Ayushman Bharat Digital Mission IDs.
*   **SMS Fallback Layer:** Support basic feature phones through lightweight SMS-based symptom checking.
*   **Low-Bandwidth Telemedicine:** Add real-time text/image consult pipelines optimized for ultra-poor data conditions.
*   **Government Partnerships:** Partner with local district ministries to test SwasthAI Guardian in active community clinics.

---

## The Development Team

*   **Divyansh Gupta (Team Leader):** AI/ML, Backend Architecture, Cloud Deployment.
*   **Tejshvee Yerpurwad:** Frontend, UX Design, Localization, Grounded RAG Engine.
*   **Rishabh Agnihotri:** Official Presenter of SwasthAI Guardian.

***

**SwasthAI Guardian** - *Built for Bharat's villages, not just its cities.*

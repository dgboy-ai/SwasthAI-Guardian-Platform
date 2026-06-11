# SwasthAI Guardian: Integrated Rural Health Platform

> **Note to Judges:** Our attached demo video showcases the V1 foundation of our platform. Below is the documentation for our **V3 Production Upgrade**, which adds Grounded RAG, Offline Login, Autonomous Outbreak Agent, NGO B2B Impact Analytics, and Predictive Village Risk Intelligence Early Warning System.

A production-grade, AI-powered healthcare platform built for rural India. Connecting remote villagers, ASHA health workers, and district hospitals through real machine learning, offline-first architecture, and regional language support.

---

## Inspiration

Over 65% of India’s population resides in rural areas, yet access to healthcare infrastructure remains severely limited. We were inspired by ASHA (Accredited Social Health Activist) workers who tirelessly serve these communities under challenging circumstances, often relying on manual paper records, facing poor cellular connectivity, and having limited clinical tools.

Our goal was to build a scalable, AI-powered digital health ecosystem that bridges this gap—providing villagers with immediate, accessible medical guidance in their native language, while equipping frontline workers and district authorities with real-time, proactive data to stop outbreaks before they become epidemics.

---

## What it does

**SwasthAI Guardian** is an offline-first, role-based healthcare platform connecting Villagers, ASHA/NGO workers, and Hospital Administrators into a single unified ecosystem.

### 🚀 Technical Differentiation (V1 to V2 Evolution)

Most health applications simply call a third-party AI API and display the result. SwasthAI owns its intelligence and operates securely, even without a stable internet connection:

*   **Custom Medical AI (Upgraded to SymptomNet):** We evolved from our V1 Random Forest model to **SymptomNet**, a Transformer-embedding neural model evaluated on a reserved test set across **101 disease classes** in 7 languages: **64.6% SymptomNet accuracy** and **51.8% Random Forest fallback accuracy** versus ~1% random chance, used for triage support with confidence scores, alternatives, uncertainty refusal, and ASHA/PHC escalation.
*   **"Sakhi" Women's Health AI (Grounded RAG + Memory):** Our private conversational AI for women's health is powered by a **Grounded RAG** system with **243 knowledge chunks** (2-sentence sliding-window overlap) from WHO/MoHFW/FOGSI/ASHA/UNICEF, a **calibrated retrieval threshold of 0.45**, and **full conversation memory** (dual-track: frontend localStorage history + server-side session cache). It provides conservative triage support, not diagnosis.
*   **Agentic Outbreak Radar (Layer 1 — Autonomous):** An autonomous background AI agent scans village clinical data every 30 minutes. If it detects a localized symptom cluster (e.g., 5+ cases of fever in one village), it triggers instant, targeted notifications for both District Admins and local ASHA workers to stop outbreaks before they become epidemics.
*   **Predictive Village Risk Intelligence (Layer 2 — Early Warning):** A new dual-layer system that *forecasts elevated village risk before outbreaks begin*. Uses a transparent weighted engine: Symptom Trend Growth (40%), Nearby Outbreak Proximity (25%), NVBDCP Indian Seasonal Calendar (20%), Referral Backlog (15%). Admins get a district-wide risk heatmap; NGO workers see a village risk forecast. Both include XAI contributor bars, prevention checklists, and an Intervention Impact Forecast simulator.
*   **NGO B2B Impact Analytics:** Grant-proof monthly analytics dashboard with referral closure rates, vaccination completion %, Risk Watchlist (high-risk pregnancies, overdue vaccinations, emergency cases), Top Performers leaderboard, Recommended Actions engine, and clean PDF export.
*   **Hardened Offline-First Sync:** We engineered a clearly labeled **Judge/Demo Offline Login**. Using IndexedDB and Service Workers, ASHA workers in zero-signal zones can use demo credential hashes, access cached data, and record patient vitals. Production replacement is encrypted device credential cache or WebAuthn/device-bound refresh tokens.
*   **Smart Share Peer-to-Peer:** A high-visibility Share Button generates a **Dynamic QR Code**, allowing villagers and ASHA workers to distribute the PWA instantly without needing an app store or internet connection.
*   **Full Native Localization & Voice:** The entire platform dynamically supports **7 languages natively** (English, Hindi, Hinglish, Marathi, Tamil, Telugu, and Bengali), with Voice-to-Text integration ensuring non-literate users can interact with complex medical AI seamlessly.

---

## System Architecture (V2)

```text
+-------------------------+     +--------------------------+     +------------------------+
|   React + Vite Frontend |---->|  Node.js + Express API   |---->|  FastAPI AI Service    |
|   (Offline PWA Mode)    |     |  (Secure Backend Hub)    |     |  (Neural AI Engine)    |
|                         |     |                          |     |                        |
|  * Luminous Emerald UI  |     |  * JWT Auth & Bcrypt     |     |  * SymptomNet (64.6%)  |
|  * 7-Language i18n      |     |  * Cluster Load Balance  |     |  * Sakhi RAG 243-chunk |
|  * Offline Login/Sync   |     |  * Aurora PostgreSQL     |     |  * Threshold 0.45 (F1=1)|
|  * Voice Input/Output   |     |  * DynamoDB (GSI valid.) |     |  * Outbreak Agent Loop |
|  * Smart Share QR       |     |  * DISHA 2023 Compliant  |     |  * Conversation Memory |
+-------------------------+     +--------------------------+     +------------------------+
```

---

## Core Features

### 👨‍🌾 Villager Features

*   **AI Symptom Checker** with multilingual voice input, **101-class SymptomNet/RF evaluation metrics**, confidence, alternatives, uncertainty refusal, and ASHA/PHC escalation.
*   **Sakhi Women's Health AI** powered by Grounded RAG with 243 chunks, calibrated threshold 0.45, and conversation memory.
*   **Skin Disease Scanner** with image-based Edge AI assesssment.
*   **Emergency Ambulance System** with GPS and offline fallback queueing support.
*   **Sanitary Pad Request System** for private, discreet NGO/ASHA assistance.
*   **Voice Input & Voice Output** seamless support.
*   **Offline PWA Support** with Install-to-Home-Screen functionality.
*   **Multilingual Support** for Hindi, Marathi, Tamil, Telugu, Bengali, and English.

---

### 🏥 NGO / ASHA Worker Features

*   **Maternal Health Tracker** for high-risk pregnancy monitoring.
*   **Child Nutrition Monitor** with Z-score, BMI, and malnutrition analysis.
*   **Village Health Dashboard** for local population health statistics.
*   **AI Outbreak Alerts** for disease cluster detection in assigned villages.
*   **🔮 Risk Forecast Tab** — Village risk score (0–100) with XAI breakdown, health category flags, prevention actions, and Intervention Impact Forecast simulator.
*   **📊 Impact Analytics & B2B Monthly Reports** — Grant-proof dashboard with risk watchlist, top performers leaderboard, recommended actions, and PDF export.
*   **Emergency Ambulance Feed** for local emergency requests.
*   **Smart Share QR System** to instantly distribute the app in rural areas.
*   **Offline Login & Sync** for low-connectivity environments.

---

### 🏛️ Admin Features

*   **District Analytics Dashboard** with real-time village health insights.
*   **Agentic Outbreak Radar (Layer 1)** for autonomous epidemic detection every 30 minutes.
*   **🗺️ Predictive Village Risk Intelligence (Layer 2)** — District heatmap with village risk scores, XAI contributor drilldown, intervention forecast simulator, and early warning prevention panel.
*   **Village Registry Management** for ASHA/NGO worker assignments.
*   **CSV Export System** for compliant government health reporting.
*   **Emergency Request Monitoring** with dynamic ambulance feeds.
*   **DISHA 2023 Compliant Data Management** with built-in consent modal.
*   **Role-Based Access Control & Secure Reporting**.

---

## How we built it

### Frontend
*   Vercel v0 (Used for scaffolding the initial layout structures, dashboard components, and form designs)
*   React 18 + Vite
*   Tailwind CSS (Luminous Emerald design system)
*   Service Workers + LocalStorage/IndexedDB
*   Progressive Web App (PWA) configuration

### Backend
*   Node.js + Express API
*   Aurora PostgreSQL system of record with SQLite local fallback
*   DynamoDB event and telemetry plane
*   JWT Authentication + Bcrypt

### AI Services
*   Python FastAPI · SymptomNet Transformer Model · Groq Llama-3.3-70b · Grounded RAG (243 chunks, threshold 0.45) · Sakhi Conversation Memory · Autonomous Outbreak Detection Agent

---

## Prize Strategy

*   **Top 3 B2B SaaS:** The buyer is a district health office or NGO network. The repeatable workflow is district onboarding, ASHA assignment, configurable outbreak thresholds, live command center, CMO report export, and performance review.
*   **Best Technical Implementation:** Aurora stores durable medical and operational records; DynamoDB stores high-write telemetry streams. The Admin Production Evidence panel verifies status, schema, regions, and latest writes.
*   **Most Impactful:** The field chain is villager triage -> ASHA workload queue -> referral/SOS follow-through -> district intelligence -> monthly health report.
*   **Most Original:** SwasthAI is not a hospital app scaled down. It is a field-health operations layer built from the village upward, where disconnected village work becomes auditable district telemetry.
*   **Best Design:** The UI is built around operational roles: compact admin cockpit, mobile ASHA queue, clear degraded/mock status labels, and low-connectivity field workflows.

---

## Challenges we ran into

*   **Hardening Offline Authentication:** Creating a bulletproof local fallback login database (`offline_users` registry cache) that safely handles credentials, roles, and session states without throwing gateway errors when Render servers sleep.
*   **Robust Background Syncing:** Serializing local clinic vitals, Z-score updates, and SOS triggers while maintaining strict order of operations once cell signals recover.
*   **Edge Visual Assessment:** Optimizing visual processing for lower-end rural smartphones.
*   **Multilingual Voice I/O Integration:** Tackling local accent variations and regional speech-to-text transitions offline.
*   **DISHA 2023 Privacy Compliance:** Designing custom user-consent modals and secure local data encryption routines to respect national patient privacy guidelines.

---

## Accomplishments that we're proud of

*   Built a healthcare AI triage-support engine evaluated on a reserved test set across **101 distinct disease classes**: **64.6% SymptomNet accuracy** and **51.8% Random Forest fallback accuracy**, with conservative uncertainty handling.
*   Deployed **Sakhi RAG** with 243 chunks, calibrated threshold 0.45 (F1=1.00), and full conversation memory.
*   Created an **autonomous AI outbreak detection system** running on 30-minute intervals.
*   Built a **Predictive Village Risk Intelligence Early Warning System** — a transparent, weighted 4-signal forecasting engine giving India's health system proactive early warning before epidemics begin.
*   Delivered **NGO B2B Impact Analytics** with grant-proof metrics, leaderboards, risk watchlists, and professional PDF exports.
*   Added support for **7 Indian languages with voice interaction** (including Hinglish).
*   Designed a highly polished, production-grade offline-first PWA.

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


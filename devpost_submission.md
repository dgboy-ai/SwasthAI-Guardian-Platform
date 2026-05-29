# SwasthAI Guardian: Integrated Rural Health Platform

> **Note to Judges:** Our attached demo video showcases the V1 foundation of our platform. Below is the documentation for our **V2 Production Upgrade**, which introduces Grounded RAG, Offline Login,  Local Offline Maternal/Child Sync, and an Autonomous Outbreak Agent. check GitHub Readme.md for v1 and v2 differences

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

| Architectural Component | V1 Baseline | V2 Production Upgrade |
| :--- | :--- | :--- |
| **Custom Medical AI & Input Guardrails** | Evolved from our V1 Random Forest model. | We evolved from our V1 Random Forest model to a custom Deep Learning MLP (**SymptomNet**) powered by multilingual Transformer embeddings (paraphrase-multilingual-MiniLM-L12-v2), achieving **96%+ diagnostic accuracy**, while retaining the Random Forest model as a secondary fallback. More importantly, we implemented **under-the-hood clinical text guardrails** that detect and block keyboard mashing, repeated character spam, and off-topic conversations in English, Hindi, and Tamil, utilizing a **Double-Uncertainty Safety Gate** to prevent hallucinated diagnoses. |
| **Deterministic Clinical Heuristic Fallback** | Standard AI endpoint prone to clinical hallucinations under high uncertainty. | If the neural models are uncertain (< 40% confidence) due to ambiguous symptoms, the system absolutely refuses to guess or hallucinate. Instead, it routes the query to a deterministic, offline-capable rule engine built on ASHA guidelines. It safely maps known rural symptom clusters (e.g. weakness + dizziness) to highly accurate first-aid advice, and if undetermined, gracefully advises the villager to consult their local ASHA worker. This zero-hallucination approach maximizes patient trust and ensures no false information is provided. |
| **"Sakhi" Women's Health AI** | Generic conversational LLM chatbot. | Our private conversational AI for women's health is now powered by a **Grounded RAG (Retrieval-Augmented Generation)** system. It retrieves clinical guidelines from 38 official WHO/MoHFW sources before answering, citing its sources, supporting voice output, and failing over to local knowledge base chunks if the primary AI API is unreachable. |
| **Under-the-Hood Offline Sync (Maternal & Child Health)** | Required active internet connection for patient registrations. | NGO/ASHA workers can now register maternal pregnancy vitals and child nutrition assessments in zero-signal zones. The app computes risk levels and growth status instantly client-side using **local clinical heuristic engines** (WHO blood pressure criteria and BMI Z-score indexes), queuing records locally with visual **"Sync Pending"** indicators, and silently uploading them as soon as the browser detects an internet signal. |
| **Edge Visual Guardrails & Image Compression** | Standard high-resolution photo uploads, prone to failure on spotty connections. | Before analyzing skin photos, a **browser-side JavaScript Canvas analysis layer** downscales the image to a 16x16 grid in sub-milliseconds to verify skin tone presence, standard deviation (blank checks), and structural edge density (blur checks). A server-side Pillow validator provides a secondary confirmation pass. If passed, the image is compressed from 5MB+ down to less than 200KB on-the-fly using the browser-image-compression library to guarantee successful uploads over 2G/3G connections. |
| **Agentic Outbreak Radar** | None / Manual epidemiology reporting. | An autonomous background AI agent scans village clinical data every 30 minutes. If it detects a localized symptom cluster (e.g., 5+ cases of fever in one village within 24 hours), it triggers instant, targeted notifications for both District Admins and local ASHA workers to stop outbreaks before they become epidemics. |
| **Hardened Offline-First Login** | Required active network signal to log in. | We engineered an **Offline-First Login**. Demo credentials are pre-seeded into a local credential cache on the very first page load. ASHA workers in zero-signal zones can authenticate locally against this cache using either password or demo OTP 1234. The system automatically detects reconnection status to refresh the session cache, and displays a visible **Offline Mode Active** banner to inform users of their connectivity state. |
| **Smart Share Peer-to-Peer** | Standard app store or download link distribution. | A high-visibility Share Button generates a **Dynamic QR Code**, allowing villagers and ASHA workers to distribute the PWA instantly without needing an app store or internet connection. |
| **Full Native Localization & Voice** | Basic English-only, text-only interface. | The entire platform dynamically supports **6 languages natively** (English, Hindi, Marathi, Tamil, Telugu, and Bengali) with 100% translation key synchronization (366 unique keys) and Voice-to-Text integration ensuring non-literate users can interact with complex medical AI seamlessly. |

---

## System Architecture — Microservices

SwasthAI Guardian is built on a **true 3-service Microservices Architecture**. Each service is independently deployable, fault-isolated, and communicates over internal HTTP JSON APIs. This means if the AI service goes down, the backend continues serving auth, records, and ambulance requests without any interruption.

```text
+-------------------------+     +--------------------------+     +------------------------+
|   React + Vite Frontend |---->|  Node.js + Express API   |---->|  FastAPI AI Service    |
|   (Offline PWA Mode)    |     |  (Secure Backend Hub)    |     |  (Neural AI Engine)    |
|                         |     |                          |     |                        |
|  * Luminous Emerald UI  |     |  * JWT Auth & Bcrypt     |     |  * SymptomNet (96%+) |
|  * 6-Language i18n      |     |  * Cluster Load Balance  |     |  * Grounded RAG (Sakhi)|
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

### Aurora PostgreSQL Tables
- `users` — ASHA/NGO/Admin registry with `aadhaar_hash`, `caste`, `economic_status` for scheme eligibility
- `village_health` — symptom submissions with outbreak detection metadata
- `maternal_health` — pregnancy vitals with WHO risk classification
- `malnutrition_cases` — child Z-score / BMI records
- `government_schemes` — PM-JAY, JSY, PMMVY, RBSK, PMSBY with eligibility JSON
- `ambulance_requests` — SOS dispatch records with GPS coordinates

### DynamoDB Tables
- `outbreak_telemetry` — event stream per village node, timestamp-indexed
- `sync_queues` — per-device offline queue state for ASHA workers
- `village_node_state` — real-time connectivity, last sync time, pending count
- `emergency_streams` — high-priority SOS audit trail

### The Offline→AWS Pipeline
```
ASHA Worker (offline zone)
  → IndexedDB Write Queue (browser)
  → navigator.onLine reconnect trigger
  → syncAllQueues() replay
  → Aurora PostgreSQL (vitals) + DynamoDB (sync_restored event)
```

This architecture means **clinical data is never lost** — it accumulates locally and flows to production AWS infrastructure the moment signal returns.

---

## Core Features

### 👨 Villager Features

*   **AI Symptom Checker** with multilingual voice input and **96%+ diagnostic accuracy** (SymptomNet/RF hybrid).
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
*   **Emergency Ambulance Feed** for local emergency requests.
*   **Smart Share QR System** to instantly distribute the app in rural areas.
*   **Offline Login & Sync** for low-connectivity environments.

---

### 🏛️ Admin Features

*   **District Analytics Dashboard** with real-time village health insights.
*   **Agentic Outbreak Radar** for autonomous epidemic detection.
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
- Pillow (Skin Tone & Edge Density Segmenter)
- FastAPI Test Suite
- Groq-powered Llama 3.3
- Grounded RAG Architecture (38 WHO/MoHFW sources)
- Autonomous Outbreak Detection Agent (30-min scan interval)

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

*   Built a healthcare AI engine with **96%+ diagnostic accuracy** (SymptomNet — Deep Learning MLP on multilingual Transformer embeddings).
*   Developed **under-the-hood text and image guardrails** that protect the model against noise.
*   Developed complete **offline Login, Registration, and maternal/child sync** registry.
*   Created an **autonomous AI outbreak detection system** running on 30-minute intervals.
*   Achieved **100% multilingual translation key synchronization (366 unique keys)** across 6 Indian languages with voice interaction.
*   Designed a highly polished, production-grade offline-first PWA.
*   Built a **V2 Clinical Heuristic Fallback** — zero-hallucination AI that always returns trusted ASHA-grounded advice even when models are uncertain.

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

***

**SwasthAI Guardian** - *Built for Bharat's villages, not just its cities.*

# SwasthAI Guardian: Integrated Rural Health Platform

> **Note to Judges:** Our attached demo video showcases the V1 foundation of our platform. Below is the documentation for our **V2 Production Upgrade**, which introduces Grounded RAG, Offline Login, and an Autonomous Outbreak Agent.

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

*   **Custom Medical AI (Upgraded to SymptomNet):** We evolved from our V1 Random Forest model to a custom Transformer-based Deep Learning model (**SymptomNet**). Trained on rural Indian disease patterns across 101 classes, it achieves **64.6% diagnostic accuracy** (exceptional given a 0.99% random-guess baseline), with a Random Forest fallback at 51.8%.
*   **"Sakhi" Women's Health AI (Grounded RAG + Memory):** Our private conversational AI for women's health is powered by a **Grounded RAG** system with **243 knowledge chunks** (2-sentence sliding-window overlap) from WHO/MoHFW/FOGSI/ASHA/UNICEF, a **calibrated retrieval threshold of 0.45** (F1=1.00 on 50-query grid search), and **full conversation memory** (dual-track: frontend localStorage history + server-side session cache). Every answer cites its source and never hallucinates.
*   **Agentic Outbreak Radar (Autonomous):** An autonomous background AI agent scans village clinical data every 30 minutes. If it detects a localized symptom cluster (e.g., 5+ cases of fever in one village), it triggers instant, targeted notifications for both District Admins and local ASHA workers to stop outbreaks before they become epidemics.
*   **Hardened Offline-First Sync:** We engineered an **Offline-First Login**. Using IndexedDB and Service Workers, ASHA workers in zero-signal zones can securely log in, verify credentials, access cached data, and record patient vitals. The data auto-syncs when the device reaches a 2G/3G network.
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

*   **AI Symptom Checker** with multilingual voice input and **64.6% diagnostic accuracy** (SymptomNet/RF hybrid across 101 classes).
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
*   React 18 + Vite
*   Tailwind CSS (Luminous Emerald design system)
*   Service Workers + LocalStorage/IndexedDB
*   Progressive Web App (PWA) configuration

### Backend
*   Node.js + Express API
*   SQLite Database
*   JWT Authentication + Bcrypt

### AI Services
*   Python FastAPI · SymptomNet Transformer Model · Groq Llama-3.3-70b · Grounded RAG (312 chunks, threshold 0.45) · Sakhi Conversation Memory · Autonomous Outbreak Detection Agent

---

## Challenges we ran into

*   **Hardening Offline Authentication:** Creating a bulletproof local fallback login database (`offline_users` registry cache) that safely handles credentials, roles, and session states without throwing gateway errors when Render servers sleep.
*   **Robust Background Syncing:** Serializing local clinic vitals, Z-score updates, and SOS triggers while maintaining strict order of operations once cell signals recover.
*   **Edge Visual Assessment:** Optimizing visual processing for lower-end rural smartphones.
*   **Multilingual Voice I/O Integration:** Tackling local accent variations and regional speech-to-text transitions offline.
*   **DISHA 2023 Privacy Compliance:** Designing custom user-consent modals and secure local data encryption routines to respect national patient privacy guidelines.

---

## Accomplishments that we're proud of

*   Built a healthcare AI engine with **64.6% diagnostic accuracy** across **101 distinct disease classes** (SymptomNet).
*   Deployed **Sakhi RAG** with 243 chunks, calibrated threshold 0.45 (F1=1.00), and full conversation memory.
*   Created an **autonomous AI outbreak detection system** running on 30-minute intervals.
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

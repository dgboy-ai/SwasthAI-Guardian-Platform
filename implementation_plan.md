# Implementation Plan - SwasthAI Guardian V2: AWS/Vercel Hackathon Evolution

This plan outlines the technical transition of **SwasthAI Guardian** into a resilient, production-ready hybrid architecture utilizing **Amazon Aurora PostgreSQL** and **Amazon DynamoDB** on the backend, hosted on **Vercel** on the frontend. It features a simplified **Guided Healthcare Mode**, an offline **Event Replay Engine**, a **District Simulation & Observability Panel**, and a **Local Semantic AI Cache** to ensure reliability in offline and low-bandwidth rural environments.

---

## User Review Required

> [!IMPORTANT]
> **AWS Multi-Service Configuration:**
> This architecture requires both an **Amazon Aurora PostgreSQL** database (for transactional business tables) and an **Amazon DynamoDB** database (for telemetry, retry logs, and village states). You will need to configure `DATABASE_URL` (PostgreSQL) and `AWS_REGION`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` in the backend environment variables.
> 
> **Vercel API Mapping:**
> The frontend React app will be deployed on Vercel. Since we are maintaining a 3-microservice architecture, the backend Node.js API must be deployed on an external cloud host (e.g. AWS App Runner or Render) and the API URL must be provided in Vercel environment variables as `VITE_API_URL`.

---

## Proposed Changes

```
               ┌────────────────────────────────────────────────────────┐
               │              React + Vite PWA (Vercel)                 │
               │  - Guided Healthcare Mode    - Active Node Live Map    │
               │  - Local-first Writes        - Offline Queue Indicators│
               └────────────────────────────────────────────────────────┘
                                   │                   ▲
                     HTTPS / WSS   │                   │ Sync Replays & Logs
                                   ▼                   │
               ┌────────────────────────────────────────────────────────┐
               │             Node.js + Express API (Host)               │
               │  - PostgreSQL Connection Pool & Async Inference        │
               │  - Event-Driven Dispatcher (symptom_submitted, etc.)   │
               └────────────────────────────────────────────────────────┘
                         │                                  │
               Relational│                                  │NoSQL Telemetry
                 Queries │                                  │& Offline Syncs
                         ▼                                  ▼
        ┌─────────────────────────┐               ┌────────────────────┐
        │  Amazon Aurora Postgres │               │  Amazon DynamoDB   │
        │ - Users & Health Records│               │ - Outbreak Logs    │
        │ - Govt Schemes & Audits │               │ - Sync Queues      │
        │ - Relational Analytics  │               │ - Node States      │
        └─────────────────────────┘               └────────────────────┘
```

---

### Component 1: Multi-Database Infrastructure Layer (AWS)

#### [NEW] [dynamodb.js](file:///c:/projects/Swasthai-Guardian-Up/backend/dynamodb.js)
* Initialize the AWS DynamoDB client.
* Configure tables:
  * `outbreak_telemetry`: Event streams for symptom clusters.
  * `sync_queues`: Temp storage for replays.
  * `village_node_state`: Status of registered village connectivity and logs.
  * `retry_events`: Tracker for failed background tasks.
  * `emergency_streams`: Accidental/SOS audit streams.

#### [MODIFY] [server.js](file:///c:/projects/Swasthai-Guardian-Up/backend/server.js)
* Replace SQLite3 connection code with a `pg.Pool` connection pool utilizing the `DATABASE_URL` environment variable.
* Implement a database utility helper (`db`) that mimics the current query wrapper while routing:
  * **Relational data** (Users, Pregnancy data, Malnutrition data, Schemes, Audit logs) $\to$ **Aurora PostgreSQL**.
  * **Event streams, retry logs, and telemetry data** $\to$ **Amazon DynamoDB** using the AWS SDK.
* Translate SQLite syntax in existing queries (e.g. replacing `?` with `$1, $2`, converting date intervals).

---

### Component 2: Event-Driven Architecture (EDA) & Resilience

#### [NEW] [eventDispatcher.js](file:///c:/projects/Swasthai-Guardian-Up/backend/eventDispatcher.js)
* Build a lightweight, local event emitter to trigger background processors for:
  * `symptom_submitted`: Logs metadata, updates DynamoDB village telemetry, triggers check for outbreak criteria.
  * `outbreak_detected`: Triggers outbreak alert in `village_health`, logs telemetry, sends notifications.
  * `sync_restored`: Triggered when offline sync replay is initiated; logs sync health statistics.
  * `emergency_triggered`: Instantly flags high-priority alerts in DynamoDB stream, dispatches ASHA notification.
  * `maternal_alert`: Logs maternal high-risk events to Aurora and pushes event notification.

#### [MODIFY] [server.js](file:///c:/projects/Swasthai-Guardian-Up/backend/server.js)
* Rewrite the symptom submission pipeline to run **async AI inference** with a strict 8s timeout. If the FastAPI neural service fails or times out, degrade gracefully to the local clinical heuristic rule engine.
* Integrate event dispatches into HTTP route handlers (e.g. `/api/villager/symptoms` emits `symptom_submitted`).

---

### Component 3: Government Schemes Upgrades

#### [MODIFY] [server.js](file:///c:/projects/Swasthai-Guardian-Up/backend/server.js)
* Remove any reference to the `religion` field from the database schema and matching parameters.
* Seed welfare schemes database tables with parameters supporting only **Age, Gender, Caste (optional), and Economic Status (optional)**.

#### [NEW] [GovernmentSchemes.jsx](file:///c:/projects/Swasthai-Guardian-Up/frontend/src/pages/GovernmentSchemes.jsx)
* Create the schemes page using the custom UI system:
  * Optional profile inputs for Caste/Category and Economic Status (APL/BPL).
  * Personalized matching widget displaying calculated eligibility matching score.
  * Interactive document checklists for PM-JAY, JSY, and PMMVY.
  * "Request ASHA Support" button that fires a sync request.

---

### Component 4: Local Semantic AI Cache & Offline Knowledge Base

#### [NEW] [semanticCache.js](file:///c:/projects/Swasthai-Guardian-Up/frontend/src/services/semanticCache.js)
* Implement a client-side local cache using **IndexedDB** to store results for repeated symptom assessments, reducing network latency and server load in spotty areas.
* Cache the multilingual emergency guidance materials, WHO clinical chunks, and basic maternal/child risk criteria locally so that first-aid advice is accessible immediately even when offline.
* Bind states to the UI: **Cached Offline**, **Sync Pending**, **Replay Active**, and **Local AI Mode** (using fallback logic).

---

### Component 5: Guided Healthcare Mode & UX Polish

#### [NEW] [GuidedHealthcareMode.jsx](file:///c:/projects/Swasthai-Guardian-Up/frontend/src/pages/GuidedHealthcareMode.jsx)
* Build a simplified portal displaying 5 large, color-coded, high-visibility tactile cards:
  1. **Fever / बुखार (Symptom check):** Quick flow to identify viral infections or acute outbreaks.
  2. **Pregnancy / गर्भावस्था (Maternal Tracker):** Slide vitals inputs, risk estimation.
  3. **Emergency / आपातकालीन (One-tap SOS):** Large ambulance dispatch trigger, offline backup display.
  4. **Women’s Health / महिला स्वास्थ्य (Sakhi RAG):** Grounded guidelines chat.
  5. **Child Health / बाल स्वास्थ्य (Nutrition Monitor):** Z-score checks.
* Design specs:
  * Large touch targets (minimum 60x60px) for easier fat-finger usability.
  * Simpler language prompts with dual-language support (Hindi/English).
  * Voice-first navigation: integrated text-to-speech guidance prompting the user at each step.
* Polish elements:
  * route-based lazy loading to split app bundles.
  * Skeleton loaders for a smoother experience on low-end Android phones.
  * Service worker configurations to ensure full PWA installability.

#### [NEW] [DistrictOutbreakMap.jsx](file:///c:/projects/Swasthai-Guardian-Up/frontend/src/components/DistrictOutbreakMap.jsx)
* Create an interactive SVG map representing village nodes:
  * Village coordinates and outbreak clusters visualised as color-coded heat circles (Green $\to$ Red pulses).
  * Markers displaying live emergency location triggers.
  * Real-time network state indicator.

---

### Component 6: Observability, Simulation & Benchmarking Panel

#### [NEW] [MonitoringDashboard.jsx](file:///c:/projects/Swasthai-Guardian-Up/frontend/src/pages/MonitoringDashboard.jsx)
* Build an internal monitoring interface for judges:
  * **System Telemetry & Benchmarks:** Live line charts and numeric gauges showing:
    * *API Latency Metrics:* Response times of core endpoints in milliseconds.
    * *Offline Replay Speed:* Average sync time per record during restoration.
    * *AI Fallback Response Time:* Speed of local clinical heuristic models.
    * *Queue Recovery Timing:* Duration required to clear the IndexedDB queue.
    * *Image Compression Savings:* Size reduction stats (e.g., 5MB $\to$ 180KB).
    * *Low-Bandwidth Metrics:* Bytes saved via payload compression.
  * **District Simulation Controller:** Controls to simulate live traffic:
    * *Internet Loss Simulation:* Toggles mock network status to demonstrate local queueing and fallback modes.
    * *Village Node Offline Simulation:* Simulates a specific village going completely offline.
    * *Outbreak Spike Simulation:* Injects 20+ symptoms in a specific village node within 5 seconds to trigger the Outbreak Agent.
    * *Emergency Surge Simulation:* Injects concurrent SOS ambulance requests.
    * *Replay Recovery Simulation:* Initiates connection restoration and shows the queue clearance.

---

## Verification Plan

### Automated Tests
* Use a local PostgreSQL and LocalStack (DynamoDB container) to validate database initializations.
* Execute concurrent simulation calls via the Dashboard controller and verify that Postgres connections pool correctly without hitting max client limits.

### Manual Verification
1. **Offline Replay Walkthrough:**
   * Open the app, disconnect network (DevTools Offline).
   * Submit 3 maternal vitals records in **Guided Healthcare Mode**. Verify they cache in IndexedDB and display **"Sync Pending"** badges.
   * Toggle network back Online. Verify the local queue replays and uploads records to AWS DynamoDB, shifting badges to **"Synced"**.
2. **Outbreak Simulation Walkthrough:**
   * Open the **System Monitor** and click **Simulate Outbreak Surge**.
   * Verify the **District Outbreak Map** animates a red pulsing circle over the targeted village node.
   * Verify the ASHA alert feed displays a localized outbreak warning.
3. **AWS Logs Verification:**
   * Confirm Aurora PostgreSQL correctly records static patient registries.
   * Confirm AWS DynamoDB logs the event streams and replay queues.

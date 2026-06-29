# Judge's Guide — SwasthAI Guardian

*Devpost Submission: Most Impact Track + B2B Track | June 30, 2026*  
*Team ID: `team_ZuoCZ7nsvWVIrutn3eqmYdQD`*

This guide walks through the platform's most impressive features in ~15 minutes. Each section shows exactly what to click and what to notice.

---

## 1. Landing Page (2 min)

**URL:** https://swasth-ai-guardian-platform.vercel.app

- Notice the **B2B pricing tiers** (Community, Growth, Enterprise) — real subscription model with feature breakdowns
- Click **"Emergency Help"** — calls `tel:108` directly (no auth required, works on any phone)
- Click **"Get Started"** → IntroFlow with role selection
- **What to note:** Every logo, icon, and illustration is lucide SVG, not emoji. WCAG 2.5.5 compliant touch targets (44x44px).

## 2. Villager Experience & Offline-First (4 min)

**Login:** Phone `9876543210` · OTP `1234` · Role: Patient

- **Symptom Checker** — Type "fever headache body pain" → see real ML inference (SymptomNet). **Toggle offline mode** (subtle icon bottom-right) → classifier still works via local ONNX model. Works without any internet.
- **Ambulance SOS** — Submit an emergency → notice the **60s cooldown** displayed in the button. **Toggle offline** → request is queued to IndexedDB. Reconnect online → auto-replays.
- **Government Schemes** — Browse JSY, PMMVY, Ayushman Bharat. **Toggle offline** → all schemes still load from 6h localStorage cache with full eligibility checkers.
- **Sakhi Chatbot** — Ask "What are the danger signs in pregnancy?" in Hindi or English. Grounded RAG (243 clinical chunks, threshold 0.45, F1=1.00) with cited sources. Falls back to local KB if Groq API is down.
- **Menstrual Health** — Clinical content, zero API calls. Works fully offline.

**What to note:** 5 of 10 major features work completely offline (symptom check, ambulance, schemes, menstrual health, maternal/child records). This is not a "loading spinner" offline mode — it's real local inference.

## 3. Admin Panel & AWS Infrastructure Proof (3 min)

**Login:** Phone `9876543212` · OTP `1234` · Role: Admin

- **Navigate to Live Infrastructure Monitor** (top nav) — Live connection status to:
  - **Aurora PostgreSQL**: Connection OK, pool health, query latency, item counts
  - **DynamoDB**: 5 tables with GSIs, TTL config, item counts, access patterns
  - **AI Service**: Module status, RAG config, model availability
- **Command Center** — District-level dashboard with live SSE telemetry. Notice the **Outbreak Radar** fetching real DynamoDB outbreak_telemetry. Service alerts with AnimatePresence transitions.
- **B2B Usage Dashboard** — Per-tenant API key analytics with village stats, user counts, record volumes. Data comes from real PostgreSQL JOIN queries.
- **Production Evidence Panel** — Shows data provenance (`_db: postgresql` or `_db: dynamodb` on every response). Degraded mode banner when DynamoDB is in mock mode.

**What to note:** Every data point has provenance — `_db` field on every API response. The Live Infrastructure Monitor page is cached in localStorage to survive Render cold starts. 18 AWS judge audit gaps were closed — no hardcoded metrics, no fabricated fallbacks.

## 4. B2B API Key System (3 min)

- In the Admin panel, navigate to **API Keys** tab
- Click **"Generate Key"** — enter name `Judge Demo`, tenant `varanasi_district`, permissions `read`
- **Copy the full key** (shown once: `sk_live_...`)
- Open a terminal and test:
  ```bash
  curl -H "x-api-key: sk_live_abc..." https://swasthai-guardian-platform-0jsb.onrender.com/api/b2b/me
  # Returns key metadata, tenant, permissions
  curl -H "x-api-key: sk_live_abc..." https://swasthai-guardian-platform-0jsb.onrender.com/api/b2b/villages
  # Returns village health data scoped to Varanasi only
  ```
- **B2B Usage Dashboard** — Refresh to see the `usage_count` increment for the key you just used

**What to note:** API keys are scoped to a single tenant. Usage is tracked per key (`usage_count`, `last_used_at`). The Groq key for Sakhi AI is an internal env var — completely separate from this B2B system.

## 5. NGO / ASHA Dashboard (2 min)

**Login:** Phone `9876543211` · OTP `1234` · Role: ASHA

- **Maternal Records** — View pregnancies with WHO risk classification. **Toggle offline** → still accessible via IndexedDB queue + local WHO calculations.
- **Emergency Response Workflow** — Red alert banner for P1 emergencies. All icons are lucide SVGs.
- **Smart Task Manager** — Stagger entrance animations on task cards. Error banner with AlertTriangle on API failure.

**What to note:** Every emoji in the original NGO UI has been replaced with lucide icons. Loading skeletons, error states, and empty states are wired throughout.

## 6. Architecture & Technical Depth (1 min)

Review these docs for the full technical picture:

- **[Architecture Diagram](../docs/architecture_v3.png)** — Premium visual architecture showing all 5 layers, AWS dual-DB design, 4 differentiators, and real tech stack (dark-mode, scannable in 5 seconds)
- **[system_architecture.md](system_architecture.md)** — ERD, DynamoDB access patterns, GSI schema, production hardening table
- **[ai_architecture.md](ai_architecture.md)** — 5-Fold Stratified CV results, RAG calibration (threshold 0.45, F1=1.00), 101 disease classes
- **[offline_sync_strategy.md](offline_sync_strategy.md)** — Three conflict resolution rules (Reject-Duplicate, LWW, Accumulate)

---

## Key Differentiators (Why This Submission Wins)

| Differentiator | SwasthAI | Typical Submission |
|:---|---:|:---|
| **Real AWS infrastructure** | Aurora PostgreSQL + DynamoDB (5 tables, 7 GSIs) | Mock/Fake cloud config |
| **Data provenance** | Every response tagged `_db: postgresql` / `_db: dynamodb` | No data source tracking |
| **Offline-first, not offline-tolerant** | 5 features fully offline (ONNX, IndexedDB, localStorage) | "Sorry, no internet" spinners |
| **B2B API key system** | Scoped keys, usage tracking, tenant isolation | Single hardcoded key or none |
| **AI grounded in clinical guidelines** | 243 chunks, threshold 0.45, F1=1.00, 6-turn memory | Generic LLM with no citation |
| **101-class diagnostic model** | 64.6% DL / 71.1% LR (random chance = ~1%) | 5-10 class demo models |
| **Closed-loop outbreak agent** | 30-min autonomous loop, SSE push, DynamoDB dedup | Manual dashboard refresh |

# SwasthAI Guardian: Integrated Rural Health Platform

**Tracks:** Monetizable B2B App · Most Impactful · Open Innovation

**Stack:** Vercel v0 + React PWA → Render Express API → Render FastAPI AI
**AWS:** Aurora PostgreSQL (ap-south-1) + DynamoDB (5 tables, 7 GSIs, ap-south-1)

---

## Inspiration

Over 65% of India's population — 650+ million people — lives in rural areas with severely limited healthcare access. ASHA (Accredited Social Health Activist) workers serve as the frontline, yet they operate with paper records, no clinical decision support, and frequent network dead zones.

1.4 million ASHA workers. 600,000 villages. Zero digital infrastructure.

We built SwasthAI Guardian to change that — an offline-first, AI-powered platform that works where the internet doesn't, speaks the language villagers understand, and gives health workers the intelligence they need to save lives.

---

## What it does

A unified healthcare ecosystem connecting three roles — Villagers (AI triage, women's health, emergency), ASHA Workers (offline tracking, outbreak alerts, impact analytics), and District Administrators (risk heatmaps, outbreak radar, B2B API management):

- **SymptomNet AI** — Deep MLP (paraphrase-multilingual-MiniLM-L12-v2), **64.6% accuracy** across **101 diseases** in **7 languages** (52,900 training samples, versus ~1% random chance). Clinical guardrails reject spam, gibberish, and off-topic input. Output framed as triage support with confidence scores — never as a diagnosis.

- **Clinical Fallback (< 40% confidence)** — When uncertain, refuses to guess. Routes to an offline ASHA-grounded rule engine with conservative first-aid guidance mapped to common rural symptom patterns.

- **Sakhi Women's Health AI** — Grounded RAG system: **243 knowledge chunks** from WHO, MoHFW, FOGSI, ASHA, and UNICEF guidelines. Retrieval calibrated to threshold 0.45 (F1=1.00) via 50-query grid search. 6-turn conversation memory (localStorage + server cache). Falls back to top KB chunk when Groq is unavailable.

- **Offline Maternal & Child Sync** — Pregnancy vitals and child nutrition assessments computed entirely client-side (WHO Z-scores, blood pressure criteria). Queued in IndexedDB with "Sync Pending" badges, auto-uploaded silently on reconnect.

- **Edge Visual Guardrails** — Browser canvas (300×300) verifies skin tone, blur, blank. Server-side Pillow confirms. Images compressed 5MB→200KB for 2G uploads.

- **Outbreak Radar (30-min cycle)** — Autonomous AI agent scans all village clinical data every 30 minutes. Symptom clusters trigger SSE alerts to Admins and ASHA workers instantly.

- **Predictive Risk Engine** — 4-factor early warning scoring: symptom trend (40%), outbreak proximity (25%), seasonal NVBDCP calendar (20%), referral backlog (15%). District heatmap with XAI per-village drilldown and intervention simulator.

- **Camera-Verified Pad Requests** — Selfie capture → AI gender verification → GPS geocoding → SSE to ASHA with photo + map link. Blocks misuse. First privacy-preserving, camera-gated welfare request in rural health.

- **Offline Login** — Pre-seeded credential hashes in localStorage with visible demo labeling. Zero-backend authentication for evaluation scenarios.

- **7 Languages + Voice I/O** — English, Hindi, Hinglish, Marathi, Tamil, Telugu, Bengali. Voice-to-text for non-literate users. 471 translation keys fully synced.

---

## B2B API Key System — Revenue Model

Production-grade B2B gateway for NGOs and district health departments:

- `sk_live_` + 32 hex character keys, each locked to exactly one of 6 districts (Varanasi, Lucknow, Sehore, Bhopal, Indore, Pune)
- 3 permission tiers — Read (analytics access), ReadWrite (data submission), Admin (key management)
- 5 REST endpoints: `/api/b2b/me`, `/api/b2b/villages`, `/api/b2b/analytics`, `/api/b2b/ambulances`, `/api/b2b/outbreaks`
- Per-request usage tracking (`usage_count`, `last_used_at`) persisted in PostgreSQL
- Full SQL-level tenant isolation via `WHERE "districtId" = ?`
- Admin web panel: create, revoke, rotate, copy-to-clipboard, per-tenant usage analytics

We charge partner organizations for programmatic data access — pulling real-time village health analytics, outbreak telemetry, and ambulance streams into their own dashboards. This is how the platform becomes self-sustaining beyond the hackathon.

### Pricing Model

| Tier | Price | What's Included |
|------|-------|-----------------|
| **District Starter** | ₹18,800/mo (~$199) | Up to 50 villages, offline vitals, basic RAG, weekly CSV exports |
| **District Command** | ₹37,700/mo (~$399) | Up to 250 villages, outbreak agent, SSE dashboards, 7-language support |
| **State Enterprise** | Custom | Unlimited villages, dedicated Aurora pool, ABDM sync, SLA |

---

## How we built it

```
Layer          Tech                          Purpose
─────────      ──────────                    ────────────────────────────
Frontend       React 18 + Vite PWA           Offline-first SPA on Vercel
               Tailwind CSS                  Luminous Emerald design
               Service Workers + IndexedDB   4 offline queues (maternal,
                                             child, ambulance, symptoms)
               React.lazy()                  Route-based code splitting
               7-language i18n + Voice I/O   471 keys, voice-to-text

Backend        Node.js + Express (cluster)   Multi-core API on Render
               JWT + Bcrypt                  Auth
               Aurora PostgreSQL             ACID records (users, vitals,
                                             schemes, Aadhaar, audit)
               DynamoDB (5 tables, 7 GSIs)   Event streams, sync, SOS, audit
               eventDispatcher.js            5 event types
               SSE infrastructure            Real-time push to ASHA/admins

AI Services    FastAPI (Python)              Microservice on Render
               SymptomNet MLP (64.6%)        101-disease classifier
               Logistic Regression (71.1%)   Fallback when GPU unavailable
               Groq Llama 3.3-70b            RAG (F1=1.00) + outbreak agent
               52,900 samples / 101 classes  Multilingual training dataset
```

---

## Challenges we overcame

- **Clinical Safety at Scale:** Handling real-world noisy inputs — spam, keyboard mashes, religious text, non-skin photos — while keeping cloud inference costs near zero and never outputting a false diagnosis. Every incorrect output in a rural setting has real consequences.

- **Offline Medical Logic:** Porting WHO Z-score growth indicators and pregnancy risk classifications to vanilla client-side JavaScript. Medical formulas reference lookup tables and edge cases not designed for browser execution.

- **Offline Authentication:** Building a local login cache (`swasthai_offline_user_cache`) that handles demo credentials, roles, OTP flows, and session state in zero-signal zones. `online/offline` event listeners drive automatic reconnect and queue replay.

- **Background Sync Integrity:** Serializing vitals, Z-scores, SOS triggers, and pad requests in strict chronological order during network recovery. Race conditions between IndexedDB writes and server-side deduplication required careful LWW (last-writer-wins) timestamp design.

- **Edge AI on Low-End Devices:** Running canvas-based skin tone analysis, blur detection, and blank verification on $50 Android phones used by ASHA workers in the field. Every millisecond of processing time matters.

- **Multilingual Voice Across 7 Languages:** Handling regional accent variation, code-switching (Hinglish), and speech-to-text accuracy tradeoffs across English, Hindi, Marathi, Tamil, Telugu, Bengali, and Hinglish.

- **DISHA 2023 Compliance:** Building consent-first data collection modals, local encryption routines, and audit trails that satisfy India's national digital health privacy framework.

---

## Accomplishments we're proud of

- **101-class AI triage engine** — 64.6% SymptomNet MLP + 71.1% Logistic Regression fallback, both with confidence guardrails and uncertainty refusal. Trained on 52,900 multilingual samples. Every output is triage support, never a diagnosis.

- **Full offline capability** — Login, registration, maternal health tracking, child nutrition analysis (Z-scores, BMI), and data sync all function at zero signal. Queued records replay in order on reconnect.

- **Autonomous outbreak detection** — AI agent running on 30-minute cycles across all villages. Detects symptom clusters and alerts ASHA workers before the outbreak reaches the clinic.

- **Camera-verified pad request system** — End-to-end: selfie capture → AI gender verification → GPS reverse geocoding → SSE broadcast to ASHA with photo + Google Maps link. Prevents welfare fraud while preserving privacy.

- **B2B impact analytics** — Grant-proof dashboards with referral closure rates, vaccination completion, risk watchlists, top-performer leaderboards, and PDF export. Designed for NGOs reporting to their funders.

- **100% i18n sync (471 keys)** across 7 Indian languages with voice I/O for non-literate users. Every string, every error message, every UI label translated.

- **Dual AWS database architecture** — Aurora PostgreSQL for ACID health records + DynamoDB for high-throughput event streams. Both provisioned in ap-south-1 (Mumbai). Designed for India-scale.

- **Clinical heuristic fallback** — When the AI is uncertain, the system refuses to guess instead of producing a false diagnosis. Routes to conservative, ASHA-grounded first-aid guidance.

---

## What we learned

Building for rural India taught us that accessibility is not a feature — it's the foundation. Grounding AI in verified clinical data (RAG), supporting complete offline operation, and removing literacy barriers through voice interaction are prerequisites, not differentiators.

The most important technical insight: a cloud-only health platform excludes the very population it aims to serve. Offline-first architecture isn't a nice-to-have in rural healthcare — it's the only architecture that works.

Proactive AI shifts medicine from reactive triage to epidemic prevention. The outbreak radar caught simulated clusters before they would have reached clinics. In the real world, that difference means lives saved.

---

## What's next

- **ABDM Integration:** Link village health records with India's Ayushman Bharat Digital Mission for nationwide health ID interoperability
- **SMS Fallback:** Support basic feature phones through lightweight SMS symptom checking and referral alerts
- **Low-Bandwidth Telemedicine:** Real-time text and image consult pipelines optimized for 2G and sub-100kbps conditions
- **Government Pilots:** Partner with district health ministries to deploy in active community health centers under real rural connectivity conditions

---

## Team

- **Divyansh Gupta (Team Leader):** AI/ML architecture, backend systems, AWS cloud deployment, API design
- **Tejshvee Yerpurwad:** Frontend engineering, UX design, multilingual localization, Grounded RAG system

---

*1.4 million ASHA workers. 600,000 villages. 650 million lives. Powered by Aurora PostgreSQL + DynamoDB on Vercel.*

**SwasthAI Guardian** — *We didn't build AI for doctors. We built it for the villages that don't have one.*

*Built for H0 Hackathon 2026.*

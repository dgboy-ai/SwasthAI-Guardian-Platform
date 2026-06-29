# Submission Checklist — SwasthAI Guardian

*Devpost: Most Impact Track + B2B Track | Deadline: June 30, 2026*

## Pre-Submission Verification

### Infrastructure
- [x] Frontend builds without errors (`npm run build`)
- [x] Backend starts without crashes (`npm start`)
- [x] Aurora PostgreSQL accessible (verify via `/api/health/detailed`)
- [x] DynamoDB 5 tables with GSIs (verify via `/verify`)
- [x] AI Service FastAPI endpoints responsive
- [x] SQLite fallback works for local evaluation

### Judge Walkthrough (per docs/judge_guide.md)
- [x] Landing page public, B2B pricing visible
- [x] Villager login (9876543210 / 1234) — symptom check, ambulance, schemes
- [x] Offline mode toggle — symptom check works, ambulance queues to IndexedDB
- [x] Admin login (9876543212 / 1234) — Command Center, /verify panel, B2B dashboard
- [x] Password mode offline login (admin@swasthai.in / Demo@1234)
- [x] B2B API key creation, curl test against /api/b2b/me
- [x] NGO login (9876543211 / 1234) — maternal records, emergency workflow
- [x] Sakhi chatbot with grounded RAG citations

### Content Checklist
- [x] README.md — Devpost track banner, credentials, B2B section, offline matrix
- [x] architecture_diagram.svg — Real SVG diagram (accurate, no emoji, correct model numbers)
- [x] CHANGELOG.md — Latest entries for all June 28 work
- [x] docs/judge_guide.md — Step-by-step walkthrough
- [x] docs/system_architecture.md — ERD, DynamoDB schema, B2B section, production hardening
- [x] docs/ai_architecture.md — CV results, RAG calibration, 101 disease classes
- [x] docs/offline_sync_strategy.md — Conflict rules, offline login, role-aware toast
- [x] docs/repository_map.md — Complete, up-to-date file listing
- [x] docs/setup_guide.md — Docker, local dev, env vars with ALLOW_DEMO_OTP
- [x] DEPLOYMENT.md — AWS + Vercel + Render steps, correct seed command
- [x] docs/SUBMISSION_CHECKLIST.md — This file
- [x] No emoji in UI views (lucide SVGs throughout)
- [x] No hardcoded fake metrics (all data from DB or shown as dash)
- [x] Data provenance on every API response (`_db` field + `X-Data-Source` header)
- [x] District filtering works for Varanasi and Lucknow
- [x] Offline login works without backend (password mode)
- [x] B2B API keys are tenant-scoped and track usage

### Build & Deploy
- [x] Frontend deployed to Vercel
- [x] Vercel Team ID: `team_ZuoCZ7nsvWVIrutn3eqmYdQD`
- [x] Backend deployed to Render
- [x] AI Service deployed to Render
- [x] AWS Aurora + DynamoDB provisioned in ap-south-1
- [x] Seed data loaded (5 villages, 6 pregnancies, etc.)
- [x] Demo credentials tested end-to-end

### Recording
- [ ] 3-min demo video recorded
- [ ] DynamoDB console screenshot (showing 5 tables + GSIs)
- [ ] Aurora PostgreSQL screenshot (showing tables + data)
- [ ] Devpost submission form filled

# H0 Hackathon — Submission Checklist (SwasthAI Guardian)

**Event:** H0: Hack the Zero Stack with Vercel v0 and AWS Databases  
**Track:** 2 — Monetizable B2B (Healthcare)  
**Deadline:** 30 Jun 2026 @ 5:30am IST  

---

## Required submission artifacts

| Item | Status | Notes |
|------|--------|--------|
| Public GitHub + open license | ☐ | AGPL-3.0 in repo root; pin in GitHub About |
| Text description (Aurora + DynamoDB) | ☐ | See `devpost_submission.md` |
| 3–5 min demo video (YouTube) | ☐ | Script below |
| **Vercel** project URL + Team ID | ☐ | Deploy `frontend/` — not Render-only |
| Architecture diagram | ☐ | Export from `docs/system_architecture.md` |
| Vercel screenshots (storage / AWS proof) | ☐ | Env vars + AWS RDS + DynamoDB console |
| AWS databases used | ☐ | Aurora PostgreSQL + DynamoDB (ap-south-1) |

---

## Demo video script (~4 min)

1. **Problem (30s)** — 600M rural Indians, ASHA workers, 2G, no doctor nearby.
2. **Villager (90s)** — Login OTP `1234` → Symptom checker → Pad request (GPS) → Ambulance SOS.
3. **ASHA (60s)** — Login `9876543211` / OTP `1234` → `/ngo` → **Pad Requests** tab → Accept request.
4. **Admin (45s)** — Outbreak map / ambulance feed → open `/api/health/detailed` in browser.
5. **AWS (30s)** — Show `aurora_postgresql.status: connected` and `dynamodb.status: connected` (not mock).
6. **Offline / PWA (20s)** — Install prompt, offline queue story.

### If API fails during recording

- Say: *"Backend uses Aurora + DynamoDB; if the live API is slow, we have Judge Evaluation Toolkit with seeded demo data."*
- On **Admin** dashboard → enable **Judge Evaluation Toolkit** toggle → demo stats/ambulances still render.

---

## Judge-safe live URLs to test

| Check | URL |
|-------|-----|
| App | Your Vercel URL |
| Stack health | `https://<backend>/api/health/detailed` |
| Basic health | `https://<backend>/api/health` |

### Demo logins

| Role | Phone | OTP / password |
|------|-------|----------------|
| Villager | Any 10 digits | OTP `1234` |
| ASHA | `9876543211` | OTP `1234` |
| Admin | `9876543212` | OTP `1234` |
| New ASHA signup | — | Passcode `ASHA2026`, password 6+ chars |

---

## Production AWS (not mock)

On **Render** (or your API host), set:

```env
DATABASE_URL=postgresql://...@<aurora-endpoint>:5432/postgres
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
NODE_ENV=production
```

Then run seed once (Render shell):

```bash
cd backend && node seed.js
```

Verify:

```bash
curl https://<your-api>/api/health/detailed
```

Expect:

- `databases.aurora_postgresql.status` → `"connected"`
- `databases.dynamodb.status` → `"connected"`
- `production_ready` → `true`
- `databases.aurora_postgresql.pad_requests` → ≥ 1 after seed

---

## Do NOT show in video unless tested

- Monitoring Dashboard offline simulation (`simulated_network_state`)
- Brand-new user registration mid-demo
- Features you haven’t clicked after latest deploy

---

## Optional bonus (+ points)

- [ ] Blog / LinkedIn / dev.to with **#H0Hackathon** and line: *"Created for the H0 Hackathon."*
- [ ] Mention dual-database rationale (Aurora = records, DynamoDB = telemetry)

---

## API routes aligned (for code reviewers)

All frontend services now match backend mounts under `/api`:

- Villager: `/symptoms`, `/ambulance`, `/my-history`, `/villager/pad-request`, etc.
- NGO: `/ngo/maternal`, `/ngo/stats`, `/ngo/residents`, `/ngo/pads`, …
- Admin: `/admin/users`, `/admin/analytics`, `/health/detailed`, …

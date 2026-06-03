# Contributing to SwasthAI Guardian

**SwasthAI Guardian** — National Rural Health Intelligence Platform  
Built for the H0: Hack the Zero Stack hackathon | Track 2 B2B | AWS Databases + Vercel

---

## 🗺️ Architecture Overview

```
SwasthAI Guardian/
├── frontend/    React 18 + Vite + PWA (Vercel Edge)
├── backend/     Node.js + Express + Cluster (Render/Railway)
└── ai-service/  FastAPI + PyTorch + Groq (Python)
    └── outbreak_agent.py  Autonomous 30-min outbreak detection daemon
```

**Two databases, two distinct purposes:**
- **Amazon Aurora PostgreSQL** — ACID-compliant relational health records (users, pregnancies, symptoms, ambulances, government schemes)
- **Amazon DynamoDB** — High-velocity telemetry (outbreak events, sync queues, village node state, emergency streams)

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18.x
- Python ≥ 3.10 (for AI service)
- npm ≥ 9.x

### 1. Clone and install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/SwasthAI-Guardian-Platform.git
cd SwasthAI-Guardian-Platform
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment setup

Copy the example file:
```bash
cp .env.example backend/.env
```

Minimum required vars for local dev (SQLite fallback mode — no AWS needed):
```env
NODE_ENV=development
JWT_SECRET=your_local_dev_secret
PORT=5000
```

For full production stack with AWS:
```env
DATABASE_URL=postgresql://user:pass@aurora-cluster.rds.amazonaws.com:5432/swasthai
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
GROQ_API_KEY=your_groq_key
JWT_SECRET=generate_with_openssl_rand_base64_32
```

### 3. Start services

```bash
# Terminal 1: Backend (starts on :5000, auto-falls-back to SQLite if no DB_URL)
cd backend && node server.js

# Terminal 2: Frontend (starts on :5173)
cd frontend && npm run dev

# Terminal 3: AI Service (optional — symptom checker falls back to local rules)
cd ai-service && pip install -r requirements.txt && uvicorn main:app --port 8000
```

### 4. Seed demo users

The backend auto-creates SQLite tables on first boot. To seed demo users manually:

```bash
# POST to register endpoint (runs on every boot automatically for demo accounts)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"villager@swasthai.in","password":"Demo@1234","name":"Ramesh Kumar","role":"villager","username":"ramesh"}'
```

Or use the demo credentials on the `/demo` page — the backend auto-seeds these on first boot.

---

## 🧪 Running Tests

```bash
# Frontend build validation (catches JSX errors, missing imports)
cd frontend && npm run build

# Backend syntax check
node --check backend/server.js

# Lint (ESLint)
cd frontend && npm run lint
```

---

## 🏗️ Project Structure Deep-Dive

### Backend (`backend/`)

| File | Purpose |
|------|---------|
| `server.js` | Main Express app — all routes, middleware, DB initialization, SSE feed |
| `dynamodb.js` | DynamoDB helper — table creation, put/get/query operations |
| `eventDispatcher.js` | Node.js EventEmitter — decouples outbreak events from HTTP routes |

**Database Abstraction Layer**: All SQL queries use `db.get()`, `db.all()`, `db.run()` wrappers that work identically in both SQLite (local dev) and PostgreSQL/Aurora (production). Never use `pool.query()` directly.

### Frontend (`frontend/src/`)

| Directory | Purpose |
|-----------|---------|
| `Admin/` | Admin Command Center dashboard (dark emerald theme) |
| `NGO/` | ASHA/NGO worker dashboard (clinical white) |
| `Villager/` | Village-level dashboard (mobile-first) |
| `pages/` | Feature pages: SymptomChecker, AmbulancePage, MenstrualHealth, etc. |
| `components/` | Shared: Navbar, Footer, ErrorBoundary, SkeletonCard, OfflineToast |
| `context/` | AuthContext, LanguageContext |
| `services/` | API client, adminService, ngoService |
| `utils/` | offlineSyncQueue (IndexedDB), helpers |

**Offline-First Architecture**: The `offlineSyncQueue` in `utils/` uses IndexedDB to queue symptom checks and health records when there's no connectivity. On reconnect, the queue auto-replays to Aurora via the Express API.

### AI Service (`ai-service/`)

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app — symptom prediction, pregnancy risk, skin disease |
| `symptom_model.py` | PyTorch SymptomNet — 17 rural Indian diseases |
| `sakhi_rag.py` | Groq Llama-3 + RAG grounded on WHO/ASHA guidelines |
| `outbreak_agent.py` | Autonomous 30-min epidemic surveillance daemon |

---

## 🤝 Contribution Guidelines

### Coding Standards

**Backend:**
- Always use the `db` abstraction wrapper — never raw `pool.query()`
- Use `?` placeholders in SQL (the wrapper converts to `$N` for PostgreSQL automatically)
- Use `usingSQLite` flag for dialect-specific queries (e.g., datetime functions)
- All auth-protected routes use the `auth` middleware + `checkRole([])`

**Frontend:**
- Vanilla CSS classes mapped to the design system in index.css (no inline style blocks unless absolutely necessary)
- Use `framer-motion` for all animated components
- Mobile-first: all touch targets ≥ 44px (WCAG 2.5.5)
- Add `SkeletonCard` while loading any data from the API

**AI Service:**
- Always include a local rule-based fallback when Groq/PyTorch is unavailable
- Log all RAG traces to `ragTraces` array (consumed by `/api/admin/rag-traces`)

### Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following the coding standards above
3. Run `cd frontend && npm run build` to validate the build
4. Run `node --check backend/server.js` to validate server syntax
5. Submit a PR with a clear description of what you changed and why

### Reporting Bugs

Open a GitHub Issue with:
- The exact error message and stack trace
- Whether you're running in SQLite mode or Aurora mode
- Browser/OS version (for frontend issues)
- Steps to reproduce

---

## 🏥 For District Health Officers (Non-Technical)

SwasthAI Guardian can be deployed for your district without any programming knowledge. See [DEPLOYMENT.md](./DEPLOYMENT.md) for a step-by-step guide designed for government IT teams.

**Supported configurations:**
- Small district (< 50 villages): Single-server setup on a ₹2,000/month VPS
- Medium district (50–500 villages): Render.com + Vercel + Aurora Free Tier
- Large state deployment (500+ villages): AWS ECS + Aurora Serverless + DynamoDB

**Contact**: Reach out to the SwasthAI team via the GitHub Issues tab for deployment support.

---

## 📜 License

MIT License — see [LICENSE](./LICENSE) for details.

This project was built during the **H0: Hack the Zero Stack with Vercel v0 and AWS Databases** hackathon (May–June 2026).

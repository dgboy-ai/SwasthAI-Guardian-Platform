# ⚙️ Installation, Setup & Local Development Guide

### 🐳 Docker Deployment (Recommended — One Command)

```bash
# 1. Copy the env template and fill in your secrets
cp .env.example .env

# 2. Launch all 3 services with health-checked startup ordering
docker-compose up --build
```

Services start in order: **AI Service → Backend → Frontend**

| URL | Service |
|---|---|
| `http://localhost` | React Frontend (Nginx) |
| `http://localhost:5000` | Node.js Backend API |
| `http://localhost:8000` | FastAPI AI Microservice |

**Docker files created:**
* `docker-compose.yml`: Orchestrates all 3 services with health checks.
* `backend/Dockerfile`: Multi-stage Node.js build, runs as non-root user.
* `ai-service/Dockerfile`: Python + baked ML model, non-root user.
* `frontend/Dockerfile`: Vite build → Nginx with SPA fallback + security headers.
* `.dockerignore`: Prevents secrets and node_modules from entering images.

---

### 🛠️ Local Development Setup (No Docker)

#### Prerequisites
- Node.js 18+
- Python 3.10+
- pip

#### 1. AI Service (start first)
```bash
cd ai-service
pip install -r requirements.txt
python train_disease_model.py        # trains Random Forest fallback
python train_deep_model.py           # trains Deep Learning engine (requires ~500MB RAM)
python calibrate_rag.py              # calibrates RAG threshold (writes rag_config.py)
uvicorn main:app --reload --port 8000
```

#### 2. Backend API
```bash
cd backend
cp .env.example .env                 # set GROQ_API_KEY, JWT_SECRET, ALLOWED_ORIGINS
npm install
npm run dev                          # starts on port 5000
```

> Local SQLite / PostgreSQL database is initialized and accessed automatically on start.

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev                          # opens http://localhost:5173
```

### Environment Variables (`.env`)
```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
AI_SERVICE_URL=http://127.0.0.1:8000
ALLOWED_ORIGINS=http://localhost:5173
AGENT_SECRET=your_agent_secret_here
```

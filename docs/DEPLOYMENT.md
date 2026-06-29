# Production Deployment Guide: AWS + Vercel + Render

This document contains step-by-step instructions to configure Amazon Web Services (AWS), Vercel, and Render.com to deploy the complete **SwasthAI Guardian** production infrastructure under the **AWS Free Tier** (zero-cost to evaluate).

---

## Deployment Architecture Overview

```
+--------------------------+
|  React PWA (Vercel)      | <-- Frontend hosting
+--------------------------+
             |
             v (API Calls)
+--------------------------+
|  Node.js API (Render)    | <-- Backend server
+--------------------------+
        /          \
       v            v
+--------------+   +--------------+
| Aurora PostgreSQL |   |  DynamoDB    | <-- AWS Cloud Database Layer
| (Free Tier)  |   | (Free Tier)  |
+--------------+   +--------------+
```

---

## Phase 1: AWS Database Provisioning

### Step 1.1: Set up Amazon Aurora PostgreSQL (Serverless v2)
1. Sign in to the [AWS Management Console](https://aws.amazon.com/console/).
2. In the search bar at the top, type **RDS** and click on the RDS service.
3. Click the orange **Create database** button.
4. Choose **Standard create** and select **Aurora (PostgreSQL Compatible)** as the Engine type.
5. Under **Templates**, select **Dev/Test** (or default to Serverless v2).
6. Under **Settings**:
   - **DB cluster identifier**: `swasthai-cluster`
   - **Master username**: `postgres`
   - **Master password**: Set a strong password (write this down).
7. Under **Instance configuration**:
   - Select **Serverless v2**.
   - Set Capacity range: **Minimum ACUs = 0.5**, **Maximum ACUs = 1.0** (this minimizes credit consumption).
8. Under **Connectivity**:
   - **Publicly accessible**: Select **Yes** (required so Render/Vercel can connect).
   - Under **VPC security group**, choose **Create new** and name it `swasthai-db-security-group`.
9. Scroll to the bottom and click **Create database**.
10. Once created (status changes to *Available*), click on the DB cluster name, go to the **Connectivity & security** tab, and copy the **Writer Endpoint** URL (e.g., `swasthai-cluster.cluster-xxxx.ap-south-1.rds.amazonaws.com`).

#### Configure DB Security Group for Connections:
1. In the database details panel (Connectivity & security), click on the active VPC Security Group link.
2. Select the security group, click the **Inbound rules** tab, and click **Edit inbound rules**.
3. Add a rule: Type = **PostgreSQL**, Port = `5432`, Source = **Anywhere-IPv4** (`0.0.0.0/0`). Save the rules.

Your Aurora PostgreSQL connection string (`DATABASE_URL`) will be:
```
postgresql://postgres:<your_password>@<your-aurora-writer-endpoint>:5432/postgres
```

---

### Step 1.2: Set up DynamoDB Tables
1. Search for **DynamoDB** in the AWS console.
2. Click **Create table** and set up the 5 tables in the **ap-south-1** (Mumbai) region exactly as configured:

#### 1. Outbreak Telemetry Table
- **Table name**: `outbreak_telemetry`
- **Partition key**: `villageId` (String)
- **Sort key**: `detectedAt` (String)
- Click **Create table**. Once created, select the table → **Indexes** tab → **Create index** (Global secondary index):
  - **Index 1**:
    - **Partition key**: `disease` (String)
    - **Sort key**: `detectedAt` (String)
    - **Index name**: `disease-index`
    - **Attribute projections**: All
  - **Index 2**:
    - **Partition key**: `districtId` (String)
    - **Sort key**: `detectedAt` (String)
    - **Index name**: `district-time-index`
    - **Attribute projections**: All
  - **Index 3**:
    - **Partition key**: `_gsikey` (String)
    - **Sort key**: `timestamp` (String)
    - **Index name**: `gsikey-time-index`
    - **Attribute projections**: All

#### 2. Sync Queues Table
- **Table name**: `sync_queues`
- **Partition key**: `deviceId` (String)
- **Sort key**: `queuedAt` (String)
- Once created, select the table → **Indexes** tab → **Create index**:
  - **Partition key**: `status` (String)
  - **Sort key**: `queuedAt` (String)
  - **Index name**: `status-index`
  - **Attribute projections**: All

#### 3. Village Node State Table
- **Table name**: `village_node_state`
- **Partition key**: `villageId` (String)
- Once created, select the table → **Indexes** tab → **Create index**:
  - **Partition key**: `_gsiPk` (String)
  - **Sort key**: *(None — composite query-time filter only)*
  - **Index name**: `all-nodes-index`
  - **Attribute projections**: All
- Scroll down to **Additional settings** or the **Indexes/TTL** tab → **Time to Live (TTL)** → Click **Turn on** or **Manage TTL**:
  - **TTL attribute**: `expiresAt`

#### 4. Emergency Streams Table
- **Table name**: `emergency_streams`
- **Partition key**: `districtId` (String)
- **Sort key**: `streamId` (String)
- Once created, select the table → **Indexes** tab → **Create index**:
  - **Index 1**:
    - **Partition key**: `priority` (String)
    - **Sort key**: `streamId` (String)
    - **Index name**: `priority-index`
    - **Attribute projections**: All
  - **Index 2**:
    - **Partition key**: `districtDateBucket` (String)
    - **Sort key**: `timestamp` (String)
    - **Index name**: `district-date-index`
    - **Attribute projections**: All

#### 5. Security Audit Logs Table
- **Table name**: `security_audit_logs`
- **Partition key**: `actor` (String)
- **Sort key**: `timestamp` (String)
- No GSIs required — this table is queried by actor (PK lookup) for compliance audit trails. Click **Create table**.
- No TTL — audit records are retained indefinitely.

---

### Step 1.3: Generate IAM Access Credentials
1. Search for **IAM** (Identity and Access Management) in the AWS console.
2. Click **Users** → **Create user**.
3. Set User name: `swasthai-app-user` and click **Next**.
4. Choose **Attach policies directly** and select **AmazonDynamoDBFullAccess**. Click **Next** → **Create user**.
5. Select the newly created user `swasthai-app-user`.
6. Go to the **Security credentials** tab, scroll to **Access keys**, and click **Create access key**.
7. Choose **Application running outside AWS**, click **Next**, set a description tag (e.g., `render-backend`), and click **Create access key**.
8. Copy the **Access key ID** and **Secret access key** (save these securely).

---

## Phase 2: Deploying the Backend API & AI Service (Render)

We deploy the Node.js backend and Python FastAPI AI services on **Render.com** (which has a free tier for web services).

### Step 2.1: Deploy AI Service (FastAPI)
1. Go to [Render.com](https://render.com/) and create a free account.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set the following configurations:
   - **Name**: `swasthai-ai-service`
   - **Environment**: `Python3`
   - **Root Directory**: `ai-service`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click **Advanced** and add these Environment Variables:
   - `GROQ_API_KEY`: `<your_groq_api_key>`
   - `AGENT_SECRET`: `<create_a_random_32_char_string>`
6. Click **Create Web Service**. Copy the service URL (e.g., `https://swasthai-ai-service.onrender.com`).

### Step 2.2: Deploy Backend API (Node.js Express)
1. Click **New +** → **Web Service** on Render.
2. Select your repository.
3. Set configurations:
   - **Name**: `swasthai-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Click **Advanced** and add the following Environment Variables:
   - `DATABASE_URL`: `postgresql://postgres:<your_password>@<your-rds-endpoint>:5432/postgres` (from RDS)
   - `AWS_REGION`: `ap-south-1`
   - `AWS_ACCESS_KEY_ID`: `<your_iam_access_key>`
   - `AWS_SECRET_ACCESS_KEY`: `<your_iam_secret_key>`
   - `GROQ_API_KEY`: `<your_groq_api_key>`
   - `AI_SERVICE_URL`: `https://swasthai-ai-service.onrender.com` (from Step 2.1)
   - `AGENT_SECRET`: `<the_same_random_string_from_step_2.1>`
   - `JWT_SECRET`: `<create_a_random_32_char_string>`
   - `AADHAAR_SALT`: `<create_a_random_32_char_string>`
   - `NODE_ENV`: `production`
   - `ALLOWED_ORIGINS`: `*` (or your vercel app domain once deployed)
5. Click **Create Web Service**. Once running, seed the database by sending a POST request to the seed endpoint:
   ```bash
   curl -X POST https://swasthai-guardian-platform-0jsb.onrender.com/api/admin/seed-hackathon
   ```
   (This seeds 5 villages, 6 pregnancies, 8 symptoms, 3 ambulances in Aurora + 5 outbreak events, 3 emergency streams in DynamoDB.)

---

## Phase 3: Deploying the Frontend (Vercel)

1. Sign in to your [Vercel](https://vercel.com/) account.
2. Click **Add New** → **Project**.
3. Import your GitHub repository.
4. Set configurations:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
5. Open the **Environment Variables** panel and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://swasthai-guardian-platform-0jsb.onrender.com/api` (from Step 2.2 + `/api` suffix)
6. Click **Deploy**.

Vercel will build your static React App, optimize it as a Progressive Web App (PWA), and make it available under a production SSL URL (e.g. `https://swasth-ai-guardian-platform.vercel.app/`).


---

## Phase 4: Containerization & Load Balancing (Docker & Multi-Core Scaling)

SwasthAI Guardian includes built-in configurations for localized self-hosting via Docker Compose and multi-core process load balancing.

### 4.1 Architecture

```
Internet → [Nginx Reverse Proxy] → /api/* → [Node.js Backend — 2 cluster workers]
                               → /ws/*  → [Node.js Backend — WebSocket]
                               → /*     → [Nginx Frontend — static PWA]
                                               ↓
                                    [FastAPI AI Service — 1 uvicorn worker]
```

The Nginx reverse proxy (`nginx.conf`) handles:
- API reverse proxying to the backend cluster with 20s connect / 30s read timeouts for cold-start tolerance
- WebSocket/SSE proxying with 24h read timeout
- Static frontend serving via upstream frontend container
- `max_fails=3` with `fail_timeout=10s` health-based load balancing across workers

### 4.2 Local Self-Hosting with Docker Compose

**Prerequisites:** Docker Engine 24+ and Docker Compose v2.

```bash
# 1. Copy env template — all ${VAR:?} vars below must be set
cp .env.example .env
# Edit .env to fill in GROQ_API_KEY, JWT_SECRET, AGENT_SECRET

# 2. Launch all 4 services with health-checked startup ordering
docker compose up --build -d

# 3. Verify everything is healthy
docker compose ps

# 4. Open http://localhost (or $HOST_PORT)
```

**Container roles:**

| Container | Internal Network | Role |
|-----------|:---------------:|------|
| `swasthai_nginx` | port `80` (published) | Reverse proxy: API → backend cluster, WS → backend, static → frontend |
| `swasthai_frontend` | port `80` (bridged) | Serves React PWA build via Nginx (SPA fallback, gzip, 1y cache) |
| `swasthai_backend` | port `5000` (bridged) | Express API with Node.js `cluster` module — forks `$WEB_CONCURRENCY` workers |
| `swasthai_ai` | port `8000` (bridged) | FastAPI SymptomNet MLP + Sakhi RAG + Outbreak Agent |

**Docker Compose env vars (set in `.env`):**

| Variable | Required | Default | Notes |
|----------|:--------:|:-------:|-------|
| `GROQ_API_KEY` | Yes | — | Groq API key for Sakhi RAG + Outbreak Agent |
| `JWT_SECRET` | Yes | — | Signs all auth tokens (min 32 chars) |
| `AGENT_SECRET` | Yes | — | Bearer token for Outbreak Agent alert injection |
| `WEB_CONCURRENCY` | No | `2` (backend), `1` (AI) | Controls Node.js cluster forks + uvicorn workers |
| `DATABASE_URL` | No | SQLite (local) | Aurora PostgreSQL connection string for production |
| `AWS_REGION` | No | `ap-south-1` | AWS region for DynamoDB + Aurora |
| `AWS_ACCESS_KEY_ID` | No | — | Required when using Aurora/DynamoDB |
| `AWS_SECRET_ACCESS_KEY` | No | — | Required when using Aurora/DynamoDB |
| `HOST_PORT` | No | `80` | External port for the Nginx reverse proxy |

### 4.3 Service Boot Order & Health Checks

Containers start in strict dependency order using Docker Compose `depends_on` with `condition: service_healthy`:

1. **ai-service** — boots first; FastAPI health endpoint at `/health`
2. **backend** — waits for ai-service to pass health check; exposes `/api/health` 
3. **nginx + frontend** — wait for backend health check; static frontend has no dependencies

Each service defines an HTTP readiness probe in `docker-compose.yml`:
- `interval: 30s` — checks every 30 seconds
- `timeout: 10s` — marks failed if no response in 10 seconds
- `retries: 3` — declares unhealthy after 3 consecutive failures
- `start_period` — gives the service time to initialize before probes begin

### 4.4 Multi-Worker Process Load Balancing

The platform scales dynamically on multi-core environments to maximize throughput:

- **Node.js API Gateway (Backend)**:
  - Uses the native `cluster` module in production (`backend/server.js:52-62`).
  - Reads `WEB_CONCURRENCY` env var to fork worker processes.
  - Default: `Math.min(CPUs, 2)` (or `1` on Render free tier).
  - Auto-restarts workers on uncaught exit (`cluster.on('exit') → cluster.fork()`).

- **Python FastAPI (AI Service)**:
  - Uvicorn ASGI server with `--workers ${WEB_CONCURRENCY:-1}`.
  - Both `ai-service/Dockerfile` and `ai-service/Procfile` read the same env var.

- **Nginx Reverse Proxy** (`nginx.conf`):
  - `upstream backend_cluster` block with `max_fails=3` and `fail_timeout=10s`.
  - SSE/WebSocket support with `proxy_buffering off` and 24h read timeout.
  - Cold-start tolerance with 20s connect / 30s read timeouts.

- **Configuring Concurrency**:
  - Set `WEB_CONCURRENCY=2` for a dual-core host, `4` for quad-core, etc.
  - On Render free tier (512MB RAM), defaults to `1` to stay within memory limits.


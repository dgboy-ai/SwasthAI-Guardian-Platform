# SwasthAI Guardian — Deployment Guide

> **Target audience**: District Health Officers, State IT Teams, NGO Technology Leads

SwasthAI Guardian can be fully deployed for a district in under 2 hours using the AWS + Vercel stack.

---

## 🏗️ Architecture Overview

```
Villager / ASHA Android → Vercel PWA → Render.com Backend API ─┬─ Amazon Aurora PostgreSQL
                                                                  └─ Amazon DynamoDB
                                         FastAPI AI Microservice ─── Groq Llama-3 API
```

**Three AWS services, one Vercel deployment, one Render.com backend.**

---

## For District Health Officers (Non-Technical)

SwasthAI Guardian requires no local servers. It runs entirely on cloud infrastructure:

1. **Your villagers** open the web app on their phone (no app store needed)
2. **ASHA workers** log in with their phone number + OTP
3. **You** (the district admin) log in to the command center dashboard
4. **The system** monitors all 24/7 — outbreak detection runs automatically every 30 minutes

**Monthly cost estimate (AWS free tier + Render free tier):**
- Aurora PostgreSQL db.t3.micro: ~₹0 (free tier for 12 months, then ~₹1,200/month)
- DynamoDB PAY_PER_REQUEST: ~₹0 (25 GB + 25 WCU free forever)
- Render.com backend: ₹0 (free tier, spins up on first request)
- Vercel frontend: ₹0 (free tier, unlimited deploys)
- **Total for pilot district: ₹0 for first year**

---

## For State IT Teams

### Prerequisites
- AWS account with IAM user (Access Key + Secret Key)
- Vercel account (free)
- Render.com account (free)
- Node.js 18+ and Python 3.10+ for local testing

### Step 1: AWS Database Setup (30 minutes)

#### Amazon Aurora PostgreSQL
```bash
# Via AWS Console:
# 1. Go to RDS → Create Database
# 2. Engine: Amazon Aurora PostgreSQL-Compatible
# 3. Template: Free tier (db.t3.micro)
# 4. DB cluster ID: swasthai-district-[your-district]
# 5. Master username: swasthai_admin
# 6. Public access: Yes (for initial setup — restrict after)
# 7. Initial database name: swasthai
# 8. Copy the Cluster Endpoint (e.g., swasthai.cluster-xyz.ap-south-1.rds.amazonaws.com)
```

#### Amazon DynamoDB
```bash
# The backend auto-creates all 4 tables on first start:
# - outbreak_telemetry  (villageId + detectedAt composite key, disease-index GSI)
# - sync_queues         (deviceId + queuedAt composite key, status-index GSI)
# - village_node_state  (villageId hash key, TTL 7-day auto-expire)
# - emergency_streams   (districtId + streamId composite key, priority-index GSI)
# No manual table creation needed.
```

### Step 2: Backend Deployment (30 minutes)

**Deploy to Render.com (recommended — free tier)**

1. Fork this repository to your GitHub account
2. Go to render.com → New → Web Service
3. Connect your GitHub repo
4. Set these environment variables in Render dashboard:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<generate: openssl rand -base64 32>
GROQ_API_KEY=<your Groq API key from console.groq.com>
AI_SERVICE_URL=<your FastAPI service URL>
DATABASE_URL=postgresql://swasthai_admin:<password>@<aurora-endpoint>:5432/swasthai
AWS_ACCESS_KEY_ID=<your IAM user access key>
AWS_SECRET_ACCESS_KEY=<your IAM user secret key>
AWS_REGION=ap-south-1
ALLOWED_ORIGINS=https://your-app.vercel.app
AGENT_SECRET=<generate: openssl rand -base64 16>
```

5. Build command: `npm install`
6. Start command: `node backend/server.js`

### Step 3: Frontend Deployment (15 minutes)

**Deploy to Vercel**

1. Go to vercel.com → New Project → Import from GitHub
2. Framework preset: **Vite**
3. Root directory: `frontend`
4. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
5. Click Deploy

### Step 4: Verify Deployment

Check these URLs after deployment:
```
https://your-backend.onrender.com/api/health          → should return { "status": "ok" }
https://your-backend.onrender.com/api/health/detailed  → full AWS connection status
https://your-app.vercel.app                            → login page loads
```

---

## Demo Credentials (After Seeding)

The database seeding API populates demo data on first run.

| Role | Login Method |
|------|-------------|
| Villager (Ramesh Kumar) | OTP mode → any phone number → OTP: `1234` |
| ASHA Worker (Sita Devi) | OTP mode → any phone number → OTP: `1234` (select NGO) |
| District Admin (CMO) | OTP mode → any phone number → OTP: `1234` (select Admin) |

---

## Security Checklist Before Going Live

- [ ] Rotate `JWT_SECRET` from the default value
- [ ] Rotate `AGENT_SECRET` from the default value  
- [ ] Set `ALLOWED_ORIGINS` to your exact Vercel URL
- [ ] Set Aurora PostgreSQL VPC security group to restrict public access
- [ ] Enable AWS CloudTrail for audit logging
- [ ] Enable S3 bucket versioning if storing health exports

---

## Scaling for a Full District (10,000+ Villages)

SwasthAI Guardian is designed to scale horizontally:

| Component | Current (Free Tier) | Scaled (Full District) |
|-----------|---------------------|------------------------|
| Aurora | db.t3.micro (1 vCPU) | db.r6g.large (Multi-AZ) |
| DynamoDB | PAY_PER_REQUEST | PAY_PER_REQUEST (auto-scales) |
| Backend | 1 Render instance | Multiple instances behind ALB |
| Frontend | Vercel CDN (global) | Same (Vercel scales automatically) |

The DynamoDB tables use `PAY_PER_REQUEST` billing — they automatically handle 1 or 10 million write requests per day with zero configuration.

---

## Support

For deployment questions, raise a GitHub issue or contact the SwasthAI team.

> *SwasthAI Guardian — Built for Bharat's villages, not just its cities.*

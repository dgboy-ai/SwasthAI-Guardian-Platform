# 🚀 Production Deployment Guide: AWS + Vercel + Render

This document contains step-by-step instructions to configure Amazon Web Services (AWS), Vercel, and Render.com to deploy the complete **SwasthAI Guardian** production infrastructure under the **AWS Free Tier** (zero-cost to evaluate).

---

## 🏗️ Deployment Architecture Overview

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
| RDS Postgres |   |  DynamoDB    | <-- AWS Cloud Database Layer
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
- Once created, scroll down to **Additional settings** or the **Indexes/TTL** tab → **Time to Live (TTL)** → Click **Turn on** or **Manage TTL**:
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
5. Click **Create Web Service**. Once running, run your DB seed by clicking the **Shell** tab on Render and executing:
   ```bash
   node seed.js
   ```

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
   - **Value**: `https://swasthai-backend.onrender.com/api` (from Step 2.2 + `/api` suffix)
6. Click **Deploy**.

Vercel will build your static React App, optimize it as a Progressive Web App (PWA), and make it available under a production SSL URL (e.g. `https://swasthai-guardian.vercel.app`).

You are now fully deployed on production-grade infrastructure!

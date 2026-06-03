# System Architecture Diagram — SwasthAI Guardian Platform

This document describes the high-level architecture of the SwasthAI Guardian Platform, illustrating how offline-first clients, backend APIs, relational databases, NoSQL event stores, and AI microservices interact.

---

## 🏗️ Architectural Flow

```mermaid
graph TB
    subgraph Client Layer [Client-Side App - Vercel / PWA / Android]
        UI[React UI Page / Guided Mode]
        LS[Local Storage & IndexedDB]
        SQ[Offline Sync Queue]
    end

    subgraph CDN & Hosting Layer
        Vercel[Vercel Serverless Hosting]
    end

    subgraph Application Backend [Render.com / AWS ECS Node.js API]
        Express[Express.js App Router]
        Auth[JWT / OTP Auth Middleware]
        Audit[Audit Logging Middleware]
        ED[EDA - Event Dispatcher]
    end

    subgraph AI Service [FastAPI Microservice]
        SymptomNet[SymptomNet MLP Classifier]
        RAG[Sakhi RAG Chatbot - Llama 3.3]
        OutbreakAgent[Outbreak Agent Outbreak detection]
    end

    subgraph Data Layer [AWS Cloud Datastore]
        Aurora[(Amazon Aurora PostgreSQL - Transactional SQL)]
        Dynamo[(Amazon DynamoDB - High-Throughput NoSQL)]
        S3[(AWS S3 - Skin Condition Images)]
    end

    %% Client and CDN Interactions
    UI --> Vercel
    UI --> LS
    UI -->|Online| Express
    LS --> SQ
    SQ -->|Resumed Connection Replay| Express

    %% Backend Router & Middlewares
    Express --> Auth
    Auth --> Audit
    Audit -->|Async Write| Aurora
    Express --> ED

    %% Relational Queries
    Express -->|Transactional CRUD| Aurora
    ED -->|Maternal & Referral Events| Aurora

    %% Telemetry & Streams
    Express -->|Telemetry & Heartbeats| Dynamo
    ED -->|Emergency Streams & Sync Logs| Dynamo

    %% AI Service Interactions
    Express -->|Symptom Inference / Speech Check| SymptomNet
    Express -->|Conversational RAG request| RAG
    OutbreakAgent -->|Read cluster telemetry| Dynamo
    OutbreakAgent -->|Write detected outbreak alert| Aurora
    OutbreakAgent -->|Push critical alerts| Express
    
    %% Skin Analyzer
    Express -->|Analyze Skin Image| S3
```

---

## 📦 Component Roles

1. **Client Layer (Vercel / PWA / Android)**:
   - Built with React & Vite, hosted on Vercel. 
   - Uses an **Offline Event Replay Engine** powered by IndexedDB to log events (symptoms, pregnancies, emergencies) when offline and replay them automatically on reconnection.
   
2. **Backend API Service (Express.js)**:
   - Handles route validation, auth checks, and asynchronous audit logs.
   - Hosts the local **Event Dispatcher** which processes events like `symptom_submitted`, `emergency_triggered`, and `maternal_alert` out-of-band to keep route speeds fast.

3. **Data Layer (Aurora PostgreSQL + DynamoDB)**:
   - **Amazon Aurora PostgreSQL**: Stores core business relational tables (users, pregnancies, vaccinations, referrals, and district configs) ensuring ACID transactional compliance.
   - **Amazon DynamoDB**: Stores transient high-throughput event telemetry (symptoms logs, node sync queues, real-time emergency dispatches, and heartbeats) using TTL fields to automatically expire data after 7 days.

4. **AI Microservice (FastAPI + Python)**:
   - **SymptomNet**: A multi-layered MLP Neural Network that evaluates symptom inputs with a heuristic local rules model acting as a fallback if the network is busy/offline.
   - **Sakhi Chatbot**: A Retrieval-Augmented Generation (RAG) assistant running Llama-3.3-70B over an expanded 243-chunk multilingual clinical database.
   - **Outbreak Agent**: An asynchronous process that analyzes DynamoDB telemetry logs, groups them by village cluster, and automatically issues outbreak alerts into Aurora Postgres.

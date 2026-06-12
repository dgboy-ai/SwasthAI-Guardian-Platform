# 📁 SwasthAI Guardian Repository Directory Map

This document provides a comprehensive map of the SwasthAI Guardian codebase, detailing directory roles, files, and their architectural purpose.

---

## 🏗️ Folder Tree Overview

```
SwasthAI-Guardian-Platform/
├── frontend/                     # React + Vite PWA (Frontend App)
│   ├── public/                   # Static icons & manifest for PWA installability
│   └── src/
│       ├── App.jsx               # Main App entrypoint with routes & DISHA consent gate
│       ├── index.css             # Unified CSS Design System & mobile touch utilities
│       ├── Admin/                # District Command Center files
│       │   ├── AdminDashboard.jsx
│       │   └── components/       # CommandCenterView, ProductionEvidencePanel, ReportsView
│       ├── NGO/                  # NGO / CSR field operations dashboard
│       │   └── NGODashboard.jsx
│       ├── Villager/             # Shared villager portal
│       │   └── VillagerDashboard.jsx
│       ├── components/           # Reusable components (e.g. DiSHAConsentModal, OfflineToast)
│       ├── context/              # Global states (AuthContext with client-side SHA-256 caching, LanguageContext)
│       ├── services/             # API services with timeout wrappers and intercepts
│       └── pages/                # Features & workflows (25+ active files)
│           ├── dashboards/       # Role-specific analytics wrappers
│           ├── GuidedHealthcareMode.jsx
│           ├── SakhiChatbot.jsx  # Sakhi RAG with voice features
│           ├── MaternalHealthPage.jsx
│           ├── ChildNutritionPage.jsx
│           ├── SkinDiseaseCheckerPage.jsx # Melanoid-inclusive skin triage
│           ├── SymptomCheckerPage.jsx     # On-device SymptomNet & RAG fallback
│           └── workflows/        # Multi-step medical workflows (Pregnancy, Fever, Child, SOS)
│
├── backend/                      # Express.js REST API
│   ├── server.js                 # Server entrypoint with Health Watchdog monitor loop
│   ├── config.js                 # Centralized secrets validation helper
│   ├── dynamodb.js               # DynamoDB Client connection, GSI validator, & table schemas
│   ├── eventDispatcher.js        # Decoupled DB write events with 3-attempt retry queue
│   ├── sanitize.js               # Security sanitation middleware
│   ├── db/
│   │   ├── schema.js             # Dual schemas (Production PostgreSQL + Evaluation SQLite)
│   │   └── seed.js               # Database seeding coordinates & demographic data
│   └── routes/
│       ├── admin.js              # Admin feeds, metrics & SSE live alert endpoints
│       ├── villager.js           # Vital logs, ambulance requests, & sync health checks
│       └── ngo.js                # NGO assessment submissions & reporting
│
├── ai-service/                   # FastAPI Python Microservice
│   ├── main.py                   # API Server hosting hybrid classification and RAG endpoints
│   ├── requirements.txt          # Python dependencies (PyTorch, FastAPI, SentenceTransformers)
│   ├── model_def.py              # SymptomNet Multilayer Perceptron neural network definition
│   ├── deep_disease_model.pkl    # SymptomNet weights, scalers, and label encoders
│   ├── disease_model.pkl         # Logistic Regression fallback classifier (71.1% accuracy)
│   ├── rag_service.py            # Sakhi RAG embedding encoder & retrieval matching engine
│   ├── health_kb_data.py         # Grounded knowledge base (243 clinical guidelines chunks)
│   ├── calibrate_rag.py          # Calibrator analyzing F1-score to fix RAG threshold to 0.45
│   ├── outbreak_agent.py         # 30-minute background spatial outbreak scan agent
│   ├── skin_analyzer.py          # Melanin-tolerant HSV skin lesion range detector
│   ├── train_deep_model.py       # SymptomNet training pipeline (PyTorch MLP)
│   ├── train_disease_model.py    # Logistic Regression training pipeline
│   └── tests/                    # Stress-tests, guardrails, & safety validation suites
│
├── docs/                         # Technical Guides & System Documentation
│   ├── system_architecture.md    # Data flow diagram, ERDs, event schedules, and tables
│   ├── ai_architecture.md        # Neural Net CV logs, RAG calibration stats, skin classifier
│   ├── offline_sync_strategy.md  # IndexedDB conflict rules, LWW timestamps, sync flows
│   ├── setup_guide.md            # Environment vars, Docker-Compose, local startup guides
│   ├── repository_map.md         # (This file) Complete codebase index
│   └── SUBMISSION_CHECKLIST.md   # Verification procedures & submission logs
│
├── DEPLOYMENT.md                 # Production deployment steps (AWS + Vercel + Render)
├── CHANGELOG.md                  # Chronological features & optimization log
└── README.md                     # Main landing page for the project
```

---

## 🔍 Core Component Descriptions

### 1. Frontend Client
* **[App.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/App.jsx)**: Handles app routing. Wraps the main layout inside the [DiSHAConsentModal](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/components/DiSHAConsentModal.jsx) to ensure all clinical assessments comply with the Digital Information Security in Healthcare Act (DISHA) of India.
* **[index.css](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/index.css)**: Implements the system's design tokens (colors, animations, and typography). Contains accessibility classes matching WCAG 2.5.5 touch target sizes and handles page transition optimizations.
* **[AuthContext.jsx](file:///c:/projects/SwasthAI-Guardian-Platform/frontend/src/context/AuthContext.jsx)**: Handles login sessions. Utilizes client-side SHA-256 password hashing for protecting cached user profiles when operating in offline/low-connectivity environments.

### 2. Express Backend
* **[server.js](file:///c:/projects/SwasthAI-Guardian-Platform/backend/server.js)**: Runs the API listener. Integrates a background **Health Watchdog Monitor** that polls the AI service every 30 seconds and verification loops to track Outbreak Agent activity, broadcasting status via SSE.
* **[dynamodb.js](file:///c:/projects/SwasthAI-Guardian-Platform/backend/dynamodb.js)**: Initializes the AWS SDK DynamoDB Client. Bootstraps 5 tables automatically upon server launch (`outbreak_telemetry`, `sync_queues`, `village_node_state`, `emergency_streams`, and `security_audit_logs`) and checks/validates their GSIs and TTLs.
* **[eventDispatcher.js](file:///c:/projects/SwasthAI-Guardian-Platform/backend/eventDispatcher.js)**: An in-memory queue dispatcher that handles non-blocking database writes. It decouples high-velocity logs and dispatches events like `emergency_triggered` with a robust 3-attempt auto-retry module.

### 3. AI Service
* **[main.py](file:///c:/projects/SwasthAI-Guardian-Platform/ai-service/main.py)**: Serves FastAPI routes. Contains route paths for SymptomNet ML classification, RAG inference, and the manual triggering of the Outbreak Agent.
* **[rag_service.py](file:///c:/projects/SwasthAI-Guardian-Platform/ai-service/rag_service.py)**: Encodes queries using semantic transformers. Contains retrieval search methods comparing query vectors against precomputed embeddings in `kb_embeddings.npy` with a threshold cutoff of `0.45` to prevent hallucinations.
* **[outbreak_agent.py](file:///c:/projects/SwasthAI-Guardian-Platform/ai-service/outbreak_agent.py)**: An autonomous worker executing spatial clustering calculations to identify symptoms indicating potential localized health crises.

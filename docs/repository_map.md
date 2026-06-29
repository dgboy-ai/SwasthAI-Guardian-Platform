# SwasthAI Guardian Repository Directory Map

This document provides a comprehensive map of the SwasthAI Guardian codebase, detailing directory roles, files, and their architectural purpose.

---

## Folder Tree Overview

```
SwasthAI-Guardian-Platform/
├── frontend/                     # React + Vite PWA (Frontend App)
│   ├── public/                   # Static icons & manifest for PWA installability
│   └── src/
│       ├── App.jsx               # Main App entrypoint with routes & DISHA consent gate
│       ├── index.css             # Unified CSS Design System & mobile touch utilities
│       ├── Admin/                # District Command Center files
│       │   ├── AdminDashboard.jsx
│       │   └── components/       # CommandCenterView, ProductionEvidencePanel, ReportsView,
│       │                         # ApiKeysView, B2BUsageDashboard, TenantOverview, ...
│       ├── NGO/                  # NGO / CSR field operations dashboard
│       │   └── NGODashboard.jsx
│       ├── Villager/             # Shared villager portal
│       │   └── VillagerDashboard.jsx
│       ├── components/           # Reusable components (DiSHAConsentModal, OfflineToast, SkeletonCard, ...)
│       ├── context/              # Global states (AuthContext with client-side SHA-256 caching, LanguageContext)
│       ├── services/             # API services with timeout wrappers and intercepts
│       └── pages/                # Features & workflows (30+ active files)
│           ├── LandingPage.jsx   # Public marketing page (new)
│           ├── LoginPage.jsx     # OTP + password login (offline-capable)
│           ├── RegisterPage.jsx  # Aadhaar QR-assisted registration
│           ├── IntroFlow.jsx     # Onboarding flow with role selection
│           ├── GovernmentSchemesPage.jsx   # Offline-cached scheme eligibility
│           ├── SchemeDetailPage.jsx        # Per-scheme deep-dive
│           ├── SakhiChatbot.jsx  # Sakhi RAG with voice features
│           ├── MaternalHealthPage.jsx
│           ├── ChildNutritionPage.jsx
│           ├── MenstrualHealth.jsx         # Zero-API static clinical content
│           ├── SkinDiseaseCheckerPage.jsx  # Melanoid-inclusive skin triage
│           ├── SymptomCheckerPage.jsx      # On-device SymptomNet & RAG fallback
│           ├── PadRequestForm.jsx          # Offline-queued sanitary pad requests
│
├── backend/                      # Express.js REST API
│   ├── server.js                 # Server entrypoint with Health Watchdog monitor loop
│   ├── config.js                 # Centralized secrets validation helper
│   ├── dynamodb.js               # DynamoDB Client connection, GSI validator, & table schemas
│   ├── eventDispatcher.js        # Decoupled DB write events with 3-attempt retry queue
│   ├── sanitize.js               # Security sanitation middleware
│   ├── middleware/
│   │   ├── auth.js               # JWT verification middleware
│   │   ├── policy.js             # Role/IDOR scope enforcement
│   │   ├── audit.js              # Audit logging middleware
│   │   └── apiKeyAuth.js         # B2B API key authentication (x-api-key header)
│   ├── db/
│   │   ├── schema.js             # Dual schemas (Production PostgreSQL + Evaluation SQLite)
│   │   └── seed.js               # Database seeding coordinates & demographic data
│   └── routes/
│       ├── admin.js              # Admin feeds, metrics & SSE live alert endpoints
│       ├── villager.js           # Vital logs, ambulance requests, & sync health checks
│       ├── ngo.js                # NGO assessment submissions & reporting
│       ├── apiKeys.js            # B2B API key CRUD + usage dashboard
│       ├── b2b.js                # B2B partner endpoints (API-key protected)
│       ├── auth.js               # Login/register/OTP routes
│       └── webhooks.js           # External webhook integrations
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
│   ├── test_guardrail.py         # Stress-tests, guardrails, & safety validation
│   ├── test_rag_guardrail.py     # RAG-specific safety and response quality tests
│   ├── test_rural.py             # Rural connectivity and low-bandwidth simulation
│   └── test_text_guardrail_direct.py  # Text safety guardrail validation
│
├── docs/                         # Technical Guides & System Documentation
│   ├── system_architecture.md    # Data flow diagram, ERDs, event schedules, and tables
│   ├── ai_architecture.md        # Neural Net CV logs, RAG calibration stats, skin classifier
│   ├── offline_sync_strategy.md  # IndexedDB conflict rules, LWW timestamps, sync flows
│   ├── setup_guide.md            # Environment vars, Docker-Compose, local startup guides
│   ├── repository_map.md         # (This file) Complete codebase index
│   ├── judge_guide.md            # Step-by-step walkthrough for Devpost judges
│   ├── SUBMISSION_SUMMARY.md     # Devpost submission text
│   ├── architecture_diagram.html # HTML architecture diagram
│   ├── architecture_diagram.md   # Mermaid architecture topology diagram
│   ├── architecture_diagram.svg  # SVG architecture diagram
│   ├── DEPLOYMENT.md             # Production deployment steps
│   ├── CHANGELOG.md              # Chronological features & optimization log
│   └── PITCH.md                  # Pitch document
│
├── infra/                         # Deployment infrastructure
│   ├── nginx.conf                 # Nginx reverse proxy config
│   ├── Procfile                   # Heroku process definition
│   ├── render.yaml                # Render deployment config
│   ├── .env.example               # Environment variable template
│   └── dynamodb-tables.md         # DynamoDB table schemas
│
└── README.md                     # Main landing page for the project
```

---

## Core Component Descriptions

### 1. Frontend Client
* **App.jsx**: Handles app routing. Wraps the main layout inside DiSHAConsentModal to ensure all clinical assessments comply with DISHA (India).
* **index.css**: Implements the system's design tokens (colors, animations, typography). Contains accessibility classes matching WCAG 2.5.5 touch target sizes.
* **AuthContext.jsx**: Handles login sessions with client-side SHA-256 password hashing for offline credential verification.
* **ApiKeysView.jsx**: Admin panel for generating and managing B2B API keys (create, list, toggle, delete, copy).
* **B2BUsageDashboard.jsx**: Per-tenant analytics showing API call volume, active keys, village stats, and record counts.
* **OfflineToast.jsx**: Role-aware component showing offline capability map, real-time queue stats, and sync controls.

### 2. Express Backend
* **server.js**: Runs the API listener with Health Watchdog Monitor, SSE bus, WebSocket server.
* **dynamodb.js**: AWS SDK DynamoDB Client with auto-bootstrap of 5 tables, GSI validation, TTL management.
* **eventDispatcher.js**: In-memory queue decoupling high-velocity DB writes with 3-attempt retry.
* **middleware/apiKeyAuth.js**: Validates `x-api-key` header against `api_keys` table, tracks `usage_count`, attaches tenant scope.
* **routes/b2b.js**: B2B partner endpoints (villages, analytics, ambulances, outbreaks) scoped to API key tenant.
* **routes/apiKeys.js**: Full CRUD for B2B API keys + multi-tenant usage aggregation.

### 3. AI Service
* **main.py**: FastAPI routes for SymptomNet ML classification, RAG inference, Outbreak Agent.
* **rag_service.py**: Semantic query encoder comparing against 243 precomputed KB embeddings with 0.45 threshold.
* **outbreak_agent.py**: Autonomous 30-min loop scanning PostgreSQL symptom clusters via Groq Llama-3.3-70B.

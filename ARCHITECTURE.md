# SwasthAI Guardian Platform Architecture

SwasthAI Guardian is a National Rural Health Intelligence Platform built for scale, resilience, and offline-first dependability. It bridges the gap between rural citizens, field ASHA workers, and district healthcare administration.

## System Architecture

```mermaid
graph TD
    classDef frontend fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef backend fill:#0F172A,stroke:#1E293B,stroke-width:2px,color:#fff;
    classDef ai fill:#8B5CF6,stroke:#6D28D9,stroke-width:2px,color:#fff;
    classDef db fill:#3B82F6,stroke:#1D4ED8,stroke-width:2px,color:#fff;

    Villager["Villager (Local Mobile App)"]:::frontend
    ASHA["ASHA Worker (Field App)"]:::frontend
    Admin["District Admin (Command Center)"]:::frontend

    ReactPWA["React 18 PWA / Frontend<br/>(IndexedDB Sync Queue, Leaflet.js)"]:::frontend

    NodeBackend["Node.js Express Backend<br/>(Auth, Operations, SSE Hub)"]:::backend
    AIService["FastAPI AI Service<br/>(SymptomNet, Skin CV, RAG Chat, OutbreakAgent)"]:::ai

    AuroraDB["Amazon Aurora PostgreSQL<br/>(Relational Core)"]:::db
    SQLiteDB["SQLite Fallback Database<br/>(Local Dev Mode)"]:::db
    DynamoDB["Amazon DynamoDB<br/>(outbreak_telemetry Table + GSIs)"]:::db

    Villager --> ReactPWA
    ASHA --> ReactPWA
    Admin --> ReactPWA

    ReactPWA <-->|"REST APIs / SSE Events"| NodeBackend
    NodeBackend <-->|"HTTP Requests"| AIService

    NodeBackend <-->|"Aurora client"| AuroraDB
    NodeBackend <-->|"better-sqlite3 / sqlite"| SQLiteDB
    
    AIService <-->|"DynamoDB client"| DynamoDB
    AIService <-->|"DB queries (Outbreak detection)"| SQLiteDB
    AIService <-->|"DB queries (Outbreak detection)"| AuroraDB
```

## Key Modules & Technologies

### 1. Offline-First Frontend Axis (PWA)
- **Framework**: React 18, Tailwind CSS, Framer Motion.
- **Offline Sync Queue**: Utilizes an IndexedDB-backed service worker queue. All diagnosis logs, pregnancy registrations, and child nutrition assessments sync automatically when connectivity returns.
- **Map & Boundaries**: Renders an interactive Leaflet.js map of Varanasi showing dynamic outbreak markers and live ASHA contact nodes.

### 2. Node.js Express Operations Hub
- **Authentication**: JWT access tokens (15m expiry) and sliding-window Refresh Tokens. Fallback local authentication using cached bcrypt hashes.
- **SSE Stream**: Server-Sent Events (SSE) stream live ambulance requests, telemetry changes, and outbreak alerts directly to the Admin dashboard.

### 3. Python AI & Analytical Service
- **Malnutrition Classifier**: Calculates WHO Weight-for-Height Z-score (WHZ) using linear interpolation on the 2006 WHO growth standards.
- **Skin Disease Detector**: Image processing using Pillow with a tone-normalized HSV skin-tone inclusion check.
- **Proactive Outbreak Prediction**: An `/predict/seasonal-risk` endpoint that maps villages to disease patterns using India's seasonal metrics to identify potential hot-spots.
- **Outbreak Agent**: Groq Llama-3.3-70b RAG-powered agent that analyzes clinical clusters to differentiate genuine outbreaks from background noise.

### 4. Hybrid Database Layer
- **Relational Core**: Amazon Aurora PostgreSQL as primary DB with an automatic fallback to local SQLite for zero-config development.
- **Telemetry Store**: Amazon DynamoDB storing outbreak telemetry records, queryable by disease and district indices using GSIs.

# Offline Synchronization & Conflict Resolution Strategy

This document outlines the architecture, idempotency controls, and conflict-resolution strategies used in the SwasthAI Guardian Platform to support offline-first operations in rural India (specifically optimized for high-latency, offline, or 2G network environments).

---

## 1. Architecture Overview

SwasthAI Guardian employs a **Local-First / Offline-Capable** transaction queue on the client, backed by **centralized relational (Aurora/SQLite)** and **non-relational (DynamoDB)** stores on the backend.

```
[ Frontend Action ]
        │ (Offline / 2G)
        ▼
[ IndexedDB Write Queue ] ──(Auto-drain on Reconnect)──► [ Node.js Backend API ]
                                                                │
                                              ┌─────────────────┴─────────────────┐
                                              ▼                                   ▼
                                     [ Relational SQL ]                   [ AWS DynamoDB ]
                                  (Idempotent Transactions)            (Event-driven Telemetry)
```

- **Client Storage**: `frontend/src/utils/offlineSyncQueue.js` utilizes **IndexedDB** as an asynchronous, non-blocking bulk store (capable of storing megabytes of patient records locally). LocalStorage is kept purely as an emergency fallback.
- **Auto-Sync Engine**: The client listens for the browser's `online` event and reloads/initializes page processes to automatically trigger a background queue replay when connectivity returns.

---

## 2. Idempotency Guarantees

To prevent duplicate records (e.g., repeating clinical checks or double-ordering ambulances) when network retries occur, we use a two-tiered idempotency key schema:

1. **Client-Generated UUIDs (`clientRequestId`)**:
   - Every transaction queued offline (symptom checks, SOS ambulance requests, maternal vitals, and child nutrition entries) is immediately stamped with a unique `clientRequestId` (e.g. `mat-1780859306864-x8f2d9a1`).
   - The queue re-posts this key as part of the request body.

2. **Server-Side Unique Indexes**:
   - The backend checks for the existence of `clientRequestId` before performing any database write operation.
   - **PostgreSQL / SQLite Indexing**: Relational tables (like `pregnancy_data` and `malnutrition_data`) enforce unique constraints on `client_request_id`.
   - **Idempotency Response**: If the server detects a duplicate request ID:
     - It returns the **existing record ID and status** with a `200 OK` (setting `duplicate: true` in the JSON response).
     - It **ignores** the secondary insert, completely avoiding database pollution while satisfying the client.

---

## 3. Conflict Resolution Strategy

When offline-queued items are replayed on the server, conflicts may arise if records have been updated or if multiple sync streams clash. We enforce three distinct rules depending on the data type:

### Rule A: Reject-Duplicate (Transactional Data)
- **Applicable to**: Clinical observations, symptom checker logs, PHQ-2 screens, maternal health metrics, and malnutrition checks.
- **Rule**: Transaction records are immutable. Once a vital sign report or symptom check is successfully captured for a specific `clientRequestId`, the server rejects any modification attempt to that specific ID and retains the first successful record.

### Rule B: Last-Write-Wins (LWW) (State-Based & Status Updates)
- **Applicable to**: Emergency/Ambulance statuses (`pending` ➔ `assigned` ➔ `completed`) and system settings.
- **Rule**: The server compares the client-supplied `clientUpdatedAt` timestamp included in the replayed sync payload. For state transitions (e.g., ambulance `pending` → `assigned` → `completed`), the database updates the status field to the latest write received, keeping the system synchronized without requiring a lock.

### Rule C: Accumulate/Aggregate (Telemetry & Counter Fields)
- **Applicable to**: Outbreak counts, village activity logs, and ASHA workload queues.
- **Rule**: Metrics are merged and aggregated. A sync restoration event (`sync_restored`) increments the total metrics rather than overriding past stats.

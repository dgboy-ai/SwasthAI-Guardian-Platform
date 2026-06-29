# DynamoDB tables

SwasthAI creates these tables automatically on backend startup when `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set:

| Table | PK | SK | GSIs | GSI Count |
|---|---|---|---|---|
| `outbreak_telemetry` | `villageId` | `detectedAt` | `gsikey-time-index`, `disease-index`, `district-time-index` | 3 |
| `sync_queues` | `deviceId` | `queuedAt` | `status-index` | 1 |
| `village_node_state` | `villageId` | — | `all-nodes-index` · TTL on `expiresAt` | 1 |
| `emergency_streams` | `districtId` | `streamId` | `priority-index`, `district-date-index` (`districtDateBucket` + `timestamp`) | 2 |
| `security_audit_logs` | `actor` | `timestamp` | None — all queries actor-scoped for audit trail integrity | 0 |

**Total: 7 GSIs across 5 tables (verified live on AWS console)**

Region defaults to `ap-south-1`. See `backend/dynamodb.js` for schema definitions.

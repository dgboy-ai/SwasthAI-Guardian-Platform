# DynamoDB tables

SwasthAI creates these tables automatically on backend startup when `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set:

- `outbreak_telemetry` (villageId + detectedAt, GSIs `disease-index`, `district-time-index`)
- `sync_queues` (deviceId + queuedAt, GSI `status-index`)
- `village_node_state` (villageId, TTL on `expiresAt`)
- `emergency_streams` (districtId + streamId, GSIs `priority-index`, `district-date-index` using `districtDateBucket` + `timestamp`)
- `security_audit_logs` (actor + timestamp, no GSIs — all queries actor-scoped for audit trail integrity)

Region defaults to `ap-south-1`. See `backend/dynamodb.js` for schema definitions.

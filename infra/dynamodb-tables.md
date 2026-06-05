# DynamoDB tables

SwasthAI creates these tables automatically on backend startup when `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set:

- `outbreak_telemetry` (villageId + detectedAt, GSIs `disease-index`, `district-time-index`)
- `sync_queues` (deviceId + queuedAt, GSI `status-index`)
- `village_node_state` (villageId, TTL on `expiresAt`)
- `emergency_streams` (districtId + streamId, GSIs `priority-index`, `district-date-index` using `districtDateBucket` + `timestamp`)

Region defaults to `ap-south-1`. See `backend/dynamodb.js` for schema definitions.

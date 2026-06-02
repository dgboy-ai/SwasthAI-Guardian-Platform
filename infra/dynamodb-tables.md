# DynamoDB tables

SwasthAI creates these tables automatically on backend startup when `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set:

- `outbreak_telemetry` (villageId + detectedAt, GSI `disease-index`)
- `sync_queues` (deviceId + queuedAt, GSI `status-index`)
- `village_node_state` (villageId, TTL on `expiresAt`)
- `emergency_streams` (districtId + streamId, GSI `priority-index`)

Region defaults to `ap-south-1`. See `backend/dynamodb.js` for schema definitions.

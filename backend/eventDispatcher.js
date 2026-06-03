import { EventEmitter } from "events";
import dynamoHelper from "./dynamodb.js";

const eventEmitter = new EventEmitter();
let pgDb = null;

export function initializeEventDispatcher(dbInstance) {
  pgDb = dbInstance;
  console.log("📢 Event Dispatcher Initialized with Relational DB reference.");
}

// 1. Listen for symptom submissions
eventEmitter.on("symptom_submitted", async (eventData) => {
  const { userId, villageId, symptoms, prediction, timestamp } = eventData;
  console.log(`[EVENT] symptom_submitted: User ${userId} in ${villageId}`);
  const now = timestamp || new Date().toISOString();
  await dynamoHelper.put("outbreak_telemetry", {
    villageId,
    detectedAt:  now,             // Fix: required range key
    eventId:     `EVT-SYM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    eventType:   "symptom_submitted",
    userId,
    symptoms,
    prediction,
    timestamp:   now,
  });

  await dynamoHelper.updateNodeState(villageId, "online", now, 0);
});

// 2. Listen for outbreak detections
eventEmitter.on("outbreak_detected", async (eventData) => {
  const { villageId, disease, count, action, timestamp } = eventData;
  console.log(`[EVENT] outbreak_detected: Cluster in ${villageId} (${disease})`);
  const now = timestamp || new Date().toISOString();
  await dynamoHelper.put("outbreak_telemetry", {
    villageId,
    detectedAt:  now,             // Fix: required range key
    eventId:     `EVT-OUT-${Date.now()}`,
    eventType:   "outbreak_detected",
    disease:     disease || 'Unknown',
    casesCount:  count,
    action,
    timestamp:   now,
  });

  await dynamoHelper.updateNodeState(villageId, "outbreak", now, 0);

  if (pgDb) {
    try {
      await pgDb.run(
        `UPDATE village_health
         SET "outbreakAlert" = $1, "lastUpdated" = $2
         WHERE "villageId" = $3`,
        [`⚠️ Outbreak Alert: ${disease}. Action: ${action}`, now, villageId]
      );
    } catch (err) {
      console.error("Failed to update village_health on outbreak_detected event:", err.message);
    }
  }
});

// 3. Listen for sync restorations
eventEmitter.on("sync_restored", async (eventData) => {
  const { villageId, recordCount, durationMs, timestamp } = eventData;
  console.log(`[EVENT] sync_restored: ${recordCount} records from ${villageId} synced in ${durationMs}ms`);
  const now = timestamp || new Date().toISOString();
  await dynamoHelper.put("outbreak_telemetry", {
    villageId,
    detectedAt:   now,            // Fix: required range key
    eventId:      `EVT-SYNC-${Date.now()}`,
    eventType:    "sync_restored",
    recordCount,
    durationMs,
    timestamp:    now,
  });

  await dynamoHelper.updateNodeState(villageId, "online", now, 0);
});

// 4. Listen for emergency dispatches
eventEmitter.on("emergency_triggered", async (eventData) => {
  const { requestId, name, location, priority, symptoms, timestamp } = eventData;
  console.log(`[EVENT] emergency_triggered: Request #${requestId} at ${location}`);

  await dynamoHelper.put("emergency_streams", {
    eventId: `EVT-EMG-${Date.now()}-${requestId}`,
    requestId,
    name,
    villageId: location,
    priority,
    symptoms,
    status: "pending",
    timestamp: timestamp || new Date().toISOString()
  });

  await dynamoHelper.updateNodeState(location, "emergency", new Date().toISOString(), 0);
});

// 5. Listen for high-risk maternal alerts
eventEmitter.on("maternal_alert", async (eventData) => {
  const { name, age, villageId, riskLevel, vitals, timestamp } = eventData;
  console.log(`[EVENT] maternal_alert: ${riskLevel} Risk pregnancy registered for ${name} in ${villageId}`);

  await dynamoHelper.put("emergency_streams", {
    eventId: `EVT-MAT-${Date.now()}`,
    eventType: "maternal_alert",
    name,
    age,
    villageId,
    riskLevel,
    vitals,
    timestamp: timestamp || new Date().toISOString()
  });
});

export default eventEmitter;

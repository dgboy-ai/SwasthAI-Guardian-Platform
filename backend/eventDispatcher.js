import { EventEmitter } from "events";
import dynamoHelper from "./dynamodb.js";

const eventEmitter = new EventEmitter();
let pgDb = null;

export function initializeEventDispatcher(dbInstance) {
  pgDb = dbInstance;
  console.log("📢 Event Dispatcher Initialized with Relational DB reference.");
}

// ── Generic Retry Helper for DynamoDB writes ────────────────────────────────
async function callWithRetry(fn, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fn();
      return;
    } catch (err) {
      console.error(`[DYNAMODB RETRY ERROR] Attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// ── Helper: derive districtId from village_health or env fallback ─────────────
async function getDistrictId(db, villageId) {
  if (!db) return process.env.DISTRICT_NAME || 'district_main';
  try {
    const row = await db.get('SELECT "districtId" FROM village_health WHERE "villageId" = ?', [villageId]);
    return row?.districtId || process.env.DISTRICT_NAME || 'district_main';
  } catch (_) {
    return process.env.DISTRICT_NAME || 'district_main';
  }
}

// ── pgDb Retry Helper with Null Guard ───────────────────────────────────────
async function runPgWithRetry(sql, params, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    if (pgDb) {
      try {
        await pgDb.run(sql, params);
        return;
      } catch (err) {
        console.error(`[PG RETRY] Attempt ${attempt}/${retries} failed:`, err.message);
        if (attempt === retries) throw err;
      }
    } else {
      console.warn(`[CRITICAL WARNING] pgDb is null (Attempt ${attempt}/${retries}). Waiting for initialization to complete...`);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("pgDb is null after all retry attempts");
}

// 1. Listen for symptom submissions
eventEmitter.on("symptom_submitted", async (eventData) => {
  const { userId, villageId, symptoms, prediction, timestamp } = eventData;
  console.log(`[EVENT] symptom_submitted: User ${userId} in ${villageId}`);
  const now = timestamp || new Date().toISOString();

  try {
    const districtId = await getDistrictId(pgDb, villageId);

    await callWithRetry(async () => {
      await dynamoHelper.put("outbreak_telemetry", {
        villageId,
        districtId,
        detectedAt:  now,
        eventId:     `EVT-SYM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        eventType:   "symptom_submitted",
        userId,
        symptoms,
        prediction,
        timestamp:   now,
      });
    });

    await callWithRetry(async () => {
      await dynamoHelper.updateNodeState(villageId, "online", now, 0);
    });
  } catch (err) {
    console.error(`[EVENT ERROR] symptom_submitted handling failed:`, err.message);
  }
});

// 2. Listen for outbreak detections
eventEmitter.on("outbreak_detected", async (eventData) => {
  const { villageId, disease, count, action, timestamp } = eventData;
  console.log(`[EVENT] outbreak_detected: Cluster in ${villageId} (${disease})`);
  const now = timestamp || new Date().toISOString();

  try {
    const districtId = await getDistrictId(pgDb, villageId);

    await callWithRetry(async () => {
      await dynamoHelper.put("outbreak_telemetry", {
        villageId,
        districtId,
        detectedAt:  now,
        eventId:     `EVT-OUT-${Date.now()}`,
        eventType:   "outbreak_detected",
        disease:     disease || 'Unknown',
        casesCount:  count,
        action,
        timestamp:   now,
      });
    });

    await callWithRetry(async () => {
      await dynamoHelper.updateNodeState(villageId, "outbreak", now, 0);
    });

    await runPgWithRetry(
      `UPDATE village_health
       SET "outbreakAlert" = ?, "lastUpdated" = ?
       WHERE "villageId" = ?`,
      [`⚠️ Outbreak Alert: ${disease}. Action: ${action}`, now, villageId]
    );
  } catch (err) {
    console.error(`[EVENT ERROR] outbreak_detected handling failed:`, err.message);
  }
});

// 3. Listen for sync restorations
eventEmitter.on("sync_restored", async (eventData) => {
  const { villageId, recordCount, durationMs, syncBatchId, clientRequestIds = [], timestamp } = eventData;
  console.log(`[EVENT] sync_restored: ${recordCount} records from ${villageId} synced in ${durationMs}ms`);
  const now = timestamp || new Date().toISOString();

  try {
    const districtId = await getDistrictId(pgDb, villageId);

    await callWithRetry(async () => {
      await dynamoHelper.put("outbreak_telemetry", {
        villageId,
        districtId,
        detectedAt:   now,
        eventId:      `EVT-SYNC-${Date.now()}`,
        eventType:    "sync_restored",
        syncBatchId,
        clientRequestIds,
        recordCount,
        durationMs,
        timestamp:    now,
      });
    });

    await callWithRetry(async () => {
      await dynamoHelper.updateNodeState(villageId, "online", now, 0);
    });
  } catch (err) {
    console.error(`[EVENT ERROR] sync_restored handling failed:`, err.message);
  }
});

// 4. Listen for emergency dispatches
eventEmitter.on("emergency_triggered", async (eventData) => {
  const { requestId, name, location, villageId, priority, symptoms, timestamp } = eventData;
  console.log(`[EVENT] emergency_triggered: Request #${requestId} at ${location}`);

  const resolvedVillageId = villageId || 'v101'; // structured ID fallback
  const resolvedLocation = location || 'unspecified'; // separate location attribute
  const now = timestamp || new Date().toISOString();

  try {
    const districtId = await getDistrictId(pgDb, resolvedVillageId);
    
    await callWithRetry(async () => {
      await dynamoHelper.put("emergency_streams", {
        districtId,
        streamId:    `amb-${requestId}-${Date.now()}`,
        eventId:     `EVT-EMG-${Date.now()}-${requestId}`,
        requestId,
        name,
        villageId:   resolvedVillageId, // structured ID
        location:    resolvedLocation,  // separate location attribute
        priority:    priority || 'High',
        symptoms,
        status:      "pending",
        timestamp:   now
      });
    });

    await callWithRetry(async () => {
      await dynamoHelper.updateNodeState(resolvedVillageId, "emergency", now, 0);
    });
  } catch (err) {
    console.error(`[EVENT ERROR] emergency_triggered handling failed:`, err.message);
  }
});

// 5. Listen for high-risk maternal alerts
eventEmitter.on("maternal_alert", async (eventData) => {
  const { name, age, villageId, riskLevel, vitals, timestamp } = eventData;
  console.log(`[EVENT] maternal_alert: ${riskLevel} Risk pregnancy registered for ${name} in ${villageId}`);
  const now = timestamp || new Date().toISOString();
  const resolvedVillageId = villageId || 'v101';

  try {
    const districtId = await getDistrictId(pgDb, resolvedVillageId);

    await callWithRetry(async () => {
      await dynamoHelper.put("emergency_streams", {
        districtId,
        streamId:    `mat-${Date.now()}`,
        eventId:     `EVT-MAT-${Date.now()}`,
        eventType:   "maternal_alert",
        name,
        age,
        villageId:   resolvedVillageId,
        riskLevel,
        vitals,
        priority:    riskLevel === 'high' ? 'High' : 'Medium',
        timestamp:   now
      });
    });
  } catch (err) {
    console.error(`[EVENT ERROR] maternal_alert handling failed:`, err.message);
  }
});

export default eventEmitter;

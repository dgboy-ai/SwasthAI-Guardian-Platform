import { EventEmitter } from "events";
import dynamoHelper from "./dynamodb.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DLQ_PATH = path.join(__dirname, "failed_events_dlq.json");

const eventEmitter = new EventEmitter();
let pgDb = null;
let isSQLite = false;

let broadcastCallback = null;

export function initializeEventDispatcher(dbInstance, usingSQLite = false, broadcastFn = null) {
  pgDb = dbInstance;
  isSQLite = usingSQLite;
  broadcastCallback = broadcastFn;
  console.log(`📢 Event Dispatcher Initialized with Relational DB reference (usingSQLite: ${usingSQLite}).`);
}

// ── Dead Letter Queue (DLQ) Mechanism ────────────────────────────────────────
async function writeToDLQ(eventType, eventData, errorMessage) {
  try {
    const dlqItem = {
      timestamp: new Date().toISOString(),
      eventType,
      eventData,
      error: errorMessage
    };
    
    let currentDLQ = [];
    if (fs.existsSync(DLQ_PATH)) {
      try {
        const raw = fs.readFileSync(DLQ_PATH, "utf8");
        currentDLQ = JSON.parse(raw);
      } catch (_) {
        // start fresh if JSON is corrupted
      }
    }
    
    currentDLQ.push(dlqItem);
    if (currentDLQ.length > 100) {
      currentDLQ.shift(); // keep size constrained to 100 entries to prevent disk bloating
    }
    
    fs.writeFileSync(DLQ_PATH, JSON.stringify(currentDLQ, null, 2), "utf8");
    console.warn(`[DLQ] Saved failed event '${eventType}' to dead-letter queue at ${DLQ_PATH}`);

    if (typeof broadcastCallback === 'function') {
      try {
        const villageId = eventData?.villageId || eventData?.location || null;
        let districtId = null;
        if (villageId) {
          districtId = await getDistrictId(pgDb, villageId);
        }
        broadcastCallback('dlq_alert', {
          eventType,
          error: errorMessage,
          timestamp: dlqItem.timestamp,
          villageId,
          districtId
        });
      } catch (broadcastErr) {
        console.error("[DLQ] Failed to broadcast dlq_alert over SSE:", broadcastErr.message);
      }
    }
  } catch (dlqErr) {
    console.error("[CRITICAL DLQ ERROR] Failed to write to dead-letter queue file:", dlqErr.message);
  }
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
  if (!db) {
    console.warn(`[DISTRICT RESOLUTION WARNING] Relational DB instance is null. Falling back to default district for village: ${villageId}`);
    return process.env.DISTRICT_NAME || 'district_main';
  }
  try {
    const row = await db.get('SELECT "districtId" FROM village_health WHERE "villageId" = ?', [villageId]);
    if (!row?.districtId) {
      console.warn(`[DISTRICT RESOLUTION WARNING] Village '${villageId}' has no assigned districtId in DB. Falling back to default.`);
    }
    return row?.districtId || process.env.DISTRICT_NAME || 'district_main';
  } catch (err) {
    console.error(`[DISTRICT RESOLUTION ERROR] Failed to query districtId for village '${villageId}':`, err.message);
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
        symptomPattern: symptoms,
        prediction,
        classification: prediction,
        timestamp:   now,
        traceId:     eventData.traceId || null
      });
    });

    await callWithRetry(async () => {
      await dynamoHelper.updateNodeState(villageId, "online", now, 0);
    });
  } catch (err) {
    console.error(`[EVENT ERROR] symptom_submitted handling failed:`, err.message);
    await writeToDLQ("symptom_submitted", eventData, err.message);
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
        classification: disease || 'Unknown',
        casesCount:  count,
        caseCount:   count,
        action,
        timestamp:   now,
        traceId:     eventData.traceId || null
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

    if (typeof broadcastCallback === 'function') {
      broadcastCallback('outbreak', {
        villageId,
        districtId,
        detectedAt: now,
        disease: disease || 'Unknown',
        classification: disease || 'Unknown',
        action,
        caseCount: count,
        symptomPattern: `${count} cases detected`,
        confidence: 0.85,
        riskScore: 85,
        severity: 'high',
        source: 'EventDispatcher'
      });
    }
  } catch (err) {
    console.error(`[EVENT ERROR] outbreak_detected handling failed:`, err.message);
    await writeToDLQ("outbreak_detected", eventData, err.message);
  }
});

// 3. Listen for sync restorations
eventEmitter.on("sync_restored", async (eventData) => {
  const { villageId, recordCount, durationMs, syncBatchId, clientRequestIds = [], pendingCount = 0, timestamp } = eventData;
  console.log(`[EVENT] sync_restored: ${recordCount} records from ${villageId} synced in ${durationMs}ms. Pending: ${pendingCount}`);
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
        classification: "Sync Restored",
        symptomPattern: `Synced ${recordCount} records in ${durationMs}ms`,
        traceId:      eventData.traceId || null
      });
    });

    await callWithRetry(async () => {
      await dynamoHelper.updateNodeState(villageId, "online", now, pendingCount);
    });
  } catch (err) {
    console.error(`[EVENT ERROR] sync_restored handling failed:`, err.message);
    await writeToDLQ("sync_restored", eventData, err.message);
  }
});

// 4. Listen for emergency dispatches
eventEmitter.on("emergency_triggered", async (eventData) => {
  const { requestId, name, location, villageId, priority, symptoms, timestamp } = eventData;
  console.log(`[EVENT] emergency_triggered: Request #${requestId} (Priority: ${priority || 'High'})`);

  const resolvedVillageId = villageId || 'v101'; // structured ID fallback
  const resolvedLocation = location || 'unspecified'; // separate location attribute
  const now = timestamp || new Date().toISOString();

  try {
    const districtId = await getDistrictId(pgDb, resolvedVillageId);
    const districtDateBucket = `${districtId}#${now.slice(0, 10)}`;
    
    await callWithRetry(async () => {
      await dynamoHelper.put("emergency_streams", {
        districtId,
        districtDateBucket,
        streamId:    `amb-${requestId}-${Date.now()}`,
        eventId:     `EVT-EMG-${Date.now()}-${requestId}`,
        requestId,
        name,
        villageId:   resolvedVillageId, // structured ID
        location:    resolvedLocation,  // separate location attribute
        priority:    priority || 'High',
        symptoms,
        status:      "pending",
        timestamp:   now,
        traceId:     eventData.traceId || null
      });
    });

    await callWithRetry(async () => {
      await dynamoHelper.updateNodeState(resolvedVillageId, "emergency", now, 0);
    });

    if (typeof broadcastCallback === 'function') {
      broadcastCallback('ambulance', {
        requestId, name, location: resolvedLocation, villageId: resolvedVillageId,
        priority: priority || 'High', symptoms,
        status: 'pending', timestamp: now, traceId: eventData.traceId || null,
        districtId
      });
    }
  } catch (err) {
    console.error(`[EVENT ERROR] emergency_triggered handling failed:`, err.message);
    await writeToDLQ("emergency_triggered", eventData, err.message);
  }
});

// 5. Listen for high-risk maternal alerts
eventEmitter.on("maternal_alert", async (eventData) => {
  const { name, age, villageId, riskLevel, vitals, timestamp } = eventData;
  console.log(`[EVENT] maternal_alert: ${riskLevel} Risk pregnancy registered in ${villageId}`);
  const now = timestamp || new Date().toISOString();
  const resolvedVillageId = villageId || 'v101';

  try {
    const districtId = await getDistrictId(pgDb, resolvedVillageId);
    const districtDateBucket = `${districtId}#${now.slice(0, 10)}`;

    await callWithRetry(async () => {
      await dynamoHelper.put("emergency_streams", {
        districtId,
        districtDateBucket,
        streamId:    `mat-${Date.now()}`,
        eventId:     `EVT-MAT-${Date.now()}`,
        eventType:   "maternal_alert",
        name,
        age,
        villageId:   resolvedVillageId,
        riskLevel,
        vitals,
        priority:    riskLevel === 'high' ? 'High' : 'Medium',
        timestamp:   now,
        traceId:     eventData.traceId || null
      });
    });
  } catch (err) {
    console.error(`[EVENT ERROR] maternal_alert handling failed:`, err.message);
    await writeToDLQ("maternal_alert", eventData, err.message);
  }
});

export default eventEmitter;

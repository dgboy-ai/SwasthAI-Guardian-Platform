import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth, checkRole } from '../middleware/auth.js';
import dynamoHelper from '../dynamodb.js';
import { seedDemoData } from '../db/seed.js';

const router = express.Router();

const adminSseClients = new Map(); // clientId → res

Object.defineProperty(router, 'sseClientsCount', {
  get: () => adminSseClients.size
});

export function broadcastToAdmins(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  adminSseClients.forEach((res) => {
    try { res.write(payload); } catch (_) { /* client disconnected */ }
  });
  console.log(`[SSE] Broadcast '${eventType}' to ${adminSseClients.size} admin client(s)`);
}

router.get('/rag-traces', auth, checkRole(['admin', 'ngo']), (req, res) => {
  res.send(req.app.locals.ragTraces || []);
});

router.post('/seed-demo-data', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  const usingSQLite = req.app.locals.usingSQLite;
  try {
    await seedDemoData(db, usingSQLite, bcrypt);
    res.send({ success: true, message: 'Database reset and preloaded with mock data!' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Seeding failed: ' + err.message });
  }
});

router.get('/analytics', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const vCount = await db.get('SELECT COUNT(*) as c FROM village_health');
    const pCount = await db.get('SELECT COUNT(*) as c FROM pregnancy_data');
    const mCount = await db.get(`SELECT COUNT(*) as c FROM malnutrition_data WHERE status != 'Normal'`);
    const aCount = await db.get('SELECT COUNT(*) as c FROM ambulance_requests');
    const alerts = await db.all(`SELECT id FROM symptoms WHERE "createdAt" >= NOW() - INTERVAL '1 day'`).catch(() => []);

    res.send({
      villages: parseInt(vCount?.c || vCount?.count || 0),
      pregnancies: parseInt(pCount?.c || pCount?.count || 0),
      malnutrition: parseInt(mCount?.c || mCount?.count || 0),
      ambulances: parseInt(aCount?.c || aCount?.count || 0),
      today_symptoms: alerts.length
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.get('/ambulances', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const rows = await db.all('SELECT * FROM ambulance_requests ORDER BY id DESC LIMIT 50');
    res.send(rows);
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch ambulance records.' });
  }
});

router.get('/village/:id', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  const db = req.app.locals.db;
  const village = await db.get('SELECT * FROM village_health WHERE "villageId" = ?', [req.params.id]);
  if (!village) return res.status(404).send({ error: 'Node Not Found' });
  const pregnancies = await db.all('SELECT * FROM pregnancy_data WHERE "villageId" = ?', [req.params.id]);
  res.send({ village, pregnancies });
});

router.get('/summary', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const totalUsers = await db.get("SELECT COUNT(*) as c FROM users WHERE role = 'villager'");
    const totalNgos = await db.get("SELECT COUNT(*) as c FROM users WHERE role = 'ngo'");

    let totalReqs = { c: 0 };
    let sanitaryReqs = { c: 0 };
    try {
      totalReqs = await db.get('SELECT COUNT(*) as c FROM requests');
      sanitaryReqs = await db.get('SELECT COUNT(*) as c FROM requests WHERE type = "sanitary_pad"');
    } catch (e) { /* ignore if table missing */ }

    const emergencyReqs = await db.get('SELECT COUNT(*) as c FROM ambulance_requests');
    const padReqs = await db.get('SELECT COUNT(*) as c FROM ambulance_requests WHERE priority = "Pad Request"');

    res.send({
      totalUsers: totalUsers?.c || 0,
      totalNgos: totalNgos?.c || 0,
      totalRequests: (totalReqs?.c || 0) + (emergencyReqs?.c || 0),
      emergencyCount: emergencyReqs?.c || 0,
      sanitaryCount: (sanitaryReqs?.c || 0) + (padReqs?.c || 0)
    });
  } catch (err) {
    console.error('Summary fetch error:', err);
    res.status(500).send({ error: 'Failed to fetch admin summary' });
  }
});

router.get('/report', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const ambulances = await db.all('SELECT * FROM ambulance_requests ORDER BY id DESC');

    let csv = 'Record ID,Type,Patient Name/ID,Location/Priority,Status,Date\n';

    ambulances.forEach(a => {
      csv += `AMB-${a.id},${a.type || 'ambulance'},"${a.name || 'User ' + a.user_id}","${a.location || ''} (${a.priority || ''})",${a.status},${a.created_at}\n`;
    });

    try {
      const padReqs = await db.all('SELECT * FROM requests ORDER BY id DESC');
      padReqs.forEach(r => {
        csv += `REQ-${r.id},${r.type},User ${r.user_id},N/A,${r.status},${r.created_at}\n`;
      });
    } catch (e) { /* ignore if table missing */ }

    res.header('Content-Type', 'text/csv');
    res.attachment('swasthai_admin_report.csv');
    return res.send(csv);
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).send({ error: 'Failed to generate report' });
  }
});

router.get('/clusters', async (req, res) => {
  const db = req.app.locals.db;
  const usingSQLite = req.app.locals.usingSQLite;
  const agentSecret = req.headers['x-agent-secret'];
  const expectedSecret = process.env.AGENT_SECRET;
  if (!expectedSecret || agentSecret !== expectedSecret) {
    return res.status(403).send({ error: 'Forbidden' });
  }
  try {
    const rows = await db.all(
      usingSQLite
        ? `SELECT "villageId", COUNT(*) as count,
                  GROUP_CONCAT(symptoms, ' | ') as symptoms
           FROM symptoms
           WHERE "createdAt" >= datetime('now', '-1 day')
           GROUP BY "villageId"
           HAVING COUNT(*) >= 3
           ORDER BY count DESC`
        : `SELECT "villageId", COUNT(*) as count,
                  string_agg(symptoms, ' | ') as symptoms
           FROM symptoms
           WHERE "createdAt" >= NOW() - INTERVAL '1 day'
           GROUP BY "villageId"
           HAVING COUNT(*) >= 3
           ORDER BY count DESC`
    );
    res.send(rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.post('/outbreak-alert', async (req, res) => {
  const db = req.app.locals.db;
  const agentSecret = req.headers['x-agent-secret'];
  if (!process.env.AGENT_SECRET || agentSecret !== process.env.AGENT_SECRET) {
    return res.status(403).send({ error: 'Forbidden' });
  }

  const {
    villageId, disease, action,
    confidence = 0, caseCount = 0, symptomPattern = '', detectedAt, source = 'OutbreakAgent'
  } = req.body;

  if (!villageId || !disease) {
    return res.status(400).json({ error: 'villageId and disease are required' });
  }

  const timestamp = detectedAt || new Date().toISOString();

  try {
    await dynamoHelper.put('outbreak_telemetry', {
      villageId,
      detectedAt:     timestamp,
      disease,
      action,
      confidence,
      caseCount,
      symptomPattern,
      source,
      severity:       confidence >= 0.9 ? 'critical' : confidence >= 0.75 ? 'high' : 'medium',
      riskScore:      Math.round(confidence * 100),
    });

    try {
      await db.run(
        `INSERT INTO village_health ("villageId", "outbreakAlert", "lastUpdated")
         VALUES (?, ?, ?)
         ON CONFLICT("villageId") DO UPDATE
           SET "outbreakAlert" = excluded."outbreakAlert",
               "lastUpdated" = excluded."lastUpdated"`,
        [villageId, `${disease}: ${action}`, timestamp]
      );
    } catch (auroraSyncErr) {
      console.warn(`[OUTBREAK] Aurora sync skipped: ${auroraSyncErr.message}`);
    }

    if (typeof req.app.locals.broadcastToAdmins === 'function') {
      req.app.locals.broadcastToAdmins('outbreak', {
        villageId,
        disease,
        action,
        confidence,
        caseCount,
        riskScore:   Math.round(confidence * 100),
        severity:    confidence >= 0.9 ? 'critical' : confidence >= 0.75 ? 'high' : 'medium',
        detectedAt:  timestamp,
        source
      });
    }

    console.log(`[OUTBREAK] ✅ ${disease} in ${villageId} → DynamoDB + SSE broadcast`);
    res.status(201).json({ status: 'stored', store: 'dynamodb', sseClients: 0 });
  } catch (err) {
    console.error('[OUTBREAK] Error:', err.message);
    res.status(500).json({ error: 'Failed to store outbreak alert', detail: err.message });
  }
});

router.get('/outbreaks-dynamo', async (req, res) => {
  const agentSecret = req.headers['x-agent-secret'];
  const isAgent  = agentSecret === process.env.AGENT_SECRET;
  const authHeader = req.headers.authorization;
  let isAuthed = false;
  if (authHeader) {
    try {
      jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET);
      isAuthed = true;
    } catch (_) {}
  }
  if (!isAgent && !isAuthed) return res.status(403).json({ error: 'Forbidden' });

  try {
    const outbreaks = await dynamoHelper.scan('outbreak_telemetry');
    outbreaks.sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''));
    const limit = parseInt(req.query.limit) || 20;
    res.json({ outbreaks: outbreaks.slice(0, limit), total: outbreaks.length, store: dynamoHelper.isMock ? 'mock' : 'dynamodb' });
  } catch (err) {
    res.status(500).json({ outbreaks: [], error: err.message });
  }
});

router.get('/outbreaks', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  try {
    const outbreaks = await dynamoHelper.scan('outbreak_telemetry');
    outbreaks.sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''));
    res.json({ outbreaks: outbreaks.slice(0, 20), store: dynamoHelper.isMock ? 'mock' : 'dynamodb' });
  } catch (err) {
    res.status(503).json({ outbreaks: [], message: err.message });
  }
});

router.get('/dynamo-feed', auth, async (req, res) => {
  try {
    const [outbreaks, syncQueues, nodeStates, emergencies] = await Promise.all([
      dynamoHelper.scan('outbreak_telemetry'),
      dynamoHelper.scan('sync_queues'),
      dynamoHelper.scan('village_node_state'),
      dynamoHelper.scan('emergency_streams'),
    ]);
    const sort = (arr) => (arr || [])
      .sort((a, b) => new Date(b.timestamp || b.ts || 0) - new Date(a.timestamp || a.ts || 0))
      .slice(0, 10);
    res.json({
      outbreak_telemetry: sort(outbreaks),
      sync_queues: sort(syncQueues),
      village_node_state: sort(nodeStates),
      emergency_streams: sort(emergencies),
      isMock: dynamoHelper.isMock,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('DynamoDB feed error:', err.message);
    res.status(500).json({ error: 'Failed to fetch DynamoDB feed', isMock: dynamoHelper.isMock });
  }
});

router.get('/live-feed', (req, res) => {
  let decoded;
  try {
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const queryToken  = req.query.token;
    const token = headerToken || queryToken;
    if (!token) return res.status(401).json({ error: 'Auth Required' });
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access only' });
  } catch (_) {
    return res.status(401).json({ error: 'Invalid Token' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = `admin-${decoded.id}-${Date.now()}`;
  adminSseClients.set(clientId, res);
  console.log(`[SSE] Admin ${decoded.id} connected (${adminSseClients.size} total)`);

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(`event: ping\ndata: ${Date.now()}\n\n`); } catch (_) { clearInterval(heartbeat); }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    adminSseClients.delete(clientId);
    console.log(`[SSE] Admin ${decoded.id} disconnected (${adminSseClients.size} remaining)`);
  });
});

export default router;

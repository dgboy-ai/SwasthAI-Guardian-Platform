import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth, checkRole } from '../middleware/auth.js';
import dynamoHelper from '../dynamodb.js';
import { seedDemoData } from '../db/seed.js';

const router = express.Router();

const adminSseClients = new Map(); // clientId → res
const MAX_SSE_CLIENTS = 20;

// Structured Error helper
const sendError = (res, statusCode, code, message, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, details }
  });
};

Object.defineProperty(router, 'sseClientsCount', {
  get: () => adminSseClients.size
});

export function broadcastToAdmins(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  adminSseClients.forEach((res, clientId) => {
    try { 
      res.write(payload); 
    } catch (_) { 
      adminSseClients.delete(clientId);
    }
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
    sendError(res, 500, 'SEED_FAILED', 'Database seeding failed', err.message);
  }
});

router.get('/analytics', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const vCount = await db.get('SELECT COUNT(*) as c FROM village_health');
    const pCount = await db.get('SELECT COUNT(*) as c FROM pregnancy_data');
    const mCount = await db.get(`SELECT COUNT(*) as c FROM malnutrition_data WHERE status != 'Normal'`);
    const aCount = await db.get('SELECT COUNT(*) as c FROM ambulance_requests');
    const usingSQLite = req.app.locals.usingSQLite;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const alerts = await db.all(
      usingSQLite
        ? `SELECT id FROM symptoms WHERE "createdAt" >= ?`
        : `SELECT id FROM symptoms WHERE "createdAt" >= NOW() - INTERVAL '1 day'`,
      usingSQLite ? [oneDayAgo] : []
    ).catch(() => []);

    res.send({
      villages: parseInt(vCount?.c || vCount?.count || 0),
      pregnancies: parseInt(pCount?.c || pCount?.count || 0),
      malnutrition: parseInt(mCount?.c || mCount?.count || 0),
      ambulances: parseInt(aCount?.c || aCount?.count || 0),
      today_symptoms: alerts.length
    });
  } catch (err) {
    sendError(res, 500, 'ANALYTICS_FAILED', err.message);
  }
});

// Keyset pagination on ambulance requests
router.get('/ambulances', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const lastId = parseInt(req.query.lastId) || null;
    
    let rows;
    if (lastId) {
      rows = await db.all('SELECT * FROM ambulance_requests WHERE id < ? ORDER BY id DESC LIMIT ?', [lastId, limit]);
    } else {
      rows = await db.all('SELECT * FROM ambulance_requests ORDER BY id DESC LIMIT ?', [limit]);
    }
    
    res.send(rows);
  } catch (err) {
    sendError(res, 500, 'FETCH_AMBULANCE_FAILED', 'Failed to fetch ambulance records.');
  }
});

router.get('/village/:id', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const village = await db.get('SELECT * FROM village_health WHERE "villageId" = ?', [req.params.id]);
    if (!village) return sendError(res, 404, 'NODE_NOT_FOUND', 'Node Not Found');
    const pregnancies = await db.all('SELECT * FROM pregnancy_data WHERE "villageId" = ?', [req.params.id]);
    res.send({ village, pregnancies });
  } catch (err) {
    sendError(res, 500, 'FETCH_VILLAGE_FAILED', err.message);
  }
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
    sendError(res, 500, 'SUMMARY_FAILED', 'Failed to fetch admin summary');
  }
});

// CSV Injection mitigation helper
const sanitizeCsvCell = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Mitigate CSV injection (cell starting with =, +, -, @)
  if (/^[=\+\-\@]/.test(str)) {
    str = `'${str}`;
  }
  // Escape quotes
  return str.replace(/"/g, '""');
};

router.get('/report', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const ambulances = await db.all('SELECT * FROM ambulance_requests ORDER BY id DESC');

    let csv = 'Record ID,Type,Patient Name/ID,Location/Priority,Status,Date\n';

    ambulances.forEach(a => {
      csv += `AMB-${sanitizeCsvCell(a.id)},${sanitizeCsvCell(a.type || 'ambulance')},"${sanitizeCsvCell(a.name || 'User ' + a.user_id)}","${sanitizeCsvCell(a.location || '')} (${sanitizeCsvCell(a.priority || '')})",${sanitizeCsvCell(a.status)},${sanitizeCsvCell(a.created_at)}\n`;
    });

    try {
      const padReqs = await db.all('SELECT * FROM requests ORDER BY id DESC');
      padReqs.forEach(r => {
        csv += `REQ-${sanitizeCsvCell(r.id)},${sanitizeCsvCell(r.type)},User ${sanitizeCsvCell(r.user_id)},N/A,${sanitizeCsvCell(r.status)},${sanitizeCsvCell(r.created_at)}\n`;
      });
    } catch (e) { /* ignore if table missing */ }

    res.header('Content-Type', 'text/csv');
    res.attachment('swasthai_admin_report.csv');
    return res.send(csv);
  } catch (err) {
    console.error('Report generation error:', err);
    sendError(res, 500, 'REPORT_FAILED', 'Failed to generate report');
  }
});

// Clusters protected by IP allowlist + agent secret check
router.get('/clusters', async (req, res) => {
  const db = req.app.locals.db;
  const usingSQLite = req.app.locals.usingSQLite;

  const remoteIp = req.socket.remoteAddress;
  const isLocal = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteIp);
  
  const agentSecret = req.headers['x-agent-secret'];
  const expectedSecret = process.env.AGENT_SECRET;
  const isSecretValid = expectedSecret && agentSecret === expectedSecret;

  if (!isLocal && !isSecretValid) {
    return sendError(res, 403, 'FORBIDDEN', 'Access Denied: Internal use or secret required');
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
    sendError(res, 500, 'CLUSTERS_FAILED', err.message);
  }
});

router.post('/outbreak-alert', async (req, res) => {
  const db = req.app.locals.db;
  const agentSecret = req.headers['x-agent-secret'];
  if (!process.env.AGENT_SECRET || agentSecret !== process.env.AGENT_SECRET) {
    return sendError(res, 403, 'FORBIDDEN', 'Forbidden');
  }

  const {
    villageId, disease, action,
    confidence = 0, caseCount = 0, symptomPattern = '', detectedAt, source = 'OutbreakAgent'
  } = req.body;

  if (!villageId || !disease) {
    return sendError(res, 400, 'INVALID_INPUT', 'villageId and disease are required');
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
    sendError(res, 500, 'OUTBREAK_STORAGE_FAILED', 'Failed to store outbreak alert', err.message);
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
  if (!isAgent && !isAuthed) return sendError(res, 403, 'FORBIDDEN', 'Forbidden');

  try {
    // Fix 1: queryRecentAll instead of unbounded scan — last 7 days with FilterExpression
    const daysBack = parseInt(req.query.days) || 7;
    const outbreaks = await dynamoHelper.queryRecentAll('outbreak_telemetry', daysBack);
    outbreaks.sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''));
    const limit = parseInt(req.query.limit) || 20;
    res.json({ outbreaks: outbreaks.slice(0, limit), total: outbreaks.length, store: dynamoHelper.isMock ? 'mock' : 'dynamodb', daysBack });
  } catch (err) {
    sendError(res, 500, 'DYNAMO_OUTBREAKS_FAILED', err.message);
  }
});

router.get('/outbreaks', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  try {
    // Fix 1: queryRecentAll instead of unbounded scan — last 7 days with FilterExpression
    const daysBack = parseInt(req.query.days) || 7;
    const outbreaks = await dynamoHelper.queryRecentAll('outbreak_telemetry', daysBack);
    outbreaks.sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''));
    res.json({ outbreaks: outbreaks.slice(0, 20), store: dynamoHelper.isMock ? 'mock' : 'dynamodb', daysBack });
  } catch (err) {
    sendError(res, 503, 'OUTBREAKS_TEMPORARILY_UNAVAILABLE', err.message);
  }
});

router.get('/dynamo-feed', auth, async (req, res) => {
  try {
    // Fix 1: outbreak_telemetry uses queryRecentAll (has detectedAt range key)
    // sync_queues, village_node_state, emergency_streams still use scan
    // (they lack a common time-range key suitable for cross-partition Query)
    const [outbreaks, syncQueues, nodeStates, emergencies] = await Promise.all([
      dynamoHelper.queryRecentAll('outbreak_telemetry', 7),
      dynamoHelper.scan('sync_queues'),
      dynamoHelper.scan('village_node_state'),
      dynamoHelper.scan('emergency_streams'),
    ]);
    const sort = (arr) => (arr || [])
      .sort((a, b) => new Date(b.timestamp || b.ts || b.detectedAt || 0) - new Date(a.timestamp || a.ts || a.detectedAt || 0))
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
    sendError(res, 500, 'DYNAMO_FEED_FAILED', 'Failed to fetch DynamoDB feed', err.message);
  }
});

// ── HEATMAP DATA ─────────────────────────────────────────────────────────────
// Returns {villageId, lat, lng, outbreakScore} for map visualisation
router.get('/heatmap-data', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  const db = req.app.locals.db;
  const usingSQLite = req.app.locals.usingSQLite;
  try {
    // Pull village coords + outbreak flag
    const villages = await db.all(
      'SELECT "villageId", name, population, pregnant_women, malnutrition_cases, "outbreakAlert" FROM village_health'
    );

    // Recent 24h symptom counts per village
    const symptomCounts = await db.all(
      usingSQLite
        ? `SELECT "villageId", COUNT(*) as cnt FROM symptoms WHERE "createdAt" >= datetime('now','-1 day') GROUP BY "villageId"`
        : `SELECT "villageId", COUNT(*) as cnt FROM symptoms WHERE "createdAt" >= NOW() - INTERVAL '1 day' GROUP BY "villageId"`
    );
    const symptomMap = {};
    symptomCounts.forEach(r => { symptomMap[r.villageId] = parseInt(r.cnt || 0); });

    // High-risk pregnancy counts per village
    const highRiskPreg = await db.all(
      `SELECT "villageId", COUNT(*) as cnt FROM pregnancy_data WHERE "riskLevel" IN ('high','High','HIGH') GROUP BY "villageId"`
    );
    const highRiskMap = {};
    highRiskPreg.forEach(r => { highRiskMap[r.villageId] = parseInt(r.cnt || 0); });

    // Compose heatmap payload with a simple composite risk score 0-100
    // Score = clamp(symptomCnt*5 + malnutrition*3 + highRiskPreg*4 + outbreakAlert*20, 0, 100)
    const payload = villages.map(v => {
      const symptoms   = symptomMap[v.villageId] || 0;
      const malnut     = parseInt(v.malnutrition_cases || 0);
      const highRisk   = highRiskMap[v.villageId] || 0;
      const hasAlert   = v.outbreakAlert ? 1 : 0;
      const rawScore   = symptoms * 5 + malnut * 3 + highRisk * 4 + hasAlert * 20;
      const outbreakScore = Math.min(Math.round(rawScore), 100);

      // Placeholder lat/lng seeded deterministically from villageId string (real coords come from your seed/CSV)
      const hash = Array.from(v.villageId || 'unknown').reduce((a, c) => a + c.charCodeAt(0), 0);
      const lat  = parseFloat((18.5 + (hash % 500) / 100).toFixed(4));
      const lng  = parseFloat((73.8 + (hash % 300) / 100).toFixed(4));

      return { villageId: v.villageId, name: v.name, lat, lng, outbreakScore, hasAlert: !!v.outbreakAlert };
    });

    res.json({ heatmap: payload, total: payload.length, generatedAt: new Date().toISOString() });
  } catch (err) {
    sendError(res, 500, 'HEATMAP_FAILED', 'Failed to compute heatmap data', err.message);
  }
});

// ── VILLAGE BULK UPLOAD (CSV) ─────────────────────────────────────────────────
// POST /api/admin/village-bulk-upload
// Accepts raw text/csv body OR JSON { rows: [...] } for B2B integrations
// CSV format: villageId,name,population,pregnant_women,children_under_5,malnutrition_cases,asha_contact
const bulkUploadSchema = z.object({
  villageId:          z.string().min(1).max(60),
  name:               z.string().min(1).max(120),
  population:         z.coerce.number().int().nonnegative(),
  pregnant_women:     z.coerce.number().int().nonnegative().optional().default(0),
  children_under_5:   z.coerce.number().int().nonnegative().optional().default(0),
  malnutrition_cases: z.coerce.number().int().nonnegative().optional().default(0),
  asha_contact:       z.string().max(20).optional().default(''),
});

router.post('/village-bulk-upload',
  auth, checkRole(['admin']),
  express.text({ type: ['text/csv', 'text/plain'], limit: '1mb' }),
  async (req, res) => {
    const db         = req.app.locals.db;
    const userId     = req.user.id;
    const filename   = req.headers['x-filename'] || 'upload.csv';

    // Support both raw-CSV body and JSON {rows:[]} body
    let rawRows = [];
    if (typeof req.body === 'string') {
      const lines = req.body.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return sendError(res, 400, 'INVALID_CSV', 'CSV must have a header row and at least one data row');

      const EXPECTED_HEADERS = ['villageId','name','population','pregnant_women','children_under_5','malnutrition_cases','asha_contact'];
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      // Validate required columns present
      const missing = ['villageId','name','population'].filter(h => !headers.includes(h));
      if (missing.length) return sendError(res, 400, 'MISSING_COLUMNS', `Required columns missing: ${missing.join(', ')}`);

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] ?? ''; });
        rawRows.push({ row, lineNum: i + 1 });
      }
    } else if (req.body && Array.isArray(req.body.rows)) {
      rawRows = req.body.rows.map((row, i) => ({ row, lineNum: i + 1 }));
    } else {
      return sendError(res, 400, 'INVALID_BODY', 'Provide text/csv body or JSON { rows: [...] }');
    }

    let inserted = 0;
    let skipped  = 0;
    const errors = [];

    for (const { row, lineNum } of rawRows) {
      const parsed = bulkUploadSchema.safeParse(row);
      if (!parsed.success) {
        skipped++;
        errors.push(`Line ${lineNum}: ${parsed.error.errors.map(e => e.message).join('; ')}`);
        continue;
      }
      const d = parsed.data;
      try {
        await db.run(
          `INSERT INTO village_health
             ("villageId", name, population, pregnant_women, children_under_5, malnutrition_cases, asha_contact)
           VALUES (?,?,?,?,?,?,?)
           ON CONFLICT("villageId") DO UPDATE SET
             name               = EXCLUDED.name,
             population         = EXCLUDED.population,
             pregnant_women     = EXCLUDED.pregnant_women,
             children_under_5   = EXCLUDED.children_under_5,
             malnutrition_cases = EXCLUDED.malnutrition_cases,
             asha_contact       = EXCLUDED.asha_contact`,
          [d.villageId, d.name, d.population, d.pregnant_women, d.children_under_5, d.malnutrition_cases, d.asha_contact]
        );
        inserted++;
      } catch (err) {
        skipped++;
        errors.push(`Line ${lineNum} (${row.villageId}): DB error — ${err.message}`);
      }
    }

    // Audit record
    try {
      await db.run(
        `INSERT INTO village_bulk_uploads (filename, uploaded_by, rows_inserted, rows_skipped, errors)
         VALUES (?,?,?,?,?)`,
        [filename, userId, inserted, skipped, errors.join(' | ') || null]
      );
    } catch (_) { /* non-fatal */ }

    res.status(inserted > 0 ? 201 : 400).json({
      success: inserted > 0,
      inserted,
      skipped,
      errors: errors.slice(0, 20),      // cap error list
      message: `${inserted} villages upserted, ${skipped} rows skipped.`
    });
  }
);

// ── DISTRICT REPORT — CMO monthly aggregation ─────────────────────────────────
// GET /api/admin/district-report?month=YYYY-MM
router.get('/district-report', auth, checkRole(['admin']), async (req, res) => {
  const db         = req.app.locals.db;
  const usingSQLite = req.app.locals.usingSQLite;
  const format      = (req.query.format || 'json').toLowerCase();

  // Parse optional month filter (default: current month)
  const monthParam = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const monthStart = `${monthParam}-01`;
  const monthEnd   = `${monthParam}-31`;

  try {
    // Village summary
    const villages = await db.all('SELECT * FROM village_health');

    // Pregnancy stats for month
    const pregnancyStats = await db.get(
      usingSQLite
        ? `SELECT COUNT(*) as total,
                  SUM(CASE WHEN "riskLevel" IN ('high','High','HIGH') THEN 1 ELSE 0 END) as high_risk
           FROM pregnancy_data`
        : `SELECT COUNT(*) as total,
                  SUM(CASE WHEN "riskLevel" ILIKE 'high' THEN 1 ELSE 0 END) as high_risk
           FROM pregnancy_data`
    );

    // Malnutrition stats
    const malnutStats = await db.get(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status NOT IN ('Normal','normal') THEN 1 ELSE 0 END) as abnormal
       FROM malnutrition_data`
    );

    // Ambulance requests for month
    const ambStats = await db.get(
      usingSQLite
        ? `SELECT COUNT(*) as total,
                  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
           FROM ambulance_requests
           WHERE date(created_at) BETWEEN ? AND ?`
        : `SELECT COUNT(*) as total,
                  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
           FROM ambulance_requests
           WHERE created_at::date BETWEEN $1 AND $2`,
      [monthStart, monthEnd]
    );

    // Referrals for month
    let referralStats = { total: 0, completed: 0 };
    try {
      referralStats = await db.get(
        usingSQLite
          ? `SELECT COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
             FROM referrals
             WHERE date(created_at) BETWEEN ? AND ?`
          : `SELECT COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
             FROM referrals
             WHERE created_at::date BETWEEN $1 AND $2`,
        [monthStart, monthEnd]
      ) || { total: 0, completed: 0 };
    } catch (_) { /* referrals table may not exist in older deploys */ }

    // Fix 1: outbreak_telemetry — use queryRecentAll with monthParam prefix filter
    // This avoids a full-table scan; FilterExpression limits to the billing period.
    let outbreaks = [];
    try {
      const monthStart = `${monthParam}-01T00:00:00.000Z`;
      const monthEnd   = `${monthParam}-31T23:59:59.999Z`;
      const raw = await dynamoHelper.queryRecentAll('outbreak_telemetry', 60); // 60-day window covers any month
      outbreaks = (raw || []).filter(o => {
        const ts = o.detectedAt || '';
        return ts >= monthStart && ts <= monthEnd;
      });
    } catch (_) {}

    // Symptom cluster count
    const symptomTotal = await db.get(
      usingSQLite
        ? `SELECT COUNT(*) as cnt FROM symptoms WHERE date("createdAt") BETWEEN ? AND ?`
        : `SELECT COUNT(*) as cnt FROM symptoms WHERE "createdAt"::date BETWEEN $1 AND $2`,
      [monthStart, monthEnd]
    );

    const report = {
      meta: {
        month: monthParam,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.id,
        district: process.env.DISTRICT_NAME || 'Pune District',
        state:    process.env.STATE_NAME    || 'Maharashtra',
      },
      villages: {
        total:         villages.length,
        totalPop:      villages.reduce((s, v) => s + (v.population || 0), 0),
        withAlerts:    villages.filter(v => v.outbreakAlert).length,
        list:          villages.map(v => ({
          villageId:         v.villageId,
          name:              v.name,
          population:        v.population,
          pregnantWomen:     v.pregnant_women,
          malnutritionCases: v.malnutrition_cases,
          outbreakAlert:     v.outbreakAlert || null,
        })),
      },
      maternal: {
        totalPregnancies:    parseInt(pregnancyStats?.total || 0),
        highRiskPregnancies: parseInt(pregnancyStats?.high_risk || 0),
      },
      malnutrition: {
        totalScreened:    parseInt(malnutStats?.total || 0),
        abnormalCases:    parseInt(malnutStats?.abnormal || 0),
      },
      emergencies: {
        ambulanceRequests: parseInt(ambStats?.total || 0),
        resolved:          parseInt(ambStats?.completed || 0),
      },
      referrals: {
        total:     parseInt(referralStats?.total || 0),
        completed: parseInt(referralStats?.completed || 0),
      },
      symptoms: {
        reportedThisMonth: parseInt(symptomTotal?.cnt || symptomTotal?.count || 0),
      },
      outbreakAlerts: {
        count:  outbreaks.length,
        events: outbreaks.slice(0, 10),
      },
    };

    if (format === 'csv') {
      // Flatten top-level metrics into a single-row CSV
      const headers = ['Month','District','State','Villages','TotalPop','WithAlerts','TotalPregnancies','HighRisk',
                       'MalnutritionCases','AmbulanceReqs','AmbulanceResolved','ReferralsTotal','ReferralsDone',
                       'SymptomsReported','OutbreakAlerts','GeneratedAt'];
      const row = [
        report.meta.month, report.meta.district, report.meta.state,
        report.villages.total, report.villages.totalPop, report.villages.withAlerts,
        report.maternal.totalPregnancies, report.maternal.highRiskPregnancies,
        report.malnutrition.abnormalCases,
        report.emergencies.ambulanceRequests, report.emergencies.resolved,
        report.referrals.total, report.referrals.completed,
        report.symptoms.reportedThisMonth, report.outbreakAlerts.count,
        report.meta.generatedAt
      ].map(v => sanitizeCsvCell(v));

      res.header('Content-Type', 'text/csv');
      res.attachment(`district_report_${monthParam}.csv`);
      return res.send(`${headers.join(',')}\n${row.join(',')}`);
    }

    res.json(report);
  } catch (err) {
    sendError(res, 500, 'DISTRICT_REPORT_FAILED', 'Failed to generate district report', err.message);
  }
});

router.get('/live-feed', (req, res) => {
  let decoded;
  try {
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const queryToken  = req.query.token;
    const token = headerToken || queryToken;
    if (!token) return sendError(res, 401, 'AUTH_REQUIRED', 'Auth Required');
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return sendError(res, 403, 'ADMIN_ACCESS_ONLY', 'Admin access only');
  } catch (_) {
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid Token');
  }

  // Max SSE client cap & stale client eviction
  if (adminSseClients.size >= MAX_SSE_CLIENTS) {
    const oldestClientId = adminSseClients.keys().next().value;
    const oldestRes = adminSseClients.get(oldestClientId);
    try { 
      oldestRes.write('event: evicted\ndata: connection closed due to client limit\n\n');
      oldestRes.end(); 
    } catch (_) {}
    adminSseClients.delete(oldestClientId);
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
    try { 
      res.write(`event: ping\ndata: ${Date.now()}\n\n`); 
    } catch (_) { 
      clearInterval(heartbeat); 
      adminSseClients.delete(clientId);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    adminSseClients.delete(clientId);
    console.log(`[SSE] Admin ${decoded.id} disconnected (${adminSseClients.size} remaining)`);
  });
});

export default router;

import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/policy.js';
import dynamoHelper from '../dynamodb.js';
import { seedDemoData } from '../db/seed.js';
import { logAudit } from '../middleware/audit.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DLQ_PATH = path.join(__dirname, '../failed_events_dlq.json');

// NOTE: adminSseClients is in-memory per-worker. In cluster mode (server.js),
// each worker has its own Map — SSE broadcasts from worker 1 won't reach
// clients connected to worker 2. For production HA, replace with a shared
// pub/sub store (Redis pub/sub or DynamoDB streams with DB polling).
const adminSseClients = new Map(); // clientId → res
const MAX_SSE_CLIENTS = 20;
const agentScans = []; // In-memory scan log — lost on restart, DynamoDB is source of truth

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

async function resolveDistrictId(db, villageId) {
  if (!villageId) return process.env.DISTRICT_NAME || 'district_main';
  try {
    const row = await db.get('SELECT "districtId" FROM village_health WHERE "villageId" = ?', [villageId]);
    return row?.districtId || process.env.DISTRICT_NAME || 'district_main';
  } catch (_) {
    return process.env.DISTRICT_NAME || 'district_main';
  }
}

function requestedDistrict(req) {
  return req.query.districtId || process.env.DISTRICT_NAME || 'Varanasi';
}

export function broadcastToAdmins(eventType, data) {
  adminSseClients.forEach((clientObj, clientId) => {
    const { res, villageId, districtId } = clientObj;

    // Strict multi-tenant/district scoping check
    if (districtId && data.districtId && data.districtId !== districtId) {
      return;
    }

    // Scoping check: If the admin user has a villageId limit, filter the stream data
    if (villageId) {
      const eventVillageId = data.villageId || data.location;
      const eventDistrictId = data.districtId;

      if (eventVillageId && eventVillageId !== villageId) {
        if (!districtId || eventDistrictId !== districtId) {
          // Skip broadcasting this event to this client
          return;
        }
      }
    }

    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    try {
      res.write(payload);
    } catch (_) {
      adminSseClients.delete(clientId);
    }
  });
  console.log(`[SSE] Broadcast '${eventType}' to ${adminSseClients.size} admin client(s)`);
}

export async function getAgentScans() {
  // Derive scans from live outbreak_telemetry data when available
  // (outbreak events with detectedAt in the last 24h grouped by village)
  // Queries all 10 shards in parallel for complete coverage
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const shardResults = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        dynamoHelper.query(
          'outbreak_telemetry',
          '#gsk = :gk AND detectedAt >= :cutoff',
          { ':gk': `outbreak_v0#${i}`, ':cutoff': cutoff },
          'gsikey-time-index',
          { ExpressionAttributeNames: { '#gsk': '_gsikey' } }
        ).catch(() => [])
      )
    );
    const liveData = shardResults.flat();
    if (liveData && liveData.length > 0) {
      const byVillage = {};
      for (const item of liveData) {
        const v = item.villageId;
        if (!byVillage[v]) byVillage[v] = { cases: 0, diseases: new Set(), firstSeen: item.detectedAt };
        byVillage[v].cases++;
        if (item.classification) byVillage[v].diseases.add(item.classification);
      }
      return Object.entries(byVillage).map(([villageId, info]) => ({
        villageId,
        villageName: `Village ${villageId.replace('v', '')}`,
        casesScanned: info.cases,
        symptoms: `${[...info.diseases].slice(0, 3).join(', ')} symptoms in ${info.cases} cases`,
        outbreakDetected: info.cases >= parseInt(process.env.OUTBREAK_THRESHOLD, 10) || 3,
        disease: [...info.diseases][0] || 'Under investigation',
        confidence: Math.min(0.5 + info.cases * 0.08, 0.95),
        action: info.cases >= (parseInt(process.env.OUTBREAK_THRESHOLD, 10) || 3) ? 'Deploy ASHA team immediately. Alert district health officer.' : 'Continue monitoring. Standard surveillance.',
        timestamp: new Date().toISOString(),
        source: 'dynamodb',
      }));
    }
  } catch (_) { /* DynamoDB unavailable — return empty, agent will populate on next cycle */ }

  return [];
}

router.get('/agent-scans', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  try {
    const scans = await getAgentScans();
    res.json(scans);
  } catch (err) {
    sendError(res, 500, 'AGENT_SCANS_FAILED', err.message || 'Failed to fetch agent scans');
  }
});

router.post('/agent-scan', async (req, res) => {
  const agentSecret = req.headers['x-agent-secret'];
  const isAgent = process.env.AGENT_SECRET && agentSecret === process.env.AGENT_SECRET;

  let isAuthedAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        isAuthedAdmin = true;
      }
    } catch (_) { }
  }

  if (!isAgent && !isAuthedAdmin) {
    return sendError(res, 403, 'FORBIDDEN', 'Forbidden');
  }

  const { villageId, casesScanned, symptoms, outbreakDetected, disease, confidence, action, timestamp } = req.body;

  if (!villageId) {
    return sendError(res, 400, 'INVALID_INPUT', 'villageId is required');
  }

  const db = req.app.locals.db;
  let villageName = villageId;
  try {
    const vRow = await db.get('SELECT name FROM village_health WHERE "villageId" = ?', [villageId]);
    if (vRow && vRow.name) {
      villageName = vRow.name.split(' / ')[0];
    }
  } catch (_) { }

  const newScan = {
    villageId,
    villageName,
    casesScanned: Number(casesScanned || 0),
    symptoms: symptoms || '',
    outbreakDetected: !!outbreakDetected,
    disease: disease || 'unknown',
    confidence: Number(confidence || 0),
    action: action || 'Monitor closely.',
    timestamp: timestamp || new Date().toISOString()
  };

  // Persist to DynamoDB outbreak_telemetry so scans survive server restarts
  try {
    const districtId = await resolveDistrictId(db, villageId);
    await dynamoHelper.put('outbreak_telemetry', {
      villageId,
      districtId,
      detectedAt: newScan.timestamp,
      disease: newScan.disease,
      classification: newScan.disease,
      action: newScan.action,
      confidence: newScan.confidence,
      caseCount: newScan.casesScanned,
      symptomPattern: newScan.symptoms,
      source: 'agent-scan',
      scanType: newScan.outbreakDetected ? 'outbreak' : 'routine',
      severity: newScan.outbreakDetected ? 'monitor' : 'info',
    });
  } catch (_) { /* non-critical — in-memory fallback still works */ }

  agentScans.unshift(newScan);
  if (agentScans.length > 50) {
    agentScans.pop();
  }

  if (typeof req.app.locals.broadcastToAdmins === 'function') {
    req.app.locals.broadcastToAdmins('agent-scan', newScan);
  }

  res.status(201).json({ success: true, message: 'Scan logged' });
});

router.get('/rag-traces', auth, checkRole(['admin', 'ngo']), (req, res) => {
  res.send(req.app.locals.ragTraces || []);
});

router.post('/seed-demo-data', auth, checkRole(['admin']), logAudit('seed', 'demo_data'), async (req, res) => {
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

// ── Hackathon Demo Seed: populates Aurora + DynamoDB with realistic health data
router.post('/seed-hackathon', async (req, res) => {
  const db = req.app.locals.db;
  const results = { aurora: {}, dynamodb: {} };
  try {
    // ── Aurora: Villages ──
    const villages = [
      { id: 'V101', name: 'Rampur', pop: 1240, district: 'Varanasi', lat: 25.3176, lng: 82.9739 },
      { id: 'V102', name: 'Nagwa', pop: 890, district: 'Varanasi', lat: 25.2920, lng: 83.0080 },
      { id: 'V103', name: 'Sarai', pop: 1100, district: 'Varanasi', lat: 25.3400, lng: 83.0100 },
      { id: 'V104', name: 'Dariyapur', pop: 760, district: 'Varanasi', lat: 25.2700, lng: 82.9500 },
      { id: 'V105', name: 'Kashirampur', pop: 950, district: 'Varanasi', lat: 25.3050, lng: 83.0200 },
    ];
    for (const v of villages) {
      await db.run(
        `INSERT INTO village_health ("villageId", name, population, "districtId", lat, lng, "lastUpdated")
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT("villageId") DO UPDATE SET name=EXCLUDED.name, population=EXCLUDED.population, "districtId"=EXCLUDED."districtId", lat=EXCLUDED.lat, lng=EXCLUDED.lng, "lastUpdated"=CURRENT_TIMESTAMP`,
        [v.id, v.name, v.pop, v.district, v.lat, v.lng]
      );
    }
    results.aurora.villages = villages.length;

    // ── Aurora: Users ──
    const users = [
      { phone: '9876543211', name: 'Sunita Devi', role: 'ngo', villageId: 'V101' },
      { phone: '9876543213', name: 'Priya Sharma', role: 'ngo', villageId: 'V102' },
      { phone: '9876543214', name: 'Geeta Yadav', role: 'ngo', villageId: 'V103' },
      { phone: '9876543212', name: 'Dr. Rajesh Kumar (CMO)', role: 'admin', villageId: null },
    ];
    for (const u of users) {
      await db.run(
        `INSERT INTO users (phone, name, role, "villageId") VALUES (?, ?, ?, ?)
         ON CONFLICT(phone) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role, "villageId"=EXCLUDED."villageId"`,
        [u.phone, u.name, u.role, u.villageId]
      );
    }
    results.aurora.users = users.length;

    // ── Clear old hackathon seed data to prevent duplicates ──
    await db.run('DELETE FROM pregnancy_data WHERE name IN (?,?,?,?,?,?)', ['Sunita Devi', 'Rani Kumari', 'Pooja Gupta', 'Meena Kumari', 'Lata Devi', 'Aarti Sen']);
    await db.run('DELETE FROM symptoms WHERE model_used = ?', ['SymptomNet-DL']);
    await db.run('DELETE FROM referrals WHERE patient_name IN (?,?,?,?,?)', ['Sunita Devi', 'Raju Kumar', 'Lata Devi', 'Karan Singh', 'Geeta Devi']);
    await db.run("DELETE FROM ambulance_requests WHERE name IN (?,?,?) AND request_type = 'ambulance'", ['Ram Singh', 'Lata Devi', 'Geeta Devi']);
    await db.run('DELETE FROM vaccination_records WHERE child_name IN (?,?,?,?)', ['Raju Kumar', 'Priya Singh', 'Amit Kumar', 'Sita Devi']);

    // ── Aurora: Pregnancies ──
    const pregnancies = [
      { name: 'Sunita Devi', age: 26, tri: 3, village: 'V101', risk: 'High', sbp: 145, dbp: 95, hr: 88 },
      { name: 'Rani Kumari', age: 22, tri: 2, village: 'V102', risk: 'Medium', sbp: 128, dbp: 82, hr: 76 },
      { name: 'Pooja Gupta', age: 24, tri: 1, village: 'V103', risk: 'Low', sbp: 118, dbp: 75, hr: 72 },
      { name: 'Meena Kumari', age: 28, tri: 3, village: 'V101', risk: 'High', sbp: 152, dbp: 98, hr: 92 },
      { name: 'Lata Devi', age: 20, tri: 2, village: 'V104', risk: 'Low', sbp: 120, dbp: 78, hr: 74 },
      { name: 'Aarti Sen', age: 30, tri: 3, village: 'V105', risk: 'Medium', sbp: 135, dbp: 88, hr: 80 },
    ];
    for (const p of pregnancies) {
      const due = new Date(Date.now() + (9 - p.tri) * 30 * 86400000).toISOString().slice(0, 10);
      await db.run(
        `INSERT INTO pregnancy_data (name, age, trimester, "dueDate", "riskLevel", "villageId", systolic_bp, diastolic_bp, heart_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.name, p.age, p.tri, due, p.risk, p.village, p.sbp, p.dbp, p.hr]
      );
    }
    results.aurora.pregnancies = pregnancies.length;

    // ── Aurora: Symptoms ──
    const symptoms = [
      { village: 'V101', sym: 'Fever, Headache, Body ache', disease: 'Malaria', conf: 0.82 },
      { village: 'V101', sym: 'Cough, Breathing difficulty', disease: 'Respiratory Infection', conf: 0.75 },
      { village: 'V102', sym: 'Fever, Rash, Joint pain', disease: 'Dengue', conf: 0.78 },
      { village: 'V103', sym: 'Diarrhea, Vomiting, Dehydration', disease: 'Gastroenteritis', conf: 0.85 },
      { village: 'V101', sym: 'Fever, Cough, Fatigue', disease: 'Malaria', conf: 0.79 },
      { village: 'V104', sym: 'Skin rash, Itching', disease: 'Dermatitis', conf: 0.71 },
      { village: 'V105', sym: 'Fever, Body ache, Nausea', disease: 'Viral Fever', conf: 0.68 },
      { village: 'V102', sym: 'Cough, Sore throat', disease: 'Common Cold', conf: 0.88 },
    ];
    for (const s of symptoms) {
      await db.run(
        `INSERT INTO symptoms ("villageId", symptoms, disease, confidence, model_used) VALUES (?, ?, ?, ?, ?)`,
        [s.village, s.sym, s.disease, s.conf, 'SymptomNet-DL']
      );
    }
    results.aurora.symptoms = symptoms.length;

    // ── Aurora: Referrals ──
    const referrals = [
      { name: 'Sunita Devi', village: 'V101', reason: 'High BP in 8th month', priority: 'urgent', status: 'pending' },
      { name: 'Raju Kumar', village: 'V101', reason: 'Severe malnutrition SAM', priority: 'high', status: 'in_progress' },
      { name: 'Lata Devi', village: 'V104', reason: 'Chest pain cardiac risk', priority: 'urgent', status: 'completed' },
      { name: 'Karan Singh', village: 'V103', reason: 'Moderate malnutrition', priority: 'routine', status: 'completed' },
    ];
    for (const r of referrals) {
      await db.run(
        `INSERT INTO referrals (patient_name, "villageId", reason, priority, status) VALUES (?, ?, ?, ?, ?)`,
        [r.name, r.village, r.reason, r.priority, r.status]
      );
    }
    results.aurora.referrals = referrals.length;

    // ── Aurora: Ambulances ──
    const ambulances = [
      { name: 'Ram Singh', loc: 'Rampur Sector 4', priority: 'high', sym: 'Chest pain, Breathing difficulty', status: 'dispatched' },
      { name: 'Lata Devi', loc: 'Nagwa Village', priority: 'critical', sym: 'Pregnancy labour pain', status: 'assigned' },
      { name: 'Geeta Devi', loc: 'Sarai Block', priority: 'medium', sym: 'High fever, Dehydration', status: 'pending' },
    ];
    for (const a of ambulances) {
      await db.run(
        `INSERT INTO ambulance_requests (name, location, priority, symptoms, status, request_type) VALUES (?, ?, ?, ?, ?, 'ambulance')`,
        [a.name, a.loc, a.priority, a.sym, a.status]
      );
    }
    results.aurora.ambulances = ambulances.length;

    // ── Aurora: Vaccinations ──
    const vaccs = [
      { child: 'Raju Kumar', vaccine: 'BCG', village: 'V101', status: 'given', given: '2026-06-15' },
      { child: 'Raju Kumar', vaccine: 'OPV-0', village: 'V101', status: 'given', given: '2026-06-15' },
      { child: 'Priya Singh', vaccine: 'DPT-1', village: 'V102', status: 'scheduled', sched: '2026-07-01' },
      { child: 'Amit Kumar', vaccine: 'Measles', village: 'V103', status: 'scheduled', sched: '2026-07-05' },
    ];
    for (const v of vaccs) {
      await db.run(
        `INSERT INTO vaccination_records (child_name, vaccine_name, "villageId", status, given_date, scheduled_date) VALUES (?, ?, ?, ?, ?, ?)`,
        [v.child, v.vaccine, v.village, v.status, v.given || null, v.sched || null]
      );
    }
    results.aurora.vaccinations = vaccs.length;

    // ── DynamoDB: Outbreaks ──
    const outbreakEvents = [
      { villageId: 'V101', disease: 'Malaria', cases: 12, trend: 'increasing', riskScore: 87, districtId: 'Varanasi' },
      { villageId: 'V102', disease: 'Dengue', cases: 5, trend: 'stable', riskScore: 45, districtId: 'Varanasi' },
      { villageId: 'V103', disease: 'Malaria', cases: 3, trend: 'declining', riskScore: 32, districtId: 'Varanasi' },
      { villageId: 'V104', disease: 'Typhoid', cases: 7, trend: 'increasing', riskScore: 65, districtId: 'Varanasi' },
      { villageId: 'V101', disease: 'Cholera', cases: 2, trend: 'stable', riskScore: 28, districtId: 'Varanasi' },
    ];
    for (const evt of outbreakEvents) {
      const ts = new Date(Date.now() - Math.random() * 24 * 3600000).toISOString();
      const shard = Math.abs(hashStr(evt.villageId)) % 10;
      await dynamoHelper.put('outbreak_telemetry', {
        villageId: evt.villageId, districtId: evt.districtId, detectedAt: ts,
        disease: evt.disease, classification: evt.disease, cases: evt.cases,
        trend: evt.trend, riskScore: evt.riskScore, source: 'HackathonSeeder',
        severity: evt.riskScore >= 70 ? 'critical' : evt.riskScore >= 50 ? 'high' : 'medium',
      });
    }
    results.dynamodb.outbreaks = outbreakEvents.length;

    // ── DynamoDB: Emergencies ──
    const emergencies = [
      { districtId: 'Varanasi', priority: 'critical', patientName: 'Lata Devi', condition: 'Labour pain', location: 'Nagwa Village' },
      { districtId: 'Varanasi', priority: 'high', patientName: 'Ram Singh', condition: 'Chest pain', location: 'Rampur Sector 4' },
      { districtId: 'Varanasi', priority: 'medium', patientName: 'Geeta Devi', condition: 'High fever', location: 'Sarai Block' },
    ];
    for (const e of emergencies) {
      const ts = new Date().toISOString();
      await dynamoHelper.put('emergency_streams', {
        ...e, streamId: `SOS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: ts, status: 'pending',
        districtDateBucket: `${e.districtId}#${ts.slice(0, 10)}`,
      });
    }
    results.dynamodb.emergencies = emergencies.length;

    // ── DynamoDB: Village nodes ──
    for (const v of villages) {
      await dynamoHelper.put('village_node_state', {
        villageId: v.id, status: 'online', lastActive: new Date().toISOString(),
        syncPendingCount: Math.floor(Math.random() * 5),
      });
    }
    results.dynamodb.villageNodes = villages.length;

    res.json({ success: true, message: 'Hackathon demo data seeded successfully!', results });
  } catch (err) {
    console.error('[SEED-HACKATHON]', err);
    res.status(500).json({ success: false, error: err.message, results });
  }
});

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return h;
}

// GET /api/admin/users — registry for district admin (evaluators / demos)
router.get('/users', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const rows = await db.all(
      'SELECT id, name, phone, email, username, role, "villageId" FROM users ORDER BY id DESC LIMIT ?',
      [limit]
    );
    res.send(rows || []);
  } catch (err) {
    sendError(res, 500, 'USERS_FETCH_FAILED', 'Failed to fetch users', err.message);
  }
});

router.put('/users/:id/role', auth, checkRole(['admin']), logAudit('update_role', 'users'), async (req, res) => {
  const db = req.app.locals.db;
  const { role } = req.body;
  const allowed = ['villager', 'ngo', 'admin'];
  if (!allowed.includes(role)) {
    return sendError(res, 400, 'INVALID_ROLE', `Role must be one of: ${allowed.join(', ')}`);
  }
  try {
    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.send({ success: true, userId: req.params.id, role });
  } catch (err) {
    sendError(res, 500, 'ROLE_UPDATE_FAILED', 'Failed to update user role', err.message);
  }
});

router.get('/analytics', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  const districtId = requestedDistrict(req);
  try {
    const vCount = await db.get('SELECT COUNT(*) as c FROM village_health WHERE "districtId" = ?', [districtId]);
    const pCount = await db.get(
      `SELECT COUNT(*) as c FROM pregnancy_data pd
       INNER JOIN village_health vh ON pd."villageId" = vh."villageId"
       WHERE vh."districtId" = ?`, [districtId]
    );
    const mCount = await db.get(
      `SELECT COUNT(*) as c FROM malnutrition_data md
       INNER JOIN village_health vh ON md."villageId" = vh."villageId"
       WHERE vh."districtId" = ? AND md.status != 'Normal'`, [districtId]
    );
    const aCount = await db.get('SELECT COUNT(*) as c FROM ambulance_requests');
    const usingSQLite = req.app.locals.usingSQLite;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const alertRow = await db.get(
      usingSQLite
        ? `SELECT COUNT(*) as c FROM symptoms s
           INNER JOIN village_health vh ON s."villageId" = vh."villageId"
           WHERE vh."districtId" = ? AND s."createdAt" >= ?`
        : `SELECT COUNT(*) as c FROM symptoms s
           INNER JOIN village_health vh ON s."villageId" = vh."villageId"
           WHERE vh."districtId" = ? AND s."createdAt" >= NOW() - INTERVAL '1 day'`,
      usingSQLite ? [districtId, oneDayAgo] : [districtId]
    ).catch(() => ({ c: 0 }));

    res.send({
      villages: parseInt(vCount?.c || vCount?.count || 0),
      pregnancies: parseInt(pCount?.c || pCount?.count || 0),
      malnutrition: parseInt(mCount?.c || mCount?.count || 0),
      ambulances: parseInt(aCount?.c || aCount?.count || 0),
      today_symptoms: parseInt(alertRow?.c || 0)
    });
  } catch (err) {
    sendError(res, 500, 'ANALYTICS_FAILED', err.message);
  }
});

// Keyset pagination on ambulance requests (scoped by district via user → village join)
router.get('/ambulances', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  const districtId = requestedDistrict(req);
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const lastId = parseInt(req.query.lastId) || null;
    const joinFrom = 'FROM ambulance_requests ar LEFT JOIN users u ON ar.user_id = u.id LEFT JOIN village_health vh ON u."villageId" = vh."villageId"';
    const whereClause = districtId ? ` WHERE vh."districtId" = ? OR vh."districtId" IS NULL` : '';

    let rows;
    if (lastId) {
      rows = await db.all(`SELECT ar.* ${joinFrom}${whereClause} AND ar.id < ? ORDER BY ar.id DESC LIMIT ?`, districtId ? [districtId, lastId, limit] : [lastId, limit]);
    } else {
      rows = await db.all(`SELECT ar.* ${joinFrom}${whereClause} ORDER BY ar.id DESC LIMIT ?`, districtId ? [districtId, limit] : [limit]);
    }

    res.send(rows);
  } catch (err) {
    sendError(res, 500, 'FETCH_AMBULANCE_FAILED', 'Failed to fetch ambulance records.');
  }
});

router.get('/villages', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  const db = req.app.locals.db;
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const districtId = requestedDistrict(req);
  try {
    let villages;
    if (districtId) {
      villages = await db.all(
        `SELECT v.*, u.phone AS asha_phone, u.name AS asha_name
         FROM village_health v
         LEFT JOIN users u ON u."villageId" = v."villageId" AND u.role = 'ngo'
         WHERE v."districtId" = ?
         LIMIT ?`, [districtId, limit]
      );
    } else {
      villages = await db.all(
        `SELECT v.*, u.phone AS asha_phone, u.name AS asha_name
         FROM village_health v
         LEFT JOIN users u ON u."villageId" = v."villageId" AND u.role = 'ngo'
         LIMIT ?`, [limit]
      );
    }
    res.send(villages);
  } catch (err) {
    sendError(res, 500, 'FETCH_VILLAGES_FAILED', err.message);
  }
});

router.get('/village-status', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  const { villageId } = req.query;
  if (!villageId) {
    return sendError(res, 400, 'MISSING_VILLAGE_ID', 'villageId is required');
  }
  const db = req.app.locals.db;
  try {
    const village = await db.get('SELECT * FROM village_health WHERE "villageId" = ?', [villageId]);
    if (!village) return sendError(res, 404, 'VILLAGE_NOT_FOUND', 'Village not found');

    // Fetch latest telemetry from DynamoDB village_node_state
    const nodeState = await dynamoHelper.get('village_node_state', { villageId }) || {};

    // Fetch recent outbreaks
    const outbreaks = await dynamoHelper.queryByVillage('outbreak_telemetry', villageId, 7) || [];

    res.json({
      villageId,
      name: village.name,
      population: village.population,
      pregnant_women: village.pregnant_women,
      children_under_5: village.children_under_5,
      malnutrition_cases: village.malnutrition_cases,
      outbreakAlert: village.outbreakAlert,
      nodeState: {
        status: nodeState.status || (village.outbreakAlert ? 'outbreak' : 'normal'),
        lastActive: nodeState.lastActive || new Date().toISOString(),
        syncPendingCount: nodeState.syncPendingCount || 0
      },
      recentOutbreaks: outbreaks
    });
  } catch (err) {
    sendError(res, 500, 'FETCH_STATUS_FAILED', err.message);
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
  const districtId = requestedDistrict(req);
  try {
    const totalUsers = await db.get(
      `SELECT COUNT(*) as c FROM users u
       INNER JOIN village_health vh ON u."villageId" = vh."villageId"
       WHERE vh."districtId" = ? AND u.role = 'villager'`, [districtId]
    );
    const totalNgos = await db.get(
      `SELECT COUNT(*) as c FROM users u
       INNER JOIN village_health vh ON u."villageId" = vh."villageId"
       WHERE vh."districtId" = ? AND u.role = 'ngo'`, [districtId]
    );

    const emergencyReqs = await db.get(
      `SELECT COUNT(*) as c FROM ambulance_requests ar
       INNER JOIN users u ON ar.user_id = u.id
       INNER JOIN village_health vh ON u."villageId" = vh."villageId"
       WHERE vh."districtId" = ? AND ar.request_type = 'ambulance'`, [districtId]
    ).catch(() => ({ c: 0 }));
    const padReqs = await db.get(
      `SELECT COUNT(*) as c FROM ambulance_requests ar
       INNER JOIN users u ON ar.user_id = u.id
       INNER JOIN village_health vh ON u."villageId" = vh."villageId"
       WHERE vh."districtId" = ? AND ar.request_type = 'pad_request'`, [districtId]
    ).catch(() => ({ c: 0 }));

    res.send({
      districtId,
      totalUsers: totalUsers?.c || 0,
      totalNgos: totalNgos?.c || 0,
      totalRequests: (emergencyReqs?.c || 0) + (padReqs?.c || 0),
      emergencyCount: emergencyReqs?.c || 0,
      sanitaryCount: padReqs?.c || 0
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

router.get('/report', auth, checkRole(['admin']), logAudit('export_report', 'ambulance_and_pad_requests'), async (req, res) => {
  const db = req.app.locals.db;
  const districtId = requestedDistrict(req);
  try {
    let query = `SELECT ar.* FROM ambulance_requests ar`;
    const params = [];
    if (districtId) {
      query += ` INNER JOIN users u ON ar.user_id = u.id INNER JOIN village_health vh ON u."villageId" = vh."villageId" WHERE vh."districtId" = ?`;
      params.push(districtId);
    }
    query += ` ORDER BY ar.id DESC LIMIT ?`;
    params.push(5000);
    const ambulances = await db.all(query, params);

    let csv = 'Record ID,Type,Patient Name/ID,Location/Priority,Status,Date\n';

    ambulances.forEach(a => {
      csv += `AMB-${sanitizeCsvCell(a.id)},${sanitizeCsvCell(a.request_type || a.type || 'ambulance')},"${sanitizeCsvCell(a.name || 'User ' + a.user_id)}","${sanitizeCsvCell(a.location || '')} (${sanitizeCsvCell(a.priority || '')})",${sanitizeCsvCell(a.status)},${sanitizeCsvCell(a.created_at)}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('swasthai_admin_report.csv');
    return res.send(csv);
  } catch (err) {
    console.error('Report generation error:', err);
    sendError(res, 500, 'REPORT_FAILED', 'Failed to generate report');
  }
});

// Clusters protected by admin JWT or agent secret check
router.get('/clusters', async (req, res) => {
  const db = req.app.locals.db;
  const usingSQLite = req.app.locals.usingSQLite;

  const agentSecret = req.headers['x-agent-secret'];
  const isAgent = process.env.AGENT_SECRET && agentSecret === process.env.AGENT_SECRET;

  let isAuthedAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        isAuthedAdmin = true;
      }
    } catch (_) { }
  }

  if (!isAgent && !isAuthedAdmin) {
    return sendError(res, 403, 'FORBIDDEN', 'Forbidden');
  }

  const OUTBREAK_THRESHOLD = parseInt(process.env.OUTBREAK_THRESHOLD, 10) || 3;
  try {
    const rows = await db.all(
      usingSQLite
        ? `SELECT "villageId", COUNT(*) as count,
                  GROUP_CONCAT(symptoms, ' | ') as symptoms
           FROM symptoms
           WHERE "createdAt" >= datetime('now', '-1 day')
           GROUP BY "villageId"
           HAVING COUNT(*) >= ?
           ORDER BY count DESC`
        : `SELECT "villageId", COUNT(*) as count,
                  string_agg(symptoms, ' | ') as symptoms
           FROM symptoms
           WHERE "createdAt" >= NOW() - INTERVAL '1 day'
           GROUP BY "villageId"
           HAVING COUNT(*) >= ?
           ORDER BY count DESC`,
      [OUTBREAK_THRESHOLD]
    );
    res.send(rows);
  } catch (err) {
    sendError(res, 500, 'CLUSTERS_FAILED', err.message);
  }
});

router.post('/outbreak-alert', async (req, res) => {
  const db = req.app.locals.db;
  const agentSecret = req.headers['x-agent-secret'];
  const isAgent = process.env.AGENT_SECRET && agentSecret === process.env.AGENT_SECRET;

  let isAuthedAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        isAuthedAdmin = true;
      }
    } catch (_) { }
  }

  if (!isAgent && !isAuthedAdmin) {
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
    const districtId = await resolveDistrictId(db, villageId);

    await dynamoHelper.put('outbreak_telemetry', {
      villageId,
      districtId,
      detectedAt: timestamp,
      disease,
      classification: disease,
      action,
      confidence,
      caseCount,
      symptomPattern,
      source,
      severity: confidence >= 0.9 ? 'critical' : confidence >= 0.75 ? 'high' : 'medium',
      riskScore: Math.round(confidence * 100),
      traceId: req.traceId
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

    try {
      await dynamoHelper.updateNodeState(villageId, 'outbreak', timestamp, 0);
      console.log(`[OUTBREAK] ✅ Updated DynamoDB node state for village ${villageId} to outbreak`);
    } catch (nodeStateErr) {
      console.error(`[OUTBREAK] Failed to update DynamoDB node state: ${nodeStateErr.message}`);
    }

    if (typeof req.app.locals.broadcastToAdmins === 'function') {
      req.app.locals.broadcastToAdmins('outbreak', {
        villageId,
        districtId,
        disease,
        classification: disease,
        action,
        confidence,
        caseCount,
        riskScore: Math.round(confidence * 100),
        severity: confidence >= 0.9 ? 'critical' : confidence >= 0.75 ? 'high' : 'medium',
        detectedAt: timestamp,
        source,
        traceId: req.traceId
      });
    }

    console.log(`[OUTBREAK] ✅ ${disease} in ${villageId} → DynamoDB + SSE broadcast`);
    const storeType = dynamoHelper && dynamoHelper.isMock ? 'mock' : 'dynamodb';
    res.status(201).json({ status: 'stored', store: storeType, sseClients: adminSseClients.size });
  } catch (err) {
    console.error('[OUTBREAK] Error:', err.message);
    sendError(res, 500, 'OUTBREAK_STORAGE_FAILED', 'Failed to store outbreak alert', err.message);
  }
});

router.post('/outbreak', auth, checkRole(['admin']), logAudit('simulate', 'outbreak_telemetry'), async (req, res) => {
  const db = req.app.locals.db;
  const { villageId, disease, action, confidence, caseCount, symptomPattern } = req.body;

  const resolvedVillageId = villageId || 'VILLAGE_047';
  const resolvedDisease = disease || 'Simulated Cholera Outbreak';
  const resolvedAction = action || 'Simulated outbreak triggered by Admin. Dispatch medical kits and notify ASHA.';
  const resolvedConfidence = confidence !== undefined ? Number(confidence) : 0.95;
  const resolvedCaseCount = caseCount !== undefined ? Number(caseCount) : 8;
  const resolvedSymptomPattern = symptomPattern || 'Severe dehydration, vomiting, and acute watery diarrhea';

  const timestamp = new Date().toISOString();

  try {
    const districtId = await resolveDistrictId(db, resolvedVillageId);

    await dynamoHelper.put('outbreak_telemetry', {
      villageId: resolvedVillageId,
      districtId,
      detectedAt: timestamp,
      disease: resolvedDisease,
      classification: resolvedDisease,
      action: resolvedAction,
      confidence: resolvedConfidence,
      caseCount: resolvedCaseCount,
      symptomPattern: resolvedSymptomPattern,
      source: 'AdminSimulator',
      severity: resolvedConfidence >= 0.9 ? 'critical' : resolvedConfidence >= 0.75 ? 'high' : 'medium',
      riskScore: Math.round(resolvedConfidence * 100),
      traceId: req.traceId
    });

    try {
      await db.run(
        `INSERT INTO village_health ("villageId", "outbreakAlert", "lastUpdated")
         VALUES (?, ?, ?)
         ON CONFLICT("villageId") DO UPDATE
           SET "outbreakAlert" = excluded."outbreakAlert",
               "lastUpdated" = excluded."lastUpdated"`,
        [resolvedVillageId, `${resolvedDisease}: ${resolvedAction}`, timestamp]
      );
    } catch (auroraSyncErr) {
      console.warn(`[OUTBREAK] Aurora sync skipped: ${auroraSyncErr.message}`);
    }

    try {
      await dynamoHelper.updateNodeState(resolvedVillageId, 'outbreak', timestamp, 0);
      console.log(`[OUTBREAK SIMULATOR] ✅ Updated DynamoDB node state for village ${resolvedVillageId} to outbreak`);
    } catch (nodeStateErr) {
      console.error(`[OUTBREAK SIMULATOR] Failed to update DynamoDB node state: ${nodeStateErr.message}`);
    }

    if (typeof req.app.locals.broadcastToAdmins === 'function') {
      req.app.locals.broadcastToAdmins('outbreak', {
        villageId: resolvedVillageId,
        districtId,
        disease: resolvedDisease,
        classification: resolvedDisease,
        action: resolvedAction,
        confidence: resolvedConfidence,
        caseCount: resolvedCaseCount,
        riskScore: Math.round(resolvedConfidence * 100),
        severity: resolvedConfidence >= 0.9 ? 'critical' : resolvedConfidence >= 0.75 ? 'high' : 'medium',
        detectedAt: timestamp,
        source: 'AdminSimulator',
        traceId: req.traceId
      });
    }

    const storeType = dynamoHelper && dynamoHelper.isMock ? 'mock' : 'dynamodb';
    console.log(`[OUTBREAK SIMULATOR] ✅ ${resolvedDisease} in ${resolvedVillageId} -> ${storeType} + SSE broadcast`);
    res.status(201).json({ status: 'stored', store: storeType, sseBroadcast: true });
  } catch (err) {
    console.error('[OUTBREAK SIMULATOR] Error:', err.message);
    sendError(res, 500, 'OUTBREAK_SIMULATION_FAILED', 'Failed to store and broadcast simulated outbreak alert', err.message);
  }
});

router.get('/outbreaks-dynamo', async (req, res) => {
  const agentSecret = req.headers['x-agent-secret'];
  const isAgent = agentSecret === process.env.AGENT_SECRET;
  const authHeader = req.headers.authorization;
  let isAuthed = false;
  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET);
      if (decoded && ['admin', 'ngo'].includes(decoded.role)) {
        isAuthed = true;
      }
    } catch (_) { }
  }
  if (!isAgent && !isAuthed) return sendError(res, 403, 'FORBIDDEN', 'Forbidden');

  try {
    // Fix 1: queryRecentAll instead of unbounded scan — last 7 days with FilterExpression
    const daysBack = parseInt(req.query.days) || 7;
    const districtId = requestedDistrict(req);
    const outbreaks = await dynamoHelper.queryByDistrict('outbreak_telemetry', districtId, daysBack);
    outbreaks.sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''));
    const limit = parseInt(req.query.limit) || 20;
    res.json({ outbreaks: outbreaks.slice(0, limit), total: outbreaks.length, store: dynamoHelper.isMock ? 'mock' : 'dynamodb', daysBack, districtId, accessPattern: 'district-time-index' });
  } catch (err) {
    sendError(res, 500, 'DYNAMO_OUTBREAKS_FAILED', err.message);
  }
});

router.get('/outbreaks', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  try {
    // Fix 1: queryRecentAll instead of unbounded scan — last 7 days with FilterExpression
    const daysBack = parseInt(req.query.days) || 7;
    const districtId = requestedDistrict(req);
    const outbreaks = await dynamoHelper.queryByDistrict('outbreak_telemetry', districtId, daysBack);
    outbreaks.sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''));
    res.json({ outbreaks: outbreaks.slice(0, 20), store: dynamoHelper.isMock ? 'mock' : 'dynamodb', daysBack, districtId, accessPattern: 'district-time-index' });
  } catch (err) {
    sendError(res, 503, 'OUTBREAKS_TEMPORARILY_UNAVAILABLE', err.message);
  }
});

router.get('/disease-trends', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  try {
    const disease = req.query.disease;
    if (!disease) {
      return sendError(res, 400, 'BAD_REQUEST', 'Disease query parameter is required');
    }
    const daysBack = parseInt(req.query.days) || 7;
    const outbreaks = await dynamoHelper.queryByDisease('outbreak_telemetry', disease, daysBack);
    outbreaks.sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''));
    res.json({ disease, outbreaks, store: dynamoHelper.isMock ? 'mock' : 'dynamodb', daysBack });
  } catch (err) {
    sendError(res, 503, 'OUTBREAKS_TEMPORARILY_UNAVAILABLE', err.message);
  }
});

router.get('/dynamo-feed', auth, checkRole(['admin']), async (req, res) => {
  try {
    const daysBack = parseInt(req.query.days) || 7;
    const districtId = requestedDistrict(req);
    const [outbreaks, syncQueues, nodeStates, emergencies] = await Promise.all([
      dynamoHelper.queryByDistrict('outbreak_telemetry', districtId, daysBack),
      dynamoHelper.scan('sync_queues'),
      // Query all 10 shards of village_node_state via all-nodes-index GSI in parallel
      (async () => {
        const shardPromises = Array.from({ length: 10 }, (_, i) =>
          dynamoHelper.query('village_node_state', '#gpk = :pk', { ':pk': `node_state_all#${i}` }, 'all-nodes-index', { ExpressionAttributeNames: { '#gpk': '_gsiPk' } }).catch(() => [])
        );
        return (await Promise.all(shardPromises)).flat();
      })(),
      dynamoHelper.queryEmergenciesByDistrictDate(districtId, daysBack),
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
      districtId,
      daysBack,
      accessPattern: 'outbreak_telemetry.district-time-index + emergency_streams.district-date-index',
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
    const payload = villages.map((v, index) => {
      const symptoms = symptomMap[v.villageId] || 0;
      const malnut = parseInt(v.malnutrition_cases || 0);
      const highRiskVal = highRiskMap[v.villageId] || 0;
      const hasAlert = v.outbreakAlert ? 1 : 0;
      const rawScore = symptoms * 5 + malnut * 3 + highRiskVal * 4 + hasAlert * 20;
      const outbreakScore = Math.min(Math.round(rawScore), 100);

      // Deterministic lat/lng centered around Varanasi matching getVillageCoords in frontend
      const VILLAGE_COORDS = {
        v101: [25.3300, 82.9500],
        v102: [25.3500, 83.0200],
        v103: [25.2900, 82.9800],
        v104: [25.3100, 82.9200],
        v105: [25.3400, 83.0800],
      };
      let lat, lng;
      if (VILLAGE_COORDS[v.villageId]) {
        [lat, lng] = VILLAGE_COORDS[v.villageId];
      } else {
        const hash = Array.from(v.villageId || 'unknown').reduce((a, c) => a + c.charCodeAt(0), 0);
        lat = 25.28 + (hash % 100) / 1000 + (index % 3) * 0.02;
        lng = 82.90 + (hash % 150) / 1000 + Math.floor(index / 3) * 0.02;
      }

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
  villageId: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  population: z.coerce.number().int().nonnegative(),
  pregnant_women: z.coerce.number().int().nonnegative().optional().default(0),
  children_under_5: z.coerce.number().int().nonnegative().optional().default(0),
  malnutrition_cases: z.coerce.number().int().nonnegative().optional().default(0),
  asha_contact: z.string().max(20).optional().default(''),
});

router.post('/village-bulk-upload',
  auth, checkRole(['admin']), logAudit('bulk_upload', 'village_health'),
  express.text({ type: ['text/csv', 'text/plain'], limit: '1mb' }),
  async (req, res) => {
    const db = req.app.locals.db;
    const userId = req.user.id;
    const filename = req.headers['x-filename'] || 'upload.csv';

    // Support both raw-CSV body and JSON {rows:[]} body
    let rawRows = [];
    if (typeof req.body === 'string') {
      const lines = req.body.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return sendError(res, 400, 'INVALID_CSV', 'CSV must have a header row and at least one data row');

      const EXPECTED_HEADERS = ['villageId', 'name', 'population', 'pregnant_women', 'children_under_5', 'malnutrition_cases', 'asha_contact'];
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      // Validate required columns present
      const missing = ['villageId', 'name', 'population'].filter(h => !headers.includes(h));
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
    let skipped = 0;
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
router.get('/district-report', auth, checkRole(['admin']), logAudit('export_report', 'district_monthly_report'), async (req, res) => {
  const db = req.app.locals.db;
  const usingSQLite = req.app.locals.usingSQLite;
  const format = (req.query.format || 'json').toLowerCase();

  // Parse optional month filter (default: current month)
  const monthParam = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const monthStart = `${monthParam}-01`;
  const monthEnd = `${monthParam}-31`;

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
      const monthEnd = `${monthParam}-31T23:59:59.999Z`;
      const raw = await dynamoHelper.queryByDistrict('outbreak_telemetry', process.env.DISTRICT_NAME || 'district_main', 60);
      outbreaks = (raw || []).filter(o => {
        const ts = o.detectedAt || '';
        return ts >= monthStart && ts <= monthEnd;
      });
    } catch (_) { }

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
        state: process.env.STATE_NAME || 'Maharashtra',
      },
      villages: {
        total: villages.length,
        totalPop: villages.reduce((s, v) => s + (v.population || 0), 0),
        withAlerts: villages.filter(v => v.outbreakAlert).length,
        list: villages.map(v => ({
          villageId: v.villageId,
          name: v.name,
          population: v.population,
          pregnantWomen: v.pregnant_women,
          malnutritionCases: v.malnutrition_cases,
          outbreakAlert: v.outbreakAlert || null,
        })),
      },
      maternal: {
        totalPregnancies: parseInt(pregnancyStats?.total || 0),
        highRiskPregnancies: parseInt(pregnancyStats?.high_risk || 0),
      },
      malnutrition: {
        totalScreened: parseInt(malnutStats?.total || 0),
        abnormalCases: parseInt(malnutStats?.abnormal || 0),
      },
      emergencies: {
        ambulanceRequests: parseInt(ambStats?.total || 0),
        resolved: parseInt(ambStats?.completed || 0),
      },
      referrals: {
        total: parseInt(referralStats?.total || 0),
        completed: parseInt(referralStats?.completed || 0),
      },
      symptoms: {
        reportedThisMonth: parseInt(symptomTotal?.cnt || symptomTotal?.count || 0),
      },
      outbreakAlerts: {
        count: outbreaks.length,
        events: outbreaks.slice(0, 10),
      },
    };

    if (format === 'csv') {
      // Flatten top-level metrics into a single-row CSV
      const headers = ['Month', 'District', 'State', 'Villages', 'TotalPop', 'WithAlerts', 'TotalPregnancies', 'HighRisk',
        'MalnutritionCases', 'AmbulanceReqs', 'AmbulanceResolved', 'ReferralsTotal', 'ReferralsDone',
        'SymptomsReported', 'OutbreakAlerts', 'GeneratedAt'];
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

router.get('/live-feed', async (req, res) => {
  let decoded;
  try {
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const queryToken = req.query.token;
    const cookieToken = req.cookies?.token;
    // Token priority: Authorization header > cookie > query param
    // Query param kept only as last-resort fallback for environments where
    // EventSource cannot set headers/cookies. In production, use WebSocket
    // or a short-lived session cookie instead.
    const token = headerToken || cookieToken || queryToken;
    if (!token) return sendError(res, 401, 'AUTH_REQUIRED', 'Auth Required');
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return sendError(res, 403, 'ADMIN_ACCESS_ONLY', 'Admin access only');
  } catch (_) {
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid Token');
  }

  const db = req.app.locals.db;
  let userVillageId = null;
  let userDistrictId = null;
  try {
    const user = await db.get('SELECT "villageId", role FROM users WHERE id = ?', [decoded.id]);
    if (user) {
      userVillageId = user.villageId;
      if (userVillageId) {
        userDistrictId = await resolveDistrictId(db, userVillageId);
      }
    }
  } catch (dbErr) {
    console.warn('[SSE AUTH] Failed to retrieve user details from DB:', dbErr.message);
  }

  // Max SSE client cap & stale client eviction
  if (adminSseClients.size >= MAX_SSE_CLIENTS) {
    const oldestClientId = adminSseClients.keys().next().value;
    const oldestClientObj = adminSseClients.get(oldestClientId);
    try {
      oldestClientObj.res.write('event: evicted\ndata: connection closed due to client limit\n\n');
      oldestClientObj.res.end();
    } catch (_) { }
    adminSseClients.delete(oldestClientId);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = `admin-${decoded.id}-${Date.now()}`;
  adminSseClients.set(clientId, { res, userId: decoded.id, role: decoded.role, villageId: userVillageId, districtId: userDistrictId });
  console.log(`[SSE] Admin ${decoded.id} connected (${adminSseClients.size} total)`);

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  const activeAlerts = req.app.locals.serviceAlerts || {};
  Object.entries(activeAlerts).forEach(([service, message]) => {
    res.write(`event: service-alert\ndata: ${JSON.stringify({ service, status: 'down', message, timestamp: new Date().toISOString() })}\n\n`);
  });

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

// GET /asha-performance — ASHA worker KPIs for CMO Dashboard
router.get('/asha-performance', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const query = `
      SELECT 
        u.id as asha_id,
        u.name,
        u.phone,
        u."villageId",
        COALESCE(ap.month, 'overall') as month,
        COALESCE(ap.referrals_count, (SELECT COUNT(*) FROM referrals WHERE referred_by = u.id)) as referrals_count,
        COALESCE(ap.pregnancies_tracked, (SELECT COUNT(*) FROM pregnancy_data WHERE recorded_by = u.id)) as pregnancies_tracked,
        COALESCE(ap.vaccinations_completed, (SELECT COUNT(*) FROM vaccination_records WHERE recorded_by = u.id AND status = 'given')) as vaccinations_completed,
        COALESCE(ap.emergencies_reported, (SELECT COUNT(*) FROM ambulance_requests WHERE user_id = u.id AND type = 'emergency')) as emergencies_reported
      FROM users u
      LEFT JOIN asha_performance ap ON u.id = ap.asha_id
      WHERE u.role = 'ngo'
    `;
    const performanceData = await db.all(query);
    res.json({ success: true, performance: performanceData });
  } catch (err) {
    console.error('[PERFORMANCE] Fetch error:', err.message);
    sendError(res, 500, 'PERFORMANCE_FETCH_FAILED', err.message);
  }
});

// GET /district-config/:id — Fetch specific district configurations
router.get('/district-config/:id', auth, checkRole(['admin', 'ngo']), async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  try {
    const config = await db.get('SELECT * FROM district_config WHERE district_id = ?', [id]);
    if (!config) {
      return res.json({
        success: true,
        config: {
          district_id: id,
          outbreak_threshold: 3,
          enable_auto_ambulance: true,
          emergency_contact_phone: null
        }
      });
    }
    config.enable_auto_ambulance = !!config.enable_auto_ambulance;
    res.json({ success: true, config });
  } catch (err) {
    sendError(res, 500, 'CONFIG_FETCH_FAILED', err.message);
  }
});

// PUT /district-config/:id — Update specific district configurations
router.put('/district-config/:id', auth, checkRole(['admin']), logAudit('update', 'district_config'), async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { outbreak_threshold, enable_auto_ambulance, emergency_contact_phone } = req.body;

  try {
    await db.run(
      `INSERT INTO district_config (district_id, outbreak_threshold, enable_auto_ambulance, emergency_contact_phone)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(district_id) DO UPDATE SET
         outbreak_threshold = EXCLUDED.outbreak_threshold,
         enable_auto_ambulance = EXCLUDED.enable_auto_ambulance,
         emergency_contact_phone = EXCLUDED.emergency_contact_phone,
         updated_at = CURRENT_TIMESTAMP`,
      [id, outbreak_threshold !== undefined ? Number(outbreak_threshold) : 3, enable_auto_ambulance ? 1 : 0, emergency_contact_phone || null]
    );

    res.json({ success: true, message: `District configurations for ${id} updated.` });
  } catch (err) {
    sendError(res, 500, 'CONFIG_UPDATE_FAILED', err.message);
  }
});

// GET /audit-logs — Fetch audit logs list (restricted to admins)
router.get('/audit-logs', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (Math.max(parseInt(req.query.page) || 1, 1) - 1) * limit;

  try {
    const [logs, totalRow] = await Promise.all([
      db.all(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]),
      db.get(`SELECT COUNT(*) as total FROM audit_logs`)
    ]);
    res.json({ success: true, logs, count: totalRow?.total || 0 });
  } catch (err) {
    sendError(res, 500, 'AUDIT_LOGS_FETCH_FAILED', err.message);
  }
});

// GET /outbreaks/disease-search — Query outbreaks by disease GSI (disease-index)
router.get('/outbreaks/disease-search', auth, checkRole(['admin']), async (req, res) => {
  const { disease, days = 7 } = req.query;
  if (!disease) {
    return sendError(res, 400, 'MISSING_DISEASE', 'disease query parameter is required.');
  }

  const cutoff = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
  try {
    const outbreaks = await dynamoHelper.query(
      'outbreak_telemetry',
      'disease = :disease AND detectedAt >= :cutoff',
      { ':disease': disease, ':cutoff': cutoff },
      'disease-index'
    );
    res.json({ success: true, count: outbreaks.length, outbreaks });
  } catch (err) {
    sendError(res, 500, 'GSI_QUERY_FAILED', err.message);
  }
});

router.get('/dlq', auth, checkRole(['admin']), (req, res) => {
  try {
    if (fs.existsSync(DLQ_PATH)) {
      const raw = fs.readFileSync(DLQ_PATH, 'utf8');
      const dlq = JSON.parse(raw);
      return res.json({ success: true, dlq });
    }
    return res.json({ success: true, dlq: [] });
  } catch (err) {
    sendError(res, 500, 'DLQ_FETCH_FAILED', err.message);
  }
});

// ── PREDICTIVE DISTRICT RISK HEATMAP ────────────────────────────────────────────
// Shared seasonal risk calendar (same logic as ngo.js risk engine — pure fn, no circular dep)
function _getSeasonalScore(month) {
  const calendar = { 1: 12, 2: 8, 3: 10, 4: 18, 5: 20, 6: 28, 7: 32, 8: 30, 9: 25, 10: 22, 11: 15, 12: 14 };
  return calendar[month] || 10;
}
function _getRiskLevel(score) {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH';
  if (score >= 31) return 'MEDIUM';
  return 'LOW';
}
function _getRiskColor(level) {
  return { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#22C55E' }[level] || '#22C55E';
}
function _computeVillageScore({ symptomCount7d, symptomCount14d, openReferralsCount, nearbyOutbreakCount, month }) {
  const prevWindow = Math.max(symptomCount14d - symptomCount7d, 0);
  let symptomScore = 0;
  if (prevWindow > 0) {
    const gr = (symptomCount7d - prevWindow) / prevWindow;
    if (gr > 1.5) symptomScore = 40;
    else if (gr > 1.0) symptomScore = 32;
    else if (gr > 0.5) symptomScore = 22;
    else if (gr > 0.2) symptomScore = 14;
    else if (gr > 0) symptomScore = 8;
  } else if (symptomCount7d > 5) { symptomScore = 14; }

  let outbreakScore = 0;
  if (nearbyOutbreakCount >= 3) outbreakScore = 25;
  else if (nearbyOutbreakCount === 2) outbreakScore = 18;
  else if (nearbyOutbreakCount === 1) outbreakScore = 10;

  const seasonalScore = Math.round((_getSeasonalScore(month) / 32) * 20);

  let referralScore = 0;
  if (openReferralsCount >= 10) referralScore = 15;
  else if (openReferralsCount >= 6) referralScore = 11;
  else if (openReferralsCount >= 3) referralScore = 7;
  else if (openReferralsCount >= 1) referralScore = 3;

  const total = Math.min(100, symptomScore + outbreakScore + seasonalScore + referralScore);
  return { riskScore: total, riskLevel: _getRiskLevel(total), riskColor: _getRiskColor(_getRiskLevel(total)), symptomScore, outbreakScore, seasonalScore, referralScore };
}

// GET /api/admin/district-risk-heatmap
router.get('/district-risk-heatmap', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day7ago = new Date(now - 7 * 86400000).toISOString();
    const day14ago = new Date(now - 14 * 86400000).toISOString();

    // Get all villages
    const villages = await db.all(`SELECT "villageId", name, population, "outbreakAlert" FROM village_health ORDER BY name`).catch(() => []);

    // Get global nearby outbreak count (district-wide)
    const globalOutbreakCount = villages.filter(v => v.outbreakAlert).length;

    // Batch compute risk for each village
    const villageRisks = await Promise.all(villages.map(async (v) => {
      try {
        const [sym7, sym14, refRow] = await Promise.all([
          db.get(`SELECT COUNT(*) AS cnt FROM symptoms WHERE "villageId" = ? AND "createdAt" >= ?`, [v.villageId, day7ago]).catch(() => ({ cnt: 0 })),
          db.get(`SELECT COUNT(*) AS cnt FROM symptoms WHERE "villageId" = ? AND "createdAt" >= ?`, [v.villageId, day14ago]).catch(() => ({ cnt: 0 })),
          db.get(`SELECT COUNT(*) AS cnt FROM referrals WHERE "villageId" = ? AND status IN ('pending', 'assigned')`, [v.villageId]).catch(() => ({ cnt: 0 })),
        ]);

        const nearbyCount = Math.max(0, globalOutbreakCount - (v.outbreakAlert ? 1 : 0));
        const computed = _computeVillageScore({
          symptomCount7d: Number(sym7?.cnt || 0),
          symptomCount14d: Number(sym14?.cnt || 0),
          openReferralsCount: Number(refRow?.cnt || 0),
          nearbyOutbreakCount: nearbyCount,
          month
        });

        return {
          villageId: v.villageId,
          village: v.name || v.villageId,
          population: v.population || 0,
          hasActiveOutbreak: !!v.outbreakAlert,
          ...computed,
          dataPoints: {
            symptomCount7d: Number(sym7?.cnt || 0),
            openReferralsCount: Number(refRow?.cnt || 0),
          }
        };
      } catch (_) {
        return {
          villageId: v.villageId,
          village: v.name || v.villageId,
          population: v.population || 0,
          riskScore: 10,
          riskLevel: 'LOW',
          riskColor: '#22C55E',
          hasActiveOutbreak: false
        };
      }
    }));

    // Sort by risk score descending
    villageRisks.sort((a, b) => b.riskScore - a.riskScore);

    // District aggregate summary
    const criticalCount = villageRisks.filter(v => v.riskLevel === 'CRITICAL').length;
    const highCount = villageRisks.filter(v => v.riskLevel === 'HIGH').length;
    const mediumCount = villageRisks.filter(v => v.riskLevel === 'MEDIUM').length;
    const lowCount = villageRisks.filter(v => v.riskLevel === 'LOW').length;
    const avgScore = villageRisks.length > 0 ? Math.round(villageRisks.reduce((s, v) => s + v.riskScore, 0) / villageRisks.length) : 0;
    const highestRisk = villageRisks[0] || null;

    res.json({
      success: true,
      data: {
        villages: villageRisks,
        summary: { criticalCount, highCount, mediumCount, lowCount, avgScore, totalVillages: villageRisks.length, highestRisk: highestRisk?.village || 'N/A', highestRiskScore: highestRisk?.riskScore || 0 },
        generatedAt: now.toISOString()
      }
    });
  } catch (err) {
    console.error('[DISTRICT RISK HEATMAP] Error:', err.message);
    sendError(res, 500, 'HEATMAP_FAILED', 'Failed to compute district risk heatmap.');
  }
});

// GET /api/admin/village-risk/:villageId — single village risk (admin, unscoped)
router.get('/village-risk/:villageId', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  const { villageId } = req.params;
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day7ago = new Date(now - 7 * 86400000).toISOString();
    const day14ago = new Date(now - 14 * 86400000).toISOString();

    const [sym7, sym14, refRow, village, outbreakRow] = await Promise.all([
      db.get(`SELECT COUNT(*) AS cnt FROM symptoms WHERE "villageId" = ? AND "createdAt" >= ?`, [villageId, day7ago]).catch(() => ({ cnt: 0 })),
      db.get(`SELECT COUNT(*) AS cnt FROM symptoms WHERE "villageId" = ? AND "createdAt" >= ?`, [villageId, day14ago]).catch(() => ({ cnt: 0 })),
      db.get(`SELECT COUNT(*) AS cnt FROM referrals WHERE "villageId" = ? AND status IN ('pending', 'assigned')`, [villageId]).catch(() => ({ cnt: 0 })),
      db.get(`SELECT name, population FROM village_health WHERE "villageId" = ?`, [villageId]).catch(() => null),
      db.get(`SELECT COUNT(*) AS cnt FROM village_health WHERE "outbreakAlert" IS NOT NULL AND "villageId" != ?`, [villageId]).catch(() => ({ cnt: 0 })),
    ]);

    const computed = _computeVillageScore({
      symptomCount7d: Number(sym7?.cnt || 0),
      symptomCount14d: Number(sym14?.cnt || 0),
      openReferralsCount: Number(refRow?.cnt || 0),
      nearbyOutbreakCount: Number(outbreakRow?.cnt || 0),
      month
    });

    const baseScore = computed.riskScore;
    const interventionForecast = {
      current: baseScore,
      afterVaccinationDrive: Math.max(0, baseScore - 12),
      afterReferralClosure: Math.max(0, baseScore - Math.round(computed.referralScore * 0.8 || 8)),
      afterCombinedInterventions: Math.max(0, baseScore - 22)
    };

    res.json({
      success: true,
      data: {
        village: village?.name || villageId,
        villageId,
        population: village?.population || 0,
        ...computed,
        interventionForecast,
        dataPoints: { symptomCount7d: Number(sym7?.cnt || 0), symptomCount14d: Number(sym14?.cnt || 0), openReferralsCount: Number(refRow?.cnt || 0), nearbyOutbreakCount: Number(outbreakRow?.cnt || 0) },
        generatedAt: now.toISOString()
      }
    });
  } catch (err) {
    console.error('[VILLAGE RISK DETAIL] Error:', err.message);
    sendError(res, 500, 'VILLAGE_RISK_FAILED', 'Failed to compute village risk score.');
  }
});

export default router;


import express from 'express';
import axios from 'axios';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { checkRole, enforceVillageScope, enforceReferralAccess, enforceAmbulanceAccess } from '../middleware/policy.js';
import { logAudit } from '../middleware/audit.js';
import eventEmitter from '../eventDispatcher.js';
import { PregnancyRiskSchema, MalnutritionSchema, validateAiOutput } from '../utils/aiValidator.js';

const router = express.Router();

const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

const cleanClientRequestId = (value) => {
  const cleaned = sanitize(value);
  return typeof cleaned === 'string' && cleaned.length > 0 ? cleaned.slice(0, 120) : null;
};

router.get('/maternal', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = (parseInt(req.query.page || 1) - 1) * limit;
    let records;
    if (req.user.role !== 'admin') {
      const villageId = req.user.villageId || 'unassigned';
      records = await db.all('SELECT * FROM pregnancy_data WHERE "villageId" = ? ORDER BY id DESC LIMIT ? OFFSET ?', [villageId, limit, offset]);
    } else {
      records = await db.all('SELECT * FROM pregnancy_data ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset]);
    }
    res.send(records);
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch maternal records.' });
  }
});

router.get('/malnutrition', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = (parseInt(req.query.page || 1) - 1) * limit;
    let records;
    if (req.user.role !== 'admin') {
      const villageId = req.user.villageId || 'unassigned';
      records = await db.all(
        'SELECT id, "childName", "ageMonths", weight, height, status, "villageId" FROM malnutrition_data WHERE "villageId" = ? ORDER BY id DESC LIMIT ? OFFSET ?',
        [villageId, limit, offset]
      );
    } else {
      records = await db.all(
        'SELECT id, "childName", "ageMonths", weight, height, status, "villageId" FROM malnutrition_data ORDER BY id DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
    }
    res.send(records);
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch malnutrition records.' });
  }
});

router.post('/village', auth, checkRole(['ngo', 'admin']), enforceVillageScope, async (req, res) => {
  const db = req.app.locals.db;
  const { villageId, name, population, pregnant, children, malnutrition, contact } = req.body;
  try {
    await db.run(
      `INSERT INTO village_health ("villageId", name, population, pregnant_women, children_under_5, malnutrition_cases, asha_contact)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT("villageId") DO UPDATE SET
         name = EXCLUDED.name,
         population = EXCLUDED.population,
         pregnant_women = EXCLUDED.pregnant_women,
         children_under_5 = EXCLUDED.children_under_5,
         malnutrition_cases = EXCLUDED.malnutrition_cases,
         asha_contact = EXCLUDED.asha_contact`,
      [villageId, name, population, pregnant, children, malnutrition, contact]
    );
    res.send({ status: 'Updated Node Axis.' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to update village info.' });
  }
});

router.post('/maternal', auth, checkRole(['ngo', 'admin']), logAudit('create', 'pregnancy_data'), async (req, res) => {
  const db = req.app.locals.db;
  const AI_SERVICE_URL = req.app.locals.AI_SERVICE_URL;
  const { name, age, trimester, dueDate, vitals } = req.body;
  const clientRequestId = cleanClientRequestId(req.body.clientRequestId);

  if (!name || !age || !trimester) {
    return res.status(400).send({ error: 'Name, age, and trimester are required.' });
  }
  if (age < 10 || age > 60) {
    return res.status(400).send({ error: 'Age must be between 10 and 60.' });
  }
  if (![1, 2, 3].includes(Number(trimester))) {
    return res.status(400).send({ error: 'Trimester must be 1, 2, or 3.' });
  }

  const villageId = req.user.villageId || 'unassigned';
  const patientVitals = vitals || { systolic_bp: 120, diastolic_bp: 80, bs: 5.0, body_temp: 98, heart_rate: 75 };

  if (clientRequestId) {
    const existing = await db.get(
      'SELECT id, "riskLevel", "villageId" FROM pregnancy_data WHERE client_request_id = ?',
      [clientRequestId]
    );
    if (existing) {
      return res.send({
        riskLevel: existing.riskLevel,
        villageId: existing.villageId,
        recordId: existing.id,
        duplicate: true,
        clientRequestId
      });
    }
  }

  let riskLevel;
  try {
    const ai = await axios.post(`${AI_SERVICE_URL}/predict/pregnancy_risk`, { age, ...patientVitals }, { headers: { 'x-trace-id': req.traceId }, timeout: 5000 });
    const validated = validateAiOutput(PregnancyRiskSchema, ai.data, 'Pregnancy Risk AI Output');
    riskLevel = validated.risk_level;
  } catch (err) {
    console.warn('[NGO MATERNAL] AI Service failed or timed out — applying local clinical fallback:', err.message);
    // Local clinical fallback logic
    let score = 0;
    if (patientVitals.systolic_bp >= 140 || patientVitals.diastolic_bp >= 90) score += 3;
    if (patientVitals.bs >= 7.8) score += 3;
    if (age < 18 || age > 35) score += 2;
    riskLevel = score >= 5 ? 'High Risk' : score >= 3 ? 'Medium Risk' : 'Low Risk';
  }
  const saved = await db.run(
    'INSERT INTO pregnancy_data (name, age, trimester, "dueDate", "riskLevel", "villageId", recorded_by, client_request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, age, trimester, dueDate, riskLevel, villageId, req.user.id, clientRequestId]
  );
  if (String(riskLevel || '').toLowerCase().includes('high')) {
    eventEmitter.emit('maternal_alert', { name, age, villageId, riskLevel, vitals: patientVitals, timestamp: new Date().toISOString(), traceId: req.traceId });
  }
  res.send({ riskLevel, villageId, recordId: saved.lastID, clientRequestId });
});

router.post('/malnutrition', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  const AI_SERVICE_URL = req.app.locals.AI_SERVICE_URL;
  const { name, age, weight, height } = req.body;
  const clientRequestId = cleanClientRequestId(req.body.clientRequestId);

  if (!name || !age || !weight || !height) {
    return res.status(400).send({ error: 'Name, age, weight, and height are all required.' });
  }
  if (age < 0 || age > 60) {
    return res.status(400).send({ error: 'Age in months must be between 0 and 60.' });
  }
  if (weight < 1 || weight > 30) {
    return res.status(400).send({ error: 'Weight must be between 1 and 30 kg for children under 5.' });
  }
  if (height < 30 || height > 130) {
    return res.status(400).send({ error: 'Height must be between 30 and 130 cm.' });
  }

  const villageId = req.user.villageId || 'unassigned';
  if (clientRequestId) {
    const existing = await db.get(
      'SELECT id, status, "villageId" FROM malnutrition_data WHERE client_request_id = ?',
      [clientRequestId]
    );
    if (existing) {
      return res.send({
        status: existing.status,
        villageId: existing.villageId,
        recordId: existing.id,
        duplicate: true,
        clientRequestId
      });
    }
  }

  let status, bmi, action;
  try {
    const ai = await axios.post(`${AI_SERVICE_URL}/predict/malnutrition`, { age_months: age, weight_kg: weight, height_cm: height }, { headers: { 'x-trace-id': req.traceId }, timeout: 5000 });
    const validated = validateAiOutput(MalnutritionSchema, ai.data, 'Malnutrition AI Output');
    status = validated.status;
    bmi = validated.bmi;
    action = validated.action;
  } catch (err) {
    console.warn('[NGO MALNUTRITION] AI Service failed or timed out — applying local clinical fallback:', err.message);
    // Local clinical fallback logic
    const heightM = height / 100;
    bmi = Number((weight / (heightM * heightM)).toFixed(2));
    status = bmi < 15 ? 'Moderate Acute Malnutrition' : 'Normal';
    action = status === 'Normal' ? 'Healthy growth.' : 'Consult ASHA worker for supplementary nutrition.';
  }
  const saved = await db.run(
    'INSERT INTO malnutrition_data ("childName", "ageMonths", weight, height, status, "villageId", client_request_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, age, weight, height, status, villageId, clientRequestId]
  );
  res.send({ status, bmi, action, villageId, recordId: saved.lastID, clientRequestId });
});

router.get('/ambulances', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = (parseInt(req.query.page || 1) - 1) * limit;
    let rows;
    if (req.user.role !== 'admin') {
      const villageId = req.user.villageId || 'unassigned';
      rows = await db.all("SELECT * FROM ambulance_requests WHERE request_type = 'ambulance' AND location = ? ORDER BY id DESC LIMIT ? OFFSET ?", [villageId, limit, offset]);
    } else {
      rows = await db.all("SELECT * FROM ambulance_requests WHERE request_type = 'ambulance' ORDER BY id DESC LIMIT ? OFFSET ?", [limit, offset]);
    }
    res.send(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to fetch ambulance requests.' });
  }
});

router.get('/pads', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = (parseInt(req.query.page || 1) - 1) * limit;
    let rows;
    if (req.user.role !== 'admin') {
      const villageId = req.user.villageId || 'unassigned';
      rows = await db.all("SELECT * FROM ambulance_requests WHERE request_type = 'pad_request' AND location = ? ORDER BY id DESC LIMIT ? OFFSET ?", [villageId, limit, offset]);
    } else {
      rows = await db.all("SELECT * FROM ambulance_requests WHERE request_type = 'pad_request' ORDER BY id DESC LIMIT ? OFFSET ?", [limit, offset]);
    }
    res.send(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to fetch pad requests.' });
  }
});

router.put('/ambulances/:id/status', auth, checkRole(['ngo', 'admin']), enforceAmbulanceAccess, async (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.body;
  const validStatuses = ['pending', 'assigned', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).send({ error: 'Invalid status value.' });
  }
  try {
    await db.run('UPDATE ambulance_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.send({ success: true, status });
  } catch (err) {
    res.status(500).send({ error: 'Failed to update status.' });
  }
});

// ── ASHA REFERRAL ─────────────────────────────────────────────────────────────
const referralSchema = z.object({
  patient_name:  z.string().min(1).max(120),
  patient_phone: z.string().regex(/^\+?[0-9]{7,15}$/).optional(),
  referred_to:   z.string().min(1).max(120),           // e.g. 'PHC Ambegaon', 'Civil Hospital Pune'
  reason:        z.string().min(3).max(500),
  priority:      z.enum(['routine', 'urgent', 'emergency']).default('routine'),
  notes:         z.string().max(1000).optional(),
});

// POST /api/ngo/referral — ASHA submits a patient referral
router.post('/referral', auth, checkRole(['ngo', 'admin']), logAudit('create', 'referrals'), async (req, res) => {
  const db = req.app.locals.db;
  const parsed = referralSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid referral data', details: parsed.error.errors }
    });
  }

  const { patient_name, patient_phone, referred_to, reason, priority, notes } = parsed.data;
  const villageId   = req.user.villageId || 'unassigned';
  const referred_by = req.user.id;

  try {
    const result = await db.run(
      `INSERT INTO referrals (patient_name, patient_phone, "villageId", referred_by, referred_to, reason, priority, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [patient_name, patient_phone || null, villageId, referred_by, referred_to, reason, priority, notes || null]
    );

    res.status(201).json({
      success: true,
      referralId: result.lastID,
      message: `Referral for ${patient_name} to ${referred_to} recorded.`,
      data: { patient_name, referred_to, priority, villageId, status: 'pending' }
    });
  } catch (err) {
    console.error('[REFERRAL] Insert error:', err.message);
    res.status(500).json({ success: false, error: { code: 'REFERRAL_FAILED', message: 'Failed to create referral' } });
  }
});

// GET /api/ngo/referrals — list referrals with keyset pagination
router.get('/referrals', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db     = req.app.locals.db;
  const limit  = Math.min(parseInt(req.query.limit) || 50, 100);
  const lastId = parseInt(req.query.lastId) || null;
  const status = req.query.status;  // optional filter

  try {
    let baseQuery = 'WHERE 1=1';
    const params = [];

    if (req.user.role !== 'admin') {
      baseQuery += ' AND "villageId" = ?';
      params.push(req.user.villageId || 'unassigned');
    }

    if (status) {
      baseQuery += ' AND status = ?';
      params.push(status);
    }

    if (lastId) {
      baseQuery += ' AND id < ?';
      params.push(lastId);
    }

    params.push(limit);

    const rows = await db.all(
      `SELECT * FROM referrals ${baseQuery} ORDER BY id DESC LIMIT ?`,
      params
    );
    res.json({ referrals: rows, count: rows.length, nextLastId: rows.length === limit ? rows[rows.length - 1]?.id : null });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'REFERRALS_FETCH_FAILED', message: err.message } });
  }
});

// PATCH /api/ngo/referrals/:id/status — update referral status
const VALID_REFERRAL_STATUSES = ['pending', 'accepted', 'in_transit', 'completed', 'cancelled'];
router.patch('/referrals/:id/status', auth, checkRole(['ngo', 'admin']), enforceReferralAccess, async (req, res) => {
  const db     = req.app.locals.db;
  const { status } = req.body;
  if (!VALID_REFERRAL_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: `Status must be one of: ${VALID_REFERRAL_STATUSES.join(', ')}` } });
  }
  try {
    await db.run(`UPDATE referrals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, req.params.id]);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'REFERRAL_UPDATE_FAILED', message: err.message } });
  }
});

// PUT /referrals/:id/outcome and PUT /referral/:id/outcome — close referral loop
const handleReferralOutcome = async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { outcome, outcome_details, status = 'completed' } = req.body;

  if (!outcome) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Outcome is required.' } });
  }

  try {
    const closedAt = new Date().toISOString();
    await db.run(
      `UPDATE referrals 
       SET outcome = ?, outcome_details = ?, status = ?, closed_at = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [outcome, outcome_details || null, status, closedAt, id]
    );

    res.json({ success: true, message: 'Referral outcome recorded successfully.', data: { id, outcome, outcome_details, status, closed_at: closedAt } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'REFERRAL_OUTCOME_FAILED', message: err.message } });
  }
};

router.put('/referral/:id/outcome', auth, checkRole(['ngo', 'admin']), enforceReferralAccess, logAudit('update_outcome', 'referrals'), handleReferralOutcome);
router.put('/referrals/:id/outcome', auth, checkRole(['ngo', 'admin']), enforceReferralAccess, logAudit('update_outcome', 'referrals'), handleReferralOutcome);

// POST /vaccinations — register child vaccination record
router.post('/vaccinations', auth, checkRole(['ngo', 'admin']), enforceVillageScope, logAudit('create', 'vaccination_records'), async (req, res) => {
  const db = req.app.locals.db;
  const { child_name, parent_phone, vaccine_name, scheduled_date, given_date, status = 'scheduled', villageId } = req.body;

  if (!child_name || !vaccine_name) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'child_name and vaccine_name are required.' } });
  }

  const userVillageId = req.user.role === 'admin' ? (villageId || 'unassigned') : (req.user.villageId || 'unassigned');
  const recordedBy = req.user.id;

  try {
    const result = await db.run(
      `INSERT INTO vaccination_records (child_name, parent_phone, vaccine_name, scheduled_date, given_date, status, "villageId", recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [child_name, parent_phone || null, vaccine_name, scheduled_date || null, given_date || null, status, userVillageId, recordedBy]
    );

    res.status(201).json({
      success: true,
      vaccinationId: result.lastID,
      message: `Vaccination record for ${child_name} registered successfully.`
    });
  } catch (err) {
    console.error('[VACCINATION] Insert error:', err.message);
    res.status(500).json({ success: false, error: { code: 'VACCINATION_FAILED', message: 'Failed to record vaccination' } });
  }
});

// GET /vaccinations — fetch child vaccination list with query filters
router.get('/vaccinations', auth, checkRole(['ngo', 'admin']), enforceVillageScope, async (req, res) => {
  const db = req.app.locals.db;
  const { villageId, status, child_name, limit = 50, page = 1 } = req.query;
  const parsedLimit = Math.min(parseInt(limit) || 50, 100);
  const offset = (Math.max(parseInt(page) || 1, 1) - 1) * parsedLimit;

  try {
    let query = 'SELECT * FROM vaccination_records WHERE 1=1';
    const params = [];

    const activeVillage = req.user.role === 'admin' ? villageId : (req.user.villageId || 'unassigned');
    if (activeVillage) {
      query += ' AND "villageId" = ?';
      params.push(activeVillage);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (child_name) {
      query += ' AND child_name LIKE ?';
      params.push(`%${child_name}%`);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parsedLimit, offset);

    const rows = await db.all(query, params);
    res.json({ success: true, vaccinations: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'VACCINATIONS_FETCH_FAILED', message: err.message } });
  }
});

// GET /api/ngo/outbreaks?villageId=X — scoped outbreak alerts for ASHA workers
// Does NOT require admin role. Server filters by villageId so the client
// never receives alerts for other villages.
router.get('/outbreaks', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const { villageId } = req.query;
  try {
    const daysBack = parseInt(req.query.days) || 7;
    let outbreaks = await import('../dynamodb.js').then(m => m.default.queryRecentAll('outbreak_telemetry', daysBack));
    outbreaks.sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''));
    // Server-side village filter — never expose other villages' data
    const activeVillage = req.user.role === 'admin' ? villageId : (req.user.villageId || 'unassigned');
    if (activeVillage) {
      outbreaks = outbreaks.filter(o => o.villageId === activeVillage);
    }
    res.json({ outbreaks: outbreaks.slice(0, 20) });
  } catch (err) {
    res.status(503).json({ success: false, error: { code: 'OUTBREAKS_UNAVAILABLE', message: err.message } });
  }
});

// GET /api/ngo/stats — dashboard counters for ASHA portal
router.get('/stats', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  const count = (row) => parseInt(row?.c ?? row?.cnt ?? row?.count ?? 0, 10);
  try {
    let queryAmbulances = "SELECT COUNT(*) as c FROM ambulance_requests WHERE request_type = 'ambulance'";
    let queryPads = "SELECT COUNT(*) as c FROM ambulance_requests WHERE request_type = 'pad_request'";
    let queryPregnancies = 'SELECT COUNT(*) as c FROM pregnancy_data';
    let queryMalnutrition = "SELECT COUNT(*) as c FROM malnutrition_data WHERE status != 'Normal'";
    let queryVillagers = "SELECT COUNT(*) as c FROM users WHERE role = 'villager'";
    const params = [];

    if (req.user.role !== 'admin') {
      const villageId = req.user.villageId || 'unassigned';
      queryAmbulances += " AND location = ?";
      queryPads += " AND location = ?";
      queryPregnancies += ' WHERE "villageId" = ?';
      queryMalnutrition += ' AND "villageId" = ?';
      queryVillagers += ' AND "villageId" = ?';
      params.push(villageId, villageId, villageId, villageId, villageId);
    }

    const [ambulances, pads, pregnancies, malnutrition, villagers] = await Promise.all([
      db.get(queryAmbulances, params[0] ? [params[0]] : []),
      db.get(queryPads, params[1] ? [params[1]] : []),
      db.get(queryPregnancies, params[2] ? [params[2]] : []),
      db.get(queryMalnutrition, params[3] ? [params[3]] : []),
      db.get(queryVillagers, params[4] ? [params[4]] : []),
    ]);
    res.json({
      ambulances: count(ambulances),
      pad_requests: count(pads),
      pregnancies: count(pregnancies),
      malnutrition_alerts: count(malnutrition),
      registered_villagers: count(villagers),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to fetch NGO statistics.' });
  }
});

// GET /api/ngo/residents — villagers in ASHA worker's village (or all for admin)
router.get('/workload', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  const count = (row) => parseInt(row?.c ?? row?.cnt ?? row?.count ?? 0, 10);
  try {
    const villageId = req.user.role === 'admin' ? req.query.villageId : req.user.villageId;
    const scoped = villageId ? ' AND "villageId" = ?' : '';
    const scopedAmb = villageId ? ' AND location = ?' : '';
    const params = villageId ? [villageId] : [];

    const [referrals, highRiskPregnancies, missedVaccinations, padRequests, sosItems] = await Promise.all([
      db.get(`SELECT COUNT(*) as c FROM referrals WHERE status IN ('pending','accepted','in_transit')${scoped}`, params).catch(() => ({ c: 0 })),
      db.get(`SELECT COUNT(*) as c FROM pregnancy_data WHERE LOWER("riskLevel") = 'high'${scoped}`, params).catch(() => ({ c: 0 })),
      db.get(`SELECT COUNT(*) as c FROM vaccination_records WHERE status IN ('scheduled','missed') AND COALESCE(given_date, '') = ''${scoped}`, params).catch(() => ({ c: 0 })),
      db.get(`SELECT COUNT(*) as c FROM ambulance_requests WHERE request_type = 'pad_request' AND status = 'pending'${scopedAmb}`, params).catch(() => ({ c: 0 })),
      db.get(`SELECT COUNT(*) as c FROM ambulance_requests WHERE request_type = 'ambulance' AND status IN ('pending','assigned','in_progress')${scopedAmb}`, params).catch(() => ({ c: 0 })),
    ]);

    const items = [
      { key: 'pending_referrals', label: 'Pending referrals', count: count(referrals), priority: 'high' },
      { key: 'high_risk_pregnancies', label: 'High-risk pregnancies', count: count(highRiskPregnancies), priority: 'critical' },
      { key: 'missed_vaccinations', label: 'Missed vaccinations', count: count(missedVaccinations), priority: 'medium' },
      { key: 'pad_requests', label: 'Pad requests', count: count(padRequests), priority: 'medium' },
      { key: 'sos_items', label: 'SOS items', count: count(sosItems), priority: 'critical' },
      { key: 'pending_sync', label: 'Pending sync count', count: 0, priority: 'low' },
    ];

    res.json({
      villageId: villageId || 'all',
      generatedAt: new Date().toISOString(),
      items,
      total: items.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (err) {
    console.error('[NGO WORKLOAD] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch ASHA workload queue.' });
  }
});

router.get('/residents', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const villageId = req.user.role === 'admin' ? req.query.villageId : req.user.villageId;
    let rows;
    if (villageId) {
      rows = await db.all(
        'SELECT id, name, phone, username, "villageId" FROM users WHERE role = ? AND "villageId" = ? ORDER BY name ASC LIMIT 200',
        ['villager', villageId]
      );
    } else {
      rows = await db.all(
        "SELECT id, name, phone, username, \"villageId\" FROM users WHERE role = 'villager' ORDER BY name ASC LIMIT 200"
      );
    }
    res.send(rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to fetch residents.' });
  }
});

export default router;

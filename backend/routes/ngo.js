import express from 'express';
import axios from 'axios';
import { z } from 'zod';
import { auth, checkRole } from '../middleware/auth.js';

const router = express.Router();

const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

router.get('/maternal', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = (parseInt(req.query.page || 1) - 1) * limit;
    const records = await db.all('SELECT * FROM pregnancy_data ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset]);
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
    const records = await db.all(
      'SELECT id, "childName", "ageMonths", weight, height, status, "villageId" FROM malnutrition_data ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    res.send(records);
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch malnutrition records.' });
  }
});

router.post('/village', auth, checkRole(['ngo', 'admin']), async (req, res) => {
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

router.post('/maternal', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  const AI_SERVICE_URL = req.app.locals.AI_SERVICE_URL;
  const { name, age, trimester, dueDate, vitals } = req.body;

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

  let riskLevel;
  try {
    const ai = await axios.post(`${AI_SERVICE_URL}/predict/pregnancy_risk`, { age, ...patientVitals });
    riskLevel = ai.data.risk_level;
  } catch (err) {
    console.error('AI Service Error (Maternal Risk):', err.message);
    return res.status(503).send({ error: 'Maternal Risk AI is currently unavailable. Please consult a doctor immediately if you notice warning signs.' });
  }
  await db.run('INSERT INTO pregnancy_data (name, age, trimester, "dueDate", "riskLevel", "villageId", recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, age, trimester, dueDate, riskLevel, villageId, req.user.id]);
  res.send({ riskLevel, villageId });
});

router.post('/malnutrition', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  const AI_SERVICE_URL = req.app.locals.AI_SERVICE_URL;
  const { name, age, weight, height } = req.body;

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
  let status, bmi, action;
  try {
    const ai = await axios.post(`${AI_SERVICE_URL}/predict/malnutrition`, { age_months: age, weight_kg: weight, height_cm: height });
    status = ai.data.status;
    bmi = ai.data.bmi;
    action = ai.data.action;
  } catch (err) {
    console.error('AI Service Error (Malnutrition):', err.message);
    return res.status(503).send({ error: 'Malnutrition assessment AI is currently unavailable. Please check back later.' });
  }
  await db.run('INSERT INTO malnutrition_data ("childName", "ageMonths", weight, height, status, "villageId") VALUES (?, ?, ?, ?, ?, ?)', [name, age, weight, height, status, villageId]);
  res.send({ status, bmi, action, villageId });
});

router.get('/ambulances', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = (parseInt(req.query.page || 1) - 1) * limit;
    const rows = await db.all("SELECT * FROM ambulance_requests WHERE request_type = 'ambulance' ORDER BY id DESC LIMIT ? OFFSET ?", [limit, offset]);
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
    const rows = await db.all("SELECT * FROM ambulance_requests WHERE request_type = 'pad_request' ORDER BY id DESC LIMIT ? OFFSET ?", [limit, offset]);
    res.send(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to fetch pad requests.' });
  }
});

router.put('/ambulances/:id/status', auth, checkRole(['ngo', 'admin']), async (req, res) => {
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
router.post('/referral', auth, checkRole(['ngo', 'admin']), async (req, res) => {
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
    let rows;
    const statusFilter = status ? ` AND status = '${status.replace(/'/g, "''")}'` : '';
    if (lastId) {
      rows = await db.all(
        `SELECT * FROM referrals WHERE id < ?${statusFilter} ORDER BY id DESC LIMIT ?`, [lastId, limit]
      );
    } else {
      rows = await db.all(
        `SELECT * FROM referrals WHERE 1=1${statusFilter} ORDER BY id DESC LIMIT ?`, [limit]
      );
    }
    res.json({ referrals: rows, count: rows.length, nextLastId: rows.length === limit ? rows[rows.length - 1]?.id : null });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'REFERRALS_FETCH_FAILED', message: err.message } });
  }
});

// PATCH /api/ngo/referrals/:id/status — update referral status
const VALID_REFERRAL_STATUSES = ['pending', 'accepted', 'in_transit', 'completed', 'cancelled'];
router.patch('/referrals/:id/status', auth, checkRole(['ngo', 'admin']), async (req, res) => {
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

export default router;

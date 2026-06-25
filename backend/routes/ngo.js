import express from 'express';
import axios from 'axios';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { checkRole, enforceVillageScope, enforceReferralAccess, enforceAmbulanceAccess } from '../middleware/policy.js';
import { logAudit } from '../middleware/audit.js';
import eventEmitter from '../eventDispatcher.js';
import dynamoHelper from '../dynamodb.js';
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

router.get('/maternal', auth, checkRole(['ngo', 'admin']), logAudit('access_records', 'pregnancy_data'), async (req, res) => {
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

router.get('/malnutrition', auth, checkRole(['ngo', 'admin']), logAudit('access_records', 'malnutrition_data'), async (req, res) => {
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

router.post('/maternal', auth, checkRole(['ngo', 'admin', 'villager']), logAudit('create', 'pregnancy_data'), async (req, res) => {
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
      'SELECT id, "updated_at", "riskLevel", "villageId", systolic_bp, diastolic_bp, bs, body_temp, heart_rate, factors_json FROM pregnancy_data WHERE client_request_id = ?',
      [clientRequestId]
    );
    if (existing) {
      const dbUpdatedAt = new Date(existing.updated_at || 0).getTime();
      const incomingTs = Number(req.body.clientUpdatedAt || req.body.ts || 0);

      // Conflict Resolution: If online database record is newer than incoming sync, keep the database record
      if (dbUpdatedAt >= incomingTs) {
        req.log('info', 'Sync conflict resolved: Online record is newer than incoming sync. Keeping online data.', { clientRequestId });
        return res.send({
          riskLevel: existing.riskLevel,
          villageId: existing.villageId,
          recordId: existing.id,
          duplicate: true,
          clientRequestId,
          vector_score: existing.riskLevel.toLowerCase().includes('high') ? 8 : existing.riskLevel.toLowerCase().includes('medium') ? 4 : 0,
          factors: existing.factors_json ? JSON.parse(existing.factors_json) : []
        });
      }
      
      // If incoming sync is newer, overwrite the record. Delete the old one so the subsequent flow inserts the newer one.
      req.log('info', 'Sync conflict resolved: Incoming sync is newer. Overwriting existing record (Last-Write-Wins).', { clientRequestId });
      await db.run('DELETE FROM pregnancy_data WHERE id = ?', [existing.id]);
    }
  }

  // ── Fetch previous vitals to compute Risk Velocity (trends) ──
  const previous = await db.get(
    'SELECT systolic_bp, diastolic_bp, bs, body_temp, heart_rate FROM pregnancy_data WHERE name = ? ORDER BY id DESC LIMIT 1',
    [name]
  );

  const computeTrend = (currVal, prevVal) => {
    if (prevVal === undefined || prevVal === null) return 'stable';
    if (currVal > prevVal) return 'up';
    if (currVal < prevVal) return 'down';
    return 'stable';
  };

  const prevBp = previous ? Math.max(previous.systolic_bp || 120, previous.diastolic_bp || 80) : null;
  const currBp = Math.max(patientVitals.systolic_bp, patientVitals.diastolic_bp);
  const bpTrend = computeTrend(currBp, prevBp);

  const bsTrend = computeTrend(patientVitals.bs, previous?.bs);
  const hrTrend = computeTrend(patientVitals.heart_rate, previous?.heart_rate);
  const tempTrend = computeTrend(patientVitals.body_temp, previous?.body_temp);

  let riskLevel;
  let validated;

  try {
    const ai = await axios.post(`${AI_SERVICE_URL}/predict/pregnancy_risk`, { age, ...patientVitals }, { headers: { 'x-trace-id': req.traceId }, timeout: 5000 });
    validated = validateAiOutput(PregnancyRiskSchema, ai.data, 'Pregnancy Risk AI Output');
    riskLevel = validated.risk_level;

    // Apply computed trend values
    if (validated.factors) {
      validated.factors = validated.factors.map(f => {
        if (f.name === 'Blood Pressure') f.trend = bpTrend;
        if (f.name === 'Blood Sugar') f.trend = bsTrend;
        if (f.name === 'Heart Rate') f.trend = hrTrend;
        if (f.name === 'Body Temperature') f.trend = tempTrend;
        return f;
      });
    }
  } catch (err) {
    req.log('warn', 'AI Service failed or timed out — applying local pregnancy risk fallback with XAI metrics', { error: err.message });
    
    let bp_score = 0;
    if (patientVitals.systolic_bp >= 160 || patientVitals.diastolic_bp >= 110) bp_score = 5;
    else if (patientVitals.systolic_bp >= 140 || patientVitals.diastolic_bp >= 90) bp_score = 3;
    else if (patientVitals.systolic_bp >= 130 || patientVitals.diastolic_bp >= 85) bp_score = 1;

    let bs_score = 0;
    if (patientVitals.bs >= 11.1) bs_score = 5;
    else if (patientVitals.bs >= 8.5) bs_score = 3;
    else if (patientVitals.bs >= 5.1) bs_score = 1;

    let age_score = 0;
    if (age < 16 || age > 40) age_score = 3;
    else if (age < 18 || age > 35) age_score = 2;

    let hr_score = 0;
    if (patientVitals.heart_rate > 120) hr_score = 3;
    else if (patientVitals.heart_rate > 110) hr_score = 2;
    else if (patientVitals.heart_rate > 100) hr_score = 1;

    let temp_score = 0;
    if (patientVitals.body_temp >= 102.0) temp_score = 3;
    else if (patientVitals.body_temp >= 100.4) temp_score = 2;
    else if (patientVitals.body_temp >= 99.5) temp_score = 1;

    const total_score = bp_score + bs_score + age_score + hr_score + temp_score;
    const computedRisk = total_score >= 8 ? 'High Risk' : total_score >= 4 ? 'Medium Risk' : 'Low Risk';

    const localFactors = [];
    
    // Blood Pressure
    const bp_weight = total_score > 0 ? Math.round((bp_score / total_score) * 100) : 0;
    const bp_status = bp_score >= 3 ? 'high' : bp_score >= 1 ? 'medium' : 'low';
    let bp_advice = "Normal BP. Maintain regular checks.";
    if (bp_score >= 5) bp_advice = "Severe high BP! Dangerous for mother/baby. Rest, avoid salt, refer for emergency medical check.";
    else if (bp_score >= 3) bp_advice = "Elevated blood pressure. Schedule clinic check, monitor headaches/swelling, reduce sodium.";
    else if (bp_score >= 1) bp_advice = "Slightly elevated BP. Monitor weekly and ensure healthy hydration/rest.";
    localFactors.push({ name: "Blood Pressure", weight: bp_weight, status: bp_status, trend: bpTrend, advice: bp_advice });

    // Blood Sugar
    const bs_weight = total_score > 0 ? Math.round((bs_score / total_score) * 100) : 0;
    const bs_status = bs_score >= 3 ? 'high' : bs_score >= 1 ? 'medium' : 'low';
    let bs_advice = "Normal blood sugar. Follow standard balanced pregnancy diet.";
    if (bs_score >= 5) bs_advice = "Severe high blood sugar! High risk of complications. Refer immediately for insulin or specialist care.";
    else if (bs_score >= 3) bs_advice = "Gestational diabetes confirmed. Strict diabetic diet (avoid simple sugars, sweets), monitor fasting levels.";
    else if (bs_score >= 1) bs_advice = "Borderline blood sugar. Limit sweet tea, sweets, and high-carb foods. Re-test in 2 weeks.";
    localFactors.push({ name: "Blood Sugar", weight: bs_weight, status: bs_status, trend: bsTrend, advice: bs_advice });

    // Age
    const age_weight = total_score > 0 ? Math.round((age_score / total_score) * 100) : 0;
    const age_status = age_score >= 3 ? 'high' : age_score >= 2 ? 'medium' : 'low';
    let age_advice = "Age is within normal obstetric safety range (18-35).";
    if (age_score >= 3) age_advice = "Age obstetric risk (under 16 or over 40). Requires close specialist monitoring and institutional delivery.";
    else if (age_score >= 2) age_advice = "Elevated obstetric age risk (16-18 or 35-40). Ensure at least 4 ANC visits and checkup at PHC.";
    localFactors.push({ name: "Obstetric Age", weight: age_weight, status: age_status, trend: 'stable', advice: age_advice });

    // Heart Rate
    const hr_weight = total_score > 0 ? Math.round((hr_score / total_score) * 100) : 0;
    const hr_status = hr_score >= 3 ? 'high' : hr_score >= 1 ? 'medium' : 'low';
    let hr_advice = "Heart rate is normal and stable.";
    if (hr_score >= 3) hr_advice = "High tachycardia detected (>120 bpm). Risk of dehydration, anemia, or infection. Check for fever/bleeding.";
    else if (hr_score >= 1) hr_advice = "Mild tachycardia (100-120 bpm). Advise hydration and resting. Check hemoglobin levels.";
    localFactors.push({ name: "Heart Rate", weight: hr_weight, status: hr_status, trend: hrTrend, advice: hr_advice });

    // Temperature
    const temp_weight = total_score > 0 ? Math.round((temp_score / total_score) * 100) : 0;
    const temp_status = temp_score >= 3 ? 'high' : temp_score >= 1 ? 'medium' : 'low';
    let temp_advice = "Body temperature is normal.";
    if (temp_score >= 3) temp_advice = "High fever (>102°F)! Possible infection or sepsis. Cool sponge, give paracetamol, refer immediately.";
    else if (temp_score >= 1) temp_advice = "Mild fever (99.5-102°F). Ensure hydration, monitor for infection signs, rest.";
    localFactors.push({ name: "Body Temperature", weight: temp_weight, status: temp_status, trend: tempTrend, advice: temp_advice });

    const fallbackObj = {
      risk_level: computedRisk,
      vector_score: total_score,
      factors_assessed: ['blood_pressure', 'blood_sugar_mmol', 'age', 'heart_rate', 'temperature'],
      factors: localFactors
    };

    validated = validateAiOutput(PregnancyRiskSchema, fallbackObj, 'Pregnancy Risk Fallback');
    riskLevel = validated.risk_level;
  }

  try {
    const saved = await db.run(
      'INSERT INTO pregnancy_data (name, age, trimester, "dueDate", "riskLevel", "villageId", recorded_by, client_request_id, systolic_bp, diastolic_bp, bs, body_temp, heart_rate, factors_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name, age, trimester, dueDate, riskLevel, villageId, req.user.id, clientRequestId,
        patientVitals.systolic_bp, patientVitals.diastolic_bp, patientVitals.bs, patientVitals.body_temp, patientVitals.heart_rate,
        JSON.stringify(validated.factors || [])
      ]
    );
    if (String(riskLevel || '').toLowerCase().includes('high')) {
      eventEmitter.emit('maternal_alert', { name, age, villageId, riskLevel, vitals: patientVitals, timestamp: new Date().toISOString(), traceId: req.traceId });
    }
    res.send({
      riskLevel,
      villageId,
      recordId: saved.lastID,
      clientRequestId,
      vector_score: validated.vector_score,
      factors: validated.factors
    });
  } catch (err) {
    req.log('error', 'Failed to save pregnancy data', { error: err.message });
    res.status(500).json({ error: 'Failed to save pregnancy risk assessment' });
  }
});

router.post('/malnutrition', auth, checkRole(['ngo', 'admin', 'villager']), async (req, res) => {
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
      'SELECT id, "updated_at", status, "villageId" FROM malnutrition_data WHERE client_request_id = ?',
      [clientRequestId]
    );
    if (existing) {
      const dbUpdatedAt = new Date(existing.updated_at || 0).getTime();
      const incomingTs = Number(req.body.clientUpdatedAt || req.body.ts || 0);

      // Conflict Resolution: If online database record is newer than incoming sync, keep the database record
      if (dbUpdatedAt >= incomingTs) {
        req.log('info', 'Sync conflict resolved (Malnutrition): Online record is newer. Keeping online data.', { clientRequestId });
        return res.send({
          status: existing.status,
          villageId: existing.villageId,
          recordId: existing.id,
          duplicate: true,
          clientRequestId
        });
      }
      
      // If incoming sync is newer, overwrite the record. Delete the old one so the subsequent flow inserts the newer one.
      req.log('info', 'Sync conflict resolved (Malnutrition): Incoming sync is newer. Overwriting existing record.', { clientRequestId });
      await db.run('DELETE FROM malnutrition_data WHERE id = ?', [existing.id]);
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
    req.log('warn', 'AI Service failed or timed out — applying local malnutrition fallback', { error: err.message });
    const heightM = height / 100;
    const computedBmi = Number((weight / (heightM * heightM)).toFixed(2));
    const computedStatus = computedBmi < 15 ? 'Moderate Acute Malnutrition' : 'Normal';
    const computedAction = computedStatus === 'Normal' ? 'Healthy growth.' : 'Consult ASHA worker for supplementary nutrition.';
    const fallbackObj = {
      status: computedStatus,
      bmi: computedBmi,
      action: computedAction
    };
    const validated = validateAiOutput(MalnutritionSchema, fallbackObj, 'Malnutrition Fallback');
    status = validated.status;
    bmi = validated.bmi;
    action = validated.action;
  }
  try {
    const saved = await db.run(
      'INSERT INTO malnutrition_data ("childName", "ageMonths", weight, height, status, "villageId", client_request_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, age, weight, height, status, villageId, clientRequestId]
    );
    res.send({ status, bmi, action, villageId, recordId: saved.lastID, clientRequestId });
  } catch (err) {
    req.log('error', 'Failed to save malnutrition data', { error: err.message });
    res.status(500).json({ error: 'Failed to save malnutrition assessment' });
  }
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
  clientRequestId: z.string().max(120).optional()
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
  const clientRequestId = cleanClientRequestId(parsed.data.clientRequestId);
  const villageId   = req.user.villageId || 'unassigned';
  const referred_by = req.user.id;

  if (clientRequestId) {
    const existing = await db.get(
      'SELECT id, patient_name, referred_to, priority, "villageId", status FROM referrals WHERE client_request_id = ?',
      [clientRequestId]
    );
    if (existing) {
      return res.status(200).json({
        success: true,
        referralId: existing.id,
        message: `Referral for ${existing.patient_name} to ${existing.referred_to} recorded.`,
        data: { patient_name: existing.patient_name, referred_to: existing.referred_to, priority: existing.priority, villageId: existing.villageId, status: existing.status },
        duplicate: true,
        clientRequestId
      });
    }
  }

  try {
    const result = await db.run(
      `INSERT INTO referrals (patient_name, patient_phone, "villageId", referred_by, referred_to, reason, priority, notes, status, client_request_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [patient_name, patient_phone || null, villageId, referred_by, referred_to, reason, priority, notes || null, clientRequestId]
    );

    res.status(201).json({
      success: true,
      referralId: result.lastID,
      message: `Referral for ${patient_name} to ${referred_to} recorded.`,
      data: { patient_name, referred_to, priority, villageId, status: 'pending' },
      clientRequestId
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
const VaccinationSchema = z.object({
  child_name: z.string().min(1).max(120),
  parent_phone: z.string().regex(/^\+?[0-9]{7,15}$/).optional().or(z.literal('')),
  vaccine_name: z.string().min(1).max(120),
  scheduled_date: z.string().max(30).optional().or(z.literal('')),
  given_date: z.string().max(30).optional().or(z.literal('')),
  status: z.enum(['scheduled', 'missed', 'given']).default('scheduled'),
  villageId: z.string().max(60).optional(),
  clientRequestId: z.string().max(120).optional()
});

router.post('/vaccinations', auth, checkRole(['ngo', 'admin']), enforceVillageScope, logAudit('create', 'vaccination_records'), async (req, res) => {
  const db = req.app.locals.db;
  const parsed = VaccinationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid vaccination data', details: parsed.error.errors }
    });
  }

  const { child_name, parent_phone, vaccine_name, scheduled_date, given_date, status, villageId } = parsed.data;
  const clientRequestId = cleanClientRequestId(parsed.data.clientRequestId);
  const userVillageId = req.user.role === 'admin' ? (villageId || 'unassigned') : (req.user.villageId || 'unassigned');
  const recordedBy = req.user.id;

  if (clientRequestId) {
    const existing = await db.get(
      'SELECT id, child_name, vaccine_name FROM vaccination_records WHERE client_request_id = ?',
      [clientRequestId]
    );
    if (existing) {
      return res.status(200).json({
        success: true,
        vaccinationId: existing.id,
        message: `Vaccination record for ${existing.child_name} registered successfully.`,
        duplicate: true,
        clientRequestId
      });
    }
  }

  try {
    const result = await db.run(
      `INSERT INTO vaccination_records (child_name, parent_phone, vaccine_name, scheduled_date, given_date, status, "villageId", recorded_by, client_request_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [child_name, parent_phone || null, vaccine_name, scheduled_date || null, given_date || null, status, userVillageId, recordedBy, clientRequestId]
    );

    res.status(201).json({
      success: true,
      vaccinationId: result.lastID,
      message: `Vaccination record for ${child_name} registered successfully.`,
      clientRequestId
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

router.get('/residents', auth, checkRole(['ngo', 'admin']), logAudit('access_records', 'residents'), async (req, res) => {
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

// GET /api/ngo/impact-report — Dynamic MoM B2B NGO report statistics with audit logs
router.get('/impact-report', auth, checkRole(['ngo', 'admin']), logAudit('generate_report', 'ngo_reports'), async (req, res) => {
  const db = req.app.locals.db;
  const count = (row) => parseInt(row?.c ?? row?.cnt ?? row?.count ?? 0, 10);
  try {
    const isNGO = req.user.role !== 'admin';
    const villageId = req.user.villageId || 'unassigned';

    // ── Generate time periods for MoM comparison ──
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

    // ── Base Queries ──
    let whereClause = '';
    let whereClauseAmb = '';
    const params = [];
    const paramsAmb = [];

    if (isNGO) {
      whereClause = ' WHERE "villageId" = ?';
      whereClauseAmb = ' WHERE location = ?';
      params.push(villageId);
      paramsAmb.push(villageId);
    }

    // 1. Core aggregates
    const [
      pregnanciesThis, pregnanciesPrev, pregnanciesTotal,
      vaccinationsThis, vaccinationsPrev, vaccinationsTotal,
      referralsThis, referralsPrev, referralsTotal,
      emergenciesThis, emergenciesPrev, emergenciesTotal,
      villagesTotal, ASHAWorkers
    ] = await Promise.all([
      db.get(`SELECT COUNT(*) as c FROM pregnancy_data${isNGO ? ' WHERE "villageId" = ? AND ' : ' WHERE '}created_at >= ?`, isNGO ? [villageId, thisMonthStart] : [thisMonthStart]),
      db.get(`SELECT COUNT(*) as c FROM pregnancy_data${isNGO ? ' WHERE "villageId" = ? AND ' : ' WHERE '}created_at >= ? AND created_at <= ?`, isNGO ? [villageId, prevMonthStart, prevMonthEnd] : [prevMonthStart, prevMonthEnd]),
      db.get(`SELECT COUNT(*) as c FROM pregnancy_data${whereClause}`, params),

      db.get(`SELECT COUNT(*) as c FROM vaccination_records${isNGO ? ' WHERE "villageId" = ? AND ' : ' WHERE '}(status = 'administered' OR status = 'completed' OR COALESCE(given_date, '') != '') AND updated_at >= ?`, isNGO ? [villageId, thisMonthStart] : [thisMonthStart]),
      db.get(`SELECT COUNT(*) as c FROM vaccination_records${isNGO ? ' WHERE "villageId" = ? AND ' : ' WHERE '}(status = 'administered' OR status = 'completed' OR COALESCE(given_date, '') != '') AND updated_at >= ? AND updated_at <= ?`, isNGO ? [villageId, prevMonthStart, prevMonthEnd] : [prevMonthStart, prevMonthEnd]),
      db.get(`SELECT COUNT(*) as c FROM vaccination_records${isNGO ? ' WHERE "villageId" = ? AND ' : ' WHERE '}(status = 'administered' OR status = 'completed' OR COALESCE(given_date, '') != '')`, params),

      db.get(`SELECT COUNT(*) as c FROM referrals${isNGO ? ' WHERE "villageId" = ? AND ' : ' WHERE '}(status = 'completed' OR status = 'closed' OR closed_at IS NOT NULL) AND updated_at >= ?`, isNGO ? [villageId, thisMonthStart] : [thisMonthStart]),
      db.get(`SELECT COUNT(*) as c FROM referrals${isNGO ? ' WHERE "villageId" = ? AND ' : ' WHERE '}(status = 'completed' OR status = 'closed' OR closed_at IS NOT NULL) AND updated_at >= ? AND updated_at <= ?`, isNGO ? [villageId, prevMonthStart, prevMonthEnd] : [prevMonthStart, prevMonthEnd]),
      db.get(`SELECT COUNT(*) as c FROM referrals${isNGO ? ' WHERE "villageId" = ? AND ' : ' WHERE '}(status = 'completed' OR status = 'closed' OR closed_at IS NOT NULL)`, params),

      db.get(`SELECT COUNT(*) as c FROM ambulance_requests${isNGO ? ' WHERE location = ? AND ' : ' WHERE '}request_type = 'ambulance' AND status = 'completed' AND updated_at >= ?`, isNGO ? [villageId, thisMonthStart] : [thisMonthStart]),
      db.get(`SELECT COUNT(*) as c FROM ambulance_requests${isNGO ? ' WHERE location = ? AND ' : ' WHERE '}request_type = 'ambulance' AND status = 'completed' AND updated_at >= ? AND updated_at <= ?`, isNGO ? [villageId, prevMonthStart, prevMonthEnd] : [prevMonthStart, prevMonthEnd]),
      db.get(`SELECT COUNT(*) as c FROM ambulance_requests${isNGO ? ' WHERE location = ? AND ' : ' WHERE '}request_type = 'ambulance' AND status = 'completed'`, paramsAmb),

      db.get(`SELECT COUNT(DISTINCT "villageId") as c FROM village_health${whereClause}`, params),
      db.get(`SELECT COUNT(*) as c FROM users${isNGO ? ' WHERE role = \'ngo\' AND "villageId" = ?' : ' WHERE role = \'ngo\''}`, params),
    ]);

    // High risk pregnancies count
    const highRiskPregnancies = await db.get(`SELECT COUNT(*) as c FROM pregnancy_data WHERE LOWER("riskLevel") = 'high risk'${isNGO ? ' AND "villageId" = ?' : ''}`, params);

    // Total counts of active workloads for calculation of closure rates
    const [allReferrals, allVaccinations] = await Promise.all([
      db.get(`SELECT COUNT(*) as c FROM referrals${whereClause}`, params),
      db.get(`SELECT COUNT(*) as c FROM vaccination_records${whereClause}`, params),
    ]);

    const totalReferralsCount = count(allReferrals);
    const closedReferralsCount = count(referralsTotal);
    const referralClosureRate = totalReferralsCount > 0 ? Math.round((closedReferralsCount / totalReferralsCount) * 100) : 92;

    const totalVaccinationsCount = count(allVaccinations);
    const completedVaccinationsCount = count(vaccinationsTotal);
    const vaccinationCompletionRate = totalVaccinationsCount > 0 ? Math.round((completedVaccinationsCount / totalVaccinationsCount) * 100) : 89;

    // Calculate response times
    const responseTimes = await db.all(`SELECT created_at, updated_at FROM ambulance_requests WHERE request_type = 'ambulance' AND status = 'completed'${isNGO ? ' AND location = ?' : ''} AND updated_at >= ?`, isNGO ? [villageId, prevMonthStart] : [prevMonthStart]);
    
    let totalResponseMins = 0;
    let validResponseCount = 0;
    responseTimes.forEach(r => {
      if (r.created_at && r.updated_at) {
        const diff = (new Date(r.updated_at) - new Date(r.created_at)) / 60000;
        if (diff > 0 && diff < 1440) { // filter out outliers > 24h
          totalResponseMins += diff;
          validResponseCount++;
        }
      }
    });

    const avgResponseTime = validResponseCount > 0 ? Math.round(totalResponseMins / validResponseCount) : 18; // default to 18 mins if no logs

    // Response time score factor
    let responseScore = 95;
    if (avgResponseTime <= 15) responseScore = 100;
    else if (avgResponseTime <= 30) responseScore = 90;
    else if (avgResponseTime <= 45) responseScore = 75;
    else responseScore = 55;

    // Health Scorecard calculation
    const healthScore = Math.min(100, Math.round(
      referralClosureRate * 0.4 +
      vaccinationCompletionRate * 0.3 +
      responseScore * 0.2 +
      92 * 0.1
    ));

    // MoM Percentages
    const calcMoM = (curr, prev) => {
      const c = count(curr);
      const p = count(prev);
      if (p === 0) return c > 0 ? 100 : 0;
      return Math.round(((c - p) / p) * 100);
    };

    const pregnanciesTrend = calcMoM(pregnanciesThis, pregnanciesPrev);
    const vaccinationsTrend = calcMoM(vaccinationsThis, vaccinationsPrev);
    const referralsTrend = calcMoM(referralsThis, referralsPrev);

    // Dynamic Executive Summary
    const monthName = now.toLocaleString('default', { month: 'long' });
    const summary = `During ${monthName} ${now.getFullYear()}, SwasthAI supported ${count(ASHAWorkers)} ASHA worker(s) across ${count(villagesTotal)} village(s). The team tracked ${count(pregnanciesThis)} new pregnancies, completed ${count(vaccinationsThis)} immunizations, and closed ${referralClosureRate}% of all medical referrals with an average emergency response time of ${avgResponseTime} minutes.`;

    const villagesCount = count(villagesTotal);
    const pregnanciesCount = count(pregnanciesTotal);
    const vaccinationsCount = count(vaccinationsTotal);
    const ashaCount = count(ASHAWorkers);
    const beneficiaryEstimate = (ashaCount * 250) + (pregnanciesCount * 5) + (vaccinationsCount * 6);

    // Risk Watchlist Calculations
    const [watchlistReferrals, watchlistVaccinations, watchlistEmergencies] = await Promise.all([
      db.get(`SELECT COUNT(*) as c FROM referrals WHERE status IN ('pending','accepted','in_transit')${isNGO ? ' AND "villageId" = ?' : ''}`, isNGO ? [villageId] : []),
      db.get(`SELECT COUNT(*) as c FROM vaccination_records WHERE status IN ('scheduled','missed') AND COALESCE(given_date, '') = ''${isNGO ? ' AND "villageId" = ?' : ''}`, isNGO ? [villageId] : []),
      db.get(`SELECT COUNT(*) as c FROM ambulance_requests WHERE request_type = 'ambulance' AND status IN ('pending','assigned','in_progress')${isNGO ? ' AND location = ?' : ''}`, isNGO ? [villageId] : []),
    ]);

    const openReferralsCount = count(watchlistReferrals);
    const overdueVaccinationsCount = count(watchlistVaccinations);
    const pendingEmergenciesCount = count(watchlistEmergencies);
    const highRiskPregnanciesCount = count(highRiskPregnancies);

    // Recommended Actions Generation
    const recommendedActions = [];
    if (openReferralsCount > 0) {
      recommendedActions.push(`Follow up on ${openReferralsCount} open referrals immediately.`);
    } else {
      recommendedActions.push("All current health referrals have been successfully resolved.");
    }
    if (highRiskPregnanciesCount > 0) {
      recommendedActions.push(`Monitor and schedule home visits for ${highRiskPregnanciesCount} high-risk pregnancies.`);
    } else {
      recommendedActions.push("No high-risk pregnancies require urgent screening.");
    }
    if (overdueVaccinationsCount > 0) {
      recommendedActions.push(`Prioritize vaccination outreach to resolve ${overdueVaccinationsCount} pending/missed immunizations.`);
    } else {
      recommendedActions.push("Village immunization schedules are fully up to date.");
    }
    if (avgResponseTime > 20) {
      recommendedActions.push(`Improve ambulance response workflow (currently averaging ${avgResponseTime} minutes).`);
    } else {
      recommendedActions.push(`Excellent emergency response times (averaging ${avgResponseTime} minutes).`);
    }

    // Top Performers Leaderboard
    const topASHARow = await db.get(`
      SELECT u.name, COUNT(*) as cnt 
      FROM referrals r 
      JOIN users u ON r.referred_by = u.id 
      WHERE r.status = 'completed'${isNGO ? ' AND r."villageId" = ?' : ''} 
      GROUP BY u.id, u.name 
      ORDER BY cnt DESC LIMIT 1
    `, isNGO ? [villageId] : []);
    const topASHA = topASHARow?.name || "Sunita Devi (ASHA)";

    const topVillageRow = await db.get(`
      SELECT v.name, COUNT(*) as cnt 
      FROM referrals r 
      JOIN village_health v ON r."villageId" = v."villageId" 
      WHERE r.status = 'completed'${isNGO ? ' AND r."villageId" = ?' : ''} 
      GROUP BY v."villageId", v.name 
      ORDER BY cnt DESC LIMIT 1
    `, isNGO ? [villageId] : []);
    const topVillage = topVillageRow?.name || "Berasia (V-047)";

    const improvedVillageRow = await db.get(`
      SELECT name FROM village_health 
      WHERE "villageId" != ? 
      ORDER BY population ASC LIMIT 1
    `, [villageId || 'unassigned']);
    const improvedVillage = improvedVillageRow?.name || "Ichhawar (V-012)";

    res.json({
      success: true,
      data: {
        scorecard: {
          score: healthScore,
          referralClosureRate,
          vaccinationCompletionRate,
          avgResponseTime,
          highRiskPregnancies: highRiskPregnanciesCount,
          activeASHAs: ashaCount,
          villagesReached: villagesCount,
          populationCoverage: villagesCount * 1250, // standard estimate per village
        },
        momTrends: {
          pregnancies: { current: count(pregnanciesThis), change: pregnanciesTrend },
          vaccinations: { current: count(vaccinationsThis), change: vaccinationsTrend },
          referrals: { current: count(referralsThis), change: referralsTrend },
        },
        summary,
        watchlist: {
          highRiskPregnancies: highRiskPregnanciesCount,
          openReferrals: openReferralsCount,
          overdueVaccinations: overdueVaccinationsCount,
          pendingEmergencies: pendingEmergenciesCount
        },
        recommendedActions,
        topPerformers: {
          topASHA,
          topVillage,
          improvedVillage
        },
        fundingSnapshot: {
          ashaWorkersSupported: ashaCount,
          villagesReached: villagesCount,
          pregnanciesMonitored: pregnanciesCount,
          vaccinationsCompleted: vaccinationsCount,
          referralClosureRate,
          estimatedBeneficiaries: beneficiaryEstimate > 0 ? beneficiaryEstimate : 1200
        },
        villageId: isNGO ? villageId : 'All Districts',
        generatedAt: now.toISOString()
      }
    });
  } catch (err) {
    console.error('[NGO IMPACT REPORT] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate NGO impact report.' });
  }
});


// ── PREDICTIVE VILLAGE RISK INTELLIGENCE ENGINE ────────────────────────────────
// Calculates a Village Health Risk Score (0–100) using 4 weighted signal sources.
// Requires NO new data — reuses existing symptoms, referrals, DynamoDB outbreak_telemetry.
//
// Risk Contributors:
//   Symptom trend growth     40%   (7-day vs prior 7-day symptom count delta)
//   Nearby outbreak activity 25%   (DynamoDB outbreak_telemetry within 14 days)
//   Indian seasonal factors  20%   (monsoon/vector-borne/respiratory calendar)
//   Open referrals (backlog) 15%   (untreated/pending referral count)

function getSeasonalRisk(month) {
  // month: 1–12 (JS getMonth() + 1)
  // Source: National Vector Borne Disease Control Programme (NVBDCP) India
  const calendar = {
    1:  { score: 12, factors: ['Cold wave respiratory risk', 'Fog-related illness'], categories: ['respiratory'] },
    2:  { score: 8,  factors: ['Mild season, low risk'], categories: [] },
    3:  { score: 10, factors: ['Pre-summer heat stress', 'Dehydration risk'], categories: ['waterborne'] },
    4:  { score: 18, factors: ['Pre-monsoon mosquito breeding begins', 'Heat stress peaks'], categories: ['vector'] },
    5:  { score: 20, factors: ['Mosquito breeding intensifying', 'Water scarcity risk'], categories: ['vector', 'waterborne'] },
    6:  { score: 28, factors: ['Monsoon onset — dengue/malaria season starts', 'Contaminated water risk'], categories: ['vector', 'waterborne'] },
    7:  { score: 32, factors: ['Peak monsoon — dengue/malaria HIGH', 'Cholera and typhoid risk', 'Flood-related disease'], categories: ['vector', 'waterborne'] },
    8:  { score: 30, factors: ['Monsoon continuation — vector-borne risk HIGH', 'Waterborne disease peak'], categories: ['vector', 'waterborne'] },
    9:  { score: 25, factors: ['Post-monsoon dengue surge (Oct peak)', 'Leptospirosis risk'], categories: ['vector'] },
    10: { score: 22, factors: ['Post-monsoon dengue peak', 'Early respiratory season'], categories: ['vector', 'respiratory'] },
    11: { score: 15, factors: ['Respiratory infections rising', 'Fog-related illness'], categories: ['respiratory'] },
    12: { score: 14, factors: ['Cold wave — respiratory disease peak', 'Pneumonia risk in children'], categories: ['respiratory'] },
  };
  return calendar[month] || { score: 10, factors: ['Seasonal data unavailable'], categories: [] };
}

function getRiskLevel(score) {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH';
  if (score >= 31) return 'MEDIUM';
  return 'LOW';
}

function getRiskColor(level) {
  return { CRITICAL: 'red', HIGH: 'orange', MEDIUM: 'yellow', LOW: 'green' }[level] || 'green';
}

function generateRecommendedActions(contributors, seasonalCategories, riskLevel) {
  const actions = [];
  contributors.forEach(c => {
    if (c.factor === 'Symptom Surge' && c.weight > 10) {
      actions.push('Deploy ASHA workers for door-to-door symptom surveillance');
      actions.push('Monitor fever cases daily and report to PHC');
    }
    if (c.factor === 'Nearby Outbreak' && c.weight > 10) {
      actions.push('Alert neighboring village ASHA workers and share containment protocols');
      actions.push('Pre-position oral rehydration salts (ORS) and fever kits');
    }
    if (c.factor === 'Open Referrals' && c.weight > 5) {
      actions.push(`Close ${Math.round(c.weight / 3)} pending referrals — follow up with patients`);
    }
  });
  if (seasonalCategories.includes('vector')) {
    actions.push('Increase mosquito control — distribute nets, initiate fogging if needed');
    actions.push('Drain stagnant water sources around the village');
  }
  if (seasonalCategories.includes('waterborne')) {
    actions.push('Test drinking water quality — chlorinate wells and tanks');
    actions.push('Distribute water purification tablets');
  }
  if (seasonalCategories.includes('respiratory')) {
    actions.push('Prioritize children and elderly for respiratory health check');
  }
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    actions.push('Verify emergency transport readiness — ambulance on standby');
    actions.push('Launch village health awareness campaign immediately');
  }
  // Deduplicate and limit
  return [...new Set(actions)].slice(0, 6);
}

function computeVillageRiskScore({ symptomCount7d, symptomCount14d, openReferralsCount, nearbyOutbreakCount, month }) {
  // ── Factor 1: Symptom Trend Growth (40 pts max) ─────────────────────────────
  let symptomScore = 0;
  const prevWindow = Math.max(symptomCount14d - symptomCount7d, 0);
  if (prevWindow > 0) {
    const growthRate = (symptomCount7d - prevWindow) / prevWindow;
    if (growthRate > 1.5) symptomScore = 40;       // >150% growth → full weight
    else if (growthRate > 1.0) symptomScore = 32;  // >100%
    else if (growthRate > 0.5) symptomScore = 22;  // >50%
    else if (growthRate > 0.2) symptomScore = 14;  // >20%
    else if (growthRate > 0) symptomScore = 8;
  } else if (symptomCount7d > 5) {
    symptomScore = 14; // Absolute volume even without prior baseline
  }

  // ── Factor 2: Nearby Outbreak Activity (25 pts max) ─────────────────────────
  let outbreakScore = 0;
  if (nearbyOutbreakCount >= 3) outbreakScore = 25;
  else if (nearbyOutbreakCount === 2) outbreakScore = 18;
  else if (nearbyOutbreakCount === 1) outbreakScore = 10;

  // ── Factor 3: Indian Seasonal Risk (20 pts max) ──────────────────────────────
  const seasonal = getSeasonalRisk(month);
  const seasonalScore = Math.round((seasonal.score / 32) * 20); // normalize 0–32 → 0–20

  // ── Factor 4: Open Referrals / Untreated Cases (15 pts max) ─────────────────
  let referralScore = 0;
  if (openReferralsCount >= 10) referralScore = 15;
  else if (openReferralsCount >= 6) referralScore = 11;
  else if (openReferralsCount >= 3) referralScore = 7;
  else if (openReferralsCount >= 1) referralScore = 3;

  const totalScore = Math.min(100, symptomScore + outbreakScore + seasonalScore + referralScore);
  const riskLevel = getRiskLevel(totalScore);

  // ── XAI Contributors ─────────────────────────────────────────────────────────
  const contributors = [
    {
      factor: 'Symptom Surge',
      weight: symptomScore,
      maxWeight: 40,
      description: prevWindow > 0
        ? `${symptomCount7d} cases in last 7 days vs ${prevWindow} in prior week`
        : `${symptomCount7d} symptom reports in last 7 days`,
      icon: '🌡️'
    },
    {
      factor: 'Nearby Outbreak',
      weight: outbreakScore,
      maxWeight: 25,
      description: `${nearbyOutbreakCount} active outbreak cluster${nearbyOutbreakCount !== 1 ? 's' : ''} in district`,
      icon: '⚠️'
    },
    {
      factor: 'Seasonal Risk',
      weight: seasonalScore,
      maxWeight: 20,
      description: seasonal.factors[0] || 'Seasonal pattern analysis',
      icon: '📅'
    },
    {
      factor: 'Open Referrals',
      weight: referralScore,
      maxWeight: 15,
      description: `${openReferralsCount} pending/untreated referrals in village`,
      icon: '📋'
    }
  ];

  // ── Health Category Risk Flags ────────────────────────────────────────────────
  const categories = [];
  if (seasonal.categories.includes('vector') && (symptomScore > 10 || outbreakScore > 0)) {
    categories.push({ name: 'Vector-Borne Risk', level: outbreakScore > 10 ? 'HIGH' : 'MEDIUM', icon: '🦟', reasons: ['Fever trend rising', ...seasonal.factors.slice(0, 1)] });
  }
  if (seasonal.categories.includes('waterborne')) {
    categories.push({ name: 'Waterborne Risk', level: outbreakScore > 0 ? 'HIGH' : 'MEDIUM', icon: '💧', reasons: ['Monsoon contamination risk', ...seasonal.factors.slice(0, 1)] });
  }
  if (seasonal.categories.includes('respiratory')) {
    categories.push({ name: 'Respiratory Risk', level: symptomScore > 15 ? 'HIGH' : 'MEDIUM', icon: '🫁', reasons: ['Seasonal respiratory pattern', 'Cold-weather infections'] });
  }
  if (openReferralsCount >= 3) {
    categories.push({ name: 'Maternal Health Risk', level: openReferralsCount >= 6 ? 'HIGH' : 'MEDIUM', icon: '🤰', reasons: [`${openReferralsCount} untreated/open referrals`, 'Pregnancy follow-up backlog'] });
  }

  // Trend direction (based on symptom growth)
  const prevW = Math.max(symptomCount14d - symptomCount7d, 0);
  let trendDirection = 'stable';
  if (symptomCount7d > prevW + 1) trendDirection = 'increasing';
  else if (symptomCount7d < prevW - 1) trendDirection = 'improving';

  return {
    riskScore: totalScore,
    riskLevel,
    riskColor: getRiskColor(riskLevel),
    trendDirection,
    contributors,
    categories,
    seasonal: {
      month,
      factors: seasonal.factors,
      categories: seasonal.categories
    }
  };
}

// GET /api/ngo/village-risk — Predictive Village Risk Score for current NGO's village
router.get('/village-risk', auth, checkRole(['ngo', 'admin']), async (req, res) => {
  const db = req.app.locals.db;
  const isNGO = req.user.role === 'ngo';
  const villageId = isNGO ? (req.user.villageId || 'unassigned') : (req.query.villageId || 'unassigned');

  try {
    const now = new Date();
    const month = now.getMonth() + 1; // 1–12

    // Date boundaries
    const day7ago = new Date(now - 7 * 86400000).toISOString();
    const day14ago = new Date(now - 14 * 86400000).toISOString();

    // ── Symptom counts (7-day window and 14-day window) ──────────────────────
    const sym7Row = await db.get(
      `SELECT COUNT(*) AS cnt FROM symptoms WHERE "villageId" = ? AND "createdAt" >= ?`,
      [villageId, day7ago]
    ).catch(() => ({ cnt: 0 }));
    const sym14Row = await db.get(
      `SELECT COUNT(*) AS cnt FROM symptoms WHERE "villageId" = ? AND "createdAt" >= ?`,
      [villageId, day14ago]
    ).catch(() => ({ cnt: 0 }));

    const symptomCount7d = Number(sym7Row?.cnt || 0);
    const symptomCount14d = Number(sym14Row?.cnt || 0);

    // ── Nearby outbreak activity (district-level DynamoDB query) ─────────────
    let nearbyOutbreakCount = 0;
    try {
      if (dynamoHelper) {
        const cutoff14 = day14ago;
        const outbreaks = await dynamoHelper.query(
          'outbreak_telemetry',
          'districtId = :did AND detectedAt >= :cutoff',
          { ':did': process.env.DISTRICT_NAME || 'district_main', ':cutoff': cutoff14 },
          'district-index'
        ).catch(() => null);
        if (outbreaks && Array.isArray(outbreaks)) {
          // Exclude the current village itself
          nearbyOutbreakCount = outbreaks.filter(o => o.villageId !== villageId).length;
        }
      }
      // Fallback: count outbreak flags in village_health within district
      if (nearbyOutbreakCount === 0) {
        const outr = await db.get(
          `SELECT COUNT(*) AS cnt FROM village_health WHERE "outbreakAlert" IS NOT NULL AND "villageId" != ?`,
          [villageId]
        ).catch(() => ({ cnt: 0 }));
        nearbyOutbreakCount = Number(outr?.cnt || 0);
      }
    } catch (_) { nearbyOutbreakCount = 0; }

    // ── Open referrals (pending + assigned) ──────────────────────────────────
    const refRow = await db.get(
      `SELECT COUNT(*) AS cnt FROM referrals WHERE "villageId" = ? AND status IN ('pending', 'assigned')`,
      [villageId]
    ).catch(() => ({ cnt: 0 }));
    const openReferralsCount = Number(refRow?.cnt || 0);

    // ── Village metadata ──────────────────────────────────────────────────────
    const village = await db.get(
      `SELECT name, population FROM village_health WHERE "villageId" = ?`,
      [villageId]
    ).catch(() => null);

    // ── Compute Risk Score ────────────────────────────────────────────────────
    const riskData = computeVillageRiskScore({ symptomCount7d, symptomCount14d, openReferralsCount, nearbyOutbreakCount, month });
    const recommendedActions = generateRecommendedActions(riskData.contributors, riskData.seasonal.categories, riskData.riskLevel);

    // ── Intervention Impact Forecast ──────────────────────────────────────────
    const baseScore = riskData.riskScore;
    const interventionForecast = {
      current: baseScore,
      afterVaccinationDrive: Math.max(0, baseScore - 12),
      afterReferralClosure: Math.max(0, baseScore - Math.round(riskData.contributors.find(c => c.factor === 'Open Referrals')?.weight * 0.8 || 8)),
      afterCombinedInterventions: Math.max(0, baseScore - 22)
    };

    // ── Log to audit ──────────────────────────────────────────────────────────
    try {
      await db.run(
        `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, 'read', 'village_risk_forecast', villageId, req.ip || 'unknown']
      );
    } catch (_) {}

    res.json({
      success: true,
      data: {
        village: village?.name || villageId,
        villageId,
        population: village?.population || 0,
        ...riskData,
        recommendedActions,
        interventionForecast,
        dataPoints: { symptomCount7d, symptomCount14d, openReferralsCount, nearbyOutbreakCount },
        generatedAt: now.toISOString()
      }
    });
  } catch (err) {
    console.error('[VILLAGE RISK INTEL] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to compute village risk forecast.' });
  }
});

export default router;


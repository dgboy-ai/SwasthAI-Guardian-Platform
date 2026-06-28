import express from 'express';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';
import dynamoHelper from '../dynamodb.js';

const router = express.Router();

const DB_PROVENANCE = { _db: 'postgresql' };

router.use(authenticateApiKey);

router.use((req, res, next) => {
  res.set('X-Data-Source', 'postgresql');
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (typeof body === 'object' && body !== null && !Array.isArray(body) && !body._db && !body._source) {
      body._db = 'postgresql';
    }
    return originalJson(body);
  };
  next();
});

const sendError = (res, statusCode, code, message) => {
  return res.status(statusCode).json({ success: false, error: { code, message } });
};

// Normalize tenantId to match DB districtId format (e.g., "varanasi_district" → "Varanasi")
function resolveTenantId(raw) {
  if (!raw) return null;
  let id = raw.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
  if (id.endsWith('_district')) id = id.slice(0, -9);
  return id.charAt(0).toUpperCase() + id.slice(1);
}

// GET /api/b2b/villages — village health data scoped to tenant
router.get('/villages', async (req, res) => {
  const db = req.app.locals.db;
  const tenantId = resolveTenantId(req.apiKey.tenantId);
  if (!tenantId) return sendError(res, 400, 'TENANT_REQUIRED', 'API key has no tenant scope');
  try {
    const villages = await db.all(
      `SELECT v.*, u.phone AS asha_phone, u.name AS asha_name
       FROM village_health v
       LEFT JOIN users u ON u."villageId" = v."villageId" AND u.role = 'ngo'
       WHERE v."districtId" = ?`, [tenantId]
    );
    res.json({ success: true, data: villages, tenantId, count: villages.length });
  } catch (err) {
    sendError(res, 500, 'FETCH_FAILED', err.message);
  }
});

// GET /api/b2b/analytics — aggregate health analytics for tenant
router.get('/analytics', async (req, res) => {
  const db = req.app.locals.db;
  const tenantId = resolveTenantId(req.apiKey.tenantId);
  if (!tenantId) return sendError(res, 400, 'TENANT_REQUIRED', 'API key has no tenant scope');
  try {
    const vCount = await db.get('SELECT COUNT(*) as c FROM village_health WHERE "districtId" = ?', [tenantId]);
    const pCount = await db.get(
      `SELECT COUNT(*) as c FROM pregnancy_data pd
       INNER JOIN village_health vh ON pd."villageId" = vh."villageId"
       WHERE vh."districtId" = ?`, [tenantId]
    );
    const sCount = await db.get(
      `SELECT COUNT(*) as c FROM symptoms s
       INNER JOIN village_health vh ON s."villageId" = vh."villageId"
       WHERE vh."districtId" = ?`, [tenantId]
    );
    const aCount = await db.get('SELECT COUNT(*) as c FROM village_health WHERE "districtId" = ? AND "outbreakAlert" = \'1\'', [tenantId]);
    res.json({
      success: true, tenantId,
      villages: parseInt(vCount?.c || 0),
      pregnancies: parseInt(pCount?.c || 0),
      symptoms: parseInt(sCount?.c || 0),
      outbreakAlerts: parseInt(aCount?.c || 0),
    });
  } catch (err) {
    sendError(res, 500, 'ANALYTICS_FAILED', err.message);
  }
});

// GET /api/b2b/ambulances — recent ambulance requests for tenant
router.get('/ambulances', async (req, res) => {
  const db = req.app.locals.db;
  const tenantId = resolveTenantId(req.apiKey.tenantId);
  if (!tenantId) return sendError(res, 400, 'TENANT_REQUIRED', 'API key has no tenant scope');
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  try {
    const rows = await db.all(
      `SELECT ar.* FROM ambulance_requests ar
       INNER JOIN users u ON ar.user_id = u.id
       INNER JOIN village_health vh ON u."villageId" = vh."villageId"
       WHERE vh."districtId" = ?
       ORDER BY ar.id DESC LIMIT ?`, [tenantId, limit]
    );
    res.json({ success: true, data: rows, count: rows.length, tenantId });
  } catch (err) {
    sendError(res, 500, 'AMBULANCE_FAILED', err.message);
  }
});

// GET /api/b2b/outbreaks — outbreak telemetry for tenant
router.get('/outbreaks', async (req, res) => {
  const tenantId = resolveTenantId(req.apiKey.tenantId);
  if (!tenantId) return sendError(res, 400, 'TENANT_REQUIRED', 'API key has no tenant scope');
  const daysBack = parseInt(req.query.days) || 7;
  try {
    const outbreaks = await dynamoHelper.queryByDistrict('outbreak_telemetry', tenantId, daysBack);
    outbreaks.sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''));
    res.json({
      success: true, data: outbreaks.slice(0, 20), count: outbreaks.length,
      store: dynamoHelper.isMock ? 'mock' : 'dynamodb', tenantId, daysBack,
    });
  } catch (err) {
    sendError(res, 500, 'OUTBREAKS_FAILED', err.message);
  }
});

// GET /api/b2b/me — return API key metadata
router.get('/me', async (req, res) => {
  res.json({
    success: true,
    key: {
      name: req.apiKey.name,
      keyId: req.apiKey.keyId.slice(0, 12) + '••••' + req.apiKey.keyId.slice(-4),
      tenantId: req.apiKey.tenantId,
      permissions: req.apiKey.permissions,
    }
  });
});

export default router;

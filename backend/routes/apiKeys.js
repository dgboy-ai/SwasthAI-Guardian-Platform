import express from 'express';
import crypto from 'crypto';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/policy.js';

const router = express.Router();

const sendError = (res, statusCode, code, message, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, details }
  });
};

function generateKeyId() {
  return 'sk_live_' + crypto.randomBytes(24).toString('hex');
}

function maskKey(keyId) {
  return keyId.slice(0, 12) + '••••' + keyId.slice(-4);
}

// POST /api/admin/api-keys — generate a new API key
router.post('/', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  const { name, tenantId, permissions } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return sendError(res, 400, 'KEY_NAME_REQUIRED', 'Key name is required');
  }
  const keyId = generateKeyId();
  const perm = permissions || 'read';
  try {
    const result = await db.run(
      `INSERT INTO api_keys (key_id, name, tenant_id, created_by, permissions) VALUES (?, ?, ?, ?, ?)`,
      [keyId, name.trim(), tenantId || null, req.user.id, perm]
    );
    res.status(201).json({
      success: true,
      key: {
        id: result.lastID,
        keyId,
        name: name.trim(),
        tenantId: tenantId || null,
        permissions: perm,
        createdAt: new Date().toISOString(),
        isActive: true,
        masked: maskKey(keyId),
      }
    });
  } catch (err) {
    sendError(res, 500, 'KEY_CREATE_FAILED', err.message);
  }
});

// GET /api/admin/api-keys — list all API keys (masked)
router.get('/', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const rows = await db.all(
      `SELECT id, key_id, name, tenant_id, created_by, created_at, last_used_at, expires_at, is_active, permissions, usage_count
       FROM api_keys ORDER BY created_at DESC`
    );
    const keys = rows.map(r => ({
      id: r.id,
      keyId: maskKey(r.key_id),
      name: r.name,
      tenantId: r.tenant_id,
      createdBy: r.created_by,
      createdAt: r.created_at,
      lastUsedAt: r.last_used_at,
      expiresAt: r.expires_at,
      isActive: !!r.is_active,
      permissions: r.permissions,
      usageCount: r.usage_count || 0,
    }));
    res.json({ success: true, keys });
  } catch (err) {
    sendError(res, 500, 'KEY_LIST_FAILED', err.message);
  }
});

// PUT /api/admin/api-keys/:id/toggle — activate / deactivate
router.put('/:id/toggle', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const row = await db.get('SELECT is_active FROM api_keys WHERE id = ?', [req.params.id]);
    if (!row) return sendError(res, 404, 'KEY_NOT_FOUND', 'Key not found');
    const newState = row.is_active ? 0 : 1;
    await db.run('UPDATE api_keys SET is_active = ? WHERE id = ?', [newState, req.params.id]);
    res.json({ success: true, isActive: !!newState });
  } catch (err) {
    sendError(res, 500, 'KEY_TOGGLE_FAILED', err.message);
  }
});

// DELETE /api/admin/api-keys/:id — revoke a key
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const existing = await db.get('SELECT id FROM api_keys WHERE id = ?', [req.params.id]);
    if (!existing) return sendError(res, 404, 'KEY_NOT_FOUND', 'Key not found');
    await db.run('DELETE FROM api_keys WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    sendError(res, 500, 'KEY_DELETE_FAILED', err.message);
  }
});

// GET /api/admin/api-keys/usage — usage stats per key
router.get('/usage', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const rows = await db.all(
      `SELECT id, name, key_id, usage_count, last_used_at, is_active FROM api_keys ORDER BY usage_count DESC`
    );
    const totalUsage = rows.reduce((s, r) => s + (r.usage_count || 0), 0);
    const activeKeys = rows.filter(r => r.is_active).length;
    res.json({
      success: true,
      totalKeys: rows.length,
      activeKeys,
      totalUsage,
      keys: rows.map(r => ({
        id: r.id,
        name: r.name,
        usageCount: r.usage_count || 0,
        lastUsedAt: r.last_used_at,
      })),
    });
  } catch (err) {
    sendError(res, 500, 'KEY_USAGE_FAILED', err.message);
  }
});

// GET /api/admin/b2b/usage — multi-tenant usage overview
router.get('/b2b/usage', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [keys, villages, villageCounts] = await Promise.all([
      db.all(`SELECT tenant_id, COUNT(*) AS key_count, SUM(usage_count) AS total_usage, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_keys
              FROM api_keys GROUP BY tenant_id ORDER BY total_usage DESC`).catch(() => []),
      db.all(`SELECT DISTINCT "districtId" AS tenant_id FROM village_health WHERE "districtId" IS NOT NULL`).catch(() => []),
      db.all(`SELECT v."districtId" AS tenant_id, COUNT(*) AS village_count, SUM(v.population) AS total_population,
              SUM(COALESCE(v.pregnant_women, 0)) AS total_pregnancies, SUM(COALESCE(v.malnutrition_cases, 0)) AS total_malnutrition
              FROM village_health v WHERE v."districtId" IS NOT NULL GROUP BY v."districtId"`).catch(() => []),
    ]);

    const tenantIds = new Set([
      ...keys.map(k => k.tenant_id),
      ...villages.map(v => v.tenant_id),
      ...villageCounts.map(v => v.tenant_id),
    ].filter(Boolean));

    const tenants = await Promise.all(Array.from(tenantIds).map(async (tenantId) => {
      const keyInfo = keys.find(k => k.tenant_id === tenantId);
      const vcInfo = villageCounts.find(v => v.tenant_id === tenantId);
      const userCount = await db.get(`SELECT COUNT(*) AS cnt FROM users WHERE role = 'villager' AND "villageId" IN (SELECT "villageId" FROM village_health WHERE "districtId" = ?)`, [tenantId]).catch(() => ({ cnt: 0 }));
      const recordCounts = await Promise.all([
        db.get(`SELECT COUNT(*) AS cnt FROM symptoms WHERE "villageId" IN (SELECT "villageId" FROM village_health WHERE "districtId" = ?)`, [tenantId]).catch(() => ({ cnt: 0 })),
        db.get(`SELECT COUNT(*) AS cnt FROM pregnancy_data WHERE "villageId" IN (SELECT "villageId" FROM village_health WHERE "districtId" = ?)`, [tenantId]).catch(() => ({ cnt: 0 })),
        db.get(`SELECT COUNT(*) AS cnt FROM ambulance_requests WHERE "villageId" IN (SELECT "villageId" FROM village_health WHERE "districtId" = ?)`, [tenantId]).catch(() => ({ cnt: 0 })),
      ]);
      return {
        tenantId,
        apiKeys: keyInfo ? { total: keyInfo.key_count, active: keyInfo.active_keys, totalCalls: Number(keyInfo.total_usage) || 0 } : { total: 0, active: 0, totalCalls: 0 },
        villages: vcInfo ? { total: vcInfo.village_count, population: Number(vcInfo.total_population) || 0, pregnancies: Number(vcInfo.total_pregnancies) || 0, malnutrition: Number(vcInfo.total_malnutrition) || 0 } : { total: 0, population: 0, pregnancies: 0, malnutrition: 0 },
        users: Number(userCount?.cnt || 0),
        records: { symptoms: Number(recordCounts[0]?.cnt || 0), pregnancies: Number(recordCounts[1]?.cnt || 0), emergencies: Number(recordCounts[2]?.cnt || 0) },
      };
    }));

    const totals = tenants.reduce((s, t) => ({
      totalKeys: s.totalKeys + t.apiKeys.total,
      totalCalls: s.totalCalls + t.apiKeys.totalCalls,
      totalVillages: s.totalVillages + t.villages.total,
      totalUsers: s.totalUsers + t.users,
      totalRecords: s.totalRecords + t.records.symptoms + t.records.pregnancies + t.records.emergencies,
    }), { totalKeys: 0, totalCalls: 0, totalVillages: 0, totalUsers: 0, totalRecords: 0 });

    res.json({ success: true, tenants, totals, generatedAt: new Date().toISOString() });
  } catch (err) {
    sendError(res, 500, 'B2B_USAGE_FAILED', err.message);
  }
});

export default router;

import express from 'express';
import crypto from 'crypto';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/policy.js';

const router = express.Router();

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
    return res.status(400).json({ success: false, error: 'Key name is required' });
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/api-keys/:id/toggle — activate / deactivate
router.put('/:id/toggle', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const row = await db.get('SELECT is_active FROM api_keys WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, error: 'Key not found' });
    const newState = row.is_active ? 0 : 1;
    await db.run('UPDATE api_keys SET is_active = ? WHERE id = ?', [newState, req.params.id]);
    res.json({ success: true, isActive: !!newState });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/api-keys/:id — revoke a key
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const existing = await db.get('SELECT id FROM api_keys WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Key not found' });
    await db.run('DELETE FROM api_keys WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

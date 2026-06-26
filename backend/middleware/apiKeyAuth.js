// ── API Key Authentication Middleware ─────────────────────────────────────
// Validates x-api-key header against the api_keys table.
// Tracks usage_count and last_used_at on each successful auth.

export async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'Missing x-api-key header' });
  }

  const db = req.app.locals.db;
  try {
    const row = await db.get(
      `SELECT id, key_id, name, tenant_id, is_active, permissions, usage_count
       FROM api_keys WHERE key_id = ?`,
      [apiKey]
    );

    if (!row) {
      return res.status(403).json({ success: false, error: 'Invalid API key' });
    }
    if (!row.is_active) {
      return res.status(403).json({ success: false, error: 'API key is disabled' });
    }

    // Track usage
    await db.run(
      'UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [row.id]
    );

    // Attach tenant context from the API key
    req.apiKey = {
      id: row.id,
      name: row.name,
      keyId: row.key_id,
      tenantId: row.tenant_id,
      permissions: row.permissions,
    };
    if (row.tenant_id && !req.user?.villageId) {
      req.user = req.user || {};
      req.user.villageId = row.tenant_id;
    }

    next();
  } catch (err) {
    console.error('[API Key Auth Error]', err.message);
    res.status(500).json({ success: false, error: 'Internal auth error' });
  }
}

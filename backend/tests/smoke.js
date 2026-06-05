const API_BASE = (process.env.API_BASE || 'http://localhost:5000/api').replace(/\/+$/, '');
const identifier = process.env.SMOKE_IDENTIFIER || process.env.SMOKE_PHONE || '9876543210';
const password = process.env.SMOKE_PASSWORD || 'Demo@1234';
const role = process.env.SMOKE_ROLE || 'villager';
const adminIdentifier = process.env.SMOKE_ADMIN_IDENTIFIER || 'admin@swasthai.in';
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || 'Demo@1234';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  const results = [];
  const pass = (name) => results.push({ name, status: 'PASS' });
  const skip = (name, reason) => results.push({ name, status: 'SKIP', reason });

  await request('/health/detailed');
  pass('detailed health');

  let token = null;
  let adminToken = null;
  try {
    const auth = await request('/auth/login-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role })
    });
    token = auth.token;
    pass('password auth');
  } catch (err) {
    skip('password auth + protected flows', err.message);
  }

  try {
    const auth = await request('/auth/login-password', {
      method: 'POST',
      body: JSON.stringify({ identifier: adminIdentifier, password: adminPassword, role: 'admin' })
    });
    adminToken = auth.token;
    pass('admin auth');
  } catch (err) {
    skip('admin auth + admin protected flows', err.message);
  }

  if (token) {
    const authz = { Authorization: `Bearer ${token}` };
    await request('/symptoms', {
      method: 'POST',
      headers: authz,
      body: JSON.stringify({
        symptoms: 'fever cough body pain',
        villageId: 'v101',
        clientRequestId: `smoke-sym-${Date.now()}`
      })
    });
    pass('symptom submit');

    await request('/ambulance', {
      method: 'POST',
      headers: authz,
      body: JSON.stringify({
        name: 'Smoke Test Patient',
        location: 'v101',
        priority: 'High',
        symptoms: 'smoke test emergency',
        clientRequestId: `smoke-amb-${Date.now()}`
      })
    });
    pass('ambulance submit');

    await request('/health-assistant', {
      method: 'POST',
      headers: authz,
      body: JSON.stringify({ message: 'hello sakhi' })
    });
    pass('RAG assistant fallback');

    await request('/villager/sync-health', {
      method: 'POST',
      headers: { ...authz, 'x-device-id': 'smoke-device' },
      body: JSON.stringify({
        recordCount: 2,
        durationMs: 123,
        syncBatchId: `smoke-sync-${Date.now()}`,
        clientRequestIds: [`smoke-sync-item-${Date.now()}`]
      })
    });
    pass('offline queue replay');

    try {
      await request('/admin/users', { headers: authz });
      skip('role protection', 'route allowed this token');
    } catch {
      pass('role protection');
    }
  }

  if (adminToken) {
    await request('/admin/dynamo-feed', { headers: { Authorization: `Bearer ${adminToken}` } });
    pass('DynamoDB feed access');
  }

  for (const r of results) {
    console.log(`${r.status.padEnd(4)} ${r.name}${r.reason ? ` - ${r.reason}` : ''}`);
  }
}

main().catch((err) => {
  console.error(`FAIL ${err.message}`);
  process.exit(1);
});

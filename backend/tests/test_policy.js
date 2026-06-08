// backend/tests/test_policy.js
import assert from 'assert';

const API_BASE = (process.env.API_BASE || 'http://localhost:5000/api').replace(/\/+$/, '');

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
  return { status: res.status, body };
}

async function main() {
  console.log("=== RUNNING AUTHZ AND IDOR POLICY TESTS ===");

  // 1. Authenticate users
  console.log("\nLogging in test users...");
  
  const villagerAuth = await request('/auth/login-password', {
    method: 'POST',
    body: JSON.stringify({ identifier: '9876543210', password: 'Demo@1234', role: 'villager' })
  });
  assert.strictEqual(villagerAuth.status, 200, "Villager login failed");
  const villagerToken = villagerAuth.body.token;
  const villagerHeaders = { Authorization: `Bearer ${villagerToken}` };

  const ashaAuth = await request('/auth/login-password', {
    method: 'POST',
    body: JSON.stringify({ identifier: '9876543211', password: 'Demo@1234', role: 'ngo' })
  });
  assert.strictEqual(ashaAuth.status, 200, "ASHA login failed");
  const ashaToken = ashaAuth.body.token;
  const ashaHeaders = { Authorization: `Bearer ${ashaToken}` };

  console.log("Tokens retrieved successfully!");

  // 2. Test Role Protection (Villager accessing NGO routes)
  console.log("\nTesting: Role protection (Villager accessing NGO routes)...");
  const test1 = await request('/ngo/maternal', { headers: villagerHeaders });
  assert.strictEqual(test1.status, 403, "Villager was not blocked from accessing NGO maternal list");
  console.log("✅ Passed: Villager blocked from GET /ngo/maternal (403)");

  const test2 = await request('/ngo/malnutrition', { headers: villagerHeaders });
  assert.strictEqual(test2.status, 403, "Villager was not blocked from accessing NGO malnutrition list");
  console.log("✅ Passed: Villager blocked from GET /ngo/malnutrition (403)");

  // 3. Test Admin-only Routes
  console.log("\nTesting: Admin-only protection...");
  const test3 = await request('/admin/users', { headers: villagerHeaders });
  assert.strictEqual(test3.status, 403, "Villager was not blocked from admin routes");
  console.log("✅ Passed: Villager blocked from admin routes (403)");

  const test4 = await request('/admin/users', { headers: ashaHeaders });
  assert.strictEqual(test4.status, 403, "NGO was not blocked from admin routes");
  console.log("✅ Passed: NGO blocked from admin routes (403)");

  // 4. Test IDOR prevention (NGO accessing other villages)
  console.log("\nTesting: IDOR prevention (ASHA updating village data other than their assigned 'v101')...");
  const test5 = await request('/ngo/village', {
    method: 'POST',
    headers: ashaHeaders,
    body: JSON.stringify({
      villageId: 'v102', // different village (assigned is v101)
      name: 'Unauthorized Edit',
      population: 9999
    })
  });
  assert.strictEqual(test5.status, 403, "NGO was allowed to update v102's details");
  assert.strictEqual(test5.body.error?.code, 'IDOR_PREVENTED', "Error code was not IDOR_PREVENTED");
  console.log("✅ Passed: NGO blocked from updating v102 (403 IDOR_PREVENTED)");

  // 5. Test Villager IDOR prevention on seasonal risk check
  console.log("\nTesting: Villager IDOR on seasonal risk checking...");
  const test6 = await request('/predict/seasonal-risk?villageId=v102', { headers: villagerHeaders });
  assert.strictEqual(test6.status, 403, "Villager was allowed to query seasonal risk for another village");
  assert.strictEqual(test6.body.error?.code, 'IDOR_PREVENTED', "Error code was not IDOR_PREVENTED");
  console.log("✅ Passed: Villager blocked from querying other village seasonal risk (403 IDOR_PREVENTED)");

  console.log("\n✅ ALL AUTHZ AND IDOR POLICY TESTS COMPLETED SUCCESSFULLY!");
}

main().catch(err => {
  console.error("\n❌ TESTS FAILED!");
  console.error(err);
  process.exit(1);
});

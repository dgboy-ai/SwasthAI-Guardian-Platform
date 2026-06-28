import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:4RY.gHAt7qZS!D3@swasthai-cluster.cluster-cxogawss0dg2.ap-south-1.rds.amazonaws.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

try {
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'api_keys'");
  console.log('Table exists:', tables.rows.length > 0);
  
  const keyId = 'sk_live_test_' + crypto.randomBytes(8).toString('hex');
  const result = await pool.query(
    'INSERT INTO api_keys (key_id, name, tenant_id, created_by, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [keyId, 'APITest', 'varanasi_district', 3, 'read']
  );
  console.log('Insert result:', JSON.stringify(result.rows[0]));
  
  await pool.query('DELETE FROM api_keys WHERE key_id = $1', [keyId]);
  console.log('Cleanup done');
} catch(e) {
  console.error('Error:', e.message, e.stack);
}
await pool.end();

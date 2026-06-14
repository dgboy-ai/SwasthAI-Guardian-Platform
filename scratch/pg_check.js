const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

console.log('Database URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function check() {
  console.log('Attempting to connect to PostgreSQL...');
  const t0 = Date.now();
  try {
    const res = await pool.query('SELECT 1 + 1 AS result');
    console.log(`✅ Success! Query returned:`, res.rows[0]);
    console.log(`Time taken: ${Date.now() - t0}ms`);
  } catch (err) {
    console.error(`❌ Connection failed!`);
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();

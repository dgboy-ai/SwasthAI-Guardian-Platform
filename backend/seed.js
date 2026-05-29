/**
 * SwasthAI Demo Seed Script (PostgreSQL Aurora Edition)
 * Creates 3 known working demo accounts for hackathon evaluation.
 * 
 * Run: node seed.js
 * 
 * Accounts created:
 *   Villager: phone=9876543210, password=Demo@1234, role=villager
 *   NGO/ASHA: phone=9876543211, password=Demo@1234, role=ngo
 *   Admin:    email=admin@swasthai.in, password=Demo@1234, role=admin
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool matching server.js configurations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/swasthai',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const DEMO_PASSWORD = 'Demo@1234';

async function seed() {
  console.log('⚡ Initializing database seed execution on PostgreSQL...');
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const accounts = [
    { phone: '9876543210', email: 'villager@swasthai.in', username: 'demo_villager', name: 'Ramesh Kumar', role: 'villager', villageId: 'v101' },
    { phone: '9876543211', email: 'asha@swasthai.in',    username: 'demo_asha',     name: 'Sita Devi (ASHA)', role: 'ngo',      villageId: 'v101' },
    { phone: '9876543212', email: 'admin@swasthai.in',   username: 'demo_admin',    name: 'CMO Varanasi',     role: 'admin',    villageId: null   },
  ];

  for (const acc of accounts) {
    try {
      // Delete existing demo account with this phone or email first
      await pool.query('DELETE FROM users WHERE phone = $1 OR email = $2', [acc.phone, acc.email]);
      
      // Insert new PostgreSQL-compatible record
      await pool.query(
        'INSERT INTO users (phone, email, username, name, password, role, "villageId") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [acc.phone, acc.email, acc.username, acc.name, hash, acc.role, acc.villageId]
      );
      
      console.log(`✅ Seeded ${acc.role}: ${acc.name} (phone: ${acc.phone})`);
    } catch (err) {
      console.error(`❌ Failed to seed ${acc.role}:`, err.message);
    }
  }

  await pool.end();

  console.log('\n🎉 Demo accounts ready in PostgreSQL!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Role     │ Phone/Email          │ Password  ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Villager │ 9876543210           │ Demo@1234');
  console.log('  NGO/ASHA │ 9876543211           │ Demo@1234');
  console.log('  Admin    │ admin@swasthai.in    │ Demo@1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  OTP Login: Use OTP = 1234 for any account');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch((err) => {
  console.error('Fatal seed failure:', err);
  process.exit(1);
});

/**
 * SwasthAI Demo Seed Script (PostgreSQL Aurora Edition)
 * Creates known working demo accounts and clinical/operational data for hackathon evaluation.
 * 
 * Run: node seed.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool matching server.js configurations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:5432/${process.env.DB_NAME || 'swasthai'}`,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const DEMO_PASSWORD = 'Demo@1234';

async function seed() {
  console.log('⚡ Initializing database seed execution on PostgreSQL...');
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Clear existing demo records to ensure idempotency
  console.log('🧹 Clearing existing demo records...');
  await pool.query('DELETE FROM users WHERE username IN ($1, $2, $3)', ['demo_villager', 'demo_asha', 'demo_admin']);
  await pool.query('DELETE FROM village_health WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);
  await pool.query('DELETE FROM pregnancy_data WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);
  await pool.query('DELETE FROM malnutrition_data WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);
  await pool.query('DELETE FROM symptoms WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);
  await pool.query('DELETE FROM ambulance_requests WHERE priority IN ($1, $2, $3, $4)', ['High', 'Medium', 'Low', 'Pad Request']);

  // 2. Seed Users
  const accounts = [
    { phone: '9876543210', email: 'villager@swasthai.in', username: 'demo_villager', name: 'Ramesh Kumar', role: 'villager', villageId: 'v101' },
    { phone: '9876543211', email: 'asha@swasthai.in',    username: 'demo_asha',     name: 'Sita Devi (ASHA)', role: 'ngo',      villageId: 'v101' },
    { phone: '9876543212', email: 'admin@swasthai.in',   username: 'demo_admin',    name: 'CMO Varanasi',     role: 'admin',    villageId: null   },
  ];

  console.log('👤 Seeding users...');
  for (const acc of accounts) {
    await pool.query(
      'INSERT INTO users (phone, email, username, name, password, role, "villageId") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [acc.phone, acc.email, acc.username, acc.name, hash, acc.role, acc.villageId]
    );
    console.log(`   ✅ Seeded user ${acc.username} (${acc.role})`);
  }

  // Get demo villager ID for symptoms mapping
  const villagerRes = await pool.query('SELECT id FROM users WHERE username = $1', ['demo_villager']);
  const villagerId = villagerRes.rows[0]?.id || 1;

  // 3. Seed Villages
  const villages = [
    { villageId: 'v101', name: 'Rampur', population: 1200, pregnant: 14, children: 89, malnutrition: 7, asha: '9876543211' },
    { villageId: 'v102', name: 'Mohanlal Ganj', population: 850, pregnant: 9, children: 63, malnutrition: 4, asha: '9876543213' }
  ];

  console.log('🏘️ Seeding village health records...');
  for (const v of villages) {
    await pool.query(
      `INSERT INTO village_health ("villageId", name, population, pregnant_women, children_under_5, malnutrition_cases, asha_contact, "lastUpdated")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [v.villageId, v.name, v.population, v.pregnant, v.children, v.malnutrition, v.asha]
    );
    console.log(`   ✅ Seeded village ${v.name}`);
  }

  // 4. Seed Pregnancies
  const pregnancies = [
    { name: 'Sunita Devi', age: 24, trimester: 3, risk: 'High', dueDate: '2026-08-15', villageId: 'v101' },
    { name: 'Meena Kumari', age: 21, trimester: 2, risk: 'Low', dueDate: '2026-11-05', villageId: 'v101' },
    { name: 'Priyanka Singh', age: 28, trimester: 1, risk: 'Medium', dueDate: '2027-01-20', villageId: 'v102' }
  ];

  console.log('🤰 Seeding pregnancy tracking records...');
  for (const p of pregnancies) {
    await pool.query(
      `INSERT INTO pregnancy_data (name, age, trimester, "riskLevel", "dueDate", "villageId")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [p.name, p.age, p.trimester, p.risk, p.dueDate, p.villageId]
    );
  }
  console.log('   ✅ Seeded pregnancy_data');

  // 5. Seed Malnutrition
  const malnutrition = [
    { childName: 'Raju', ageMonths: 24, weight: 11.2, height: 85.0, status: 'Moderate', villageId: 'v101' },
    { childName: 'Priya', ageMonths: 36, weight: 14.5, height: 95.0, status: 'Normal', villageId: 'v101' },
    { childName: 'Aarav', ageMonths: 18, weight: 8.5, height: 72.5, status: 'Severe', villageId: 'v102' }
  ];

  console.log('👶 Seeding malnutrition tracking records...');
  for (const m of malnutrition) {
    await pool.query(
      `INSERT INTO malnutrition_data ("childName", "ageMonths", weight, height, status, "villageId")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [m.childName, m.ageMonths, m.weight, m.height, m.status, m.villageId]
    );
  }
  console.log('   ✅ Seeded malnutrition_data');

  // 6. Seed Symptom Reports
  const symptoms = [
    { userId: villagerId, villageId: 'v101', symptoms: 'Fever, cough, body pain for 3 days', prediction: 'Mild Viral Infection - Maintain hydration, isolate, report if temp exceeds 102F' },
    { userId: villagerId, villageId: 'v101', symptoms: 'Severe dehydration, vomiting, diarrhoea', prediction: 'Moderate Gastroenteritis - Advise ORS and Zinc, monitor urine output' }
  ];

  console.log('🩺 Seeding symptom prediction logs...');
  for (const s of symptoms) {
    await pool.query(
      `INSERT INTO symptoms ("userId", "villageId", symptoms, prediction)
       VALUES ($1, $2, $3, $4)`,
      [s.userId, s.villageId, s.symptoms, s.prediction]
    );
  }
  console.log('   ✅ Seeded symptoms');

  // 7. Seed Ambulance & Operations Requests
  const requests = [
    { user_id: villagerId, name: 'Ramesh Kumar', location: 'Rampur, Near Primary School', priority: 'High', type: 'emergency', symptoms: 'Severe chest pain and difficulty breathing', status: 'pending' },
    { user_id: villagerId, name: 'Sita Devi', location: 'ASHA Center रामपुर', priority: 'Pad Request', type: 'operation', symptoms: 'Confidential request for sanitary pads supply', status: 'pending' }
  ];

  console.log('🚨 Seeding operational & ambulance requests...');
  for (const r of requests) {
    await pool.query(
      `INSERT INTO ambulance_requests (user_id, name, location, priority, type, symptoms, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [r.user_id, r.name, r.location, r.priority, r.type, r.symptoms, r.status]
    );
  }
  console.log('   ✅ Seeded ambulance_requests');

  await pool.end();

  console.log('\n🎉 PostgreSQL database seeding completed successfully!');
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

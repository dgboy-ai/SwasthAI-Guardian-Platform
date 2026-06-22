/**
 * SwasthAI Demo Seed Script (PostgreSQL Aurora Edition)
 * Creates known working demo accounts and clinical/operational data for evaluation.
 * 
 * Run: node seed.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Prevent any seeding execution in production
if (process.env.NODE_ENV === 'production') {
  console.error('❌ CRITICAL: Seeding is blocked in production environment to prevent credentials vulnerability!');
  process.exit(1);
}

// Create connection pool matching server.js configurations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:5432/${process.env.DB_NAME || 'swasthai'}`,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const DEMO_PASSWORD = 'Demo@1234';

async function seed() {
  console.log('⚡ Initializing database seed execution on PostgreSQL...');
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Clear existing demo records to ensure dependency deletion order
  console.log('🧹 Clearing existing demo records...');
  await pool.query('DELETE FROM referrals WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);
  await pool.query('DELETE FROM vaccination_records WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);
  await pool.query('DELETE FROM asha_performance');
  await pool.query('DELETE FROM audit_logs');
  await pool.query('DELETE FROM district_config');
  await pool.query('DELETE FROM symptoms WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);
  await pool.query('DELETE FROM malnutrition_data WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);
  await pool.query('DELETE FROM pregnancy_data WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);
  await pool.query('DELETE FROM ambulance_requests WHERE priority IN ($1, $2, $3, $4)', ['High', 'Medium', 'Low', 'Pad Request']);
  await pool.query('DELETE FROM users WHERE username IN ($1, $2, $3)', ['demo_villager', 'demo_asha', 'demo_admin']);
  await pool.query('DELETE FROM village_health WHERE "villageId" IN ($1, $2)', ['v101', 'v102']);

  // 2. Seed Villages first (parent key for users.villageId)
  const villages = [
    { villageId: 'v101', name: 'Rampur', population: 1200, pregnant: 14, children: 89, malnutrition: 7, asha: '9876543211' },
    { villageId: 'v102', name: 'Mohanlal Ganj', population: 850, pregnant: 9, children: 63, malnutrition: 4, asha: '9876543213' }
  ];

  console.log('🏘️ Seeding village health records...');
  for (const v of villages) {
    await pool.query(
      `INSERT INTO village_health ("villageId", name, population, pregnant_women, children_under_5, malnutrition_cases, asha_contact, "lastUpdated")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) ON CONFLICT ("villageId") DO NOTHING`,
      [v.villageId, v.name, v.population, v.pregnant, v.children, v.malnutrition, v.asha]
    );
    console.log(`   ✅ Seeded village ${v.name}`);
  }

  // 3. Seed Users next (referencing villageId)
  const accounts = [
    { phone: '9876543210', email: 'villager@swasthai.in', username: 'demo_villager', name: 'Ramesh Kumar', role: 'villager', villageId: 'v101' },
    { phone: '9876543211', email: 'asha@swasthai.in',    username: 'demo_asha',     name: 'Sita Devi (ASHA)', role: 'ngo',      villageId: 'v101' },
    { phone: '9876543212', email: 'admin@swasthai.in',   username: 'demo_admin',    name: 'CMO Varanasi',     role: 'admin',    villageId: null   },
  ];

  console.log('👤 Seeding users...');
  for (const acc of accounts) {
    await pool.query(
      `INSERT INTO users (phone, email, username, name, password, role, "villageId") 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (phone) DO NOTHING`,
      [acc.phone, acc.email, acc.username, acc.name, hash, acc.role, acc.villageId]
    );
    console.log(`   ✅ Seeded user ${acc.username} (${acc.role})`);
  }

  // 4. Resolve user IDs dynamically to avoid hardcoded IDs
  const ashaRes = await pool.query("SELECT id FROM users WHERE username = 'demo_asha'");
  const ashaId = ashaRes.rows[0]?.id || null;

  const villagerRes = await pool.query("SELECT id FROM users WHERE username = 'demo_villager'");
  const villagerId = villagerRes.rows[0]?.id || null;

  // 5. Seed Pregnancies
  const pregnancies = [
    { name: 'Sunita Devi', age: 24, trimester: 3, risk: 'High', dueDate: '2026-08-15', villageId: 'v101' },
    { name: 'Meena Kumari', age: 21, trimester: 2, risk: 'Low', dueDate: '2026-11-05', villageId: 'v101' },
    { name: 'Priyanka Singh', age: 28, trimester: 1, risk: 'Medium', dueDate: '2027-01-20', villageId: 'v102' }
  ];

  console.log('🤰 Seeding pregnancy tracking records...');
  for (const p of pregnancies) {
    await pool.query(
      `INSERT INTO pregnancy_data (name, age, trimester, "riskLevel", "dueDate", "villageId", recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [p.name, p.age, p.trimester, p.risk, p.dueDate, p.villageId, ashaId]
    );
  }
  console.log('   ✅ Seeded pregnancy_data');

  // 6. Seed Malnutrition
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

  // 7. Seed Symptom Reports
  const symptoms = [
    { userId: villagerId, villageId: 'v101', symptoms: 'Fever, cough, body pain for 3 days', prediction: 'Mild Viral Infection - Maintain hydration, isolate, report if temp exceeds 102F', disease: 'Mild Viral Infection', advice: 'Maintain hydration, isolate, report if temp exceeds 102F', confidence: 0.90, model_used: 'Offline Rule Matcher' },
    { userId: villagerId, villageId: 'v101', symptoms: 'Severe dehydration, vomiting, diarrhoea', prediction: 'Moderate Gastroenteritis - Advise ORS and Zinc, monitor urine output', disease: 'Moderate Gastroenteritis', advice: 'Advise ORS and Zinc, monitor urine output', confidence: 0.85, model_used: 'Offline Rule Matcher' }
  ];

  console.log('🩺 Seeding symptom prediction logs...');
  for (const s of symptoms) {
    await pool.query(
      `INSERT INTO symptoms ("userId", "villageId", symptoms, prediction, disease, advice, confidence, model_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [s.userId, s.villageId, s.symptoms, s.prediction, s.disease, s.advice, s.confidence, s.model_used]
    );
  }
  console.log('   ✅ Seeded symptoms');

  // 8. Seed Ambulance & Operations Requests
  const requests = [
    { user_id: villagerId, name: 'Ramesh Kumar', location: 'Rampur, Near Primary School', priority: 'High', type: 'emergency', request_type: 'ambulance', symptoms: 'Severe chest pain and difficulty breathing', status: 'pending' },
    { user_id: villagerId, name: 'Sita Devi', location: 'ASHA Center रामपुर', priority: 'Low', type: 'operation', request_type: 'pad_request', symptoms: 'Confidential request for sanitary pads supply', status: 'pending' }
  ];

  console.log('🚨 Seeding operational & ambulance requests...');
  for (const r of requests) {
    await pool.query(
      `INSERT INTO ambulance_requests (user_id, name, location, priority, type, request_type, symptoms, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [r.user_id, r.name, r.location, r.priority, r.type, r.request_type, r.symptoms, r.status]
    );
  }
  console.log('   ✅ Seeded ambulance_requests');

  // 9. Seed District Configuration
  console.log('🔧 Seeding district configurations...');
  await pool.query(
    `INSERT INTO district_config (district_id, outbreak_threshold, enable_auto_ambulance, emergency_contact_phone)
     VALUES ($1, $2, $3, $4) ON CONFLICT (district_id) DO NOTHING`,
    ['varanasi_district', 3, true, '+91 94150 12345']
  );
  console.log('   ✅ Seeded district_config');

  // 10. Seed Child Vaccinations (Mission Indradhanush)
  console.log('👶 Seeding child vaccination records...');
  const vaccinations = [
    { child_name: 'Aarav Kumar', parent_phone: '9876543210', vaccine_name: 'BCG', scheduled_date: '2026-06-01', given_date: '2026-06-02', status: 'given', villageId: 'v101' },
    { child_name: 'Ananya Singh', parent_phone: '9876543220', vaccine_name: 'OPV 1', scheduled_date: '2026-06-15', given_date: null, status: 'scheduled', villageId: 'v101' }
  ];
  for (const v of vaccinations) {
    await pool.query(
      `INSERT INTO vaccination_records (child_name, parent_phone, vaccine_name, scheduled_date, given_date, status, "villageId", recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [v.child_name, v.parent_phone, v.vaccine_name, v.scheduled_date, v.given_date, v.status, v.villageId, ashaId]
    );
  }
  console.log('   ✅ Seeded vaccination_records');

  // 11. Seed ASHA Performance
  console.log('📈 Seeding ASHA performance benchmarks...');
  await pool.query(
    `INSERT INTO asha_performance (asha_id, month, referrals_count, pregnancies_tracked, vaccinations_completed, emergencies_reported)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (asha_id, month) DO NOTHING`,
    [ashaId, '2026-06', 12, 5, 8, 2]
  );
  console.log('   ✅ Seeded asha_performance');

  // 12. Seed referrals with outcomes
  console.log('📋 Seeding referrals outcome data...');
  await pool.query(
    `INSERT INTO referrals (patient_name, patient_phone, "villageId", referred_by, referred_to, reason, priority, notes, status, outcome, outcome_details, closed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
    ['Ramesh Kumar', '9876543200', 'v101', ashaId, 'District PHC', 'Chronic cough & fever', 'high', 'Suspected TB', 'completed', 'Diagnosed with Pulmonary TB', 'Referred to DOTS center, started on therapy.']
  );
  console.log('   ✅ Seeded referrals outcome');

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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch((err) => {
  console.error('Fatal seed failure:', err);
  process.exit(1);
});

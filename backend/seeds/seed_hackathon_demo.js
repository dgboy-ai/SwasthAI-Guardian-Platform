// ─────────────────────────────────────────────────────────────────────────────
// Hackathon Demo Data Seeder — Populates Aurora + DynamoDB with realistic data
// Run: node --experimental--modules backend/seeds/seed_hackathon_demo.js
// ─────────────────────────────────────────────────────────────────────────────
import pg from 'pg';
import dotenv from 'dotenv';
import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

dotenv.config();

const { Pool } = pg;

// ── Aurora Connection ────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
});

// ── DynamoDB Connection ──────────────────────────────────────────────────────
let docClient = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { convertEmptyValues: true, removeUndefinedValues: true },
  });
  console.log('✅ DynamoDB client initialized');
} else {
  console.log('⚠️  No AWS credentials — DynamoDB seeding skipped');
}

// ── Realistic Demo Data ──────────────────────────────────────────────────────

const VILLAGES = [
  { villageId: 'V101', name: 'Rampur', population: 1240, district: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  { villageId: 'V102', name: 'Nagwa', population: 890, district: 'Varanasi', lat: 25.2920, lng: 83.0080 },
  { villageId: 'V103', name: 'Sarai', population: 1100, district: 'Varanasi', lat: 25.3400, lng: 83.0100 },
  { villageId: 'V104', name: 'Dariyapur', population: 760, district: 'Varanasi', lat: 25.2700, lng: 82.9500 },
  { villageId: 'V105', name: 'Kashirampur', population: 950, district: 'Varanasi', lat: 25.3050, lng: 83.0200 },
];

const ASHA_WORKERS = [
  { phone: '9876543211', name: 'Sunita Devi', role: 'ngo', villageId: 'V101' },
  { phone: '9876543213', name: 'Priya Sharma', role: 'ngo', villageId: 'V102' },
  { phone: '9876543214', name: 'Geeta Yadav', role: 'ngo', villageId: 'V103' },
];

const ADMIN = { phone: '9876543212', name: 'Dr. Rajesh Kumar (CMO)', role: 'admin' };

const PREGNANCY_RECORDS = [
  { name: 'Sunita Devi', age: 26, trimester: 3, villageId: 'V101', riskLevel: 'High', systolic_bp: 145, diastolic_bp: 95, bs: 92, body_temp: 98.4, heart_rate: 88 },
  { name: 'Rani Kumari', age: 22, trimester: 2, villageId: 'V102', riskLevel: 'Medium', systolic_bp: 128, diastolic_bp: 82, bs: 95, body_temp: 98.6, heart_rate: 76 },
  { name: 'Pooja Gupta', age: 24, trimester: 1, villageId: 'V103', riskLevel: 'Low', systolic_bp: 118, diastolic_bp: 75, bs: 100, body_temp: 98.2, heart_rate: 72 },
  { name: 'Meena Kumari', age: 28, trimester: 3, villageId: 'V101', riskLevel: 'High', systolic_bp: 152, diastolic_bp: 98, bs: 88, body_temp: 99.1, heart_rate: 92 },
  { name: 'Lata Devi', age: 20, trimester: 2, villageId: 'V104', riskLevel: 'Low', systolic_bp: 120, diastolic_bp: 78, bs: 98, body_temp: 98.5, heart_rate: 74 },
  { name: 'Aarti Sen', age: 30, trimester: 3, villageId: 'V105', riskLevel: 'Medium', systolic_bp: 135, diastolic_bp: 88, bs: 90, body_temp: 98.7, heart_rate: 80 },
];

const SYMPTOM_RECORDS = [
  { villageId: 'V101', symptoms: 'Fever, Headache, Body ache', disease: 'Malaria', confidence: 0.82 },
  { villageId: 'V101', symptoms: 'Cough, Breathing difficulty', disease: 'Respiratory Infection', confidence: 0.75 },
  { villageId: 'V102', symptoms: 'Fever, Rash, Joint pain', disease: 'Dengue', confidence: 0.78 },
  { villageId: 'V103', symptoms: 'Diarrhea, Vomiting, Dehydration', disease: 'Gastroenteritis', confidence: 0.85 },
  { villageId: 'V101', symptoms: 'Fever, Cough, Fatigue', disease: 'Malaria', confidence: 0.79 },
  { villageId: 'V104', symptoms: 'Skin rash, Itching', disease: 'Dermatitis', confidence: 0.71 },
  { villageId: 'V105', symptoms: 'Fever, Body ache, Nausea', disease: 'Viral Fever', confidence: 0.68 },
  { villageId: 'V102', symptoms: 'Cough, Sore throat', disease: 'Common Cold', confidence: 0.88 },
];

const REFERRAL_RECORDS = [
  { patient_name: 'Sunita Devi', villageId: 'V101', reason: 'High BP in 8th month — needs PHC referral', priority: 'urgent', status: 'pending' },
  { patient_name: 'Raju Kumar', villageId: 'V101', reason: 'Severe malnutrition SAM — therapeutic feeding', priority: 'high', status: 'in_progress' },
  { patient_name: 'Lata Devi', villageId: 'V104', reason: 'Chest pain — cardiac risk assessment needed', priority: 'urgent', status: 'completed' },
  { patient_name: 'Karan Singh', villageId: 'V103', reason: 'Moderate malnutrition — supplement follow-up', priority: 'routine', status: 'completed' },
];

const AMBULANCE_RECORDS = [
  { name: 'Ram Singh', location: 'Rampur Sector 4', priority: 'high', symptoms: 'Chest pain, Breathing difficulty', status: 'dispatched' },
  { name: 'Lata Devi', location: 'Nagwa Village', priority: 'critical', symptoms: 'Pregnancy labour pain', status: 'assigned' },
  { name: 'Geeta Devi', location: 'Sarai Block', priority: 'medium', symptoms: 'High fever, Dehydration', status: 'pending' },
];

const VACCINATION_RECORDS = [
  { child_name: 'Raju Kumar', vaccine_name: 'BCG', villageId: 'V101', status: 'given', given_date: '2026-06-15' },
  { child_name: 'Raju Kumar', vaccine_name: 'OPV-0', villageId: 'V101', status: 'given', given_date: '2026-06-15' },
  { child_name: 'Priya Singh', vaccine_name: 'DPT-1', villageId: 'V102', status: 'scheduled', scheduled_date: '2026-07-01' },
  { child_name: 'Amit Kumar', vaccine_name: 'Measles', villageId: 'V103', status: 'scheduled', scheduled_date: '2026-07-05' },
  { child_name: 'Sita Devi', vaccine_name: 'OPV-1', villageId: 'V101', status: 'given', given_date: '2026-06-20' },
];

// ── Seed Aurora PostgreSQL ───────────────────────────────────────────────────

async function seedAurora() {
  console.log('\n🐘 Seeding Aurora PostgreSQL...');
  const client = await pool.connect();

  try {
    // 1. Upsert villages
    for (const v of VILLAGES) {
      await client.query(
        `INSERT INTO village_health ("villageId", name, population, "districtId", lat, lng, "lastUpdated")
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT ("villageId") DO UPDATE SET
           name=EXCLUDED.name, population=EXCLUDED.population,
           "districtId"=EXCLUDED."districtId", lat=EXCLUDED.lat, lng=EXCLUDED.lng, "lastUpdated"=NOW()`,
        [v.villageId, v.name, v.population, v.district, v.lat, v.lng]
      );
    }
    console.log(`  ✅ ${VILLAGES.length} villages upserted`);

    // 2. Upsert users (ASHA workers + admin)
    const allUsers = [...ASHA_WORKERS, ADMIN];
    for (const u of allUsers) {
      await client.query(
        `INSERT INTO users (phone, name, role, "villageId")
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (phone) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role`,
        [u.phone, u.name, u.role, u.villageId || null]
      );
    }
    console.log(`  ✅ ${allUsers.length} users upserted`);

    // 3. Pregnancy records
    for (const p of PREGNANCY_RECORDS) {
      const dueDate = new Date(Date.now() + (9 - p.trimester) * 30 * 24 * 60 * 60 * 1000);
      await client.query(
        `INSERT INTO pregnancy_data (name, age, trimester, "dueDate", "riskLevel", "villageId",
          systolic_bp, diastolic_bp, bs, body_temp, heart_rate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [p.name, p.age, p.trimester, dueDate.toISOString().split('T')[0],
         p.riskLevel, p.villageId, p.systolic_bp, p.diastolic_bp, p.bs, p.body_temp, p.heart_rate]
      );
    }
    console.log(`  ✅ ${PREGNANCY_RECORDS.length} pregnancy records inserted`);

    // 4. Symptom records
    for (const s of SYMPTOM_RECORDS) {
      await client.query(
        `INSERT INTO symptoms ("villageId", symptoms, disease, confidence, model_used)
         VALUES ($1,$2,$3,$4,$5)`,
        [s.villageId, s.symptoms, s.disease, s.confidence, 'SymptomNet-DL']
      );
    }
    console.log(`  ✅ ${SYMPTOM_RECORDS.length} symptom records inserted`);

    // 5. Referral records
    for (const r of REFERRAL_RECORDS) {
      await client.query(
        `INSERT INTO referrals (patient_name, "villageId", reason, priority, status)
         VALUES ($1,$2,$3,$4,$5)`,
        [r.patient_name, r.villageId, r.reason, r.priority, r.status]
      );
    }
    console.log(`  ✅ ${REFERRAL_RECORDS.length} referral records inserted`);

    // 6. Ambulance records
    for (const a of AMBULANCE_RECORDS) {
      await client.query(
        `INSERT INTO ambulance_requests (name, location, priority, symptoms, status, request_type)
         VALUES ($1,$2,$3,$4,$5,'ambulance')`,
        [a.name, a.location, a.priority, a.symptoms, a.status]
      );
    }
    console.log(`  ✅ ${AMBULANCE_RECORDS.length} ambulance records inserted`);

    // 7. Vaccination records
    for (const v of VACCINATION_RECORDS) {
      await client.query(
        `INSERT INTO vaccination_records (child_name, vaccine_name, "villageId", status, given_date, scheduled_date)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [v.child_name, v.vaccine_name, v.villageId, v.status, v.given_date || null, v.scheduled_date || null]
      );
    }
    console.log(`  ✅ ${VACCINATION_RECORDS.length} vaccination records inserted`);

    // Summary
    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM village_health) as villages,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM pregnancy_data) as pregnancies,
        (SELECT COUNT(*) FROM symptoms) as symptoms,
        (SELECT COUNT(*) FROM referrals) as referrals,
        (SELECT COUNT(*) FROM ambulance_requests) as ambulances,
        (SELECT COUNT(*) FROM vaccination_records) as vaccinations
    `);
    console.log('\n📊 Aurora PostgreSQL Summary:');
    console.log(`  Villages: ${counts.rows[0].villages}`);
    console.log(`  Users: ${counts.rows[0].users}`);
    console.log(`  Pregnancies: ${counts.rows[0].pregnancies}`);
    console.log(`  Symptoms: ${counts.rows[0].symptoms}`);
    console.log(`  Referrals: ${counts.rows[0].referrals}`);
    console.log(`  Ambulances: ${counts.rows[0].ambulances}`);
    console.log(`  Vaccinations: ${counts.rows[0].vaccinations}`);

  } finally {
    client.release();
  }
}

// ── Seed DynamoDB ────────────────────────────────────────────────────────────

async function seedDynamoDB() {
  if (!docClient) {
    console.log('\n⏭️  DynamoDB seeding skipped (no credentials)');
    return;
  }

  console.log('\n⚡ Seeding DynamoDB...');

  // 1. Outbreak telemetry events
  const outbreakEvents = [
    { villageId: 'V101', disease: 'Malaria', detectedAt: new Date(Date.now() - 2 * 3600000).toISOString(), cases: 12, trend: 'increasing', riskScore: 87, districtId: 'Varanasi' },
    { villageId: 'V102', disease: 'Dengue', detectedAt: new Date(Date.now() - 5 * 3600000).toISOString(), cases: 5, trend: 'stable', riskScore: 45, districtId: 'Varanasi' },
    { villageId: 'V103', disease: 'Malaria', detectedAt: new Date(Date.now() - 8 * 3600000).toISOString(), cases: 3, trend: 'declining', riskScore: 32, districtId: 'Varanasi' },
    { villageId: 'V101', disease: 'Cholera', detectedAt: new Date(Date.now() - 12 * 3600000).toISOString(), cases: 2, trend: 'stable', riskScore: 28, districtId: 'Varanasi' },
    { villageId: 'V104', disease: 'Typhoid', detectedAt: new Date(Date.now() - 24 * 3600000).toISOString(), cases: 7, trend: 'increasing', riskScore: 65, districtId: 'Varanasi' },
  ];

  for (const evt of outbreakEvents) {
    await docClient.send(new PutCommand({
      TableName: 'outbreak_telemetry',
      Item: {
        ...evt,
        _gsikey: `outbreak_v0#${Math.abs(hashString(evt.villageId)) % 10}`,
        _shard: Math.abs(hashString(evt.villageId)) % 10,
        expiresAt: Math.floor(Date.now() / 1000) + 90 * 86400,
      },
    }));
  }
  console.log(`  ✅ ${outbreakEvents.length} outbreak events inserted`);

  // 2. Emergency streams
  const emergencyStreams = [
    { districtId: 'Varanasi', streamId: `SOS-${Date.now()}-001`, priority: 'critical', patientName: 'Lata Devi', condition: 'Labour pain', location: 'Nagwa Village', timestamp: new Date().toISOString(), status: 'dispatched' },
    { districtId: 'Varanasi', streamId: `SOS-${Date.now()}-002`, priority: 'high', patientName: 'Ram Singh', condition: 'Chest pain', location: 'Rampur Sector 4', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'assigned' },
    { districtId: 'Varanasi', streamId: `SOS-${Date.now()}-003`, priority: 'medium', patientName: 'Geeta Devi', condition: 'High fever', location: 'Sarai Block', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'pending' },
  ];

  for (const evt of emergencyStreams) {
    const dateBucket = `${evt.districtId}#${evt.timestamp.slice(0, 10)}`;
    await docClient.send(new PutCommand({
      TableName: 'emergency_streams',
      Item: {
        ...evt,
        districtDateBucket: dateBucket,
        expiresAt: Math.floor(Date.now() / 1000) + 365 * 86400,
      },
    }));
  }
  console.log(`  ✅ ${emergencyStreams.length} emergency streams inserted`);

  // 3. Village node states
  for (const v of VILLAGES) {
    await docClient.send(new PutCommand({
      TableName: 'village_node_state',
      Item: {
        villageId: v.villageId,
        status: 'online',
        lastActive: new Date().toISOString(),
        syncPendingCount: Math.floor(Math.random() * 5),
        _gsiPk: `node_state_all#${Math.abs(hashString(v.villageId)) % 10}`,
        expiresAt: Math.floor(Date.now() / 1000) + 7 * 86400,
      },
    }));
  }
  console.log(`  ✅ ${VILLAGES.length} village node states inserted`);

  // 4. Sync queue items
  const syncItems = [
    { deviceId: 'device-asha-001', queuedAt: new Date(Date.now() - 300000).toISOString(), type: 'pregnancy_record', status: 'synced', patientName: 'Sunita Devi' },
    { deviceId: 'device-asha-001', queuedAt: new Date(Date.now() - 120000).toISOString(), type: 'symptom_report', status: 'pending', patientName: 'Raju Kumar' },
    { deviceId: 'device-asha-002', queuedAt: new Date(Date.now() - 60000).toISOString(), type: 'ambulance_request', status: 'synced', patientName: 'Lata Devi' },
  ];

  for (const item of syncItems) {
    await docClient.send(new PutCommand({
      TableName: 'sync_queues',
      Item: {
        ...item,
        expiresAt: Math.floor(Date.now() / 1000) + 30 * 86400,
      },
    }));
  }
  console.log(`  ✅ ${syncItems.length} sync queue items inserted`);

  console.log('\n📊 DynamoDB seeding complete!');
}

// ── Utility ──────────────────────────────────────────────────────────────────

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SwasthAI Guardian — Hackathon Demo Data Seeder');
  console.log('═══════════════════════════════════════════════════════');

  try {
    await seedAurora();
  } catch (err) {
    console.error('❌ Aurora seeding failed:', err.message);
  }

  try {
    await seedDynamoDB();
  } catch (err) {
    console.error('❌ DynamoDB seeding failed:', err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Seeding complete! Visit /api/health/detailed to verify');
  console.log('═══════════════════════════════════════════════════════');

  await pool.end();
  process.exit(0);
}

main();

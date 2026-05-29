/**
 * SwasthAI — SQLite Demo Seed
 * Creates demo users with properly bcrypt-hashed passwords for hackathon demos.
 * Run with: node seeds/seed_sqlite.js
 *
 * Demo Credentials (for judges):
 *   Villager  → phone: 9998887770  | password: village123
 *   NGO/ASHA  → phone: 9998887771  | password: asha2024
 *   Admin     → email: admin@swasthai.in | password: admin2024
 */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '..', 'swasth_guardian.sqlite');

const DEMO_USERS = [
  {
    phone: '9998887770', email: null,
    username: 'ram_kumar', name: 'Ram Kumar',
    password: 'village123', role: 'villager', villageId: 'v101'
  },
  {
    phone: '9998887771', email: null,
    username: 'sita_asha', name: 'Sita Devi (ASHA Worker)',
    password: 'asha2024', role: 'ngo', villageId: 'v101'
  },
  {
    phone: null, email: 'admin@swasthai.in',
    username: 'cmo_admin', name: 'CMO Varanasi',
    password: 'admin2024', role: 'admin', villageId: null
  },
];

const DEMO_VILLAGES = [
  { villageId: 'v101', name: 'Rampur', population: 1200, pregnant_women: 14, children_under_5: 89, malnutrition_cases: 7, asha_contact: '9998887771' },
  { villageId: 'v102', name: 'Mohanlal Ganj', population: 850, pregnant_women: 9, children_under_5: 63, malnutrition_cases: 4, asha_contact: '9998887772' },
];

(async () => {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

  // Ensure tables exist (idempotent)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE, email TEXT UNIQUE,
      username TEXT, name TEXT, password TEXT,
      role TEXT, villageId TEXT
    );
    CREATE TABLE IF NOT EXISTS village_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      villageId TEXT UNIQUE, name TEXT, population INTEGER,
      pregnant_women INTEGER, children_under_5 INTEGER,
      malnutrition_cases INTEGER, asha_contact TEXT
    );
  `);

  console.log('\n🌱 SwasthAI SQLite Demo Seed\n');

  // Seed villages
  for (const v of DEMO_VILLAGES) {
    await db.run(
      `INSERT OR REPLACE INTO village_health (villageId, name, population, pregnant_women, children_under_5, malnutrition_cases, asha_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [v.villageId, v.name, v.population, v.pregnant_women, v.children_under_5, v.malnutrition_cases, v.asha_contact]
    );
    console.log(`   🏘️  Village: ${v.name} (${v.villageId})`);
  }

  // Seed users with hashed passwords
  for (const u of DEMO_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    try {
      await db.run(
        `INSERT OR REPLACE INTO users (phone, email, username, name, password, role, villageId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.phone, u.email, u.username, u.name, hashed, u.role, u.villageId]
      );
      console.log(`   👤 ${u.role.padEnd(8)} → ${u.name} | password: ${u.password}`);
    } catch (e) {
      console.log(`   ⚠️  Could not insert ${u.name}: ${e.message}`);
    }
  }

  console.log('\n   ✅ Seed complete. All passwords are bcrypt-hashed.');
  console.log('\n   ┌─────────────────────────────────────────┐');
  console.log('   │  DEMO LOGIN CREDENTIALS                 │');
  console.log('   │  Villager: 9998887770 / village123      │');
  console.log('   │  ASHA NGO: 9998887771 / asha2024        │');
  console.log('   │  Admin:    admin@swasthai.in / admin2024 │');
  console.log('   └─────────────────────────────────────────┘\n');

  await db.close();
  process.exit(0);
})();

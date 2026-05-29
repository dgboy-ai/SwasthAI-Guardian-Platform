/**
 * SwasthAI — Password Migration Script
 * Rehashes any plain-text passwords in the SQLite DB using bcryptjs.
 * Safe to run multiple times — detects already-hashed passwords and skips them.
 * Run with: node seeds/migrate_passwords.js
 */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '..', 'swasth_guardian.sqlite');

const isBcryptHash = (str) => str && str.startsWith('$2');

(async () => {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  const users = await db.all('SELECT id, name, password FROM users');

  console.log(`\n🔐 SwasthAI Password Migration`);
  console.log(`   Found ${users.length} user(s) in database.\n`);

  let migrated = 0, skipped = 0;

  for (const user of users) {
    if (!user.password) { skipped++; continue; }

    if (isBcryptHash(user.password)) {
      console.log(`   ✅ SKIP   [${user.name}] — already hashed`);
      skipped++;
    } else {
      const hash = await bcrypt.hash(user.password, 10);
      await db.run('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);
      console.log(`   🔄 HASHED [${user.name}] — plain text → bcrypt`);
      migrated++;
    }
  }

  console.log(`\n   Done. Migrated: ${migrated} | Skipped: ${skipped}`);
  await db.close();
  process.exit(0);
})();

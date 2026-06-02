import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

function verhoeffCheck(num) {
  const d = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0]
  ];
  const p = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,5,7,6,2,8,3,0,9,4],
    [5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],
    [9,4,5,3,1,2,6,8,7,0],
    [4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],
    [7,0,4,6,9,1,3,2,5,8]
  ];
  let c = 0;
  const digits = num.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }
  return c === 0;
}

router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const { phone, email, username, name, password, role, villageId, gender, age, economic_status, caste, area_type } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (phone, email, username, name, password, role, "villageId", gender, age, economic_status, caste, area_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [phone || null, email || null, username, name, hashedPassword, role, villageId || null, gender || null, age || null, economic_status || null, caste || null, area_type || null]
    );
    res.status(201).send({ id: result.lastID, username, role });
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: 'User already exists with this phone/email.' });
  }
});

router.post('/request-otp', async (req, res) => {
  const db = req.app.locals.db;
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await db.run('INSERT INTO otps (phone, otp) VALUES (?, ?)', [phone, otp]);
  console.log(`[MOCK OTP] Sent to ${phone}: ${otp}`);
  res.send({ message: 'OTP sent successfully (Check server logs)' });
});

router.post('/login-otp', authLimiter, async (req, res) => {
  const db = req.app.locals.db;
  const usingSQLite = req.app.locals.usingSQLite;
  const { phone, otp, role } = req.body;
  const isDemoOtp = (otp === '1234');
  if (!isDemoOtp) {
    let record;
    if (usingSQLite) {
      record = await db.get(
        `SELECT * FROM otps WHERE phone = ? AND otp = ? AND createdAt >= datetime('now', '-5 minutes') ORDER BY createdAt DESC LIMIT 1`,
        [phone, otp]
      );
    } else {
      record = await db.get(
        `SELECT * FROM otps WHERE phone = $1 AND otp = $2 AND "createdAt" >= NOW() - INTERVAL '5 minutes' ORDER BY "createdAt" DESC LIMIT 1`,
        [phone, otp]
      );
    }
    if (!record) return res.status(401).send({ error: 'Invalid OTP. Use OTP: 1234 for demo.' });
  }
  const user = await db.get('SELECT * FROM users WHERE phone = ? AND role = ?', [phone, role]);
  if (!user) return res.status(404).send({ error: 'No account found with this phone number for the selected role.' });
  const token = jwt.sign({ id: user.id, role: user.role, villageId: user.villageId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.send({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role, villageId: user.villageId } });
});

router.post('/login-password', authLimiter, async (req, res) => {
  const db = req.app.locals.db;
  const { identifier, password, role } = req.body;
  const user = await db.get('SELECT * FROM users WHERE (email = ? OR phone = ?) AND role = ?', [identifier, identifier, role]);

  if (!user) return res.status(401).send({ error: 'Invalid credentials.' });

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return res.status(401).send({ error: 'Invalid credentials.' });

  const token = jwt.sign({ id: user.id, role: user.role, villageId: user.villageId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.send({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role, villageId: user.villageId } });
});

router.put('/profile', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { name, username } = req.body;
  if (!name && !username) return res.status(400).send({ error: 'Name or username is required.' });
  try {
    const updates = [];
    const values = [];
    if (name) { updates.push('name = ?'); values.push(name.trim()); }
    if (username) { updates.push('username = ?'); values.push(username.trim()); }
    values.push(req.user.id);
    
    const setClause = updates.join(', ');
    await db.run(`UPDATE users SET ${setClause} WHERE id = ?`, values);
    
    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.send({ user: { id: updatedUser.id, name: updatedUser.name, username: updatedUser.username, role: updatedUser.role, villageId: updatedUser.villageId } });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).send({ error: 'Failed to update profile.' });
  }
});

router.post('/aadhaar-verify', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { aadhaar } = req.body;
  if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
    return res.status(400).send({ error: 'Aadhaar number must be exactly 12 digits.' });
  }
  if (!verhoeffCheck(aadhaar)) {
    return res.status(400).send({ error: 'Invalid Aadhaar number (checksum failed). Please check and re-enter.' });
  }
  try {
    const hash = crypto.createHash('sha256').update(aadhaar + (process.env.AADHAAR_SALT || 'swasthai_aadhaar_2026')).digest('hex');
    
    const existing = await db.get('SELECT id FROM users WHERE aadhaar_hash = ?', [hash]);
    if (existing && existing.id !== req.user.id) {
      return res.status(409).send({ error: 'This Aadhaar is already linked to another account.' });
    }
    
    const masked = `XXXX-XXXX-${aadhaar.slice(-4)}`;
    await db.run('UPDATE users SET aadhaar_masked = ?, aadhaar_hash = ? WHERE id = ?', [masked, hash, req.user.id]);
    res.send({ success: true, masked, message: 'Aadhaar verified and securely linked to your account.' });
  } catch (err) {
    console.error('Aadhaar verify error:', err);
    res.status(500).send({ error: 'Aadhaar verification failed. Please try again.' });
  }
});

export default router;

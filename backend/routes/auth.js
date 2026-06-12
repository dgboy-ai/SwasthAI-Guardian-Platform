import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { getAadhaarSalt, isDemoOtpAllowed } from '../config.js';
import { logAudit } from '../middleware/audit.js';


const router = express.Router();

/** Zod v4 uses `issues`; older code used `errors`. */
function zodErrorMessage(parseResult) {
  const issue = parseResult.error?.issues?.[0] ?? parseResult.error?.errors?.[0];
  return issue?.message || 'Invalid request data';
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Zod Input Validation Schemas
const RegisterSchema = z.object({
  phone: z.preprocess(val => (val === '' ? null : val), z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits').optional().nullable()),
  email: z.preprocess(val => (val === '' ? null : val), z.string().email('Invalid email address').optional().nullable()),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['villager', 'ngo', 'admin']),
  villageId: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  age: z.number().int().min(0).max(125).optional().nullable(),
  economic_status: z.string().optional().nullable(),
  caste: z.string().optional().nullable(),
  area_type: z.string().optional().nullable(),
  passcode: z.string().optional().nullable()
});

const RequestOtpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
});

const LoginOtpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  otp: z.string().min(4).max(6),
  role: z.enum(['villager', 'ngo', 'admin'])
});

const LoginPasswordSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['villager', 'ngo', 'admin'])
});

const ProfileUpdateSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional()
}).refine(data => data.name || data.username, {
  message: 'Name or username is required for updates'
});

const AadhaarVerifySchema = z.object({
  aadhaar: z.string().regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits')
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

// Helper to generate Refresh Token
async function generateRefreshToken(db, userId) {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  await db.run(
    'INSERT INTO refresh_tokens ("userId", token, "expiresAt") VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  return token;
}

// Clean up expired OTPs and expired tokens
async function runCleanup(db, usingSQLite) {
  try {
    if (usingSQLite) {
      await db.run(`DELETE FROM otps WHERE "createdAt" < datetime('now', '-10 minutes')`);
      await db.run(`DELETE FROM refresh_tokens WHERE "expiresAt" < datetime('now')`);
      await db.run(`DELETE FROM revoked_tokens WHERE "createdAt" < datetime('now', '-7 days')`);
    } else {
      await db.run(`DELETE FROM otps WHERE "createdAt" < NOW() - INTERVAL '10 minutes'`);
      await db.run(`DELETE FROM refresh_tokens WHERE "expiresAt" < NOW()`);
      await db.run(`DELETE FROM revoked_tokens WHERE "createdAt" < NOW() - INTERVAL '7 days'`);
    }
  } catch (err) {
    console.error('[Cleanup Error]', err.message);
  }
}

router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: zodErrorMessage(parseResult) });
  }

  const { phone, email, username, name, password, role, villageId, gender, age, economic_status, caste, area_type, passcode } = parseResult.data;

  if (role === 'ngo' && passcode !== (process.env.NGO_REGISTRATION_PASSCODE || 'ASHA2026')) {
    return res.status(400).json({ error: 'Invalid ASHA/NGO registration passcode.' });
  }
  if (role === 'admin' && passcode !== (process.env.ADMIN_REGISTRATION_PASSCODE || 'ADMIN2026')) {
    return res.status(400).json({ error: 'Invalid Admin registration passcode.' });
  }

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

router.post('/request-otp', authLimiter, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usingSQLite = req.app.locals.usingSQLite;
    const parseResult = RequestOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: zodErrorMessage(parseResult) });
    }

    const { phone } = parseResult.data;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.run('INSERT INTO otps (phone, otp) VALUES (?, ?)', [phone, otp]);
    console.log(`[MOCK OTP] Sent to ${phone}: ${otp}`);
    
    // Clean up old records on a new OTP request
    runCleanup(db, usingSQLite).catch(() => {});

    res.send({ message: 'OTP sent successfully (Check server logs)' });
  } catch (err) {
    console.error('[Auth] OTP request error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/login-otp', authLimiter, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usingSQLite = req.app.locals.usingSQLite;
    const parseResult = LoginOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: zodErrorMessage(parseResult) });
    }

    const { phone, otp, role } = parseResult.data;
    const isDemoOtp = isDemoOtpAllowed(otp);
    
    if (!isDemoOtp) {
      let record;
      if (usingSQLite) {
        record = await db.get(
          `SELECT * FROM otps WHERE phone = ? AND otp = ? AND "createdAt" >= datetime('now', '-5 minutes') ORDER BY "createdAt" DESC LIMIT 1`,
          [phone, otp]
        );
      } else {
        record = await db.get(
          `SELECT * FROM otps WHERE phone = $1 AND otp = $2 AND "createdAt" >= NOW() - INTERVAL '5 minutes' ORDER BY "createdAt" DESC LIMIT 1`,
          [phone, otp]
        );
      }
      if (!record) return res.status(401).send({ error: 'Invalid or expired OTP.' });
      
      // Delete OTP after successful use to prevent reuse
      await db.run('DELETE FROM otps WHERE phone = ?', [phone]);
    }

    const user = await db.get('SELECT * FROM users WHERE phone = ? AND role = ?', [phone, role]);
    if (!user) return res.status(404).send({ error: 'No account found with this phone number for the selected role.' });
    
    // Access Token expires in 15m; Refresh Token expires in 30 days
    const token = jwt.sign({ id: user.id, role: user.role, villageId: user.villageId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = await generateRefreshToken(db, user.id);

    res.send({ 
      token, 
      refreshToken,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, villageId: user.villageId } 
    });
  } catch (err) {
    console.error('[Auth] OTP login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/login-password', authLimiter, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const parseResult = LoginPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: zodErrorMessage(parseResult) });
    }

    const { identifier, password, role } = parseResult.data;
    const user = await db.get('SELECT * FROM users WHERE (email = ? OR phone = ? OR username = ?) AND role = ?', [identifier, identifier, identifier, role]);

    if (!user) return res.status(401).send({ error: 'Invalid credentials.' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).send({ error: 'Invalid credentials.' });

    // Access Token expires in 15m; Refresh Token expires in 30 days
    const token = jwt.sign({ id: user.id, role: user.role, villageId: user.villageId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = await generateRefreshToken(db, user.id);

    res.send({ 
      token, 
      refreshToken,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, villageId: user.villageId } 
    });
  } catch (err) {
    console.error('[Auth] Password login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh Token Exchange Endpoint
router.post('/refresh', async (req, res) => {
  const db = req.app.locals.db;
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).send({ error: 'Refresh token is required.' });

  try {
    const record = await db.get(
      'SELECT * FROM refresh_tokens WHERE token = ? AND "expiresAt" > ?',
      [refreshToken, new Date().toISOString()]
    );
    if (!record) return res.status(401).send({ error: 'Invalid or expired refresh token.' });

    const user = await db.get('SELECT * FROM users WHERE id = ?', [record.userId]);
    if (!user) return res.status(404).send({ error: 'User not found.' });

    // Rotate refresh token
    await db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    const newRefreshToken = await generateRefreshToken(db, user.id);
    const newToken = jwt.sign({ id: user.id, role: user.role, villageId: user.villageId }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.send({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).send({ error: 'Failed to refresh token.' });
  }
});

// Logout (Revoke tokens)
router.post('/logout', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { refreshToken } = req.body;
  const token = req.header('Authorization')?.replace('Bearer ', '');

  try {
    if (refreshToken) {
      await db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    if (token) {
      await db.run('INSERT OR IGNORE INTO revoked_tokens (token) VALUES (?)', [token]);
    }
    res.send({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).send({ error: 'Failed to log out.' });
  }
});

router.put('/profile', auth, logAudit('update_profile', 'users'), async (req, res) => {
  const db = req.app.locals.db;
  const parseResult = ProfileUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: zodErrorMessage(parseResult) });
  }

  const { name, username } = parseResult.data;
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
  const parseResult = AadhaarVerifySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: zodErrorMessage(parseResult) });
  }

  const { aadhaar } = parseResult.data;
  if (!verhoeffCheck(aadhaar)) {
    return res.status(400).send({ error: 'Invalid Aadhaar number (checksum failed). Please check and re-enter.' });
  }
  try {
    const hash = crypto.createHash('sha256').update(aadhaar + getAadhaarSalt()).digest('hex');
    
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

// POST /auth/qr-login — Passwordless Villager Card QR code login
router.post('/qr-login', authLimiter, async (req, res) => {
  const db = req.app.locals.db;
  const { qrPayload } = req.body;

  if (!qrPayload) {
    return res.status(400).json({ error: 'qrPayload is required.' });
  }

  try {
    const user = await db.get(
      'SELECT * FROM users WHERE (phone = ? OR username = ? OR aadhaar_hash = ?) AND role = ?',
      [qrPayload, qrPayload, qrPayload, 'villager']
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid or unregistered Village Card QR.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, villageId: user.villageId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = await generateRefreshToken(db, user.id);

    res.send({ 
      token, 
      refreshToken,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, villageId: user.villageId } 
    });
  } catch (err) {
    console.error('QR Login Error:', err.message);
    res.status(500).json({ error: 'Internal server error during QR authentication.' });
  }
});

export default router;

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from './db.js';

const secret = process.env.JWT_SECRET;
if (!secret && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
const jwtSecret = secret || 'development-only-change-me';
export const credentialsSchema = z.object({ email: z.string().email().max(254), password: z.string().min(12).max(200) });

export async function registerUser({ email, password }) {
  const parsed = credentialsSchema.parse({ email: email.toLowerCase().trim(), password });
  const hash = await bcrypt.hash(parsed.password, 12);
  const { rows } = await pool.query('INSERT INTO users(email, password_hash) VALUES($1,$2) RETURNING id,email,created_at', [parsed.email, hash]);
  return rows[0];
}

export async function loginUser({ email, password }) {
  const parsed = credentialsSchema.parse({ email: email.toLowerCase().trim(), password });
  const { rows } = await pool.query('SELECT id,email,password_hash FROM users WHERE email=$1', [parsed.email]);
  if (!rows[0] || !(await bcrypt.compare(parsed.password, rows[0].password_hash))) throw new Error('Invalid credentials');
  return { id: rows[0].id, email: rows[0].email };
}

export function issueToken(user) { return jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d', issuer: 'urban-empire' }); }

export function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
    req.user = jwt.verify(header.slice(7), jwtSecret, { issuer: 'urban-empire' });
    next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}

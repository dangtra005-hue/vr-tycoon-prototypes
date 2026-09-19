import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool, withTransaction } from './db.js';

const secret = process.env.JWT_SECRET;
if (!secret && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
const jwtSecret = secret || 'development-only-change-me';
export const credentialsSchema = z.object({ email: z.string().email().max(254), password: z.string().min(12).max(200) });
const tokenTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

export async function registerUser({ email, password }) {
  const parsed = credentialsSchema.parse({ email: email.toLowerCase().trim(), password });
  const hash = await bcrypt.hash(parsed.password, 12);
  const { rows } = await pool.query('INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email,created_at', [parsed.email, hash]);
  return rows[0];
}

export async function loginUser({ email, password }) {
  const parsed = credentialsSchema.parse({ email: email.toLowerCase().trim(), password });
  const { rows } = await pool.query('SELECT id,email,password_hash FROM users WHERE email=$1', [parsed.email]);
  if (!rows[0] || !(await bcrypt.compare(parsed.password, rows[0].password_hash))) throw new Error('Invalid credentials');
  return { id: rows[0].id, email: rows[0].email };
}

export function issueAccessToken(user) { return jwt.sign({ sub: user.id, email: user.email, typ: 'access' }, jwtSecret, { expiresIn: '15m', issuer: 'urban-empire' }); }

export async function issueRefreshToken(user, familyId = crypto.randomUUID()) {
  const raw = crypto.randomBytes(48).toString('base64url');
  await pool.query('INSERT INTO refresh_tokens(user_id,token_hash,family_id,expires_at) VALUES($1,$2,$3,now()+($4::text || \' days\')::interval)', [user.id, sha256(raw), familyId, tokenTtlDays]);
  return { raw, familyId };
}

export async function rotateRefreshToken(raw) {
  if (!raw) throw new Error('Refresh token required');
  return withTransaction(async (client) => {
    const found = await client.query('SELECT r.*,u.id user_id,u.email FROM refresh_tokens r JOIN users u ON u.id=r.user_id WHERE r.token_hash=$1 FOR UPDATE', [sha256(raw)]);
    const token = found.rows[0];
    if (!token || token.revoked_at || token.expires_at <= new Date()) throw new Error('Invalid refresh token');
    if (token.used_at) { await client.query('UPDATE refresh_tokens SET revoked_at=now() WHERE family_id=$1', [token.family_id]); throw new Error('Refresh token reuse detected'); }
    await client.query('UPDATE refresh_tokens SET used_at=now() WHERE id=$1', [token.id]);
    const user = { id: token.user_id, email: token.email };
    const next = await issueRefreshToken(user, token.family_id);
    return { user, accessToken: issueAccessToken(user), refreshToken: next.raw };
  });
}

export async function revokeRefreshToken(raw) { if (raw) await pool.query('UPDATE refresh_tokens SET revoked_at=now() WHERE token_hash=$1', [sha256(raw)]); }
export function requireAuth(req, res, next) { try { const h = req.get('authorization') || ''; if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' }); req.user = jwt.verify(h.slice(7), jwtSecret, { issuer: 'urban-empire', algorithms: ['HS256'] }); next(); } catch { res.status(401).json({ error: 'Invalid or expired token' }); } }
export const refreshCookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/auth', maxAge: tokenTtlDays * 86400000 };

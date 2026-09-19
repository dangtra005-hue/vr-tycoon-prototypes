import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';
import { pool, withTransaction } from './db.js';
import { registerUser, loginUser, issueAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken, requireAuth, refreshCookie } from './auth.js';
import { parseAction } from './validation.js';
import { createGame, applyAction } from './simulation/economy.js';

const metrics = new Registry();
collectDefaultMetrics({ register: metrics });
const requests = new Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status'], registers: [metrics] });
const latency = new Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request latency', labelNames: ['method', 'route'], registers: [metrics] });
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 }) : null;
const limiterStore = redis ? new RedisStore({ sendCommand: (...args) => redis.call(...args) }) : undefined;

function limiter(options) {
  if (process.env.NODE_ENV === 'production' && !limiterStore) throw new Error('REDIS_URL is required in production');
  return rateLimit({ ...options, store: limiterStore });
}

export function createApp() {
  const app = express();
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || false, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '32kb' }));
  if (process.env.NODE_ENV === 'production') app.use((req, res, next) => req.secure ? next() : res.redirect(308, `https://${req.get('host')}${req.originalUrl}`));
  app.use((req, res, next) => { const started = process.hrtime.bigint(); res.on('finish', () => { const route = req.route?.path || req.path; requests.inc({ method: req.method, route, status: res.statusCode }); latency.observe({ method: req.method, route }, Number(process.hrtime.bigint() - started) / 1e9); }); next(); });
  app.use('/api', limiter({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));
  const authLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
  app.get('/api/health', async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ ok: true, service: 'urban-empire-economy', version: '2.2.0' }); } catch { res.status(503).json({ ok: false, error: 'database unavailable' }); } });
  app.get('/metrics', async (_req, res) => { res.set('Content-Type', metrics.contentType); res.end(await metrics.metrics()); });
  app.post('/api/auth/register', authLimiter, async (req, res) => { try { const user = await registerUser(req.body || {}); const accessToken = issueAccessToken(user); const refresh = await issueRefreshToken(user); res.cookie('refresh_token', refresh.raw, refreshCookie).status(201).json({ user, accessToken }); } catch (e) { res.status(e.code === '23505' ? 409 : 400).json({ error: e.message }); } });
  app.post('/api/auth/login', authLimiter, async (req, res) => { try { const user = await loginUser(req.body || {}); const accessToken = issueAccessToken(user); const refresh = await issueRefreshToken(user); res.cookie('refresh_token', refresh.raw, refreshCookie).json({ user, accessToken }); } catch (e) { res.status(401).json({ error: e.message }); } });
  app.post('/api/auth/refresh', authLimiter, async (req, res) => { try { const result = await rotateRefreshToken(req.cookies.refresh_token || req.body?.refreshToken); res.cookie('refresh_token', result.refreshToken, refreshCookie).json({ user: result.user, accessToken: result.accessToken }); } catch (e) { res.status(401).json({ error: e.message }); } });
  app.post('/api/auth/logout', authLimiter, async (req, res) => { await revokeRefreshToken(req.cookies.refresh_token || req.body?.refreshToken); res.clearCookie('refresh_token', refreshCookie).status(204).end(); });
  app.post('/api/games', requireAuth, async (req, res) => { const game = createGame(); const result = await pool.query('INSERT INTO games(owner_id,state) VALUES($1,$2) RETURNING id,version,state,created_at,updated_at', [req.user.sub, game]); res.status(201).json(result.rows[0]); });
  app.get('/api/games/:id', requireAuth, async (req, res) => { const result = await pool.query('SELECT id,version,state,created_at,updated_at FROM games WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.sub]); if (!result.rows[0]) return res.status(404).json({ error: 'Game not found' }); res.json(result.rows[0]); });
  app.get('/api/games/:id/events', requireAuth, async (req, res) => { const result = await pool.query('SELECT e.id,e.sequence,e.action_type,e.payload,e.result,e.state_version,e.created_at FROM game_events e JOIN games g ON g.id=e.game_id WHERE e.game_id=$1 AND g.owner_id=$2 ORDER BY e.sequence DESC LIMIT 200', [req.params.id, req.user.sub]); res.json(result.rows); });
  app.post('/api/games/:id/actions', requireAuth, async (req, res) => { try { const action = parseAction(req.body || {}); const result = await withTransaction(async (client) => { const found = await client.query('SELECT id,version,state FROM games WHERE id=$1 AND owner_id=$2 FOR UPDATE', [req.params.id, req.user.sub]); if (!found.rows[0]) throw Object.assign(new Error('Game not found'), { status: 404 }); const row = found.rows[0]; const output = applyAction(row.state, action); const version = row.version + 1; const sequence = Number((await client.query('SELECT COALESCE(MAX(sequence),0)+1 next FROM game_events WHERE game_id=$1', [row.id])).rows[0].next); const updated = await client.query('UPDATE games SET state=$1,version=$2,updated_at=now() WHERE id=$3 RETURNING id,version,state,created_at,updated_at', [row.state, version, row.id]); await client.query('INSERT INTO game_events(game_id,actor_id,sequence,action_type,payload,result,state_version) VALUES($1,$2,$3,$4,$5,$6,$7)', [row.id, req.user.sub, sequence, action.type, action, output, version]); return { state: updated.rows[0], event: { sequence, actionType: action.type, result: output } }; }); res.json(result); } catch (e) { res.status(e.status || (e.name === 'ZodError' ? 400 : 422)).json({ error: e.message, details: e.issues }); } });
  return app;
}
export async function closeApp() { if (redis) await redis.quit(); await pool.end(); }

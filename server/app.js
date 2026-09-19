import express from 'express';
import cors from 'cors';
import { migrate, pool, withTransaction } from './db.js';
import { registerUser, loginUser, issueToken, requireAuth } from './auth.js';
import { parseAction } from './validation.js';
import { createGame, applyAction } from './simulation/economy.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'urban-empire-economy', version: '2.0.0' }));

  app.post('/api/auth/register', async (req, res) => {
    try { const user = await registerUser(req.body || {}); res.status(201).json({ user, token: issueToken(user) }); }
    catch (e) { res.status(e.code === '23505' ? 409 : 400).json({ error: e.message }); }
  });
  app.post('/api/auth/login', async (req, res) => {
    try { const user = await loginUser(req.body || {}); res.json({ user, token: issueToken(user) }); }
    catch (e) { res.status(401).json({ error: e.message }); }
  });

  app.post('/api/games', requireAuth, async (req, res) => {
    const game = createGame();
    const result = await pool.query('INSERT INTO games(owner_id,state) VALUES($1,$2) RETURNING id,version,state,created_at,updated_at', [req.user.sub, game]);
    res.status(201).json(result.rows[0]);
  });

  app.get('/api/games/:id', requireAuth, async (req, res) => {
    const result = await pool.query('SELECT id,version,state,created_at,updated_at FROM games WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.sub]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Game not found' });
    res.json(result.rows[0]);
  });

  app.get('/api/games/:id/events', requireAuth, async (req, res) => {
    const result = await pool.query('SELECT e.id,e.sequence,e.action_type,e.payload,e.result,e.state_version,e.created_at FROM game_events e JOIN games g ON g.id=e.game_id WHERE e.game_id=$1 AND g.owner_id=$2 ORDER BY e.sequence DESC LIMIT 200', [req.params.id, req.user.sub]);
    res.json(result.rows);
  });

  app.post('/api/games/:id/actions', requireAuth, async (req, res) => {
    try {
      const action = parseAction(req.body || {});
      const result = await withTransaction(async (client) => {
        const found = await client.query('SELECT id,version,state FROM games WHERE id=$1 AND owner_id=$2 FOR UPDATE', [req.params.id, req.user.sub]);
        if (!found.rows[0]) throw Object.assign(new Error('Game not found'), { status: 404 });
        const row = found.rows[0];
        const state = row.state;
        const output = applyAction(state, action);
        const nextVersion = row.version + 1;
        const sequence = Number((await client.query('SELECT COALESCE(MAX(sequence),0)+1 AS next FROM game_events WHERE game_id=$1', [row.id])).rows[0].next);
        const updated = await client.query('UPDATE games SET state=$1,version=$2,updated_at=now() WHERE id=$3 RETURNING id,version,state,created_at,updated_at', [state, nextVersion, row.id]);
        await client.query('INSERT INTO game_events(game_id,actor_id,sequence,action_type,payload,result,state_version) VALUES($1,$2,$3,$4,$5,$6,$7)', [row.id, req.user.sub, sequence, action.type, action, output, nextVersion]);
        return { state: updated.rows[0], event: { sequence, actionType: action.type, result: output } };
      });
      res.json(result);
    } catch (e) { res.status(e.status || (e.name === 'ZodError' ? 400 : 422)).json({ error: e.message, details: e.issues }); }
  });
  return app;
}

export async function closeApp() { await pool.end(); }

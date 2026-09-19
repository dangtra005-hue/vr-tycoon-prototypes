import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { createGame, applyAction, serialiseGame, hydrateGame } from './simulation/economy.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const clientDir = path.join(root, '..', 'webxr-tycoon');
const games = new Map();

await fs.mkdir(dataDir, { recursive: true });

async function persist(game) {
  await fs.writeFile(path.join(dataDir, `${game.id}.json`), JSON.stringify(serialiseGame(game), null, 2));
}

async function loadGame(id) {
  if (games.has(id)) return games.get(id);
  try {
    const raw = await fs.readFile(path.join(dataDir, `${id}.json`), 'utf8');
    const game = hydrateGame(JSON.parse(raw));
    games.set(id, game);
    return game;
  } catch {
    return null;
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use(express.static(clientDir));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'urban-empire-economy', version: '1.0.0' }));

app.post('/api/games', async (_req, res) => {
  const game = createGame();
  games.set(game.id, game);
  await persist(game);
  res.status(201).json(serialiseGame(game));
});

app.get('/api/games/:id', async (req, res) => {
  const game = await loadGame(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(serialiseGame(game));
});

app.post('/api/games/:id/actions', async (req, res) => {
  const game = await loadGame(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  try {
    const result = applyAction(game, req.body || {});
    await persist(game);
    res.json({ result, state: serialiseGame(game) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/games/:id/save', async (req, res) => {
  const game = await loadGame(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  await persist(game);
  res.json({ saved: true, state: serialiseGame(game) });
});

app.post('/api/games/:id/load', async (req, res) => {
  const game = await loadGame(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(serialiseGame(game));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDir, 'index.html'));
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`Urban Empire running at http://localhost:${port}`));

import test from 'node:test';
import assert from 'node:assert/strict';
import { pool, migrate, closeDb } from '../server/db.js';
import { createApp } from '../server/app.js';
import request from 'supertest';

test('PostgreSQL ownership and immutable event integration', { skip: !process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL }, async (t) => {
  await migrate();
  const app = createApp();
  const email = `test-${Date.now()}@example.com`;
  const password = 'correct horse battery staple';
  const registered = await request(app).post('/api/auth/register').send({ email, password }).expect(201);
  const token = registered.body.accessToken;
  const game = await request(app).post('/api/games').set('Authorization', `Bearer ${token}`).expect(201);
  await request(app).post(`/api/games/${game.body.id}/actions`).set('Authorization', `Bearer ${token}`).send({ type: 'next-day' }).expect(200);
  const events = await request(app).get(`/api/games/${game.body.id}/events`).set('Authorization', `Bearer ${token}`).expect(200);
  assert.equal(events.body.length, 1);
  assert.equal(events.body[0].action_type, 'next-day');
  await pool.query('DELETE FROM users WHERE email=$1', [email]);
  await closeDb();
  t.after(() => {});
});

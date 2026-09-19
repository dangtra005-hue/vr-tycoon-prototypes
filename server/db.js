import pg from 'pg';

const { Pool } = pg;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PG_POOL_SIZE || 10)
});

export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await pool.query(`CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS games (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, version INTEGER NOT NULL DEFAULT 1, state JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS game_events (id BIGSERIAL PRIMARY KEY, game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE, actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, sequence INTEGER NOT NULL, action_type TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb, result JSONB NOT NULL DEFAULT '{}'::jsonb, state_version INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(game_id, sequence))`);
}

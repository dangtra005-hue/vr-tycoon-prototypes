import { pool } from './db.js';

const days = Number(process.env.AUDIT_RETENTION_DAYS || 730);
if (!Number.isInteger(days) || days < 30) throw new Error('AUDIT_RETENTION_DAYS must be an integer >= 30');
const result = await pool.query('DELETE FROM game_events WHERE created_at < now() - ($1::text || \' days\')::interval', [days]);
console.log(`Deleted ${result.rowCount} audit events older than ${days} days`);
await pool.end();

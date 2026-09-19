import { pool } from '../db.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const directory = process.env.BACKUP_DIR || './backups';
await fs.mkdir(directory, { recursive: true });
const filename = path.join(directory, `urban-empire-${new Date().toISOString().replaceAll(':', '-')}.dump`);
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const { spawn } = await import('node:child_process');
await new Promise((resolve, reject) => { const child = spawn(process.env.PG_DUMP_BIN || 'pg_dump', ['--format=custom', '--no-owner', '--file', filename, process.env.DATABASE_URL], { stdio: 'inherit' }); child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`pg_dump exited with ${code}`))); });
console.log(`Created PostgreSQL backup: ${filename}`);
await pool.end();

import { migrate } from './db.js';
await migrate();
console.log('Database migrations applied');
process.exit(0);

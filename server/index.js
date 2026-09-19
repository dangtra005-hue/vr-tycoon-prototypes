import { migrate } from './db.js';
import { createApp } from './app.js';

await migrate();
const port = Number(process.env.PORT || 8080);
createApp().listen(port, () => console.log(`Urban Empire running at http://localhost:${port}`));

import 'dotenv/config';
import { validateEnv } from './middleware/validateEnv.js';
import { bootstrapTables } from './db/bootstrap.js';
import app from './app.js';

// Validate required environment variables before anything else
validateEnv();

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await bootstrapTables();
    app.listen(PORT, () => {
      console.log(`[CampusPrint] Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[CampusPrint] Failed to start server:', err);
    process.exit(1);
  }
}

start();

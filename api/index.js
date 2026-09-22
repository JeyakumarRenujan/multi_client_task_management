import app from '../server/src/server.js';
import { initDatabase } from '../server/src/database.js';

let dbInitPromise = null;

/**
 * Vercel Serverless Function entrypoint.
 * Routes all /api/* HTTP requests to the Express application.
 */
export default async function handler(req, res) {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      console.warn('[Vercel Serverless] DB initialization notice:', err.message);
    });
  }
  await dbInitPromise;
  return app(req, res);
}

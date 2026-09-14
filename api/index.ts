import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server/app.js';
import { postgresDatabase } from '../server/db/postgres.js';
import { readConfig } from '../server/config.js';

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;
let initialization: Promise<Handler> | undefined;

async function initialize(): Promise<Handler> {
  const config = readConfig(process.env);
  const db = postgresDatabase(config.DATABASE_URL);
  const app = await createApp({ db, appOrigin: config.APP_ORIGIN, nodeEnv: config.NODE_ENV, secureCookies: true });
  await app.ready();
  return async (req, res) => { app.server.emit('request', req, res); };
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  initialization ??= initialize();
  try {
    const serve = await initialization;
    await serve(req, res);
  } catch (error) {
    initialization = undefined;
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'STARTUP_ERROR', message: 'Servicio temporalmente no disponible' } }));
    }
    console.error('Vercel function initialization failed', error instanceof Error ? error.message : 'unknown error');
  }
}

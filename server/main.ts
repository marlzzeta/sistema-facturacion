import { readConfig } from './config';
import { postgresDatabase } from './db/postgres';
import { migrate } from './db/migrate';
import { createApp } from './app';

const config = readConfig(process.env);
const db = postgresDatabase(config.DATABASE_URL);
await migrate(db);
const app = await createApp({ db, appOrigin: config.APP_ORIGIN, nodeEnv: config.NODE_ENV });
await app.listen({ host: config.HOST, port: config.PORT });
const shutdown = async () => { await app.close(); await db.close(); process.exit(0); };
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);

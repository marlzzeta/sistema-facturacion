import { readDatabaseConfig } from './config.js';
import { migrate } from './db/migrate.js';
import { postgresDatabase } from './db/postgres.js';

const config = readDatabaseConfig(process.env);
const db = postgresDatabase(config.DATABASE_URL);
try {
  await migrate(db);
  console.log('Database migrations applied.');
} finally {
  await db.close();
}

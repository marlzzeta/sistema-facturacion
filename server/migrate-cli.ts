import { readDatabaseConfig } from './config';
import { migrate } from './db/migrate';
import { postgresDatabase } from './db/postgres';

const config = readDatabaseConfig(process.env);
const db = postgresDatabase(config.DATABASE_URL);
try {
  await migrate(db);
  console.log('Database migrations applied.');
} finally {
  await db.close();
}

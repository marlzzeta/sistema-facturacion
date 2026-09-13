import pg from 'pg';
import type { Database, Sql } from './database.js';

export function postgresDatabase(connectionString: string): Database {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
  });
  pool.on('error', () => {
    // Do not log connection URLs or driver messages containing credentials.
    console.error('PostgreSQL: fallo de conexión inactiva.');
  });
  const sql = (client: pg.Pool | pg.PoolClient): Sql => ({
    async query<T>(text: string, values: unknown[] = []) {
      const result = await client.query(text, values);
      return { rows: result.rows as T[] };
    },
  });
  return {
    ...sql(pool),
    async transaction<T>(operation: (tx: Sql) => Promise<T>) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await operation(sql(client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

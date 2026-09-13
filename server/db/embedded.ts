// Development/test only. Production always uses the pg adapter.
import { PGlite } from '@electric-sql/pglite';
import type { Database, Sql } from './database.js';

export async function embeddedDatabase(dataDir?: string): Promise<Database> {
  const db = new PGlite(dataDir);
  await db.waitReady;
  const wrap = (queryable: Pick<PGlite, 'query'>): Sql => ({
    async query<T>(text: string, values: unknown[] = []) {
      const result = await queryable.query<T>(text, values);
      return { rows: result.rows };
    },
  });
  return {
    ...wrap(db),
    transaction: operation => db.transaction(tx => operation(wrap(tx))),
    close: () => db.close(),
  };
}

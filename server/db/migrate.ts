import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import type { Database } from './database.js';

export async function migrate(db: Database) {
  const directory = new URL('../../database/migrations/', import.meta.url);
  const names = (await readdir(directory)).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  await db.transaction(async tx => {
    await tx.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    // Serializes migration runners; migration is an explicit release operation.
    await tx.query('LOCK TABLE schema_migrations IN EXCLUSIVE MODE');
    for (const name of names) {
      const content = await readFile(new URL(name, directory), 'utf8');
      const checksum = createHash('sha256').update(content).digest('hex');
      const existing = await tx.query<{ checksum: string }>(
        'SELECT checksum FROM schema_migrations WHERE name = $1', [name],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Migración alterada: ${name}`);
        continue;
      }
      // The checked-in migration contains no SQL functions with semicolons except
      // dollar-quoted bodies. Split only at statement boundaries outside $$.
      const statements: string[] = [];
      let buffer = '';
      let inBody = false;
      for (let i = 0; i < content.length; i++) {
        if (content.slice(i, i + 2) === '$$') { inBody = !inBody; buffer += '$$'; i++; }
        else if (content[i] === ';' && !inBody) { statements.push(buffer); buffer = ''; }
        else buffer += content[i];
      }
      if (buffer.trim()) statements.push(buffer);
      for (const statement of statements) if (statement.trim()) await tx.query(statement);
      await tx.query('INSERT INTO schema_migrations(name, checksum) VALUES ($1, $2)', [name, checksum]);
    }
  });
}

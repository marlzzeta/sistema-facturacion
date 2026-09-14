import type { Database, Sql } from './db/database.js';
import { hashPassword } from './auth/crypto.js';

export async function seedDevelopment(db: Database): Promise<void> {
  const passwordHash = await hashPassword('Admin1234!Admin1234');
  await db.transaction(async (tx: Sql) => {
    const companyId = '00000000-0000-4000-8000-000000000001';
    const userId = '00000000-0000-4000-8000-000000000002';
    await tx.query(`INSERT INTO companies (id, slug, name) VALUES ($1, 'demo', 'Empresa Demo') ON CONFLICT (id) DO NOTHING`, [companyId]);
    await tx.query(`INSERT INTO users (id, username, display_name, password_hash) VALUES ($1, 'admin', 'Administrador Demo', $2) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [userId, passwordHash]);
    await tx.query(`INSERT INTO memberships (user_id, company_id, role) VALUES ($1, $2, 'administrador') ON CONFLICT (user_id, company_id) DO NOTHING`, [userId, companyId]);
  });
}

import type { Database } from './database.js';
import { hashPassword } from '../auth/crypto.js';

export async function ensureAdmin(db: Database, opts: {
  companySlug: string;
  companyName: string;
  adminUsername: string;
  adminPassword: string;
}): Promise<void> {
  const hash = await hashPassword(opts.adminPassword);
  await db.transaction(async (tx) => {
    await tx.query(
      `INSERT INTO companies (id, slug, name) VALUES (gen_random_uuid(), $1, $2) ON CONFLICT (slug) DO NOTHING`,
      [opts.companySlug, opts.companyName],
    );
    const { rows: [company] } = await tx.query<{ id: string }>(
      'SELECT id FROM companies WHERE slug = $1', [opts.companySlug],
    );
    if (!company) throw new Error(`ensureAdmin: company "${opts.companySlug}" not found after upsert`);

    await tx.query(
      `INSERT INTO users (id, username, display_name, password_hash)
       VALUES (gen_random_uuid(), $1, 'Administrador', $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [opts.adminUsername, hash],
    );
    const { rows: [user] } = await tx.query<{ id: string }>(
      'SELECT id FROM users WHERE username = $1', [opts.adminUsername],
    );
    if (!user) throw new Error(`ensureAdmin: user "${opts.adminUsername}" not found after upsert`);

    await tx.query(
      `INSERT INTO memberships (company_id, user_id, role)
       VALUES ($1, $2, 'administrador')
       ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'administrador', active = true`,
      [company.id, user.id],
    );
  });
  console.log(`[setup] Admin "${opts.adminUsername}" listo para empresa "${opts.companySlug}".`);
}

/**
 * One-time admin password reset script.
 * Usage: DATABASE_URL=<url> npx tsx server/reset-admin.ts
 *
 * Prints all companies and their slugs, then resets every 'administrador'
 * user's password to the value in ADMIN_PASSWORD (default: Admin1234!Admin1234).
 */
import { postgresDatabase } from './db/postgres.js';
import { hashPassword } from './auth/crypto.js';

const url = process.env.DATABASE_URL;
if (!url) { console.error('ERROR: set DATABASE_URL'); process.exit(1); }

const newPassword = process.env.ADMIN_PASSWORD ?? 'Admin1234!Admin1234';
const db = postgresDatabase(url);

const companies = await db.query<{ slug: string; name: string }>('SELECT slug, name FROM companies ORDER BY name');
console.log('\n=== Empresas en la DB ===');
for (const c of companies.rows) console.log(`  slug: "${c.slug}"  →  ${c.name}`);

const hash = await hashPassword(newPassword);
const result = await db.query<{ username: string; company: string }>(
  `UPDATE users u SET password_hash = $1
   FROM memberships m JOIN companies c ON c.id = m.company_id
   WHERE m.user_id = u.id AND m.role = 'administrador'
   RETURNING u.username, c.slug AS company`,
  [hash],
);

console.log('\n=== Contraseñas reseteadas ===');
for (const r of result.rows) console.log(`  usuario: "${r.username}"  empresa: "${r.company}"`);
console.log(`\n  Nueva contraseña: ${newPassword}\n`);

await db.close();

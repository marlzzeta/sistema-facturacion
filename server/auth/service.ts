import { randomUUID } from 'node:crypto';
import type { Database, Sql } from '../db/database.js';
import { audit } from '../audit.js';
import { ApiError } from '../errors.js';
import { checkPassword, csrfFor, hashPassword, newToken, tokenHash } from './crypto.js';
import { rolePermissions, type Role, type SessionResponse, type SessionUser } from '../../shared/contracts.js';

const SESSION_MS = 30 * 60 * 1000;
const ABSOLUTE_SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
type MembershipRow = { user_id: string; username: string; display_name: string; password_hash: string; company_id: string; company_name: string; role: Role; failed_attempts: number; locked_until: string | null; user_active: boolean; membership_active: boolean };

function sessionUser(row: MembershipRow): SessionUser {
  return {
    id: row.user_id, username: row.username, displayName: row.display_name,
    companyId: row.company_id, companyName: row.company_name, role: row.role,
    permissions: rolePermissions[row.role],
  };
}

async function membership(db: Sql, company: string, username: string) {
  const result = await db.query<MembershipRow>('SELECT u.id AS user_id, u.username, u.display_name, u.password_hash, c.id AS company_id, c.name AS company_name, m.role, u.failed_attempts, u.locked_until, u.active AS user_active, m.active AS membership_active FROM companies c JOIN memberships m ON m.company_id = c.id JOIN users u ON u.id = m.user_id WHERE c.slug = $1 AND u.username = $2', [company, username]);
  return result.rows[0];
}

export async function createUser(db: Database, input: { companyId: string; username: string; displayName: string; password: string; role: Role }) {
  const id = randomUUID();
  const passwordHash = await hashPassword(input.password);
  await db.transaction(async tx => {
    await tx.query('INSERT INTO users(id, username, display_name, password_hash) VALUES ($1,$2,$3,$4)', [id, input.username, input.displayName, passwordHash]);
    await tx.query('INSERT INTO memberships(company_id, user_id, role) VALUES ($1,$2,$3)', [input.companyId, id, input.role]);
  });
  return id;
}

export async function login(db: Database, company: string, username: string, password: string, requestId: string) {
  const row = await membership(db, company, username);
  const now = Date.now();
  const locked = row?.locked_until && new Date(row.locked_until).getTime() > now;
  const invalidHash = '$argon2id$v=19$m=19456,t=2,p=1$invalid$invalid';
  const valid = row && row.user_active && row.membership_active && !locked && await checkPassword(row.password_hash, password);
  if (!valid) {
    if (row && !locked) {
      const failed = row.failed_attempts + 1;
      await db.query('UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3', [failed, failed >= MAX_FAILED ? new Date(now + LOCK_MS).toISOString() : null, row.user_id]);
    } else await checkPassword(invalidHash, password);
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos.');
  }
  const token = newToken();
  const created = new Date(now); const expires = new Date(now + SESSION_MS); const absolute = new Date(now + ABSOLUTE_SESSION_MS);
  await db.transaction(async tx => {
    await tx.query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1', [row.user_id]);
    await tx.query('INSERT INTO sessions(token_hash, user_id, company_id, created_at, expires_at, absolute_expires_at) VALUES ($1,$2,$3,$4,$5,$6)', [tokenHash(token), row.user_id, row.company_id, created, expires, absolute]);
    await audit(tx, { companyId: row.company_id, actorId: row.user_id, action: 'auth.login', requestId });
  });
  return { token, session: { user: sessionUser(row), expiresAt: expires.toISOString(), absoluteExpiresAt: absolute.toISOString(), csrfToken: csrfFor(token) } satisfies SessionResponse };
}

export async function loadSession(db: Database, token: string | undefined) {
  if (!token) return null;
  const result = await db.query<MembershipRow & { expires_at: string; absolute_expires_at: string }>('SELECT u.id AS user_id, u.username, u.display_name, c.id AS company_id, c.name AS company_name, m.role, u.password_hash, u.failed_attempts, u.locked_until, u.active AS user_active, m.active AS membership_active, s.expires_at, s.absolute_expires_at FROM sessions s JOIN users u ON u.id = s.user_id JOIN memberships m ON m.company_id = s.company_id AND m.user_id = s.user_id JOIN companies c ON c.id = s.company_id WHERE s.token_hash = $1', [tokenHash(token)]);
  const row = result.rows[0];
  if (!row || !row.user_active || !row.membership_active || new Date(row.expires_at).getTime() <= Date.now()) { if (row) await db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)]); return null; }
  return { token, session: { user: sessionUser(row), expiresAt: row.expires_at, absoluteExpiresAt: row.absolute_expires_at, csrfToken: csrfFor(token) } satisfies SessionResponse };
}

export async function logout(db: Database, token: string, requestId: string) {
  await db.transaction(async tx => {
    const existing = await tx.query<{ user_id: string; company_id: string }>('SELECT user_id, company_id FROM sessions WHERE token_hash = $1', [tokenHash(token)]);
    await tx.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)]);
    if (existing.rows[0]) await audit(tx, { companyId: existing.rows[0].company_id, actorId: existing.rows[0].user_id, action: 'auth.logout', requestId });
  });
}

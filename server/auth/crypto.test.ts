import { describe, expect, it } from 'vitest';
import { checkPassword, csrfFor, hashPassword, newToken, validCsrf } from './crypto';

describe('auth crypto', () => {
  it('hashes passwords with Argon2id and verifies them', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(hash).toContain('$argon2id$');
    await expect(checkPassword(hash, 'correct-horse-battery-staple')).resolves.toBe(true);
    await expect(checkPassword(hash, 'wrong-password')).resolves.toBe(false);
  });

  it('creates CSRF tokens bound to the session token', () => {
    const token = newToken();
    const csrf = csrfFor(token);
    expect(validCsrf(token, csrf)).toBe(true);
    expect(validCsrf(newToken(), csrf)).toBe(false);
  });
});

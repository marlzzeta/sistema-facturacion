import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Algorithm, hash, verify } from '@node-rs/argon2';

export const hashPassword = (password: string) => hash(password, {
  algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1,
});
export async function checkPassword(passwordHash: string, password: string) {
  try { return await verify(passwordHash, password); } catch { return false; }
}
export const newToken = () => randomBytes(32).toString('hex');
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const csrfFor = (token: string) => createHmac('sha256', token).update('fac-csrf-v1').digest('hex');
export function validCsrf(token: string, candidate: unknown) {
  return typeof candidate === 'string' && /^[a-f0-9]{64}$/.test(candidate) &&
    timingSafeEqual(Buffer.from(csrfFor(token), 'hex'), Buffer.from(candidate, 'hex'));
}

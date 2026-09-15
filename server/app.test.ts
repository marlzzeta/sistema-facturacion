import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { embeddedDatabase } from './db/embedded';
import { migrate } from './db/migrate';
import { createApp } from './app';
import { hashPassword } from './auth/crypto';
import type { Database } from './db/database';
import type { FastifyInstance } from 'fastify';

describe('backend HTTP foundation', () => {
  let db: Database;
  let app: FastifyInstance;
  let cookie = '';
  let csrf = '';

  beforeAll(async () => {
    db = await embeddedDatabase();
    await migrate(db);
    const password = await hashPassword('StrongPassword123!');
    await db.query(`INSERT INTO companies(id, slug, name) VALUES ('00000000-0000-4000-8000-000000000010','demo','Demo')`);
    await db.query(`INSERT INTO users(id, username, display_name, password_hash) VALUES ('00000000-0000-4000-8000-000000000011','admin','Admin', $1)`, [password]);
    await db.query(`INSERT INTO memberships(company_id, user_id, role) VALUES ('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011','administrador')`);
    app = await createApp({ db, appOrigin: 'http://localhost:5173', nodeEnv: 'test', secureCookies: false });
  });

  afterAll(async () => { await app.close(); await db.close(); });

  it('rejects unauthenticated access', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/clients' });
    expect(response.statusCode).toBe(401);
  });

  it('serves public company branding without exposing fiscal data', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/branding/demo' });
    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual({ razonSocial: 'Demo', logo: null });
    expect(response.body).not.toContain('tax_id');
  });

  it('logs in and creates a client with CSRF protection', async () => {
    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { company: 'demo', username: 'admin', password: 'StrongPassword123!' } });
    expect(login.statusCode).toBe(200);
    const setCookie = login.headers['set-cookie'];
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
    cookie = cookies.map((value: string) => value.split(';', 1)[0]).join('; ');
    csrf = login.json().csrfToken;
    const create = await app.inject({ method: 'POST', url: '/api/v1/clients', headers: { cookie, 'x-csrf-token': csrf }, payload: { nombre: 'Cliente QA', rtn: '08011999123456' } });
    expect(create.statusCode).toBe(201);
    expect(create.json().data.nombre).toBe('Cliente QA');
    const list = await app.inject({ method: 'GET', url: '/api/v1/clients', headers: { cookie } });
    expect(list.statusCode).toBe(200);
    expect(list.json().data).toHaveLength(1);
  });

  it('blocks state changes without CSRF', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/v1/clients', headers: { cookie }, payload: { nombre: 'Sin CSRF' } });
    expect(response.statusCode).toBe(403);
  });

  it('persists company branding for the administrator', async () => {
    const update = await app.inject({
      method: 'PATCH', url: '/api/v1/company', headers: { cookie, 'x-csrf-token': csrf },
      payload: {
        razonSocial: 'HMD Cliente S.A.', rtn: '08011999123456', direccion: 'Tegucigalpa',
        correo: 'info@hmd.hn', telefono: '+504 2200-0000', resolucionFacturacion: 'SAR-001',
        pieFactura: 'Gracias por su compra.', logo: null, version: 1,
      },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json().data).toMatchObject({ razonSocial: 'HMD Cliente S.A.', version: 2, logo: null });
    const branding = await app.inject({ method: 'GET', url: '/api/v1/branding/demo' });
    expect(branding.json().data.razonSocial).toBe('HMD Cliente S.A.');
    const company = await app.inject({ method: 'GET', url: '/api/v1/company', headers: { cookie } });
    expect(company.json().data.rtn).toBe('08011999123456');
  });
});

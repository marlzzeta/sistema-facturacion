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
    expect(response.json().data).toEqual({ razonSocial: 'Demo', logo: null, logoSistema: null, favicon: null, tituloPestana: '' });
    expect(response.body).not.toContain('tax_id');
  });

  it('allows same-host Preview login but rejects foreign origins', async () => { const payload = { company: 'demo', username: 'admin', password: 'StrongPassword123!' }; const host = 'preview.example.vercel.app'; const accepted = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { host, origin: `https://${host}` }, payload }); expect(accepted.statusCode).toBe(200); const rejected = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { host, origin: 'https://foreign.example' }, payload }); expect(rejected.statusCode).toBe(403); expect(rejected.json().error.code).toBe('ORIGIN_FORBIDDEN'); }); it('logs in and creates a client with CSRF protection', async () => {
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

  it('stores the system logo separately from the company logo', async () => {
    const systemLogo = 'data:image/png;base64,iVBORw0KGgo=';
    const current = (await app.inject({ method: 'GET', url: '/api/v1/company', headers: { cookie } })).json().data;
    const base = {
      razonSocial: current.razonSocial, rtn: current.rtn, direccion: current.direccion, correo: current.correo,
      telefono: current.telefono, resolucionFacturacion: current.resolucionFacturacion, pieFactura: current.pieFactura,
    };
    const update = await app.inject({
      method: 'PATCH', url: '/api/v1/company', headers: { cookie, 'x-csrf-token': csrf },
      payload: { ...base, logo: null, logoSistema: systemLogo, version: current.version },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json().data).toMatchObject({ logo: null, logoSistema: systemLogo });
    const branding = await app.inject({ method: 'GET', url: '/api/v1/branding/demo' });
    expect(branding.json().data).toMatchObject({ logo: null, logoSistema: systemLogo });
    // Omitting logoSistema keeps the stored value.
    const keep = await app.inject({
      method: 'PATCH', url: '/api/v1/company', headers: { cookie, 'x-csrf-token': csrf },
      payload: { ...base, logo: null, version: update.json().data.version },
    });
    expect(keep.statusCode).toBe(200);
    expect(keep.json().data.logoSistema).toBe(systemLogo);
  });

  it('stores the browser tab favicon and title', async () => {
    const favicon = 'data:image/png;base64,iVBORw0KGgo=';
    const current = (await app.inject({ method: 'GET', url: '/api/v1/company', headers: { cookie } })).json().data;
    const base = {
      razonSocial: current.razonSocial, rtn: current.rtn, direccion: current.direccion, correo: current.correo,
      telefono: current.telefono, resolucionFacturacion: current.resolucionFacturacion, pieFactura: current.pieFactura,
      logo: null,
    };
    const update = await app.inject({
      method: 'PATCH', url: '/api/v1/company', headers: { cookie, 'x-csrf-token': csrf },
      payload: { ...base, favicon, tituloPestana: 'HMD Facturación', version: current.version },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json().data).toMatchObject({ favicon, tituloPestana: 'HMD Facturación' });
    const branding = await app.inject({ method: 'GET', url: '/api/v1/branding/demo' });
    expect(branding.json().data).toMatchObject({ favicon, tituloPestana: 'HMD Facturación' });
    const keep = await app.inject({
      method: 'PATCH', url: '/api/v1/company', headers: { cookie, 'x-csrf-token': csrf },
      payload: { ...base, version: update.json().data.version },
    });
    expect(keep.json().data).toMatchObject({ favicon, tituloPestana: 'HMD Facturación' });
  });

  it('creates a real user that can authenticate', async () => {
    const created = await app.inject({
      method: 'POST', url: '/api/v1/users', headers: { cookie, 'x-csrf-token': csrf },
      payload: { username: 'mvillalobos', displayName: 'Marcela Villalobos', password: 'MarcelaSecure123!', role: 'administrador', employeeId: 'emp00003', active: true },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data).toMatchObject({ username: 'mvillalobos', employeeId: 'emp00003', version: 1 });
    expect(created.body).not.toContain('password');
    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { company: 'demo', username: 'mvillalobos', password: 'MarcelaSecure123!' } });
    expect(login.statusCode).toBe(200);
    const disabled = await app.inject({ method: 'DELETE', url: `/api/v1/users/${created.json().data.id}`, headers: { cookie, 'x-csrf-token': csrf } });
    expect(disabled.statusCode).toBe(200);
    expect(disabled.json().data.active).toBe(false);
    const rejected = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { company: 'demo', username: 'mvillalobos', password: 'MarcelaSecure123!' } });
    expect(rejected.statusCode).toBe(401);
  });

  it('persists administrative workspace data with optimistic locking', async () => {
    const data = {
      establecimientos: [], puntosEmision: [], roles: [], empleados: [{ id: 'emp00003', nombre: 'Marcela' }],
      datosFiscales: [], tiposImpuesto: [], tiposRetencion: [], tiposMoneda: [], formasPago: [], articulos: [], servicios: [],
    };
    const created = await app.inject({ method: 'PUT', url: '/api/v1/workspace', headers: { cookie, 'x-csrf-token': csrf }, payload: { data, version: 0 } });
    expect(created.statusCode).toBe(200);
    expect(created.json().version).toBe(1);
    const loaded = await app.inject({ method: 'GET', url: '/api/v1/workspace', headers: { cookie } });
    expect(loaded.statusCode).toBe(200);
    expect(loaded.json().data.empleados[0].nombre).toBe('Marcela');
    const stale = await app.inject({ method: 'PUT', url: '/api/v1/workspace', headers: { cookie, 'x-csrf-token': csrf }, payload: { data, version: 0 } });
    expect(stale.statusCode).toBe(409);
  });

  it('rejects repeated product or service codes in the workspace', async () => {
    const loaded = await app.inject({ method: 'GET', url: '/api/v1/workspace', headers: { cookie } });
    const { data, version } = loaded.json() as { data: Record<string, unknown[]>; version: number };
    const withCodes = { ...data, articulos: [{ id: 'a1', codigo: 'SRV-01', descripcion: 'Laptop' }], servicios: [{ id: 's1', codigo: 'SRV-02', descripcion: 'Web' }] };
    const ok = await app.inject({ method: 'PUT', url: '/api/v1/workspace', headers: { cookie, 'x-csrf-token': csrf }, payload: { data: withCodes, version } });
    expect(ok.statusCode).toBe(200);
    const repeated = { ...withCodes, servicios: [...withCodes.servicios, { id: 's2', codigo: ' srv-01 ', descripcion: 'Otro' }] };
    const rejected = await app.inject({ method: 'PUT', url: '/api/v1/workspace', headers: { cookie, 'x-csrf-token': csrf }, payload: { data: repeated, version: ok.json().version } });
    expect(rejected.statusCode).toBe(422);
    expect(rejected.json().error.code).toBe('DUPLICATE_CODE');
  });

  it('persists and cancels invoices using the server id', async () => {
    const clients = await app.inject({ method: 'GET', url: '/api/v1/clients', headers: { cookie } });
    const clienteId = clients.json().data[0].id as string;
    const created = await app.inject({
      method: 'POST', url: '/api/v1/invoices', headers: { cookie, 'x-csrf-token': csrf },
      payload: { numero: '001-001-01-00000001', clienteId, fecha: '2026-09-15', total: '100.00', estado: 'emitido', payload: { id: 'local-id', numero: '001-001-01-00000001', estado: 'emitido' } },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.id).not.toBe('local-id');
    const id = created.json().data.id as string;
    const canceled = await app.inject({ method: 'PATCH', url: `/api/v1/invoices/${id}/cancel`, headers: { cookie, 'x-csrf-token': csrf } });
    expect(canceled.statusCode).toBe(200);
    expect(canceled.json().data.estado).toBe('anulado');
    const listed = await app.inject({ method: 'GET', url: '/api/v1/invoices', headers: { cookie } });
    expect(listed.json().data[0].estado).toBe('anulado');
  });

  describe('account lockout', () => {
    it('bloquea la cuenta tras 5 intentos fallidos consecutivos', async () => {
      const created = await app.inject({
        method: 'POST', url: '/api/v1/users', headers: { cookie, 'x-csrf-token': csrf },
        payload: { username: 'locktest', displayName: 'Lock Test', password: 'LockPassword123!456', role: 'facturador', employeeId: 'emp-lock-01', active: true },
      });
      expect(created.statusCode).toBe(201);
      for (let i = 0; i < 5; i++) {
        await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { company: 'demo', username: 'locktest', password: 'WrongPassword!1234' } });
      }
      const r = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { company: 'demo', username: 'locktest', password: 'LockPassword123!456' } });
      expect(r.statusCode).toBe(401);
      expect(r.json().error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('session renewal', () => {
    it('renueva una sesión activa y retorna nuevo expiresAt', async () => {
      const r = await app.inject({ method: 'POST', url: '/api/v1/auth/renew', headers: { cookie, 'x-csrf-token': csrf } });
      expect(r.statusCode).toBe(200);
      expect(r.json()).toHaveProperty('expiresAt');
      expect(r.json()).toHaveProperty('absoluteExpiresAt');
    });

    it('rechaza renovación sin CSRF', async () => {
      const r = await app.inject({ method: 'POST', url: '/api/v1/auth/renew', headers: { cookie } });
      expect(r.statusCode).toBe(403);
    });

    it('rechaza renovación sin sesión activa', async () => {
      const r = await app.inject({ method: 'POST', url: '/api/v1/auth/renew' });
      expect(r.statusCode).toBe(401);
    });
  });

  describe('expired / invalid session', () => {
    it('rechaza requests con token de sesión inválido', async () => {
      const r = await app.inject({ method: 'GET', url: '/api/v1/clients', headers: { cookie: 'session=INVALID_TOKEN_XYZ_THAT_DOES_NOT_EXIST' } });
      expect(r.statusCode).toBe(401);
    });
  });

  describe('role-based access control', () => {
    it('auditor no puede crear facturas', async () => {
      const created = await app.inject({
        method: 'POST', url: '/api/v1/users', headers: { cookie, 'x-csrf-token': csrf },
        payload: { username: 'auditor.test', displayName: 'Auditor Test', password: 'AuditSecure123!456', role: 'auditor', employeeId: 'emp-aud-01', active: true },
      });
      expect(created.statusCode).toBe(201);
      const auditLogin = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { company: 'demo', username: 'auditor.test', password: 'AuditSecure123!456' } });
      expect(auditLogin.statusCode).toBe(200);
      const rawCookies = auditLogin.headers['set-cookie'];
      const auditCookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies ?? ''];
      const auditCookie = auditCookies.map((v: string) => v.split(';', 1)[0]).join('; ');
      const auditCsrf = auditLogin.json().csrfToken as string;
      const clients = await app.inject({ method: 'GET', url: '/api/v1/clients', headers: { cookie: auditCookie } });
      const clienteId = clients.json().data[0].id as string;
      const r = await app.inject({
        method: 'POST', url: '/api/v1/invoices', headers: { cookie: auditCookie, 'x-csrf-token': auditCsrf },
        payload: { numero: '001-001-01-99999999', clienteId, fecha: '2026-09-15', total: '100.00', estado: 'emitido', payload: {} },
      });
      expect(r.statusCode).toBe(403);
      expect(r.json().error.code).toBe('FORBIDDEN');
    });
  });

  describe('optimistic locking', () => {
    it('rechaza actualización de cliente con versión obsoleta', async () => {
      const clients = await app.inject({ method: 'GET', url: '/api/v1/clients', headers: { cookie } });
      const client = clients.json().data[0] as { id: string; nombre: string };
      const r = await app.inject({
        method: 'PATCH', url: `/api/v1/clients/${client.id}`, headers: { cookie, 'x-csrf-token': csrf },
        payload: { nombre: client.nombre, rtn: '', dni: '', correo: '', telefono: '', direccion: '', condicionPago: 'contado', limitCredito: '0.00', exentoImpuesto: false, activo: true, version: 9999 },
      });
      expect(r.statusCode).toBe(409);
      expect(r.json().error.code).toBe('STALE_CLIENT');
    });
  });

  describe('invoice constraints', () => {
    it('rechaza número de factura duplicado', async () => {
      const clients = await app.inject({ method: 'GET', url: '/api/v1/clients', headers: { cookie } });
      const clienteId = clients.json().data[0].id as string;
      const payload1 = { numero: '001-001-01-99000001', clienteId, fecha: '2026-09-16', total: '50.00', estado: 'emitido', payload: { numero: '001-001-01-99000001' } };
      const first = await app.inject({ method: 'POST', url: '/api/v1/invoices', headers: { cookie, 'x-csrf-token': csrf }, payload: payload1 });
      expect(first.statusCode).toBe(201);
      const second = await app.inject({ method: 'POST', url: '/api/v1/invoices', headers: { cookie, 'x-csrf-token': csrf }, payload: payload1 });
      expect(second.statusCode).toBe(409);
      expect(second.json().error.code).toBe('DUPLICATE_INVOICE');
    });

    it('anular factura ya anulada es idempotente', async () => {
      const clients = await app.inject({ method: 'GET', url: '/api/v1/clients', headers: { cookie } });
      const clienteId = clients.json().data[0].id as string;
      const created = await app.inject({
        method: 'POST', url: '/api/v1/invoices', headers: { cookie, 'x-csrf-token': csrf },
        payload: { numero: '001-001-01-99000002', clienteId, fecha: '2026-09-16', total: '75.00', estado: 'emitido', payload: { numero: '001-001-01-99000002' } },
      });
      expect(created.statusCode).toBe(201);
      const id = created.json().data.id as string;
      const first = await app.inject({ method: 'PATCH', url: `/api/v1/invoices/${id}/cancel`, headers: { cookie, 'x-csrf-token': csrf } });
      expect(first.statusCode).toBe(200);
      expect(first.json().data.estado).toBe('anulado');
      const second = await app.inject({ method: 'PATCH', url: `/api/v1/invoices/${id}/cancel`, headers: { cookie, 'x-csrf-token': csrf } });
      expect(second.statusCode).toBe(200);
      expect(second.json().data.estado).toBe('anulado');
    });
  });
});

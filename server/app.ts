import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { ZodError } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Database } from './db/database.js';
import { ApiError } from './errors.js';
import { login, loadSession, logout } from './auth/service.js';
import { validCsrf } from './auth/crypto.js';
import { listClients, createClient, updateClient } from './clients/service.js';
import { listInvoices, createInvoice } from './invoices/service.js';
import { clientSchema, updateClientSchema, invoiceSchema, loginSchema, type Permission, type SessionUser } from '../shared/contracts.js';

declare module 'fastify' {
  interface FastifyRequest { authUser?: SessionUser; sessionToken?: string; }
}

type AppOptions = { db: Database; appOrigin: string; nodeEnv?: string; secureCookies?: boolean };

const sessionCookie = 'fac_session';
const csrfCookie = 'fac_csrf';

function requirePermission(request: FastifyRequest, permission: Permission): SessionUser {
  if (!request.authUser) throw new ApiError(401, 'UNAUTHENTICATED', 'Sesión requerida');
  if (!request.authUser.permissions.includes(permission)) throw new ApiError(403, 'FORBIDDEN', 'No tienes permisos para esta operación');
  return request.authUser;
}

function requireCsrf(request: FastifyRequest): void {
  const csrf = request.headers['x-csrf-token'];
  const cookieValue = request.cookies[csrfCookie];
  if (typeof csrf !== 'string' || !cookieValue || csrf !== cookieValue || !request.sessionToken || !validCsrf(request.sessionToken, csrf)) throw new ApiError(403, 'CSRF_INVALID', 'Token CSRF inválido');
}

function setSession(reply: FastifyReply, token: string, csrfToken: string, secure: boolean): void {
  reply.setCookie(sessionCookie, token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 1800 });
  reply.setCookie(csrfCookie, csrfToken, { httpOnly: false, secure, sameSite: 'lax', path: '/', maxAge: 1800 });
}

export async function createApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, genReqId: () => randomUUID() });
  const secure = options.secureCookies ?? options.nodeEnv === 'production';
  await app.register(cookie);
  await app.register(helmet);

  app.addHook('onRequest', async (request) => {
    const origin = request.headers.origin;
    const allowedOrigins = options.appOrigin.split(',').map(value => value.trim()).filter(Boolean);
    if (origin && !allowedOrigins.includes(origin)) throw new ApiError(403, 'ORIGIN_FORBIDDEN', 'Origen no permitido');
    const token = request.cookies[sessionCookie];
    if (token) {
      const session = await loadSession(options.db, token);
      if (session) { request.authUser = session.session.user; request.sessionToken = token; }
    }
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) return reply.code(error.status).send({ error: { code: error.code, message: error.message } });
    if (error instanceof ZodError) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: error.flatten() } });
    request.log.error(error as Error);
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
  });

  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/ready', async (_request, reply) => { await options.db.query('SELECT 1'); return reply.send({ status: 'ready' }); });

  app.post('/api/v1/auth/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const result = await login(options.db, input.company, input.username, input.password, request.id);
    setSession(reply, result.token, result.session.csrfToken, secure);
    return reply.send({ user: result.session.user, csrfToken: result.session.csrfToken });
  });

  app.get('/api/v1/auth/session', async (request, reply) => {
    if (!request.authUser) throw new ApiError(401, 'UNAUTHENTICATED', 'Sesión requerida');
    return reply.send({ user: request.authUser, csrfToken: request.cookies[csrfCookie] ?? null });
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    if (request.authUser) { requireCsrf(request); await logout(options.db, request.sessionToken!, request.id); }
    reply.clearCookie(sessionCookie, { path: '/' }); reply.clearCookie(csrfCookie, { path: '/' });
    return reply.send({ ok: true });
  });

  app.get('/api/v1/clients', async (request, reply) => {
    const user = requirePermission(request, 'clients:read');
    return reply.send({ data: await listClients(options.db, user.companyId) });
  });
  app.post('/api/v1/clients', async (request, reply) => {
    const user = requirePermission(request, 'clients:write'); requireCsrf(request);
    return reply.code(201).send({ data: await createClient(options.db, user.companyId, user.id, clientSchema.parse(request.body), request.id) });
  });
  app.patch('/api/v1/clients/:id', async (request, reply) => {
    const user = requirePermission(request, 'clients:write'); requireCsrf(request);
    const params = request.params as { id: string };
    const input = updateClientSchema.parse(request.body);
    return reply.send({ data: await updateClient(options.db, user.companyId, user.id, params.id, input.version, input, request.id) });
  });

  app.get('/api/v1/invoices', async (request, reply) => {
    const user = requirePermission(request, 'clients:read');
    return reply.send({ data: await listInvoices(options.db, user.companyId) });
  });
  app.post('/api/v1/invoices', async (request, reply) => {
    const user = requirePermission(request, 'clients:write'); requireCsrf(request);
    return reply.code(201).send({ data: await createInvoice(options.db, user.companyId, user.id, invoiceSchema.parse(request.body), request.id) });
  });

  return app;
}


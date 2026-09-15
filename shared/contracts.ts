import { z } from 'zod';

export const roles = ['administrador', 'facturador', 'auditor'] as const;
export type Role = typeof roles[number];
export type Permission = 'clients:read' | 'clients:write' | 'users:read' | 'users:write' | 'audit:read';
export const rolePermissions: Record<Role, readonly Permission[]> = {
  administrador: ['clients:read', 'clients:write', 'users:read', 'users:write', 'audit:read'],
  facturador: ['clients:read', 'clients:write'],
  auditor: ['clients:read', 'audit:read'],
};

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  companyId: string;
  companyName: string;
  role: Role;
  permissions: readonly Permission[];
}

export interface SessionResponse {
  user: SessionUser;
  expiresAt: string;
  absoluteExpiresAt: string;
  csrfToken: string;
}

export const loginSchema = z.object({
  company: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
  username: z.string().trim().toLowerCase().min(3).max(100),
  password: z.string().min(1).max(128),
}).strict();

export const newUserSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._@-]{3,100}$/),
  displayName: z.string().trim().min(1).max(150),
  password: z.string().min(15).max(128),
  role: z.enum(roles),
}).strict();

const optionalText = (max: number) => z.string().trim().max(max).default('');
export const clientSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  rtn: z.union([z.literal(''), z.string().regex(/^\d{14}$/)]).default(''),
  dni: optionalText(25),
  correo: z.union([z.literal(''), z.email().max(254)]).default(''),
  telefono: optionalText(30),
  direccion: optionalText(500),
  condicionPago: z.enum(['contado', 'credito']).default('contado'),
  // Decimal string at the API boundary; never accept floating-point money.
  limitCredito: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/).default('0.00'),
  exentoImpuesto: z.boolean().default(false),
  activo: z.boolean().default(true),
}).strict();

export const updateClientSchema = clientSchema.extend({ version: z.number().int().positive() });
export type ClientInput = z.infer<typeof clientSchema>;
export interface ClientRecord extends ClientInput {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export const invoiceSchema = z.object({
  numero: z.string().trim().min(1).max(60),
  clienteId: z.string().uuid(),
  fecha: z.string().date(),
  total: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/),
  estado: z.enum(['borrador', 'emitido', 'anulado']),
  payload: z.record(z.string(), z.unknown()),
}).strict();
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export interface ApiErrorBody { error: { code: string; message: string; requestId: string } }


import { z } from 'zod';

export const roles = ['administrador', 'facturador', 'auditor'] as const;
export type Role = typeof roles[number];
export type Permission = 'company:read' | 'company:write' | 'clients:read' | 'clients:write' | 'users:read' | 'users:write' | 'workspace:read' | 'workspace:write' | 'audit:read';
export const rolePermissions: Record<Role, readonly Permission[]> = {
  administrador: ['company:read', 'company:write', 'clients:read', 'clients:write', 'users:read', 'users:write', 'workspace:read', 'workspace:write', 'audit:read'],
  facturador: ['company:read', 'clients:read', 'clients:write', 'workspace:read', 'workspace:write'],
  auditor: ['company:read', 'clients:read', 'workspace:read', 'audit:read'],
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
  employeeId: z.string().trim().min(1).max(100),
  active: z.boolean().default(true),
}).strict();

export const updateUserSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._@-]{3,100}$/),
  displayName: z.string().trim().min(1).max(150),
  password: z.union([z.literal(''), z.string().min(15).max(128)]).default(''),
  role: z.enum(roles),
  employeeId: z.string().trim().min(1).max(100),
  active: z.boolean(),
  version: z.number().int().positive(),
}).strict();

export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  employeeId: string;
  role: Role;
  active: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  version: number;
}

const workspaceCollection = z.array(z.record(z.string(), z.unknown())).max(5000);
export const workspaceDataSchema = z.object({
  establecimientos: workspaceCollection,
  puntosEmision: workspaceCollection,
  roles: workspaceCollection,
  empleados: workspaceCollection,
  datosFiscales: workspaceCollection,
  tiposImpuesto: workspaceCollection,
  tiposRetencion: workspaceCollection,
  tiposMoneda: workspaceCollection,
  formasPago: workspaceCollection,
  articulos: workspaceCollection,
  servicios: workspaceCollection,
}).strict();
export const updateWorkspaceSchema = z.object({
  data: workspaceDataSchema,
  version: z.number().int().nonnegative(),
}).strict();
export type WorkspaceData = z.infer<typeof workspaceDataSchema>;

const logoDataUrl = z.string()
  .max(2_800_000)
  .regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, 'El logo debe ser PNG, JPG o WebP.');

export const companySchema = z.object({
  razonSocial: z.string().trim().min(1).max(200),
  rtn: z.union([z.literal(''), z.string().regex(/^\d{14}$/)]).default(''),
  direccion: z.string().trim().max(500).default(''),
  correo: z.union([z.literal(''), z.email().max(254)]).default(''),
  telefono: z.string().trim().max(30).default(''),
  resolucionFacturacion: z.string().trim().max(150).default(''),
  pieFactura: z.string().trim().max(500).default(''),
  logo: z.union([z.null(), z.literal(''), logoDataUrl]).default(null),
  version: z.number().int().positive(),
}).strict();
export type CompanyInput = z.infer<typeof companySchema>;
export interface CompanyRecord extends Omit<CompanyInput, 'logo'> {
  id: string;
  logo: string | null;
  updatedAt: string;
}

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

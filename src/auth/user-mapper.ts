import type { Usuario } from '../types';

export type ApiRole = 'administrador' | 'facturador' | 'auditor';
export interface ApiUser {
  id: string; username: string; displayName: string; employeeId: string;
  role: ApiRole; active: boolean; failedAttempts: number;
  lockedUntil: string | null; lastLoginAt: string | null; version: number;
}

export function roleIdFor(role: ApiRole): string {
  if (role === 'administrador') return 'rol00001';
  if (role === 'facturador') return 'rol00002';
  return 'rol00003';
}

export function apiUserToLocal(user: ApiUser): Usuario {
  return {
    id: user.id, empleadoId: user.employeeId, displayName: user.displayName,
    username: user.username, rolId: roleIdFor(user.role), activo: user.active,
    version: user.version, ultimoAcceso: user.lastLoginAt ?? undefined,
    intentosFallidos: user.failedAttempts, bloqueadoHasta: user.lockedUntil ?? undefined,
  };
}

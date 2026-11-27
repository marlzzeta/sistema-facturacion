import type { Articulo, Servicio } from '../types';

/** Normaliza un código para compararlo (sin espacios a los lados y sin distinguir mayúsculas). */
export const normalizeCodigo = (codigo: string) => codigo.trim().toUpperCase();

/**
 * Busca otro producto o servicio que ya use el código indicado.
 * Los códigos son únicos entre artículos y servicios juntos.
 * `excludeId` permite ignorar el registro que se está editando.
 */
export function findCodigoDuplicado(
  codigo: string,
  articulos: Pick<Articulo, 'id' | 'codigo' | 'descripcion'>[],
  servicios: Pick<Servicio, 'id' | 'codigo' | 'descripcion'>[],
  excludeId?: string,
): { tipo: 'producto' | 'servicio'; descripcion: string } | null {
  const target = normalizeCodigo(codigo);
  if (!target) return null;
  const art = articulos.find(a => a.id !== excludeId && normalizeCodigo(a.codigo ?? '') === target);
  if (art) return { tipo: 'producto', descripcion: art.descripcion };
  const srv = servicios.find(s => s.id !== excludeId && normalizeCodigo(s.codigo ?? '') === target);
  if (srv) return { tipo: 'servicio', descripcion: srv.descripcion };
  return null;
}

export function mensajeCodigoDuplicado(codigo: string, dup: { tipo: 'producto' | 'servicio'; descripcion: string }) {
  return `El código "${codigo.trim()}" ya existe en el ${dup.tipo} "${dup.descripcion}". Usa un código diferente.`;
}

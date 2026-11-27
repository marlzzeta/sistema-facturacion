import type { Factura } from '../types';

export type EstadoFactura = Factura['estado'];

export type FechaPreset = 'todas' | 'hoy' | '7dias' | 'mes' | 'mesAnterior' | 'anio' | 'rango';

export interface FiltrosFactura {
  fecha: FechaPreset;
  /** Solo se usan con fecha === 'rango' (formato YYYY-MM-DD). */
  desde: string;
  hasta: string;
  clienteId: string;
  estado: EstadoFactura | '';
}

export const FILTROS_VACIOS: FiltrosFactura = {
  fecha: 'todas', desde: '', hasta: '', clienteId: '', estado: '',
};

export const FECHA_PRESETS: { value: FechaPreset; label: string }[] = [
  { value: 'todas', label: 'Todas las fechas' },
  { value: 'hoy', label: 'Hoy' },
  { value: '7dias', label: 'Últimos 7 días' },
  { value: 'mes', label: 'Este mes' },
  { value: 'mesAnterior', label: 'Mes anterior' },
  { value: 'anio', label: 'Este año' },
  { value: 'rango', label: 'Rango personalizado' },
];

export const ESTADO_LABEL: Record<EstadoFactura, string> = {
  emitido: 'Emitido',
  borrador: 'Borrador',
  anulado: 'Anulado',
};

const pad = (n: number) => String(n).padStart(2, '0');
/** Fecha local en formato YYYY-MM-DD (no UTC, para no cambiar de día de noche). */
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Devuelve el rango [desde, hasta] (inclusive, YYYY-MM-DD) del filtro de fecha, o null si no filtra. */
export function rangoFecha(f: Pick<FiltrosFactura, 'fecha' | 'desde' | 'hasta'>, now = new Date()): [string, string] | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (f.fecha) {
    case 'hoy': return [ymd(now), ymd(now)];
    case '7dias': return [ymd(new Date(y, m, now.getDate() - 6)), ymd(now)];
    case 'mes': return [ymd(new Date(y, m, 1)), ymd(new Date(y, m + 1, 0))];
    case 'mesAnterior': return [ymd(new Date(y, m - 1, 1)), ymd(new Date(y, m, 0))];
    case 'anio': return [`${y}-01-01`, `${y}-12-31`];
    case 'rango': {
      if (!f.desde && !f.hasta) return null;
      let desde = f.desde || '0000-01-01';
      let hasta = f.hasta || '9999-12-31';
      if (desde > hasta) [desde, hasta] = [hasta, desde];
      return [desde, hasta];
    }
    default: return null;
  }
}

/** Texto corto para el botón del filtro de fecha. */
export function etiquetaFecha(f: Pick<FiltrosFactura, 'fecha' | 'desde' | 'hasta'>): string {
  if (f.fecha === 'rango') {
    const fmt = (s: string) => s.split('-').reverse().join('/');
    if (f.desde && f.hasta) return `${fmt(f.desde)} – ${fmt(f.hasta)}`;
    if (f.desde) return `Desde ${fmt(f.desde)}`;
    if (f.hasta) return `Hasta ${fmt(f.hasta)}`;
    return 'Fecha';
  }
  if (f.fecha === 'todas') return 'Fecha';
  return FECHA_PRESETS.find(p => p.value === f.fecha)?.label ?? 'Fecha';
}

export function hayFiltros(f: FiltrosFactura): boolean {
  return rangoFecha(f) !== null || f.clienteId !== '' || f.estado !== '';
}

interface Opciones { ignorarEstado?: boolean; now?: Date }

/** Aplica los filtros de Fecha, Cliente y Estado a la lista de facturas. */
export function filtrarFacturas(facturas: Factura[], f: FiltrosFactura, { ignorarEstado = false, now }: Opciones = {}): Factura[] {
  const rango = rangoFecha(f, now);
  return facturas.filter(fac => {
    if (rango) {
      const d = (fac.fecha ?? '').slice(0, 10);
      if (d < rango[0] || d > rango[1]) return false;
    }
    if (f.clienteId && fac.clienteId !== f.clienteId) return false;
    if (!ignorarEstado && f.estado && fac.estado !== f.estado) return false;
    return true;
  });
}

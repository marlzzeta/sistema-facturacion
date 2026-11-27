import { describe, expect, it } from 'vitest';
import type { Factura } from '../types';
import { FILTROS_VACIOS, etiquetaFecha, filtrarFacturas, hayFiltros, rangoFecha } from './invoiceFilters';

const fac = (id: string, fecha: string, clienteId: string, estado: Factura['estado']) =>
  ({ id, fecha, clienteId, estado }) as Factura;

const lista = [
  fac('a', '2026-11-27', 'c1', 'emitido'),
  fac('b', '2026-11-21', 'c2', 'emitido'),
  fac('c', '2026-10-15', 'c1', 'anulado'),
  fac('d', '2025-12-31', 'c2', 'borrador'),
  fac('e', '2026-11-27T15:00:00.000Z', 'c2', 'emitido'),
];
const now = new Date(2026, 10, 27, 12); // 27 nov 2026
const ids = (r: Factura[]) => r.map(f => f.id).join(',');

describe('rangoFecha', () => {
  it('calcula los presets', () => {
    expect(rangoFecha({ ...FILTROS_VACIOS }, now)).toBeNull();
    expect(rangoFecha({ ...FILTROS_VACIOS, fecha: 'hoy' }, now)).toEqual(['2026-11-27', '2026-11-27']);
    expect(rangoFecha({ ...FILTROS_VACIOS, fecha: '7dias' }, now)).toEqual(['2026-11-21', '2026-11-27']);
    expect(rangoFecha({ ...FILTROS_VACIOS, fecha: 'mes' }, now)).toEqual(['2026-11-01', '2026-11-30']);
    expect(rangoFecha({ ...FILTROS_VACIOS, fecha: 'mesAnterior' }, now)).toEqual(['2026-10-01', '2026-10-31']);
    expect(rangoFecha({ ...FILTROS_VACIOS, fecha: 'mesAnterior' }, new Date(2026, 0, 10))).toEqual(['2025-12-01', '2025-12-31']);
    expect(rangoFecha({ ...FILTROS_VACIOS, fecha: 'anio' }, now)).toEqual(['2026-01-01', '2026-12-31']);
  });

  it('acepta rangos abiertos o invertidos', () => {
    expect(rangoFecha({ fecha: 'rango', desde: '', hasta: '' })).toBeNull();
    expect(rangoFecha({ fecha: 'rango', desde: '2026-11-01', hasta: '' })).toEqual(['2026-11-01', '9999-12-31']);
    expect(rangoFecha({ fecha: 'rango', desde: '2026-11-30', hasta: '2026-11-01' })).toEqual(['2026-11-01', '2026-11-30']);
  });
});

describe('filtrarFacturas', () => {
  it('sin filtros devuelve todo', () => {
    expect(ids(filtrarFacturas(lista, FILTROS_VACIOS, { now }))).toBe('a,b,c,d,e');
    expect(hayFiltros(FILTROS_VACIOS)).toBe(false);
  });

  it('combina fecha, cliente y estado', () => {
    expect(ids(filtrarFacturas(lista, { ...FILTROS_VACIOS, fecha: 'hoy' }, { now }))).toBe('a,e');
    expect(ids(filtrarFacturas(lista, { ...FILTROS_VACIOS, clienteId: 'c1' }, { now }))).toBe('a,c');
    expect(ids(filtrarFacturas(lista, { ...FILTROS_VACIOS, estado: 'emitido' }, { now }))).toBe('a,b,e');
    expect(ids(filtrarFacturas(lista, { ...FILTROS_VACIOS, fecha: 'mes', clienteId: 'c2', estado: 'emitido' }, { now }))).toBe('b,e');
    expect(ids(filtrarFacturas(lista, { ...FILTROS_VACIOS, fecha: 'rango', desde: '2025-12-01', hasta: '2026-10-31' }, { now }))).toBe('c,d');
  });

  it('puede ignorar el estado (para las tarjetas de resumen)', () => {
    expect(ids(filtrarFacturas(lista, { ...FILTROS_VACIOS, clienteId: 'c1', estado: 'emitido' }, { now, ignorarEstado: true }))).toBe('a,c');
  });
});

describe('etiquetaFecha', () => {
  it('muestra el preset o el rango', () => {
    expect(etiquetaFecha(FILTROS_VACIOS)).toBe('Fecha');
    expect(etiquetaFecha({ fecha: 'mes', desde: '', hasta: '' })).toBe('Este mes');
    expect(etiquetaFecha({ fecha: 'rango', desde: '2026-11-01', hasta: '2026-11-15' })).toBe('01/11/2026 – 15/11/2026');
    expect(etiquetaFecha({ fecha: 'rango', desde: '2026-11-01', hasta: '' })).toBe('Desde 01/11/2026');
  });
});

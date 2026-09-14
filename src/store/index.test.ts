import { describe, expect, it } from 'vitest';
import type { Factura, LineaFactura } from '../types';
import { initialState, reducer } from './index';

function makeLine(id: string, itemId: string, cantidad: number): LineaFactura {
  return {
    id,
    itemId,
    descripcion: 'Prueba',
    detalle: '',
    cantidad,
    precio: 100,
    descuento: 0,
    tipoImpuestoId: 'imp00001',
    tipoImpuestoPorcentaje: 15,
    subtotal: cantidad * 100,
    impuesto: cantidad * 15,
    total: cantidad * 115,
  };
}

function makeInvoice(lineas: LineaFactura[]): Factura {
  return {
    id: 'factura-1',
    numero: '001-001-01-00000001',
    fecha: '2026-09-13',
    monedaId: 'mon00001',
    establecimientoId: 'est00001',
    puntoEmisionId: 'pe000001',
    clienteId: 'cli00001',
    lineas,
    subtotal: 0,
    descuento: 0,
    impuestos: [],
    retencionId: null,
    retencionMonto: 0,
    total: 0,
    estado: 'emitido',
    usuarioEmisorId: 'usr00001',
    cai: 'CAI',
    rangoDesde: 1,
    rangoHasta: 500,
    fechaVigenciaCai: '2027-12-31',
    formaPagoId: 'fp000001',
    referenciaPago: '',
  };
}

describe('store reducer', () => {
  it('emite una factura, descuenta todas las líneas repetidas e incrementa el correlativo', () => {
    const originalStock = initialState.articulos[0].stock;
    const originalCorrelativo = initialState.puntosEmision[0].correlativoActual;
    const factura = makeInvoice([
      makeLine('l1', initialState.articulos[0].id, 2),
      makeLine('l2', initialState.articulos[0].id, 3),
    ]);

    const next = reducer(initialState, { type: 'EMIT_FACTURA', payload: factura });

    expect(next.facturas).toContain(factura);
    expect(next.articulos[0].stock).toBe(originalStock - 5);
    expect(next.puntosEmision[0].correlativoActual).toBe(originalCorrelativo + 1);
    expect(initialState.articulos[0].stock).toBe(originalStock);
  });

  it('anula únicamente la factura solicitada', () => {
    const factura = makeInvoice([]);
    const state = { ...initialState, facturas: [factura] };

    const next = reducer(state, { type: 'ANULAR_FACTURA', payload: factura.id });

    expect(next.facturas[0].estado).toBe('anulado');
    expect(state.facturas[0].estado).toBe('emitido');
  });
});

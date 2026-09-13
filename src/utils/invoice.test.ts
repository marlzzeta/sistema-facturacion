import { describe, expect, it } from 'vitest';
import type { ItemCatalogo, LineaFactura, TipoImpuesto } from '../types';
import { calculateInvoiceLine, calculateInvoiceTotals, roundMoney } from './invoice';

const impuestos: TipoImpuesto[] = [
  { id: 'iva15', nombre: 'IVA 15%', porcentaje: 15, activo: true },
  { id: 'iva18', nombre: 'IVA 18%', porcentaje: 18, activo: true },
];

const items: ItemCatalogo[] = [
  {
    id: 'articulo-1',
    codigo: 'ART-1',
    descripcion: 'Artículo de prueba',
    precio: 100,
    stock: 10,
    tipoImpuestoId: 'iva15',
    tipo: 'articulo',
    activo: true,
  },
];

describe('roundMoney', () => {
  it('redondea valores monetarios a dos decimales', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(10.999)).toBe(11);
  });
});

describe('calculateInvoiceLine', () => {
  it('calcula descuento, subtotal e impuesto', () => {
    const line = calculateInvoiceLine({
      id: 'linea-1',
      itemId: 'articulo-1',
      cantidad: 2,
      precio: 100,
      descuento: 10,
      detalle: 'Detalle',
      clienteExento: false,
      items,
      tiposImpuesto: impuestos,
    });

    expect(line).toMatchObject({
      descripcion: 'Artículo de prueba',
      subtotal: 180,
      impuesto: 27,
      total: 207,
      tipoImpuestoPorcentaje: 15,
    });
  });

  it('no aplica impuesto a clientes exentos', () => {
    const line = calculateInvoiceLine({
      id: 'linea-1',
      itemId: 'articulo-1',
      cantidad: 1,
      precio: 100,
      descuento: 0,
      detalle: '',
      clienteExento: true,
      items,
      tiposImpuesto: impuestos,
    });

    expect(line.impuesto).toBe(0);
    expect(line.total).toBe(100);
    expect(line.tipoImpuestoPorcentaje).toBe(0);
  });

  it('redondea cada importe antes de formar el total', () => {
    const line = calculateInvoiceLine({
      id: 'linea-1',
      itemId: 'articulo-1',
      cantidad: 3,
      precio: 10.01,
      descuento: 5,
      detalle: '',
      clienteExento: false,
      items,
      tiposImpuesto: impuestos,
    });

    expect(line.subtotal).toBe(28.53);
    expect(line.impuesto).toBe(4.28);
    expect(line.total).toBe(32.81);
  });
});

describe('calculateInvoiceTotals', () => {
  it('agrupa impuestos y aplica la retención sobre subtotal más impuestos', () => {
    const lineas: LineaFactura[] = [
      {
        id: 'l1', itemId: 'a1', descripcion: 'A', detalle: '', cantidad: 2,
        precio: 100, descuento: 10, tipoImpuestoId: 'iva15',
        tipoImpuestoPorcentaje: 15, subtotal: 180, impuesto: 27, total: 207,
      },
      {
        id: 'l2', itemId: 'a2', descripcion: 'B', detalle: '', cantidad: 1,
        precio: 50, descuento: 0, tipoImpuestoId: 'iva15',
        tipoImpuestoPorcentaje: 15, subtotal: 50, impuesto: 7.5, total: 57.5,
      },
      {
        id: 'l3', itemId: 'a3', descripcion: 'Exento', detalle: '', cantidad: 1,
        precio: 20, descuento: 0, tipoImpuestoId: '',
        tipoImpuestoPorcentaje: 0, subtotal: 20, impuesto: 0, total: 20,
      },
    ];

    const totals = calculateInvoiceTotals(lineas, impuestos, 1);

    expect(totals.subtotal).toBe(250);
    expect(totals.totalDescuentos).toBe(20);
    expect(totals.impuestos).toEqual([
      { tipoId: 'iva15', nombre: 'IVA 15%', porcentaje: 15, base: 230, monto: 34.5 },
    ]);
    expect(totals.retencionMonto).toBe(2.85);
    expect(totals.total).toBe(281.65);
  });
});

import type { ItemCatalogo, LineaFactura, TipoImpuesto } from '../types';

export interface InvoiceTotals {
  subtotal: number;
  totalDescuentos: number;
  impuestos: {
    tipoId: string;
    nombre: string;
    porcentaje: number;
    base: number;
    monto: number;
  }[];
  retencionMonto: number;
  total: number;
}

export interface InvoiceLineInput {
  id: string;
  itemId: string;
  cantidad: number;
  precio: number;
  descuento: number;
  detalle: string;
  clienteExento: boolean;
  items: ItemCatalogo[];
  tiposImpuesto: TipoImpuesto[];
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateInvoiceLine(input: InvoiceLineInput): LineaFactura {
  const item = input.items.find(candidate => candidate.id === input.itemId);
  const impuesto = item
    ? input.tiposImpuesto.find(candidate => candidate.id === item.tipoImpuestoId)
    : undefined;
  const porcentaje = input.clienteExento || !impuesto ? 0 : impuesto.porcentaje;
  const base = roundMoney(input.cantidad * input.precio);
  const descuentoMonto = roundMoney(base * (input.descuento / 100));
  const subtotal = roundMoney(base - descuentoMonto);
  const impuestoMonto = roundMoney(subtotal * (porcentaje / 100));

  return {
    id: input.id,
    itemId: input.itemId,
    descripcion: item?.descripcion ?? '',
    detalle: input.detalle,
    cantidad: input.cantidad,
    precio: input.precio,
    descuento: input.descuento,
    tipoImpuestoId: item?.tipoImpuestoId ?? '',
    tipoImpuestoPorcentaje: porcentaje,
    subtotal,
    impuesto: impuestoMonto,
    total: roundMoney(subtotal + impuestoMonto),
  };
}

export function calculateInvoiceTotals(
  lineas: LineaFactura[],
  tiposImpuesto: TipoImpuesto[],
  retencionPorcentaje = 0,
): InvoiceTotals {
  const subtotal = roundMoney(lineas.reduce((sum, linea) => sum + linea.subtotal, 0));
  const totalDescuentos = roundMoney(lineas.reduce((sum, linea) => {
    const base = roundMoney(linea.cantidad * linea.precio);
    return sum + roundMoney(base - linea.subtotal);
  }, 0));

  const taxMap = new Map<string, InvoiceTotals['impuestos'][number]>();
  lineas.forEach(linea => {
    if (linea.tipoImpuestoPorcentaje === 0) return;

    const existing = taxMap.get(linea.tipoImpuestoId);
    if (existing) {
      existing.base = roundMoney(existing.base + linea.subtotal);
      existing.monto = roundMoney(existing.monto + linea.impuesto);
      return;
    }

    taxMap.set(linea.tipoImpuestoId, {
      tipoId: linea.tipoImpuestoId,
      nombre: tiposImpuesto.find(impuesto => impuesto.id === linea.tipoImpuestoId)?.nombre ?? '',
      porcentaje: linea.tipoImpuestoPorcentaje,
      base: linea.subtotal,
      monto: linea.impuesto,
    });
  });

  const impuestos = Array.from(taxMap.values());
  const totalImpuestos = roundMoney(impuestos.reduce((sum, impuesto) => sum + impuesto.monto, 0));
  const baseRetencion = roundMoney(subtotal + totalImpuestos);
  const retencionMonto = roundMoney(baseRetencion * (retencionPorcentaje / 100));

  return {
    subtotal,
    totalDescuentos,
    impuestos,
    retencionMonto,
    total: roundMoney(baseRetencion - retencionMonto),
  };
}

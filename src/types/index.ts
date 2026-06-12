export interface Empresa {
  id: string;
  razonSocial: string;
  rtn: string;
  direccion: string;
  correo: string;
  telefono: string;
  resolucionFacturacion: string;
  pieFactura: string;
}

export interface Establecimiento {
  id: string;
  nombre: string;
  tipo: 'casa_matriz' | 'sucursal';
  direccion: string;
  activo: boolean;
}

export interface PuntoEmision {
  id: string;
  establecimientoId: string;
  nombre: string;
  cai: string;
  correlativoActual: number;
  rangoDesde: number;
  rangoHasta: number;
  fechaVigencia: string;
  activo: boolean;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  cargo: string;
  activo: boolean;
}

export interface Usuario {
  id: string;
  empleadoId: string;
  username: string;
  rolId: string;
  activo: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  rtn: string;
  dni: string;
  correo: string;
  telefono: string;
  direccion: string;
  condicionPago: 'contado' | 'credito';
  limitCredito: number;
  exentoImpuesto: boolean;
  activo: boolean;
}

export interface DatosFiscales {
  id: string;
  clienteId: string;
  retencionId: string;
  regimenFiscal: string;
  numeroExoneracion: string;
}

export interface TipoImpuesto {
  id: string;
  nombre: string;
  porcentaje: number;
  activo: boolean;
}

export interface TipoRetencion {
  id: string;
  nombre: string;
  porcentaje: number;
  activo: boolean;
}

export interface TipoMoneda {
  id: string;
  nombre: string;
  simbolo: string;
  codigoIso: string;
  activo: boolean;
}

export interface FormaPago {
  id: string;
  nombre: string;
  requiereReferencia: boolean;
  activo: boolean;
}

export interface Articulo {
  id: string;
  codigo: string;
  descripcion: string;
  precio: number;
  stock: number;
  tipoImpuestoId: string;
  tipo: 'articulo';
  activo: boolean;
}

export interface Servicio {
  id: string;
  codigo: string;
  descripcion: string;
  precio: number;
  tipoImpuestoId: string;
  tipo: 'servicio';
  activo: boolean;
}

export type ItemCatalogo = Articulo | Servicio;

export interface LineaFactura {
  id: string;
  itemId: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  descuento: number;
  tipoImpuestoId: string;
  tipoImpuestoPorcentaje: number;
  subtotal: number;
  impuesto: number;
  total: number;
}

export interface Factura {
  id: string;
  numero: string;
  fecha: string;
  monedaId: string;
  establecimientoId: string;
  puntoEmisionId: string;
  clienteId: string;
  lineas: LineaFactura[];
  subtotal: number;
  descuento: number;
  impuestos: { tipoId: string; nombre: string; porcentaje: number; base: number; monto: number }[];
  retencionId: string | null;
  retencionMonto: number;
  total: number;
  estado: 'borrador' | 'emitido' | 'anulado';
  usuarioEmisorId: string;
  cai: string;
  rangoDesde: number;
  rangoHasta: number;
  fechaVigenciaCai: string;
  formaPagoId: string;
  referenciaPago: string;
}

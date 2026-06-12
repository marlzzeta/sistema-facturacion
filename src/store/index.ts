import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  Empresa, Establecimiento, PuntoEmision, Rol, Empleado, Usuario,
  Cliente, DatosFiscales, TipoImpuesto, TipoRetencion, TipoMoneda,
  FormaPago, Articulo, Servicio, Factura
} from '../types';

const uuid = () => Math.random().toString(36).slice(2, 10);

// ── Seed IDs ────────────────────────────────────────────────────────────────
const ID = {
  est1: 'est00001', est2: 'est00002',
  pe1: 'pe000001', pe2: 'pe000002', pe3: 'pe000003', pe4: 'pe000004',
  rol1: 'rol00001', rol2: 'rol00002',
  emp1: 'emp00001', emp2: 'emp00002',
  usr1: 'usr00001', usr2: 'usr00002',
  cli1: 'cli00001', cli2: 'cli00002', cli3: 'cli00003',
  df1: 'df000001', df2: 'df000002', df3: 'df000003',
  imp1: 'imp00001', imp2: 'imp00002', imp3: 'imp00003',
  ret1: 'ret00001', ret2: 'ret00002',
  mon1: 'mon00001', mon2: 'mon00002',
  fp1: 'fp000001', fp2: 'fp000002', fp3: 'fp000003',
  art1: 'art00001', art2: 'art00002', art3: 'art00003',
  srv1: 'srv00001', srv2: 'srv00002',
};

// ── State ────────────────────────────────────────────────────────────────────
export interface AppState {
  empresa: Empresa;
  establecimientos: Establecimiento[];
  puntosEmision: PuntoEmision[];
  roles: Rol[];
  empleados: Empleado[];
  usuarios: Usuario[];
  clientes: Cliente[];
  datosFiscales: DatosFiscales[];
  tiposImpuesto: TipoImpuesto[];
  tiposRetencion: TipoRetencion[];
  tiposMoneda: TipoMoneda[];
  formasPago: FormaPago[];
  articulos: Articulo[];
  servicios: Servicio[];
  facturas: Factura[];
  temaOscuro: boolean;
  usuarioActual: Usuario | null;
}

// ── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'UPDATE_EMPRESA'; payload: Empresa }
  // Establecimientos
  | { type: 'ADD_ESTABLECIMIENTO'; payload: Establecimiento }
  | { type: 'UPDATE_ESTABLECIMIENTO'; payload: Establecimiento }
  | { type: 'DELETE_ESTABLECIMIENTO'; payload: string }
  // PuntosEmision
  | { type: 'ADD_PUNTO_EMISION'; payload: PuntoEmision }
  | { type: 'UPDATE_PUNTO_EMISION'; payload: PuntoEmision }
  | { type: 'DELETE_PUNTO_EMISION'; payload: string }
  // Roles
  | { type: 'ADD_ROL'; payload: Rol }
  | { type: 'UPDATE_ROL'; payload: Rol }
  | { type: 'DELETE_ROL'; payload: string }
  // Empleados
  | { type: 'ADD_EMPLEADO'; payload: Empleado }
  | { type: 'UPDATE_EMPLEADO'; payload: Empleado }
  | { type: 'DELETE_EMPLEADO'; payload: string }
  // Usuarios
  | { type: 'ADD_USUARIO'; payload: Usuario }
  | { type: 'UPDATE_USUARIO'; payload: Usuario }
  | { type: 'DELETE_USUARIO'; payload: string }
  // Clientes
  | { type: 'ADD_CLIENTE'; payload: Cliente }
  | { type: 'UPDATE_CLIENTE'; payload: Cliente }
  | { type: 'DELETE_CLIENTE'; payload: string }
  // DatosFiscales
  | { type: 'ADD_DATOS_FISCALES'; payload: DatosFiscales }
  | { type: 'UPDATE_DATOS_FISCALES'; payload: DatosFiscales }
  | { type: 'DELETE_DATOS_FISCALES'; payload: string }
  // TiposImpuesto
  | { type: 'ADD_TIPO_IMPUESTO'; payload: TipoImpuesto }
  | { type: 'UPDATE_TIPO_IMPUESTO'; payload: TipoImpuesto }
  | { type: 'DELETE_TIPO_IMPUESTO'; payload: string }
  // TiposRetencion
  | { type: 'ADD_TIPO_RETENCION'; payload: TipoRetencion }
  | { type: 'UPDATE_TIPO_RETENCION'; payload: TipoRetencion }
  | { type: 'DELETE_TIPO_RETENCION'; payload: string }
  // TiposMoneda
  | { type: 'ADD_TIPO_MONEDA'; payload: TipoMoneda }
  | { type: 'UPDATE_TIPO_MONEDA'; payload: TipoMoneda }
  | { type: 'DELETE_TIPO_MONEDA'; payload: string }
  // FormasPago
  | { type: 'ADD_FORMA_PAGO'; payload: FormaPago }
  | { type: 'UPDATE_FORMA_PAGO'; payload: FormaPago }
  | { type: 'DELETE_FORMA_PAGO'; payload: string }
  // Articulos
  | { type: 'ADD_ARTICULO'; payload: Articulo }
  | { type: 'UPDATE_ARTICULO'; payload: Articulo }
  | { type: 'DELETE_ARTICULO'; payload: string }
  // Servicios
  | { type: 'ADD_SERVICIO'; payload: Servicio }
  | { type: 'UPDATE_SERVICIO'; payload: Servicio }
  | { type: 'DELETE_SERVICIO'; payload: string }
  // Facturas
  | { type: 'ADD_FACTURA'; payload: Factura }
  | { type: 'UPDATE_FACTURA'; payload: Factura }
  | { type: 'EMIT_FACTURA'; payload: Factura }
  | { type: 'ANULAR_FACTURA'; payload: string }
  // UI
  | { type: 'SET_TEMA'; payload: boolean }
  | { type: 'SET_USUARIO'; payload: Usuario | null };

// ── Initial State ────────────────────────────────────────────────────────────
const initialState: AppState = {
  empresa: {
    id: 'emp-main',
    razonSocial: 'Tecnologías Honduras S.A.',
    rtn: '08011985243568',
    direccion: 'Col. Palmira, Edificio América, Piso 3, Tegucigalpa, Honduras',
    correo: 'facturacion@techonduras.hn',
    telefono: '+504 2234-5678',
    resolucionFacturacion: 'SAR-2024-001234',
    pieFactura: 'Gracias por su preferencia. Este documento es una Factura Fiscal emitida conforme a las leyes de Honduras.',
  },
  establecimientos: [
    { id: ID.est1, nombre: 'Casa Matriz', tipo: 'casa_matriz', direccion: 'Col. Palmira, Edif. América, Tegucigalpa', activo: true },
    { id: ID.est2, nombre: 'Sucursal Norte', tipo: 'sucursal', direccion: 'Blvd. Fuerzas Armadas, San Pedro Sula', activo: true },
  ],
  puntosEmision: [
    { id: ID.pe1, establecimientoId: ID.est1, nombre: 'Caja 01 - Matriz', cai: 'ABC123-DEF456-GHI789-JKL012-MNO345-P6', correlativoActual: 1, rangoDesde: 1, rangoHasta: 500, fechaVigencia: '2027-12-31', activo: true },
    { id: ID.pe2, establecimientoId: ID.est1, nombre: 'Caja 02 - Matriz', cai: 'BCD234-EFG567-HIJ890-KLM123-NOP456-Q7', correlativoActual: 1, rangoDesde: 1, rangoHasta: 500, fechaVigencia: '2027-12-31', activo: true },
    { id: ID.pe3, establecimientoId: ID.est2, nombre: 'Caja 01 - Norte', cai: 'CDE345-FGH678-IJK901-LMN234-OPQ567-R8', correlativoActual: 1, rangoDesde: 1, rangoHasta: 500, fechaVigencia: '2027-06-30', activo: true },
    { id: ID.pe4, establecimientoId: ID.est2, nombre: 'Caja 02 - Norte', cai: 'DEF456-GHI789-JKL012-MNO345-PQR678-S9', correlativoActual: 1, rangoDesde: 1, rangoHasta: 500, fechaVigencia: '2026-03-31', activo: true },
  ],
  roles: [
    { id: ID.rol1, nombre: 'Administrador', descripcion: 'Acceso total al sistema' },
    { id: ID.rol2, nombre: 'Vendedor', descripcion: 'Acceso a facturación y catálogos' },
  ],
  empleados: [
    { id: ID.emp1, nombre: 'Carlos', apellido: 'Mendoza', correo: 'carlos.mendoza@techonduras.hn', cargo: 'Gerente General', activo: true },
    { id: ID.emp2, nombre: 'Ana', apellido: 'Rivera', correo: 'ana.rivera@techonduras.hn', cargo: 'Vendedora', activo: true },
  ],
  usuarios: [
    { id: ID.usr1, empleadoId: ID.emp1, username: 'cmendoza', rolId: ID.rol1, activo: true },
    { id: ID.usr2, empleadoId: ID.emp2, username: 'arivera', rolId: ID.rol2, activo: true },
  ],
  clientes: [
    { id: ID.cli1, nombre: 'Supermercados El Ahorro S.A.', rtn: '08011987123456', dni: '', correo: 'compras@elahorro.hn', telefono: '2225-1234', direccion: 'Col. Kennedy, Tegucigalpa', condicionPago: 'credito', limitCredito: 50000, exentoImpuesto: false, activo: true },
    { id: ID.cli2, nombre: 'Municipalidad de Tegucigalpa', rtn: '08011990654321', dni: '', correo: 'municipalidad@amdc.hn', telefono: '2221-9900', direccion: 'Palacio Municipal, Tegucigalpa', condicionPago: 'credito', limitCredito: 100000, exentoImpuesto: true, activo: true },
    { id: ID.cli3, nombre: 'Juan Carlos López', rtn: '', dni: '0801-1995-01234', correo: 'jclopez@gmail.com', telefono: '9988-7766', direccion: 'Res. Las Lomas, Tegucigalpa', condicionPago: 'contado', limitCredito: 0, exentoImpuesto: false, activo: true },
  ],
  datosFiscales: [
    { id: ID.df1, clienteId: ID.cli1, retencionId: ID.ret1, regimenFiscal: 'Régimen General', numeroExoneracion: '' },
    { id: ID.df2, clienteId: ID.cli2, retencionId: ID.ret2, regimenFiscal: 'Entidad Gubernamental', numeroExoneracion: 'EXON-2024-00123' },
    { id: ID.df3, clienteId: ID.cli3, retencionId: '', regimenFiscal: 'Persona Natural', numeroExoneracion: '' },
  ],
  tiposImpuesto: [
    { id: ID.imp1, nombre: 'IVA 15%', porcentaje: 15, activo: true },
    { id: ID.imp2, nombre: 'IVA 18%', porcentaje: 18, activo: true },
    { id: ID.imp3, nombre: 'Exento', porcentaje: 0, activo: true },
  ],
  tiposRetencion: [
    { id: ID.ret1, nombre: 'IR 1%', porcentaje: 1, activo: true },
    { id: ID.ret2, nombre: 'Retención 12.5%', porcentaje: 12.5, activo: true },
  ],
  tiposMoneda: [
    { id: ID.mon1, nombre: 'Lempira', simbolo: 'L.', codigoIso: 'HNL', activo: true },
    { id: ID.mon2, nombre: 'Dólar Americano', simbolo: '$', codigoIso: 'USD', activo: true },
  ],
  formasPago: [
    { id: ID.fp1, nombre: 'Efectivo', requiereReferencia: false, activo: true },
    { id: ID.fp2, nombre: 'Tarjeta de Crédito/Débito', requiereReferencia: true, activo: true },
    { id: ID.fp3, nombre: 'Transferencia Bancaria', requiereReferencia: true, activo: true },
  ],
  articulos: [
    { id: ID.art1, codigo: 'ART-001', descripcion: 'Laptop Dell Inspiron 15', precio: 18500, stock: 25, tipoImpuestoId: ID.imp1, tipo: 'articulo', activo: true },
    { id: ID.art2, codigo: 'ART-002', descripcion: 'Mouse Inalámbrico Logitech', precio: 450, stock: 100, tipoImpuestoId: ID.imp1, tipo: 'articulo', activo: true },
    { id: ID.art3, codigo: 'ART-003', descripcion: 'Teclado Mecánico RGB', precio: 1200, stock: 50, tipoImpuestoId: ID.imp1, tipo: 'articulo', activo: true },
  ],
  servicios: [
    { id: ID.srv1, codigo: 'SRV-001', descripcion: 'Mantenimiento de Equipos', precio: 800, tipoImpuestoId: ID.imp1, tipo: 'servicio', activo: true },
    { id: ID.srv2, codigo: 'SRV-002', descripcion: 'Instalación de Software', precio: 500, tipoImpuestoId: ID.imp1, tipo: 'servicio', activo: true },
  ],
  facturas: [],
  temaOscuro: false,
  usuarioActual: { id: ID.usr1, empleadoId: ID.emp1, username: 'cmendoza', rolId: ID.rol1, activo: true },
};

// ── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'UPDATE_EMPRESA': return { ...state, empresa: action.payload };
    // Establecimientos
    case 'ADD_ESTABLECIMIENTO': return { ...state, establecimientos: [...state.establecimientos, action.payload] };
    case 'UPDATE_ESTABLECIMIENTO': return { ...state, establecimientos: state.establecimientos.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_ESTABLECIMIENTO': return { ...state, establecimientos: state.establecimientos.filter(e => e.id !== action.payload) };
    // PuntosEmision
    case 'ADD_PUNTO_EMISION': return { ...state, puntosEmision: [...state.puntosEmision, action.payload] };
    case 'UPDATE_PUNTO_EMISION': return { ...state, puntosEmision: state.puntosEmision.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_PUNTO_EMISION': return { ...state, puntosEmision: state.puntosEmision.filter(e => e.id !== action.payload) };
    // Roles
    case 'ADD_ROL': return { ...state, roles: [...state.roles, action.payload] };
    case 'UPDATE_ROL': return { ...state, roles: state.roles.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_ROL': return { ...state, roles: state.roles.filter(e => e.id !== action.payload) };
    // Empleados
    case 'ADD_EMPLEADO': return { ...state, empleados: [...state.empleados, action.payload] };
    case 'UPDATE_EMPLEADO': return { ...state, empleados: state.empleados.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EMPLEADO': return { ...state, empleados: state.empleados.filter(e => e.id !== action.payload) };
    // Usuarios
    case 'ADD_USUARIO': return { ...state, usuarios: [...state.usuarios, action.payload] };
    case 'UPDATE_USUARIO': return { ...state, usuarios: state.usuarios.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_USUARIO': return { ...state, usuarios: state.usuarios.filter(e => e.id !== action.payload) };
    // Clientes
    case 'ADD_CLIENTE': return { ...state, clientes: [...state.clientes, action.payload] };
    case 'UPDATE_CLIENTE': return { ...state, clientes: state.clientes.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_CLIENTE': return { ...state, clientes: state.clientes.filter(e => e.id !== action.payload) };
    // DatosFiscales
    case 'ADD_DATOS_FISCALES': return { ...state, datosFiscales: [...state.datosFiscales, action.payload] };
    case 'UPDATE_DATOS_FISCALES': return { ...state, datosFiscales: state.datosFiscales.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_DATOS_FISCALES': return { ...state, datosFiscales: state.datosFiscales.filter(e => e.id !== action.payload) };
    // TiposImpuesto
    case 'ADD_TIPO_IMPUESTO': return { ...state, tiposImpuesto: [...state.tiposImpuesto, action.payload] };
    case 'UPDATE_TIPO_IMPUESTO': return { ...state, tiposImpuesto: state.tiposImpuesto.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_TIPO_IMPUESTO': return { ...state, tiposImpuesto: state.tiposImpuesto.filter(e => e.id !== action.payload) };
    // TiposRetencion
    case 'ADD_TIPO_RETENCION': return { ...state, tiposRetencion: [...state.tiposRetencion, action.payload] };
    case 'UPDATE_TIPO_RETENCION': return { ...state, tiposRetencion: state.tiposRetencion.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_TIPO_RETENCION': return { ...state, tiposRetencion: state.tiposRetencion.filter(e => e.id !== action.payload) };
    // TiposMoneda
    case 'ADD_TIPO_MONEDA': return { ...state, tiposMoneda: [...state.tiposMoneda, action.payload] };
    case 'UPDATE_TIPO_MONEDA': return { ...state, tiposMoneda: state.tiposMoneda.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_TIPO_MONEDA': return { ...state, tiposMoneda: state.tiposMoneda.filter(e => e.id !== action.payload) };
    // FormasPago
    case 'ADD_FORMA_PAGO': return { ...state, formasPago: [...state.formasPago, action.payload] };
    case 'UPDATE_FORMA_PAGO': return { ...state, formasPago: state.formasPago.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_FORMA_PAGO': return { ...state, formasPago: state.formasPago.filter(e => e.id !== action.payload) };
    // Articulos
    case 'ADD_ARTICULO': return { ...state, articulos: [...state.articulos, action.payload] };
    case 'UPDATE_ARTICULO': return { ...state, articulos: state.articulos.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_ARTICULO': return { ...state, articulos: state.articulos.filter(e => e.id !== action.payload) };
    // Servicios
    case 'ADD_SERVICIO': return { ...state, servicios: [...state.servicios, action.payload] };
    case 'UPDATE_SERVICIO': return { ...state, servicios: state.servicios.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_SERVICIO': return { ...state, servicios: state.servicios.filter(e => e.id !== action.payload) };
    // Facturas
    case 'ADD_FACTURA': return { ...state, facturas: [...state.facturas, action.payload] };
    case 'UPDATE_FACTURA': return { ...state, facturas: state.facturas.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'EMIT_FACTURA': {
      const factura = action.payload;
      // Deduct stock from articulos
      const updatedArticulos = state.articulos.map(art => {
        const linea = factura.lineas.find(l => l.itemId === art.id);
        if (linea) return { ...art, stock: art.stock - linea.cantidad };
        return art;
      });
      // Increment correlativo
      const updatedPuntos = state.puntosEmision.map(pe => {
        if (pe.id === factura.puntoEmisionId) return { ...pe, correlativoActual: pe.correlativoActual + 1 };
        return pe;
      });
      return {
        ...state,
        facturas: [...state.facturas, factura],
        articulos: updatedArticulos,
        puntosEmision: updatedPuntos,
      };
    }
    case 'ANULAR_FACTURA': return {
      ...state,
      facturas: state.facturas.map(f => f.id === action.payload ? { ...f, estado: 'anulado' } : f),
    };
    // UI
    case 'SET_TEMA': return { ...state, temaOscuro: action.payload };
    case 'SET_USUARIO': return { ...state, usuarioActual: action.payload };
    default: return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────
const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return React.createElement(StoreContext.Provider, { value: { state, dispatch } }, children);
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export { uuid };
export type { Action };

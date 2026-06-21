import React, { useState } from 'react';
import {
  Plus, Eye, Printer, Ban, ChevronLeft, ChevronRight,
  Search, Trash2, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { useStore, uuid } from '../../store';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import type { Column } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import type { Factura, LineaFactura, PuntoEmision } from '../../types';
import { fmtMoney, fmtNum } from '../../utils/format';

// ── ItemSearchInput: searchable combobox for articles and services ────────────
function ItemSearchInput({
  allItems, articulos, value, onChange,
}: {
  allItems: { id: string; codigo: string; descripcion: string; precio: number; tipo: string }[];
  articulos: { id: string; codigo: string; descripcion: string; stock: number }[];
  value: string;
  onChange: (id: string, precio: number) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const selected = allItems.find(i => i.id === value);

  const filtered = query.trim() === ''
    ? allItems
    : allItems.filter(i =>
        `${i.codigo} ${i.descripcion}`.toLowerCase().includes(query.toLowerCase())
      );

  const arts = filtered.filter(i => i.tipo === 'articulo');
  const srvs = filtered.filter(i => i.tipo === 'servicio');

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (id: string) => {
    const item = allItems.find(i => i.id === id);
    if (item) { onChange(id, item.precio); setQuery(''); setOpen(false); }
  };

  const getStock = (id: string) => articulos.find(a => a.id === id)?.stock;

  return (
    <div className="col-span-2 flex flex-col gap-1" ref={wrapRef}>
      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Artículo / Servicio</label>
      <div className="relative">
        <div
          className="flex items-center gap-2 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm cursor-text focus-within:ring-2 focus-within:ring-blue-500"
          onClick={() => { setOpen(true); }}
        >
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder={selected ? `[${selected.codigo}] ${selected.descripcion}` : 'Buscar por código o nombre…'}
            value={open ? query : (selected ? `[${selected.codigo}] ${selected.descripcion}` : '')}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setOpen(true); setQuery(''); }}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
          {selected && (
            <button onClick={e => { e.stopPropagation(); onChange('', 0); setQuery(''); }} className="text-gray-400 hover:text-red-500">
              <X size={14} />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {arts.length === 0 && srvs.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400">Sin resultados para "{query}"</p>
            )}
            {arts.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 sticky top-0">ARTÍCULOS</div>
                {arts.map(a => {
                  const stock = getStock(a.id);
                  return (
                    <button key={a.id} onMouseDown={() => select(a.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 flex justify-between items-center gap-2 ${value === a.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-slate-100'}`}>
                      <span><span className="font-mono text-xs text-gray-400 mr-2">{a.codigo}</span>{a.descripcion}</span>
                      {stock !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Stock: {stock}</span>}
                    </button>
                  );
                })}
              </>
            )}
            {srvs.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 sticky top-0">SERVICIOS</div>
                {srvs.map(s => (
                  <button key={s.id} onMouseDown={() => select(s.id)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 ${value === s.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-slate-100'}`}>
                    <span className="font-mono text-xs text-gray-400">{s.codigo}</span>{s.descripcion}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PrecioInput: text input that shows formatted number, edits as plain number ─
function PrecioInput({ sym, value, onChange }: { sym: string; value: number; onChange: (v: number) => void }) {
  const [display, setDisplay] = React.useState(fmtNum(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setDisplay(fmtNum(value));
  }, [value, focused]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Precio ({sym})</label>
      <input
        type="text"
        inputMode="decimal"
        value={focused ? display : fmtNum(value)}
        onFocus={() => { setFocused(true); setDisplay(value === 0 ? '' : String(value)); }}
        onChange={e => {
          const raw = e.target.value.replace(/[^0-9.]/g, '');
          setDisplay(raw);
          const num = parseFloat(raw);
          if (!isNaN(num)) onChange(num);
        }}
        onBlur={() => {
          setFocused(false);
          const num = parseFloat(display.replace(/,/g, ''));
          if (!isNaN(num)) { onChange(num); setDisplay(fmtNum(num)); }
          else { onChange(0); setDisplay(fmtNum(0)); }
        }}
        className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const isVigente = (fecha: string) => new Date(fecha) >= new Date();
const pad = (n: number, len: number) => String(n).padStart(len, '0');

// ── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;

interface FormState {
  fecha: string;
  monedaId: string;
  establecimientoId: string;
  puntoEmisionId: string;
  clienteId: string;
  lineas: LineaFactura[];
  formaPagoId: string;
  referenciaPago: string;
}

// ── Invoice Sheet (ORIGINAL or COPIA) ────────────────────────────────────────
function InvoiceSheet({ factura, tipo, emisor }: { factura: Factura; tipo: 'ORIGINAL' | 'COPIA'; emisor: string }) {
  const { state } = useStore();
  const empresa = state.empresa;
  const cliente = state.clientes.find(c => c.id === factura.clienteId);
  const moneda = state.tiposMoneda.find(m => m.id === factura.monedaId);
  const formaPago = state.formasPago.find(f => f.id === factura.formaPagoId);
  const retencion = state.tiposRetencion.find(r => factura.retencionId === r.id);
  const sym = moneda?.simbolo ?? 'L.';

  // Build totals breakdown matching HMD structure
  const imp15 = factura.impuestos.find(i => i.porcentaje === 15);
  const imp18 = factura.impuestos.find(i => i.porcentaje === 18);
  const exentoTotal = factura.lineas.filter(l => l.tipoImpuestoPorcentaje === 0 && !cliente?.exentoImpuesto).reduce((s, l) => s + l.subtotal, 0);
  const exoneradoTotal = cliente?.exentoImpuesto ? factura.subtotal : 0;

  // Amount in words using basic implementation (numero-a-letras may not be available)
  const numToWords = (n: number): string => {
    try {
      // @ts-ignore
      const NumerosALetras = (window as any).NumerosALetras;
      if (NumerosALetras) return NumerosALetras(n);
    } catch (_) { /* fallback */ }
    const entero = Math.floor(n);
    const cents = Math.round((n - entero) * 100);
    return `${entero.toLocaleString('es-HN')} Y ${String(cents).padStart(2, '0')} / 100 ${moneda?.codigoIso ?? 'LEMPIRAS'}`;
  };

  const ahora = new Date();
  const fechaImpresion = ahora.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const s: React.CSSProperties = { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#000', background: '#fff', width: '100%', boxSizing: 'border-box' as const, padding: '20px' };

  return (
    <div style={s}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '10px' }}>
        {/* Left: Company info */}
        <div>
          {empresa.logo
            ? <img src={empresa.logo} alt="Logo" style={{ height: '60px', width: 'auto', maxWidth: '160px', objectFit: 'contain', marginBottom: '4px' }} />
            : null}
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a3c6e', lineHeight: 1.1 }}>{empresa.razonSocial}</div>
          <div style={{ fontSize: '9px', marginTop: '4px', color: '#333' }}>{empresa.rtn}</div>
          <div style={{ fontSize: '9px', color: '#333' }}>{empresa.direccion}</div>
          {empresa.correo && <div style={{ fontSize: '9px', color: '#1a3c6e', fontWeight: 'bold' }}>{empresa.correo}</div>}
          {empresa.telefono && <div style={{ fontSize: '9px', color: '#333' }}>{empresa.telefono}</div>}
        </div>
        {/* Right: FACTURA box */}
        <div style={{ textAlign: 'right', borderLeft: '2px solid #000', paddingLeft: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>FACTURA</div>
          <div style={{ fontSize: '11px', marginTop: '2px' }}>No. {factura.numero}</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '6px', letterSpacing: '1px', color: tipo === 'ORIGINAL' ? '#1a3c6e' : '#666' }}>{tipo}</div>
        </div>
      </div>

      {/* ── CLIENT + DATE ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#555', marginBottom: '2px' }}>CLIENTE:</div>
          <div style={{ fontSize: '9px' }}>{cliente?.rtn || cliente?.dni}</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{cliente?.nombre}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#555', marginBottom: '2px' }}>FECHA FACTURA:</div>
          <div style={{ fontSize: '10px' }}>{factura.fecha}</div>
          <div style={{ fontSize: '9px', color: '#555', marginTop: '4px' }}>Forma de Pago: {formaPago?.nombre}</div>
          {factura.referenciaPago && <div style={{ fontSize: '9px', color: '#555' }}>Ref: {factura.referenciaPago}</div>}
        </div>
      </div>

      {/* ── LINE ITEMS TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '9px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #000', borderTop: '1.5px solid #000' }}>
            <th style={{ textAlign: 'left', padding: '4px 3px', fontWeight: 'bold' }}>DESCRIPCION</th>
            <th style={{ textAlign: 'center', padding: '4px 3px', fontWeight: 'bold', width: '50px' }}>CANTIDAD</th>
            <th style={{ textAlign: 'right', padding: '4px 3px', fontWeight: 'bold', width: '90px' }}>DESCUENTOS</th>
            <th style={{ textAlign: 'right', padding: '4px 3px', fontWeight: 'bold', width: '100px' }}>PRECIO UNITARIO</th>
            <th style={{ textAlign: 'right', padding: '4px 3px', fontWeight: 'bold', width: '90px' }}>SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          {factura.lineas.map(l => {
            const descMonto = l.cantidad * l.precio - l.subtotal;
            return (
              <tr key={l.id} style={{ borderBottom: '0.5px solid #ddd' }}>
                <td style={{ padding: '4px 3px', verticalAlign: 'top' }}>{l.descripcion}</td>
                <td style={{ padding: '4px 3px', textAlign: 'center', verticalAlign: 'top' }}>{l.cantidad}</td>
                <td style={{ padding: '4px 3px', textAlign: 'right', verticalAlign: 'top' }}>{sym} {fmtNum(descMonto)}</td>
                <td style={{ padding: '4px 3px', textAlign: 'right', verticalAlign: 'top' }}>{sym} {fmtNum(l.precio)}</td>
                <td style={{ padding: '4px 3px', textAlign: 'right', verticalAlign: 'top' }}>{sym} {fmtNum(l.subtotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── BOTTOM SECTION: left info + right totals ── */}
      <div style={{ display: 'flex', gap: '16px', borderTop: '1.5px solid #000', paddingTop: '8px' }}>
        {/* Left bottom */}
        <div style={{ flex: 1, fontSize: '9px' }}>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ fontWeight: 'bold' }}>Valor en letras: </span>
            <span style={{ textTransform: 'uppercase' }}>{numToWords(factura.total)}</span>
          </div>
          <div style={{ marginBottom: '2px' }}>No. Orden de Compra Exenta: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '120px' }}>&nbsp;</span></div>
          <div style={{ marginBottom: '2px' }}>No. Constancia Reg. Exonerado: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '110px' }}>&nbsp;</span></div>
          <div style={{ marginBottom: '8px' }}>No. Registro de la SAG: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '128px' }}>&nbsp;</span></div>
          <div style={{ borderTop: '1.5px solid #000', paddingTop: '6px' }}>
            <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>CONDICIONES COMERCIALES</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{empresa.pieFactura}</div>
          </div>
        </div>

        {/* Right totals */}
        <div style={{ width: '220px', fontSize: '9px' }}>
          {[
            { label: 'DESCUENTO', val: factura.descuento },
            { label: 'IMPORTE EXONERADO', val: exoneradoTotal },
            { label: 'IMPORTE EXENTO', val: exentoTotal },
            { label: 'IMPORTE 15%', val: imp15?.base ?? 0 },
            { label: 'IMPORTE 18%', val: imp18?.base ?? 0 },
            { label: 'IMPUESTO 15%', val: imp15?.monto ?? 0 },
            { label: 'IMPUESTO 18%', val: imp18?.monto ?? 0 },
            { label: `RETENCION${retencion ? ` (${retencion.nombre})` : ''}`, val: factura.retencionMonto },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #ccc', padding: '2px 0' }}>
              <span>{row.label}</span>
              <span>{sym} {fmtNum(row.val)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', marginTop: '2px', paddingTop: '3px', fontWeight: 'bold', fontSize: '11px' }}>
            <span>TOTAL A PAGAR</span>
            <span>{sym} {fmtNum(factura.total)}</span>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ marginTop: '16px', borderTop: '1px solid #000', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#444' }}>
        <div>
          <div>CAI: {factura.cai}</div>
          <div>Rango: Desde {pad(factura.rangoDesde, 3)} Hasta {pad(factura.rangoHasta, 3)}</div>
          <div>Fecha Limite: {factura.fechaVigenciaCai}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Fecha de Impresión: {fechaImpresion}</div>
          <div>Impreso por: {emisor}</div>
          <div>Página 1 de 1</div>
        </div>
      </div>
    </div>
  );
}

// ── Print Modal ───────────────────────────────────────────────────────────────
function PrintModal({ factura, onClose }: { factura: Factura; onClose: () => void }) {
  const { state } = useStore();

  const emisorUsuario = state.usuarios.find(u => u.id === factura.usuarioEmisorId);
  const emisorEmpleado = state.empleados.find(e => e.id === emisorUsuario?.empleadoId);
  const emisor = emisorEmpleado ? `${emisorEmpleado.nombre} ${emisorEmpleado.apellido}` : 'Sistema';

  const handlePrint = () => window.print();

  return (
    <Modal open onClose={onClose} title={`Factura ${factura.numero}`} size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="no-print">Cerrar</Button>
          <Button icon={<Printer size={16} />} onClick={handlePrint} className="no-print">Imprimir Original + Copia</Button>
        </>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print-zone, .invoice-print-zone * { visibility: visible !important; }
          .invoice-print-zone { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div className="invoice-print-zone space-y-6">
        {/* ORIGINAL */}
        <div className="border border-gray-300 rounded bg-white">
          <InvoiceSheet factura={factura} tipo="ORIGINAL" emisor={emisor} />
        </div>

        {/* Divider visible on screen */}
        <div className="no-print flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 border-t border-dashed border-gray-300" />
          <span>✂ CORTAR AQUÍ — COPIA</span>
          <div className="flex-1 border-t border-dashed border-gray-300" />
        </div>

        {/* COPIA */}
        <div className="border border-gray-300 rounded bg-white page-break">
          <InvoiceSheet factura={factura} tipo="COPIA" emisor={emisor} />
        </div>
      </div>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FacturasPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();

  const [view, setView] = useState<'list' | 'new'>('list');
  const [step, setStep] = useState<Step>(1);
  const [printFactura, setPrintFactura] = useState<Factura | null>(null);
  const [anularId, setAnularId] = useState<string | null>(null);
  const [searchCliente, setSearchCliente] = useState('');

  // Form state
  const [form, setForm] = useState<FormState>({
    fecha: today(),
    monedaId: state.tiposMoneda[0]?.id ?? '',
    establecimientoId: '',
    puntoEmisionId: '',
    clienteId: '',
    lineas: [],
    formaPagoId: state.formasPago[0]?.id ?? '',
    referenciaPago: '',
  });

  // Line item row state
  const [addingLine, setAddingLine] = useState(false);
  const [lineForm, setLineForm] = useState({ itemId: '', cantidad: 1, precio: 0, descuento: 0 });

  // ── Derived data ─────────────────────────────────────────────────────────
  const activeEsts = state.establecimientos.filter(e => e.activo);
  const activePEs = state.puntosEmision.filter(pe =>
    pe.establecimientoId === form.establecimientoId &&
    pe.activo &&
    isVigente(pe.fechaVigencia) &&
    pe.correlativoActual <= pe.rangoHasta
  );
  const selectedPE: PuntoEmision | undefined = state.puntosEmision.find(pe => pe.id === form.puntoEmisionId);
  const selectedCliente = state.clientes.find(c => c.id === form.clienteId);
  const clienteDatosFiscales = state.datosFiscales.find(df => df.clienteId === form.clienteId);
  const clienteRetencion = clienteDatosFiscales?.retencionId
    ? state.tiposRetencion.find(r => r.id === clienteDatosFiscales.retencionId)
    : null;

  const allItems = [...state.articulos.filter(a => a.activo), ...state.servicios.filter(s => s.activo)];

  const filteredClientes = state.clientes.filter(c =>
    c.activo && (
      c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.rtn.includes(searchCliente) ||
      c.dni.includes(searchCliente)
    )
  );

  const formaPagoObj = state.formasPago.find(f => f.id === form.formaPagoId);

  // ── Totals calculation ────────────────────────────────────────────────────
  const calcTotals = () => {
    const subtotalBruto = form.lineas.reduce((s, l) => s + l.subtotal, 0);
    const totalDescuentos = form.lineas.reduce((s, l) => {
      const base = l.cantidad * l.precio;
      return s + (base - l.subtotal);
    }, 0);
    const subtotal = subtotalBruto;

    // Group taxes
    const taxMap = new Map<string, { tipoId: string; nombre: string; porcentaje: number; base: number; monto: number }>();
    form.lineas.forEach(l => {
      if (l.tipoImpuestoPorcentaje === 0) return;
      const key = l.tipoImpuestoId;
      const existing = taxMap.get(key);
      const impNombre = state.tiposImpuesto.find(i => i.id === l.tipoImpuestoId)?.nombre ?? '';
      if (existing) {
        existing.base += l.subtotal;
        existing.monto += l.impuesto;
      } else {
        taxMap.set(key, { tipoId: key, nombre: impNombre, porcentaje: l.tipoImpuestoPorcentaje, base: l.subtotal, monto: l.impuesto });
      }
    });
    const impuestos = Array.from(taxMap.values());
    const totalImpuestos = impuestos.reduce((s, i) => s + i.monto, 0);

    const baseRetencion = subtotal + totalImpuestos;
    const retencionMonto = clienteRetencion ? (baseRetencion * clienteRetencion.porcentaje) / 100 : 0;
    const total = subtotal + totalImpuestos - retencionMonto;

    return { subtotal, totalDescuentos, impuestos, retencionMonto, total };
  };

  const { subtotal, totalDescuentos, impuestos, retencionMonto, total } = calcTotals();
  const moneda = state.tiposMoneda.find(m => m.id === form.monedaId);
  const sym = moneda?.simbolo ?? 'L.';

  // ── Line helpers ──────────────────────────────────────────────────────────
  const calcLine = (): LineaFactura => {
    const item = allItems.find(i => i.id === lineForm.itemId);
    const imp = item ? state.tiposImpuesto.find(t => t.id === item.tipoImpuestoId) : null;
    const pct = (selectedCliente?.exentoImpuesto || !imp) ? 0 : imp.porcentaje;
    const base = lineForm.cantidad * lineForm.precio;
    const descMonto = base * (lineForm.descuento / 100);
    const sub = base - descMonto;
    const impMonto = sub * (pct / 100);
    return {
      id: uuid(),
      itemId: lineForm.itemId,
      descripcion: item?.descripcion ?? '',
      cantidad: lineForm.cantidad,
      precio: lineForm.precio,
      descuento: lineForm.descuento,
      tipoImpuestoId: item?.tipoImpuestoId ?? '',
      tipoImpuestoPorcentaje: pct,
      subtotal: sub,
      impuesto: impMonto,
      total: sub + impMonto,
    };
  };

  const addLine = () => {
    if (!lineForm.itemId) { toast.error('Seleccione un ítem'); return; }
    if (lineForm.cantidad < 1) { toast.error('Cantidad mínima: 1'); return; }
    const art = state.articulos.find(a => a.id === lineForm.itemId);
    if (art && lineForm.cantidad > art.stock) { toast.error(`Stock insuficiente (disponible: ${art.stock})`); return; }
    setForm(p => ({ ...p, lineas: [...p.lineas, calcLine()] }));
    setLineForm({ itemId: '', cantidad: 1, precio: 0, descuento: 0 });
    setAddingLine(false);
  };

  const removeLine = (id: string) => setForm(p => ({ ...p, lineas: p.lineas.filter(l => l.id !== id) }));

  // ── Emit factura ──────────────────────────────────────────────────────────
  const emitir = () => {
    if (!form.establecimientoId) { toast.error('Seleccione un establecimiento'); return; }
    if (!form.puntoEmisionId || !selectedPE) { toast.error('Seleccione un punto de emisión válido'); return; }
    if (!form.clienteId) { toast.error('Seleccione un cliente'); return; }
    if (form.lineas.length === 0) { toast.error('Agregue al menos una línea'); return; }
    if (!form.formaPagoId) { toast.error('Seleccione forma de pago'); return; }
    if (formaPagoObj?.requiereReferencia && !form.referenciaPago.trim()) { toast.error('Ingrese la referencia de pago'); return; }

    const estIdx = state.establecimientos.findIndex(e => e.id === form.establecimientoId) + 1;
    const peIdx = state.puntosEmision.filter(pe => pe.establecimientoId === form.establecimientoId).findIndex(pe => pe.id === form.puntoEmisionId) + 1;
    const numero = `${pad(estIdx, 3)}-${pad(peIdx, 3)}-01-${pad(selectedPE.correlativoActual, 8)}`;

    const factura: Factura = {
      id: uuid(),
      numero,
      fecha: form.fecha,
      monedaId: form.monedaId,
      establecimientoId: form.establecimientoId,
      puntoEmisionId: form.puntoEmisionId,
      clienteId: form.clienteId,
      lineas: form.lineas,
      subtotal,
      descuento: totalDescuentos,
      impuestos,
      retencionId: clienteRetencion?.id ?? null,
      retencionMonto,
      total,
      estado: 'emitido',
      usuarioEmisorId: state.usuarioActual?.id ?? '',
      cai: selectedPE.cai,
      rangoDesde: selectedPE.rangoDesde,
      rangoHasta: selectedPE.rangoHasta,
      fechaVigenciaCai: selectedPE.fechaVigencia,
      formaPagoId: form.formaPagoId,
      referenciaPago: form.referenciaPago,
    };

    dispatch({ type: 'EMIT_FACTURA', payload: factura });
    toast.success(`Factura ${numero} emitida correctamente`);

    // Reset
    setForm({ fecha: today(), monedaId: state.tiposMoneda[0]?.id ?? '', establecimientoId: '', puntoEmisionId: '', clienteId: '', lineas: [], formaPagoId: state.formasPago[0]?.id ?? '', referenciaPago: '' });
    setStep(1);
    setView('list');
  };

  // ── Column definitions ────────────────────────────────────────────────────
  const getClienteNombre = (id: string) => state.clientes.find(c => c.id === id)?.nombre ?? id;

  const columns: Column<Factura>[] = [
    { key: 'numero', header: 'N° Factura', render: r => <span className="font-mono text-xs font-medium">{r.numero}</span> },
    { key: 'fecha', header: 'Fecha' },
    { key: 'clienteId', header: 'Cliente', render: r => getClienteNombre(r.clienteId) },
    {
      key: 'total', header: 'Total',
      render: r => {
        const m = state.tiposMoneda.find(m => m.id === r.monedaId);
        return <span className="font-semibold">{fmtMoney(r.total, m?.simbolo)}</span>;
      },
    },
    {
      key: 'estado', header: 'Estado',
      render: r => {
        const v: Record<string, 'success' | 'warning' | 'danger'> = { emitido: 'success', borrador: 'warning', anulado: 'danger' };
        return <Badge variant={v[r.estado] ?? 'default'}>{r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}</Badge>;
      },
    },
    {
      key: 'actions', header: 'Acciones',
      render: r => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setPrintFactura(r)}>Ver</Button>
          <Button variant="ghost" size="sm" icon={<Printer size={14} />} onClick={() => setPrintFactura(r)}>Imprimir</Button>
          {r.estado === 'emitido' && (
            <Button variant="ghost" size="sm" icon={<Ban size={14} />} onClick={() => setAnularId(r.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Anular</Button>
          )}
        </div>
      ),
    },
  ];

  // ── Step navigation ───────────────────────────────────────────────────────
  const stepLabels = ['Datos Generales', 'Cliente', 'Líneas de Detalle', 'Resumen y Pago'];

  const StepIndicator = () => (
    <div className="flex items-center mb-6">
      {stepLabels.map((label, idx) => {
        const s = (idx + 1) as Step;
        const active = step === s;
        const done = step > s;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                active ? 'bg-blue-600 border-blue-600 text-white' : done ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400',
              ].join(' ')}>
                {done ? <CheckCircle size={16} /> : s}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${active ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
            {idx < stepLabels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-green-400' : 'bg-gray-200 dark:bg-slate-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ── Render new invoice form ───────────────────────────────────────────────
  if (view === 'new') {
    return (
      <div className="max-w-3xl">
        <PageHeader
          title="Nueva Factura"
          subtitle="Complete los pasos para emitir una factura"
          action={<Button variant="secondary" icon={<ChevronLeft size={16} />} onClick={() => { setView('list'); setStep(1); }}>Volver</Button>}
        />

        <StepIndicator />

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          {/* ── Step 1: Datos Generales ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-4">Datos Generales</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input as="input" type="date" label="Fecha" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
                <Input as="select" label="Moneda" value={form.monedaId} onChange={e => setForm(p => ({ ...p, monedaId: e.target.value }))}
                  options={state.tiposMoneda.filter(m => m.activo).map(m => ({ value: m.id, label: `${m.nombre} (${m.codigoIso})` }))} />
                <Input as="select" label="Establecimiento" value={form.establecimientoId}
                  onChange={e => setForm(p => ({ ...p, establecimientoId: e.target.value, puntoEmisionId: '' }))}
                  wrapperClassName="col-span-2">
                  <option value="">— Seleccione —</option>
                  {activeEsts.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </Input>
                {form.establecimientoId && (
                  <div className="col-span-2">
                    <Input as="select" label="Punto de Emisión" value={form.puntoEmisionId}
                      onChange={e => setForm(p => ({ ...p, puntoEmisionId: e.target.value }))}>
                      <option value="">— Seleccione —</option>
                      {activePEs.map(pe => <option key={pe.id} value={pe.id}>{pe.nombre} — CAI: {pe.cai.slice(0, 12)}...</option>)}
                    </Input>
                    {activePEs.length === 0 && (
                      <p className="mt-1 text-xs text-orange-500 flex items-center gap-1"><AlertCircle size={12} /> No hay puntos de emisión activos y vigentes disponibles</p>
                    )}
                  </div>
                )}
                {selectedPE && (
                  <div className="col-span-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs space-y-1">
                    <p><span className="font-semibold">CAI:</span> <span className="font-mono">{selectedPE.cai}</span></p>
                    <p><span className="font-semibold">Vigencia:</span> {selectedPE.fechaVigencia}</p>
                    <p><span className="font-semibold">Correlativos disponibles:</span> {selectedPE.rangoHasta - selectedPE.correlativoActual + 1}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Cliente ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-4">Selección de Cliente</h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Buscar por nombre, RTN o DNI..."
                  value={searchCliente}
                  onChange={e => setSearchCliente(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg divide-y divide-gray-100 dark:divide-slate-700">
                {filteredClientes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setForm(p => ({ ...p, clienteId: c.id })); setSearchCliente(''); }}
                    className={[
                      'w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors',
                      form.clienteId === c.id ? 'bg-blue-50 dark:bg-blue-900/20' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{c.nombre}</p>
                        <p className="text-xs text-gray-500">{c.rtn || c.dni}</p>
                      </div>
                      <div className="flex gap-1">
                        {c.exentoImpuesto && <Badge variant="success">Exento</Badge>}
                        <Badge variant={c.condicionPago === 'credito' ? 'warning' : 'default'}>{c.condicionPago}</Badge>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredClientes.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">No se encontraron clientes</p>
                )}
              </div>
              {selectedCliente && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-green-800 dark:text-green-400">Cliente seleccionado: {selectedCliente.nombre}</p>
                  {selectedCliente.rtn && <p>RTN: {selectedCliente.rtn}</p>}
                  {selectedCliente.direccion && <p>Dirección: {selectedCliente.direccion}</p>}
                  {selectedCliente.correo && <p>Correo: {selectedCliente.correo}</p>}
                  {clienteRetencion && <p>Retención: {clienteRetencion.nombre} ({clienteRetencion.porcentaje}%)</p>}
                  {selectedCliente.exentoImpuesto && <p className="text-green-700 font-medium">✓ Este cliente está exento de impuestos</p>}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Líneas ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 dark:text-slate-200">Líneas de Detalle</h3>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddingLine(true)}>Agregar Ítem</Button>
              </div>

              {/* Add line form */}
              {addingLine && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Nuevo Ítem</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <ItemSearchInput
                      allItems={allItems}
                      articulos={state.articulos.filter(a => a.activo)}
                      value={lineForm.itemId}
                      onChange={(id, precio) => setLineForm(p => ({ ...p, itemId: id, precio }))}
                    />
                    <Input as="input" type="number" label="Cantidad" value={lineForm.cantidad} min={1}
                      onChange={e => setLineForm(p => ({ ...p, cantidad: Number(e.target.value) }))} />
                    <PrecioInput sym={sym} value={lineForm.precio} onChange={v => setLineForm(p => ({ ...p, precio: v }))} />
                    <Input as="input" type="number" label="Descuento (%)" value={lineForm.descuento} min={0} max={100}
                      onChange={e => setLineForm(p => ({ ...p, descuento: Number(e.target.value) }))} />

                    {lineForm.itemId && (
                      <div className="col-span-2 text-xs bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700">
                        {(() => {
                          const l = calcLine();
                          return (
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div><p className="text-gray-400">Subtotal</p><p className="font-semibold">{fmtMoney(l.subtotal, sym)}</p></div>
                              <div><p className="text-gray-400">Impuesto</p><p className="font-semibold">{fmtMoney(l.impuesto, sym)}</p></div>
                              <div><p className="text-gray-400">Total</p><p className="font-bold text-blue-600">{fmtMoney(l.total, sym)}</p></div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addLine}>Agregar</Button>
                    <Button size="sm" variant="secondary" onClick={() => setAddingLine(false)}>Cancelar</Button>
                  </div>
                </div>
              )}

              {/* Lines table */}
              {form.lineas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400">
                        <th className="text-left px-3 py-2">Descripción</th>
                        <th className="text-right px-3 py-2">Cant.</th>
                        <th className="text-right px-3 py-2">Precio</th>
                        <th className="text-right px-3 py-2">Desc.</th>
                        <th className="text-right px-3 py-2">Imp.</th>
                        <th className="text-right px-3 py-2">Total</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {form.lineas.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                          <td className="px-3 py-2 text-gray-700 dark:text-slate-300">{l.descripcion}</td>
                          <td className="px-3 py-2 text-right">{l.cantidad}</td>
                          <td className="px-3 py-2 text-right">{fmtNum(l.precio)}</td>
                          <td className="px-3 py-2 text-right">{l.descuento > 0 ? `${l.descuento}%` : '—'}</td>
                          <td className="px-3 py-2 text-right">{l.tipoImpuestoPorcentaje > 0 ? `${l.tipoImpuestoPorcentaje}%` : 'Exento'}</td>
                          <td className="px-3 py-2 text-right font-semibold">{fmtMoney(l.total, sym)}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => removeLine(l.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 dark:text-slate-500">
                  <p>No hay líneas. Agregue artículos o servicios.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Resumen ── */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-800 dark:text-slate-200">Resumen y Forma de Pago</h3>

              {/* Totals */}
              <div className="bg-gray-50 dark:bg-slate-700/30 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>Subtotal:</span><span>{fmtMoney(subtotal, sym)}</span>
                </div>
                {totalDescuentos > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Total Descuentos:</span><span>- {fmtMoney(totalDescuentos, sym)}</span>
                  </div>
                )}
                {impuestos.map(imp => (
                  <div key={imp.tipoId} className="flex justify-between text-gray-600 dark:text-slate-400">
                    <span>Gravado {imp.porcentaje}% ({fmtMoney(imp.base, sym)}):</span>
                    <span>{fmtMoney(imp.monto, sym)}</span>
                  </div>
                ))}
                {retencionMonto > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Retención ({clienteRetencion?.nombre}):</span>
                    <span>- {fmtMoney(retencionMonto, sym)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-slate-100 pt-2 border-t border-gray-300 dark:border-slate-600">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-blue-600">{fmtMoney(total, sym)}</span>
                </div>
              </div>

              {/* Payment */}
              <div className="space-y-3">
                <Input as="select" label="Forma de Pago" value={form.formaPagoId}
                  onChange={e => setForm(p => ({ ...p, formaPagoId: e.target.value, referenciaPago: '' }))}
                  options={state.formasPago.filter(f => f.activo).map(f => ({ value: f.id, label: f.nombre }))} />
                {formaPagoObj?.requiereReferencia && (
                  <Input as="input" label="Referencia de Pago" value={form.referenciaPago}
                    onChange={e => setForm(p => ({ ...p, referenciaPago: e.target.value }))}
                    placeholder="N° de transacción, cheque, etc." />
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
            <Button variant="secondary" icon={<ChevronLeft size={16} />} onClick={() => setStep(s => Math.max(1, s - 1) as Step)} disabled={step === 1}>
              Anterior
            </Button>
            {step < 4 ? (
              <Button icon={<ChevronRight size={16} />} onClick={() => {
                if (step === 1 && (!form.establecimientoId || !form.puntoEmisionId)) { toast.error('Seleccione establecimiento y punto de emisión'); return; }
                if (step === 2 && !form.clienteId) { toast.error('Seleccione un cliente'); return; }
                if (step === 3 && form.lineas.length === 0) { toast.error('Agregue al menos una línea'); return; }
                setStep(s => (s + 1) as Step);
              }}>
                Siguiente
              </Button>
            ) : (
              <Button icon={<CheckCircle size={16} />} onClick={emitir}>
                Emitir Factura
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Facturas"
        subtitle={`${state.facturas.length} factura(s) registrada(s)`}
        action={<Button icon={<Plus size={16} />} onClick={() => { setView('new'); setStep(1); }}>Nueva Factura</Button>}
      />
      <Table columns={columns} data={state.facturas} emptyMessage="No hay facturas. Haga clic en 'Nueva Factura' para comenzar." />

      {/* Print modal */}
      {printFactura && <PrintModal factura={printFactura} onClose={() => setPrintFactura(null)} />}

      {/* Anular confirm */}
      <Modal open={!!anularId} onClose={() => setAnularId(null)} title="Anular Factura"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAnularId(null)}>Cancelar</Button>
            <Button variant="danger" icon={<Ban size={16} />} onClick={() => {
              if (anularId) {
                dispatch({ type: 'ANULAR_FACTURA', payload: anularId });
                toast.success('Factura anulada');
                setAnularId(null);
              }
            }}>Confirmar Anulación</Button>
          </>
        }
      >
        <div className="flex gap-3 items-start">
          <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-gray-600 dark:text-slate-300">
            ¿Está seguro que desea anular esta factura? Esta acción no se puede deshacer y la factura quedará marcada como anulada en el sistema.
          </p>
        </div>
      </Modal>
    </div>
  );
}

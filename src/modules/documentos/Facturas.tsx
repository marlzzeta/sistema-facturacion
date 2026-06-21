import React, { useState, useRef } from 'react';
import {
  Plus, Eye, Printer, Ban, ChevronLeft, ChevronRight,
  Search, Trash2, AlertCircle, CheckCircle
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

// ── Print Modal ───────────────────────────────────────────────────────────────
function PrintModal({ factura, onClose }: { factura: Factura; onClose: () => void }) {
  const { state } = useStore();
  const printRef = useRef<HTMLDivElement>(null);

  const empresa = state.empresa;
  const cliente = state.clientes.find(c => c.id === factura.clienteId);
  const moneda = state.tiposMoneda.find(m => m.id === factura.monedaId);
  const formaPago = state.formasPago.find(f => f.id === factura.formaPagoId);

  const handlePrint = () => window.print();

  return (
    <Modal open onClose={onClose} title="Vista Previa de Factura" size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button icon={<Printer size={16} />} onClick={handlePrint}>Imprimir</Button>
        </>
      }
    >
      <div ref={printRef} className="print-area bg-white text-gray-900 p-6 text-sm font-sans">
        <style>{`
          @media print {
            body > * { display: none !important; }
            .print-area { display: block !important; }
          }
        `}</style>
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
          <div className="flex flex-col gap-1">
            {empresa.logo
              ? <img src={empresa.logo} alt="Logo" style={{ height: '64px', width: 'auto', maxWidth: '180px', objectFit: 'contain' }} />
              : <h1 className="text-2xl font-bold text-gray-900">FACTURA</h1>
            }
            <p className="text-xs text-gray-500">Documento Fiscal</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{empresa.razonSocial}</p>
            <p className="text-xs">RTN: {empresa.rtn}</p>
            <p className="text-xs">{empresa.direccion}</p>
            <p className="text-xs">{empresa.correo} | {empresa.telefono}</p>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded">
          <div>
            <p><span className="font-semibold">No. Factura:</span> {factura.numero}</p>
            <p><span className="font-semibold">Fecha:</span> {factura.fecha}</p>
            <p><span className="font-semibold">Moneda:</span> {moneda?.nombre} ({moneda?.codigoIso})</p>
            <p><span className="font-semibold">Forma de Pago:</span> {formaPago?.nombre}</p>
            {factura.referenciaPago && <p><span className="font-semibold">Referencia:</span> {factura.referenciaPago}</p>}
          </div>
          <div>
            <p><span className="font-semibold">CAI:</span> <span className="font-mono text-xs">{factura.cai}</span></p>
            <p><span className="font-semibold">Rango Autorizado:</span> {pad(factura.rangoDesde, 8)} al {pad(factura.rangoHasta, 8)}</p>
            <p><span className="font-semibold">Vigencia CAI:</span> {factura.fechaVigenciaCai}</p>
          </div>
        </div>

        {/* Client */}
        <div className="mb-4 p-3 border border-gray-200 rounded">
          <p className="font-semibold text-xs uppercase text-gray-500 mb-1">Datos del Cliente</p>
          <p className="font-medium">{cliente?.nombre}</p>
          {cliente?.rtn && <p className="text-xs">RTN: {cliente.rtn}</p>}
          {cliente?.dni && <p className="text-xs">DNI: {cliente.dni}</p>}
          {cliente?.direccion && <p className="text-xs">{cliente.direccion}</p>}
        </div>

        {/* Lines */}
        <table className="w-full text-xs mb-4 border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left px-2 py-1.5">Descripción</th>
              <th className="text-right px-2 py-1.5">Cant.</th>
              <th className="text-right px-2 py-1.5">Precio</th>
              <th className="text-right px-2 py-1.5">Desc.</th>
              <th className="text-right px-2 py-1.5">Impuesto</th>
              <th className="text-right px-2 py-1.5">Total</th>
            </tr>
          </thead>
          <tbody>
            {factura.lineas.map((l, i) => (
              <tr key={l.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-1">{l.descripcion}</td>
                <td className="px-2 py-1 text-right">{l.cantidad}</td>
                <td className="px-2 py-1 text-right">{fmtNum(l.precio)}</td>
                <td className="px-2 py-1 text-right">{l.descuento > 0 ? `${l.descuento}%` : '—'}</td>
                <td className="px-2 py-1 text-right">{l.tipoImpuestoPorcentaje > 0 ? `${l.tipoImpuestoPorcentaje}%` : 'Exento'}</td>
                <td className="px-2 py-1 text-right font-medium">{fmtNum(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-64 text-xs space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{fmtMoney(factura.subtotal, moneda?.simbolo)}</span>
            </div>
            {factura.descuento > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuentos:</span>
                <span>- {fmtMoney(factura.descuento, moneda?.simbolo)}</span>
              </div>
            )}
            {factura.impuestos.map(imp => (
              <div key={imp.tipoId} className="flex justify-between">
                <span>{imp.nombre} ({imp.porcentaje}%):</span>
                <span>{fmtMoney(imp.monto, moneda?.simbolo)}</span>
              </div>
            ))}
            {factura.retencionMonto > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Retención:</span>
                <span>- {fmtMoney(factura.retencionMonto, moneda?.simbolo)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-800 pt-1 mt-1">
              <span>TOTAL A PAGAR:</span>
              <span>{fmtMoney(factura.total, moneda?.simbolo)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-3 text-center">
          <p className="text-xs text-gray-600">{empresa.pieFactura}</p>
          <p className="text-xs text-gray-400 mt-1">La presente Factura fue autorizada mediante resolución No. {empresa.resolucionFacturacion}</p>
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
                    <Input as="select" label="Artículo / Servicio" value={lineForm.itemId}
                      onChange={e => {
                        const item = allItems.find(i => i.id === e.target.value);
                        setLineForm(p => ({ ...p, itemId: e.target.value, precio: item?.precio ?? 0 }));
                      }}
                      wrapperClassName="col-span-2">
                      <option value="">— Seleccione —</option>
                      <optgroup label="Artículos">
                        {state.articulos.filter(a => a.activo).map(a => (
                          <option key={a.id} value={a.id}>[{a.codigo}] {a.descripcion} — Stock: {a.stock}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Servicios">
                        {state.servicios.filter(s => s.activo).map(s => (
                          <option key={s.id} value={s.id}>[{s.codigo}] {s.descripcion}</option>
                        ))}
                      </optgroup>
                    </Input>
                    <Input as="input" type="number" label="Cantidad" value={lineForm.cantidad} min={1}
                      onChange={e => setLineForm(p => ({ ...p, cantidad: Number(e.target.value) }))} />
                    <Input as="input" type="number" label={`Precio (${sym})`} value={lineForm.precio} min={0} step={0.01}
                      onChange={e => setLineForm(p => ({ ...p, precio: Number(e.target.value) }))} />
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

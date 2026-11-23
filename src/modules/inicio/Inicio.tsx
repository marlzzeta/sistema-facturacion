import { useEffect, useMemo, useState } from 'react';
import { Wallet, FileCheck2, Users, Receipt, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { useStore } from '../../store';
import { useAuth } from '../../auth/AuthContext';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { fmtMoney } from '../../utils/format';
import type { Factura } from '../../types';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const estadoVariant: Record<Factura['estado'], 'success' | 'warning' | 'danger'> = { emitido: 'success', borrador: 'warning', anulado: 'danger' };
const estadoLabel: Record<Factura['estado'], string> = { emitido: 'Emitida', borrador: 'Borrador', anulado: 'Anulada' };

/** Clave "AAAA-MM" de una fecha ISO (AAAA-MM-DD). */
const mesDe = (fecha: string) => fecha.slice(0, 7);

interface InicioProps {
  onNavigate: (page: string) => void;
}

export default function InicioPage({ onNavigate }: InicioProps) {
  const { state, dispatch } = useStore();
  const { sesion } = useAuth();
  const [seleccion, setSeleccion] = useState<number | null>(null);

  // Las facturas se cargan desde la API también aquí, ya que Inicio es la primera pantalla.
  useEffect(() => {
    if (!sesion) return;
    let activo = true;
    void fetch('/api/v1/invoices', { credentials: 'include' }).then(async response => {
      if (!activo || !response.ok) return;
      const result = await response.json() as { data: Factura[] };
      dispatch({ type: 'SET_FACTURAS', payload: result.data });
    }).catch(() => undefined);
    return () => { activo = false; };
  }, [dispatch, sesion]);

  const datos = useMemo(() => {
    const emitidas = state.facturas.filter(f => f.estado === 'emitido');
    // Si hay varias monedas, los montos se suman solo en la moneda más usada.
    const conteo = new Map<string, number>();
    emitidas.forEach(f => conteo.set(f.monedaId, (conteo.get(f.monedaId) ?? 0) + 1));
    const monedaId = [...conteo.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
    const moneda = state.tiposMoneda.find(m => m.id === monedaId) ?? state.tiposMoneda.find(m => m.activo) ?? state.tiposMoneda[0];
    const variasMonedas = conteo.size > 1;
    const enMoneda = emitidas.filter(f => f.monedaId === monedaId);

    const hoy = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1);
      const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = enMoneda.filter(f => mesDe(f.fecha) === clave).reduce((s, f) => s + f.total, 0);
      return { clave, etiqueta: MESES[d.getMonth()], total };
    });
    const mesActual = meses[meses.length - 1];
    const mesAnterior = meses[meses.length - 2];
    const variacion = mesAnterior.total > 0 ? ((mesActual.total - mesAnterior.total) / mesAnterior.total) * 100 : null;

    const totalGeneral = enMoneda.reduce((s, f) => s + f.total, 0);
    const promedio = enMoneda.length ? totalGeneral / enMoneda.length : 0;

    const porCliente = new Map<string, number>();
    enMoneda.forEach(f => porCliente.set(f.clienteId, (porCliente.get(f.clienteId) ?? 0) + f.total));
    const topClientes = [...porCliente.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, total]) => ({ id, nombre: state.clientes.find(c => c.id === id)?.nombre ?? 'Cliente', total }));

    const recientes = [...state.facturas].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero)).slice(0, 5);

    return { emitidas, moneda, variasMonedas, meses, mesActual, variacion, promedio, topClientes, recientes };
  }, [state.facturas, state.tiposMoneda, state.clientes]);

  const sym = datos.moneda?.simbolo;
  const maxMes = Math.max(...datos.meses.map(m => m.total), 1);
  const activo = seleccion ?? datos.meses.length - 1;
  const clientesActivos = state.clientes.filter(c => c.activo).length;
  const maxCliente = datos.topClientes[0]?.total ?? 1;
  const nombreCliente = (id: string) => state.clientes.find(c => c.id === id)?.nombre ?? 'Cliente';
  const simboloDe = (f: Factura) => state.tiposMoneda.find(m => m.id === f.monedaId)?.simbolo;

  const variacionTexto = (() => {
    const v = datos.variacion;
    if (v === null) return datos.mesActual.total > 0 ? 'Nuevo este mes' : undefined;
    if (Math.abs(v) < 0.5) return 'Sin cambio vs. mes anterior';
    const pct = Math.abs(v) > 999 ? '>999' : Math.abs(v).toFixed(0);
    return `${v > 0 ? '▲' : '▼'} ${pct}% vs. mes anterior`;
  })();
  const notaMoneda = datos.variasMonedas ? `Solo en ${datos.moneda?.nombre ?? 'moneda principal'}` : undefined;
  const sinVentas = datos.meses.every(m => m.total === 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Inicio
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Resumen de la facturación{state.empresa.razonSocial ? ` de ${state.empresa.razonSocial.replace(/\.$/, '')}` : ''}.
          </p>
        </div>
        <Button icon={<FileSpreadsheet size={16} />} onClick={() => onNavigate('facturas')}>Ir a Facturas</Button>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Ventas del mes" value={fmtMoney(datos.mesActual.total, sym)} hint={variacionTexto} icon={<Wallet size={20} />} tone="blue" />
        <StatCard label="Total emitidas" value={datos.emitidas.length} icon={<FileCheck2 size={20} />} tone="green" />
        <StatCard label="Clientes activos" value={clientesActivos} icon={<Users size={20} />} tone="amber" />
        <StatCard label="Ticket promedio" value={fmtMoney(datos.promedio, sym)} hint={notaMoneda} icon={<Receipt size={20} />} tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Gráfica de ventas mensuales */}
        <section className="card p-5 sm:p-6 lg:col-span-2" aria-labelledby="ventas-titulo">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="ventas-titulo" className="text-sm font-medium text-slate-500 dark:text-slate-400">Ventas mensuales</h2>
              <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100" aria-live="polite">
                {fmtMoney(datos.meses[activo].total, sym)}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{datos.meses[activo].etiqueta} · facturas emitidas</p>
            </div>
            {datos.variasMonedas && (
              <span className="text-xs text-slate-500 dark:text-slate-400">Montos en {datos.moneda?.nombre ?? 'moneda principal'}</span>
            )}
          </div>
          {sinVentas && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Sin ventas en los últimos 6 meses.</p>
          )}
          <ul className="mt-6 flex items-end gap-2 sm:gap-4 h-44" aria-label="Ventas de los últimos 6 meses" onMouseLeave={() => setSeleccion(null)}>
            {datos.meses.map((m, i) => {
              const alto = Math.max((m.total / maxMes) * 100, 4);
              const esActivo = i === activo;
              return (
                <li key={m.clave} className="flex-1 h-full">
                <button
                  type="button"
                  onClick={() => setSeleccion(i)}
                  onMouseEnter={() => setSeleccion(i)}
                  onFocus={() => setSeleccion(i)}
                  aria-label={`${m.etiqueta}: ${fmtMoney(m.total, sym)}`}
                  aria-pressed={esActivo}
                  className="group w-full h-full flex flex-col items-center justify-end gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span
                    className={[
                      'w-full max-w-12 rounded-xl transition-all duration-300',
                      esActivo ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-slate-200/80 dark:bg-slate-700 group-hover:bg-slate-300 dark:group-hover:bg-slate-600',
                    ].join(' ')}
                    style={{ height: `${alto}%` }}
                  />
                  <span className={['text-xs', esActivo ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'].join(' ')}>
                    {m.etiqueta}
                  </span>
                </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Mejores clientes */}
        <section className="card p-5 sm:p-6" aria-labelledby="clientes-titulo">
          <h2 id="clientes-titulo" className="text-base font-semibold text-slate-900 dark:text-slate-100">Mejores clientes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Histórico · facturas emitidas{notaMoneda ? ` · ${notaMoneda.toLowerCase()}` : ''}</p>
          {datos.topClientes.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Aún no hay facturas emitidas.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {datos.topClientes.map(c => (
                <li key={c.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200">{c.nombre}</span>
                    <span className="flex-shrink-0 font-semibold text-slate-900 dark:text-slate-100">{fmtMoney(c.total, sym)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${(c.total / maxCliente) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Facturas recientes */}
      <section className="card p-5 sm:p-6" aria-labelledby="recientes-titulo">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recientes-titulo" className="text-base font-semibold text-slate-900 dark:text-slate-100">Facturas recientes</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('facturas')}>
            Ver todas <ArrowRight size={14} />
          </Button>
        </div>
        {datos.recientes.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">No hay facturas todavía.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/70">
            {datos.recientes.map(f => (
              <li key={f.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{nombreCliente(f.clienteId)}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400"><span className="font-mono">{f.numero}</span> · {f.fecha}</p>
                </div>
                <span className="hidden sm:block text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{fmtMoney(f.total, simboloDe(f))}</span>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={estadoVariant[f.estado]}>{estadoLabel[f.estado]}</Badge>
                  <span className="sm:hidden text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{fmtMoney(f.total, simboloDe(f))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

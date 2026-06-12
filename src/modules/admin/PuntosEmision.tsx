import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore, uuid } from '../../store';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import type { Column } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import type { PuntoEmision } from '../../types';

type FormData = Omit<PuntoEmision, 'id'>;

const empty: FormData = {
  establecimientoId: '',
  nombre: '',
  cai: '',
  correlativoActual: 1,
  rangoDesde: 1,
  rangoHasta: 500,
  fechaVigencia: '2027-12-31',
  activo: true,
};

const isVigente = (fecha: string) => new Date(fecha) >= new Date();

export default function PuntosEmisionPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PuntoEmision | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    const firstEst = state.establecimientos[0];
    setEditing(null);
    setForm({ ...empty, establecimientoId: firstEst?.id ?? '' });
    setModalOpen(true);
  };
  const openEdit = (p: PuntoEmision) => {
    setEditing(p);
    setForm({ establecimientoId: p.establecimientoId, nombre: p.nombre, cai: p.cai, correlativoActual: p.correlativoActual, rangoDesde: p.rangoDesde, rangoHasta: p.rangoHasta, fechaVigencia: p.fechaVigencia, activo: p.activo });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nombre.trim() || !form.cai.trim()) { toast.error('Nombre y CAI son requeridos'); return; }
    if (!form.establecimientoId) { toast.error('Seleccione un establecimiento'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_PUNTO_EMISION', payload: { ...editing, ...form } });
      toast.success('Punto de emisión actualizado');
    } else {
      dispatch({ type: 'ADD_PUNTO_EMISION', payload: { id: uuid(), ...form } });
      toast.success('Punto de emisión creado');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) { dispatch({ type: 'DELETE_PUNTO_EMISION', payload: deleteId }); toast.success('Eliminado'); setDeleteId(null); }
  };

  const getEstNombre = (id: string) => state.establecimientos.find(e => e.id === id)?.nombre ?? id;

  const columns: Column<PuntoEmision>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'establecimientoId', header: 'Establecimiento', render: r => getEstNombre(r.establecimientoId) },
    { key: 'cai', header: 'CAI', render: r => <span className="font-mono text-xs">{r.cai}</span> },
    {
      key: 'vigencia', header: 'Vigencia',
      render: r => (
        <div className="flex gap-1 flex-wrap">
          <Badge variant={isVigente(r.fechaVigencia) ? 'success' : 'danger'}>{isVigente(r.fechaVigencia) ? 'Vigente' : 'Vencido'}</Badge>
          <Badge variant={r.rangoHasta - r.correlativoActual > 0 ? 'info' : 'warning'}>
            Disp: {Math.max(0, r.rangoHasta - r.correlativoActual + 1)}
          </Badge>
        </div>
      ),
    },
    { key: 'fechaVigencia', header: 'Fecha Vigencia' },
    {
      key: 'activo', header: 'Estado',
      render: r => <Badge variant={r.activo ? 'success' : 'danger'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions', header: 'Acciones',
      render: r => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(r)}>Editar</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteId(r.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Eliminar</Button>
        </div>
      ),
    },
  ];

  const estOptions = state.establecimientos.map(e => ({ value: e.id, label: e.nombre }));

  return (
    <div>
      <PageHeader
        title="Puntos de Emisión"
        subtitle="Configure los puntos de emisión de facturas (CAI)"
        action={<Button icon={<Plus size={16} />} onClick={openNew}>Nuevo</Button>}
      />
      <Table columns={columns} data={state.puntosEmision} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Punto de Emisión' : 'Nuevo Punto de Emisión'} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input as="select" label="Establecimiento" value={form.establecimientoId} onChange={e => setForm(p => ({ ...p, establecimientoId: e.target.value }))} options={estOptions} wrapperClassName="col-span-2" />
          <Input as="input" label="Nombre" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Caja 01" wrapperClassName="col-span-2" />
          <Input as="input" label="CAI" value={form.cai} onChange={e => setForm(p => ({ ...p, cai: e.target.value }))} placeholder="XXXXXX-XXXXXX-XXXXXX" wrapperClassName="col-span-2" />
          <Input as="input" type="number" label="Correlativo Actual" value={form.correlativoActual} onChange={e => setForm(p => ({ ...p, correlativoActual: Number(e.target.value) }))} />
          <Input as="input" type="date" label="Fecha Vigencia" value={form.fechaVigencia} onChange={e => setForm(p => ({ ...p, fechaVigencia: e.target.value }))} />
          <Input as="input" type="number" label="Rango Desde" value={form.rangoDesde} onChange={e => setForm(p => ({ ...p, rangoDesde: Number(e.target.value) }))} />
          <Input as="input" type="number" label="Rango Hasta" value={form.rangoHasta} onChange={e => setForm(p => ({ ...p, rangoHasta: Number(e.target.value) }))} />
          <label className="flex items-center gap-2 cursor-pointer col-span-2">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Activo</span>
          </label>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-slate-300">¿Desea eliminar este punto de emisión?</p>
      </Modal>
    </div>
  );
}

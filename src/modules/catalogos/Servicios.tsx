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
import type { Servicio } from '../../types';

type FormData = Omit<Servicio, 'id' | 'tipo'>;
const empty: FormData = { codigo: '', descripcion: '', precio: 0, tipoImpuestoId: '', activo: true };

export default function ServiciosPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [form, setForm] = useState<FormData>({ ...empty, tipoImpuestoId: state.tiposImpuesto[0]?.id ?? '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm({ ...empty, tipoImpuestoId: state.tiposImpuesto[0]?.id ?? '' }); setModalOpen(true); };
  const openEdit = (s: Servicio) => { setEditing(s); setForm({ codigo: s.codigo, descripcion: s.descripcion, precio: s.precio, tipoImpuestoId: s.tipoImpuestoId, activo: s.activo }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.codigo.trim() || !form.descripcion.trim()) { toast.error('Código y descripción son requeridos'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_SERVICIO', payload: { ...editing, ...form } });
      toast.success('Servicio actualizado');
    } else {
      dispatch({ type: 'ADD_SERVICIO', payload: { id: uuid(), tipo: 'servicio', ...form } });
      toast.success('Servicio creado');
    }
    setModalOpen(false);
  };

  const getImpNombre = (id: string) => state.tiposImpuesto.find(i => i.id === id)?.nombre ?? '—';

  const columns: Column<Servicio>[] = [
    { key: 'codigo', header: 'Código' },
    { key: 'descripcion', header: 'Descripción' },
    { key: 'precio', header: 'Precio', render: r => `L. ${r.precio.toFixed(2)}` },
    { key: 'tipoImpuestoId', header: 'Impuesto', render: r => getImpNombre(r.tipoImpuestoId) },
    { key: 'activo', header: 'Estado', render: r => <Badge variant={r.activo ? 'success' : 'danger'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge> },
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

  const impOptions = state.tiposImpuesto.map(i => ({ value: i.id, label: i.nombre }));

  return (
    <div>
      <PageHeader title="Servicios" subtitle="Catálogo de servicios ofrecidos" action={<Button icon={<Plus size={16} />} onClick={openNew}>Nuevo</Button>} />
      <Table columns={columns} data={state.servicios} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Servicio' : 'Nuevo Servicio'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}
      >
        <div className="space-y-4">
          <Input as="input" label="Código" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} placeholder="SRV-001" />
          <Input as="input" label="Descripción" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
          <Input as="input" type="number" label="Precio (L.)" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: Number(e.target.value) }))} />
          <Input as="select" label="Tipo de Impuesto" value={form.tipoImpuestoId} onChange={e => setForm(p => ({ ...p, tipoImpuestoId: e.target.value }))} options={impOptions} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Activo</span>
          </label>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={() => { if (deleteId) { dispatch({ type: 'DELETE_SERVICIO', payload: deleteId }); toast.success('Eliminado'); setDeleteId(null); } }}>Eliminar</Button></>}
      >
        <p className="text-gray-600 dark:text-slate-300">¿Desea eliminar este servicio?</p>
      </Modal>
    </div>
  );
}

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
import type { TipoRetencion } from '../../types';

type FormData = Omit<TipoRetencion, 'id'>;
const empty: FormData = { nombre: '', porcentaje: 0, activo: true };

export default function TiposRetencionPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TipoRetencion | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (t: TipoRetencion) => { setEditing(t); setForm({ nombre: t.nombre, porcentaje: t.porcentaje, activo: t.activo }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_TIPO_RETENCION', payload: { ...editing, ...form } });
      toast.success('Tipo de retención actualizado');
    } else {
      dispatch({ type: 'ADD_TIPO_RETENCION', payload: { id: uuid(), ...form } });
      toast.success('Tipo de retención creado');
    }
    setModalOpen(false);
  };

  const columns: Column<TipoRetencion>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'porcentaje', header: 'Porcentaje', render: r => `${r.porcentaje}%` },
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

  return (
    <div>
      <PageHeader title="Tipos de Retención" subtitle="Configure los tipos de retención fiscal" action={<Button icon={<Plus size={16} />} onClick={openNew}>Nuevo</Button>} />
      <Table columns={columns} data={state.tiposRetencion} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Tipo de Retención' : 'Nuevo Tipo de Retención'} size="sm"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}
      >
        <div className="space-y-4">
          <Input as="input" label="Nombre" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: IR 1%" />
          <Input as="input" type="number" label="Porcentaje (%)" value={form.porcentaje} onChange={e => setForm(p => ({ ...p, porcentaje: Number(e.target.value) }))} min={0} max={100} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Activo</span>
          </label>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={() => { if (deleteId) { dispatch({ type: 'DELETE_TIPO_RETENCION', payload: deleteId }); toast.success('Eliminado'); setDeleteId(null); } }}>Eliminar</Button></>}
      >
        <p className="text-gray-600 dark:text-slate-300">¿Desea eliminar este tipo de retención?</p>
      </Modal>
    </div>
  );
}

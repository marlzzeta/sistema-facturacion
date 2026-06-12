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
import type { Establecimiento } from '../../types';

const empty: Omit<Establecimiento, 'id'> = {
  nombre: '', tipo: 'sucursal', direccion: '', activo: true,
};

export default function EstablecimientosPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Establecimiento | null>(null);
  const [form, setForm] = useState<Omit<Establecimiento, 'id'>>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (e: Establecimiento) => { setEditing(e); setForm({ nombre: e.nombre, tipo: e.tipo, direccion: e.direccion, activo: e.activo }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_ESTABLECIMIENTO', payload: { ...editing, ...form } });
      toast.success('Establecimiento actualizado');
    } else {
      dispatch({ type: 'ADD_ESTABLECIMIENTO', payload: { id: uuid(), ...form } });
      toast.success('Establecimiento creado');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      dispatch({ type: 'DELETE_ESTABLECIMIENTO', payload: deleteId });
      toast.success('Establecimiento eliminado');
      setDeleteId(null);
    }
  };

  const columns: Column<Establecimiento>[] = [
    { key: 'nombre', header: 'Nombre' },
    {
      key: 'tipo', header: 'Tipo',
      render: row => <Badge variant={row.tipo === 'casa_matriz' ? 'info' : 'default'}>{row.tipo === 'casa_matriz' ? 'Casa Matriz' : 'Sucursal'}</Badge>,
    },
    { key: 'direccion', header: 'Dirección' },
    {
      key: 'activo', header: 'Estado',
      render: row => <Badge variant={row.activo ? 'success' : 'danger'}>{row.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions', header: 'Acciones',
      render: row => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(row)}>Editar</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteId(row.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">Eliminar</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Establecimientos"
        subtitle="Administre la casa matriz y sucursales de su empresa"
        action={<Button icon={<Plus size={16} />} onClick={openNew}>Nuevo</Button>}
      />
      <Table columns={columns} data={state.establecimientos} />

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Establecimiento' : 'Nuevo Establecimiento'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input as="input" label="Nombre" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del establecimiento" />
          <Input
            as="select"
            label="Tipo"
            value={form.tipo}
            onChange={e => setForm(p => ({ ...p, tipo: e.target.value as Establecimiento['tipo'] }))}
            options={[
              { value: 'casa_matriz', label: 'Casa Matriz' },
              { value: 'sucursal', label: 'Sucursal' },
            ]}
          />
          <Input as="textarea" label="Dirección" value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} placeholder="Dirección completa" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Activo</span>
          </label>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-slate-300">¿Está seguro de que desea eliminar este establecimiento? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}

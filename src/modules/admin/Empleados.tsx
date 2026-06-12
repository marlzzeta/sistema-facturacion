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
import type { Empleado } from '../../types';

type FormData = Omit<Empleado, 'id'>;
const empty: FormData = { nombre: '', apellido: '', correo: '', cargo: '', activo: true };

export default function EmpleadosPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (e: Empleado) => { setEditing(e); setForm({ nombre: e.nombre, apellido: e.apellido, correo: e.correo, cargo: e.cargo, activo: e.activo }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nombre.trim() || !form.apellido.trim()) { toast.error('Nombre y apellido son requeridos'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_EMPLEADO', payload: { ...editing, ...form } });
      toast.success('Empleado actualizado');
    } else {
      dispatch({ type: 'ADD_EMPLEADO', payload: { id: uuid(), ...form } });
      toast.success('Empleado creado');
    }
    setModalOpen(false);
  };

  const columns: Column<Empleado>[] = [
    { key: 'nombre', header: 'Nombre', render: r => `${r.nombre} ${r.apellido}` },
    { key: 'correo', header: 'Correo' },
    { key: 'cargo', header: 'Cargo' },
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
      <PageHeader title="Empleados" subtitle="Gestione los empleados de la empresa" action={<Button icon={<Plus size={16} />} onClick={openNew}>Nuevo</Button>} />
      <Table columns={columns} data={state.empleados} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Empleado' : 'Nuevo Empleado'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input as="input" label="Nombre" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          <Input as="input" label="Apellido" value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} />
          <Input as="input" label="Correo" type="email" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} wrapperClassName="col-span-2" />
          <Input as="input" label="Cargo" value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} wrapperClassName="col-span-2" />
          <label className="flex items-center gap-2 cursor-pointer col-span-2">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Activo</span>
          </label>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={() => { if (deleteId) { dispatch({ type: 'DELETE_EMPLEADO', payload: deleteId }); toast.success('Eliminado'); setDeleteId(null); } }}>Eliminar</Button></>}
      >
        <p className="text-gray-600 dark:text-slate-300">¿Desea eliminar este empleado?</p>
      </Modal>
    </div>
  );
}

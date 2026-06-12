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
import type { Usuario } from '../../types';

type FormData = Omit<Usuario, 'id'>;
const empty: FormData = { empleadoId: '', username: '', rolId: '', activo: true };

export default function UsuariosPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm({ ...empty, empleadoId: state.empleados[0]?.id ?? '', rolId: state.roles[0]?.id ?? '' }); setModalOpen(true); };
  const openEdit = (u: Usuario) => { setEditing(u); setForm({ empleadoId: u.empleadoId, username: u.username, rolId: u.rolId, activo: u.activo }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.username.trim() || !form.empleadoId || !form.rolId) { toast.error('Todos los campos son requeridos'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_USUARIO', payload: { ...editing, ...form } });
      toast.success('Usuario actualizado');
    } else {
      dispatch({ type: 'ADD_USUARIO', payload: { id: uuid(), ...form } });
      toast.success('Usuario creado');
    }
    setModalOpen(false);
  };

  const getEmpNombre = (id: string) => { const e = state.empleados.find(x => x.id === id); return e ? `${e.nombre} ${e.apellido}` : id; };
  const getRolNombre = (id: string) => state.roles.find(r => r.id === id)?.nombre ?? id;

  const columns: Column<Usuario>[] = [
    { key: 'username', header: 'Usuario' },
    { key: 'empleadoId', header: 'Empleado', render: r => getEmpNombre(r.empleadoId) },
    { key: 'rolId', header: 'Rol', render: r => <Badge variant="info">{getRolNombre(r.rolId)}</Badge> },
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

  const empOptions = state.empleados.map(e => ({ value: e.id, label: `${e.nombre} ${e.apellido}` }));
  const rolOptions = state.roles.map(r => ({ value: r.id, label: r.nombre }));

  return (
    <div>
      <PageHeader title="Usuarios" subtitle="Gestione los usuarios del sistema" action={<Button icon={<Plus size={16} />} onClick={openNew}>Nuevo</Button>} />
      <Table columns={columns} data={state.usuarios} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}
      >
        <div className="space-y-4">
          <Input as="select" label="Empleado" value={form.empleadoId} onChange={e => setForm(p => ({ ...p, empleadoId: e.target.value }))} options={empOptions} />
          <Input as="input" label="Nombre de usuario" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="username" />
          <Input as="select" label="Rol" value={form.rolId} onChange={e => setForm(p => ({ ...p, rolId: e.target.value }))} options={rolOptions} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Activo</span>
          </label>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={() => { if (deleteId) { dispatch({ type: 'DELETE_USUARIO', payload: deleteId }); toast.success('Eliminado'); setDeleteId(null); } }}>Eliminar</Button></>}
      >
        <p className="text-gray-600 dark:text-slate-300">¿Desea eliminar este usuario?</p>
      </Modal>
    </div>
  );
}

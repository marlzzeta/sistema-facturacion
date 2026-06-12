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
import type { Cliente } from '../../types';

type FormData = Omit<Cliente, 'id'>;
const empty: FormData = { nombre: '', rtn: '', dni: '', correo: '', telefono: '', direccion: '', condicionPago: 'contado', limitCredito: 0, exentoImpuesto: false, activo: true };

export default function ClientesPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (c: Cliente) => { setEditing(c); setForm({ nombre: c.nombre, rtn: c.rtn, dni: c.dni, correo: c.correo, telefono: c.telefono, direccion: c.direccion, condicionPago: c.condicionPago, limitCredito: c.limitCredito, exentoImpuesto: c.exentoImpuesto, activo: c.activo }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_CLIENTE', payload: { ...editing, ...form } });
      toast.success('Cliente actualizado');
    } else {
      dispatch({ type: 'ADD_CLIENTE', payload: { id: uuid(), ...form } });
      toast.success('Cliente creado');
    }
    setModalOpen(false);
  };

  const columns: Column<Cliente>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'rtn', header: 'RTN / DNI', render: r => r.rtn || r.dni },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'condicionPago', header: 'Condición', render: r => <Badge variant={r.condicionPago === 'credito' ? 'warning' : 'default'}>{r.condicionPago === 'credito' ? 'Crédito' : 'Contado'}</Badge> },
    { key: 'exentoImpuesto', header: 'Exento', render: r => r.exentoImpuesto ? <Badge variant="success">Sí</Badge> : <Badge>No</Badge> },
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
      <PageHeader title="Clientes" subtitle="Administre los clientes de la empresa" action={<Button icon={<Plus size={16} />} onClick={openNew}>Nuevo</Button>} />
      <Table columns={columns} data={state.clientes} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Cliente' : 'Nuevo Cliente'} size="xl"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input as="input" label="Nombre / Razón Social" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} wrapperClassName="col-span-2" />
          <Input as="input" label="RTN" value={form.rtn} onChange={e => setForm(p => ({ ...p, rtn: e.target.value }))} placeholder="00000000000000" />
          <Input as="input" label="DNI" value={form.dni} onChange={e => setForm(p => ({ ...p, dni: e.target.value }))} placeholder="0000-0000-00000" />
          <Input as="input" type="email" label="Correo" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} />
          <Input as="input" label="Teléfono" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
          <Input as="textarea" label="Dirección" value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} wrapperClassName="col-span-2" />
          <Input as="select" label="Condición de Pago" value={form.condicionPago} onChange={e => setForm(p => ({ ...p, condicionPago: e.target.value as Cliente['condicionPago'] }))}
            options={[{ value: 'contado', label: 'Contado' }, { value: 'credito', label: 'Crédito' }]} />
          <Input as="input" type="number" label="Límite de Crédito (L.)" value={form.limitCredito} onChange={e => setForm(p => ({ ...p, limitCredito: Number(e.target.value) }))} />
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.exentoImpuesto} onChange={e => setForm(p => ({ ...p, exentoImpuesto: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Exento de Impuestos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Activo</span>
            </label>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={() => { if (deleteId) { dispatch({ type: 'DELETE_CLIENTE', payload: deleteId }); toast.success('Cliente eliminado'); setDeleteId(null); } }}>Eliminar</Button></>}
      >
        <p className="text-gray-600 dark:text-slate-300">¿Desea eliminar este cliente?</p>
      </Modal>
    </div>
  );
}

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
import type { TipoMoneda } from '../../types';

type FormData = Omit<TipoMoneda, 'id'>;
const empty: FormData = { nombre: '', simbolo: '', codigoIso: '', activo: true };

export default function TiposMonedaPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TipoMoneda | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (m: TipoMoneda) => { setEditing(m); setForm({ nombre: m.nombre, simbolo: m.simbolo, codigoIso: m.codigoIso, activo: m.activo }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nombre.trim() || !form.codigoIso.trim()) { toast.error('Nombre y código ISO son requeridos'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_TIPO_MONEDA', payload: { ...editing, ...form } });
      toast.success('Moneda actualizada');
    } else {
      dispatch({ type: 'ADD_TIPO_MONEDA', payload: { id: uuid(), ...form } });
      toast.success('Moneda creada');
    }
    setModalOpen(false);
  };

  const columns: Column<TipoMoneda>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'simbolo', header: 'Símbolo' },
    { key: 'codigoIso', header: 'Código ISO' },
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
      <PageHeader title="Monedas" subtitle="Configure las monedas aceptadas" action={<Button icon={<Plus size={16} />} onClick={openNew}>Nuevo</Button>} />
      <Table columns={columns} data={state.tiposMoneda} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Moneda' : 'Nueva Moneda'} size="sm"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}
      >
        <div className="space-y-4">
          <Input as="input" label="Nombre" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Lempira" />
          <Input as="input" label="Símbolo" value={form.simbolo} onChange={e => setForm(p => ({ ...p, simbolo: e.target.value }))} placeholder="Ej: L." />
          <Input as="input" label="Código ISO" value={form.codigoIso} onChange={e => setForm(p => ({ ...p, codigoIso: e.target.value.toUpperCase() }))} placeholder="Ej: HNL" maxLength={3} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Activo</span>
          </label>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={() => { if (deleteId) { dispatch({ type: 'DELETE_TIPO_MONEDA', payload: deleteId }); toast.success('Eliminado'); setDeleteId(null); } }}>Eliminar</Button></>}
      >
        <p className="text-gray-600 dark:text-slate-300">¿Desea eliminar esta moneda?</p>
      </Modal>
    </div>
  );
}

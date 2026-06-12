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
import type { DatosFiscales } from '../../types';

type FormData = Omit<DatosFiscales, 'id'>;
const empty: FormData = { clienteId: '', retencionId: '', regimenFiscal: '', numeroExoneracion: '' };

export default function DatosFiscalesPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DatosFiscales | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm({ ...empty, clienteId: state.clientes[0]?.id ?? '' }); setModalOpen(true); };
  const openEdit = (d: DatosFiscales) => { setEditing(d); setForm({ clienteId: d.clienteId, retencionId: d.retencionId, regimenFiscal: d.regimenFiscal, numeroExoneracion: d.numeroExoneracion }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.clienteId) { toast.error('Seleccione un cliente'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_DATOS_FISCALES', payload: { ...editing, ...form } });
      toast.success('Datos fiscales actualizados');
    } else {
      dispatch({ type: 'ADD_DATOS_FISCALES', payload: { id: uuid(), ...form } });
      toast.success('Datos fiscales creados');
    }
    setModalOpen(false);
  };

  const getClienteLabel = (id: string) => {
    const c = state.clientes.find(x => x.id === id);
    return c ? `${c.nombre}${c.rtn ? ` (${c.rtn})` : ''}` : id;
  };
  const getRetencionNombre = (id: string) => state.tiposRetencion.find(r => r.id === id)?.nombre ?? '—';

  const columns: Column<DatosFiscales>[] = [
    { key: 'clienteId', header: 'Cliente', render: r => getClienteLabel(r.clienteId) },
    { key: 'regimenFiscal', header: 'Régimen Fiscal' },
    { key: 'retencionId', header: 'Retención', render: r => r.retencionId ? getRetencionNombre(r.retencionId) : '—' },
    { key: 'numeroExoneracion', header: 'N° Exoneración', render: r => r.numeroExoneracion || '—' },
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

  const clienteOptions = state.clientes.map(c => ({ value: c.id, label: `${c.nombre}${c.rtn ? ` (${c.rtn})` : ''}` }));
  const retencionOptions = [{ value: '', label: '— Sin retención —' }, ...state.tiposRetencion.map(r => ({ value: r.id, label: r.nombre }))];

  return (
    <div>
      <PageHeader title="Datos Fiscales" subtitle="Información fiscal de los clientes" action={<Button icon={<Plus size={16} />} onClick={openNew}>Nuevo</Button>} />
      <Table columns={columns} data={state.datosFiscales} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Datos Fiscales' : 'Nuevos Datos Fiscales'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}
      >
        <div className="space-y-4">
          <Input as="select" label="Cliente" value={form.clienteId} onChange={e => setForm(p => ({ ...p, clienteId: e.target.value }))} options={clienteOptions} />
          <Input as="select" label="Tipo de Retención" value={form.retencionId} onChange={e => setForm(p => ({ ...p, retencionId: e.target.value }))} options={retencionOptions} />
          <Input as="input" label="Régimen Fiscal" value={form.regimenFiscal} onChange={e => setForm(p => ({ ...p, regimenFiscal: e.target.value }))} placeholder="Ej: Régimen General" />
          <Input as="input" label="N° Exoneración" value={form.numeroExoneracion} onChange={e => setForm(p => ({ ...p, numeroExoneracion: e.target.value }))} placeholder="Opcional" />
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={() => { if (deleteId) { dispatch({ type: 'DELETE_DATOS_FISCALES', payload: deleteId }); toast.success('Eliminado'); setDeleteId(null); } }}>Eliminar</Button></>}
      >
        <p className="text-gray-600 dark:text-slate-300">¿Desea eliminar estos datos fiscales?</p>
      </Modal>
    </div>
  );
}

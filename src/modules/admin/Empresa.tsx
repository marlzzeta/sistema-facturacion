import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useStore } from '../../store';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { Empresa } from '../../types';

export default function EmpresaPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState<Empresa>({ ...state.empresa });
  const [saving, setSaving] = useState(false);

  const set = (field: keyof Empresa) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    dispatch({ type: 'UPDATE_EMPRESA', payload: form });
    toast.success('Datos de la empresa guardados correctamente.');
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Configuración de Empresa"
        subtitle="Información fiscal y comercial de su empresa"
        action={
          <Button onClick={handleSave} loading={saving} icon={<Save size={16} />}>
            Guardar Cambios
          </Button>
        }
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            as="input"
            label="Razón Social"
            value={form.razonSocial}
            onChange={set('razonSocial')}
            placeholder="Nombre de la empresa"
            wrapperClassName="sm:col-span-2"
          />
          <Input
            as="input"
            label="RTN"
            value={form.rtn}
            onChange={set('rtn')}
            placeholder="00000000000000"
          />
          <Input
            as="input"
            label="Teléfono"
            value={form.telefono}
            onChange={set('telefono')}
            placeholder="+504 0000-0000"
          />
          <Input
            as="input"
            label="Correo Electrónico"
            type="email"
            value={form.correo}
            onChange={set('correo')}
            placeholder="correo@empresa.hn"
            wrapperClassName="sm:col-span-2"
          />
          <Input
            as="textarea"
            label="Dirección"
            value={form.direccion}
            onChange={set('direccion')}
            placeholder="Dirección completa"
            wrapperClassName="sm:col-span-2"
          />
          <Input
            as="input"
            label="Resolución de Facturación (SAR)"
            value={form.resolucionFacturacion}
            onChange={set('resolucionFacturacion')}
            placeholder="SAR-XXXX-XXXXXX"
            wrapperClassName="sm:col-span-2"
          />
          <Input
            as="textarea"
            label="Pie de Factura"
            value={form.pieFactura}
            onChange={set('pieFactura')}
            placeholder="Texto que aparece al pie de cada factura"
            wrapperClassName="sm:col-span-2"
          />
        </div>
      </div>
    </div>
  );
}

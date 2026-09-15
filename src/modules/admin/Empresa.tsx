import React, { useRef, useState } from 'react';
import { Save, Upload, X } from 'lucide-react';
import { useStore } from '../../store';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { Empresa } from '../../types';
import { useAuth } from '../../auth/AuthContext';

export default function EmpresaPage() {
  const { state, dispatch } = useStore();
  const { csrfToken } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<Empresa>({ ...state.empresa });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof Empresa) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('El logo debe ser PNG, JPG o WebP.');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El logo no debe superar 2 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/company', {
        method: 'PATCH', credentials: 'include',
        headers: { 'content-type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ ...form, logo: form.logo ?? null }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(body?.error?.message ?? 'No se pudo guardar la configuración.');
      }
      const body = await response.json() as { data: Empresa & { logo: string | null } };
      const empresa = { ...body.data, logo: body.data.logo ?? undefined };
      dispatch({ type: 'UPDATE_EMPRESA', payload: empresa });
      setForm(empresa);
      toast.success('Datos de la empresa guardados correctamente.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la configuración.');
    } finally { setSaving(false); }
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

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-6">

        {/* Logo upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Logo de la Empresa
          </label>
          <div className="flex items-center gap-4">
            {form.logo ? (
              <div className="relative group">
                <img
                  src={form.logo}
                  alt="Logo"
                  className="h-20 w-auto max-w-[200px] object-contain rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-2"
                />
                <button
                  onClick={() => { setForm(prev => ({ ...prev, logo: undefined })); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar logo"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="h-20 w-40 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center bg-gray-50 dark:bg-slate-700">
                <span className="text-xs text-gray-400 dark:text-slate-500 text-center px-2">Sin logo</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogo}
              />
              <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => fileRef.current?.click()}>
                {form.logo ? 'Cambiar Logo' : 'Subir Logo'}
              </Button>
              <p className="text-xs text-gray-400 dark:text-slate-500">PNG, JPG o WebP · Máx. 2 MB</p>
            </div>
          </div>
        </div>

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

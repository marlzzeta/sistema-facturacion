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

  const set = (field: keyof Empresa) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        razonSocial: form.razonSocial,
        rtn: form.rtn,
        direccion: form.direccion,
        correo: form.correo,
        telefono: form.telefono,
        resolucionFacturacion: form.resolucionFacturacion,
        pieFactura: form.pieFactura,
        logo: form.logo ?? null,
        logoSistema: form.logoSistema ?? null,
        favicon: form.favicon ?? null,
        tituloPestana: form.tituloPestana ?? '',
        version: form.version,
      };
      const response = await fetch('/api/v1/company', {
        method: 'PATCH', credentials: 'include',
        headers: { 'content-type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        type ApiError = { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] } } };
        const body = await response.json().catch(() => null) as ApiError | null;
        const fieldLabels: Record<string, string> = {
          razonSocial: 'Razón Social', rtn: 'RTN', correo: 'Correo Electrónico',
          telefono: 'Teléfono', direccion: 'Dirección',
          resolucionFacturacion: 'Resolución de Facturación', pieFactura: 'Pie de Factura',
          logo: 'Logo de la Empresa', logoSistema: 'Logo del Sistema', favicon: 'Favicon', tituloPestana: 'Título de la pestaña', version: 'Versión',
        };
        const fieldErrors = body?.error?.details?.fieldErrors ?? {};
        const errorFields = Object.entries(fieldErrors)
          .map(([field, msgs]) => `${fieldLabels[field] ?? field}: ${msgs[0] ?? 'inválido'}`)
          .join('; ');
        throw new Error(errorFields || body?.error?.message || 'No se pudo guardar la configuración.');
      }
      const body = await response.json() as { data: Omit<Empresa, 'logo' | 'logoSistema' | 'favicon'> & { logo: string | null; logoSistema: string | null; favicon: string | null } };
      const empresa: Empresa = {
        ...body.data, logo: body.data.logo ?? undefined, logoSistema: body.data.logoSistema ?? undefined,
        favicon: body.data.favicon ?? undefined,
      };
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

        <LogoField
          label="Logo de la Empresa"
          help="Se usa en las facturas y documentos de la empresa."
          value={form.logo}
          onChange={logo => setForm(prev => ({ ...prev, logo }))}
        />

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

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <LogoField
          label="Logo del Sistema"
          help="Se muestra en la pantalla de inicio de sesión y en el menú lateral. Si no se configura, se usa el logo de la empresa."
          value={form.logoSistema}
          onChange={logoSistema => setForm(prev => ({ ...prev, logoSistema }))}
        />
      </div>

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Pestaña del navegador</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Cómo se ve el sistema en la pestaña del navegador.</p>
        </div>
        <Input
          as="input"
          label="Título de la pestaña"
          value={form.tituloPestana ?? ''}
          onChange={set('tituloPestana')}
          placeholder="SisFactura"
        />
        <LogoField
          label="Favicon"
          help="Ícono pequeño que aparece en la pestaña del navegador. Use una imagen cuadrada (por ejemplo 64×64). Si no se configura, se usa el ícono por defecto."
          value={form.favicon}
          onChange={favicon => setForm(prev => ({ ...prev, favicon }))}
          types={FAVICON_TYPES}
          maxBytes={500 * 1024}
          formatsLabel="PNG, JPG, WebP o ICO · Máx. 500 KB"
          previewClassName="h-16 w-16 object-contain rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-2"
        />
      </div>
    </div>
  );
}

const FAVICON_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function LogoField({
  label, help, value, onChange, types = ACCEPTED_TYPES, maxBytes = 2 * 1024 * 1024,
  formatsLabel = 'PNG, JPG o WebP · Máx. 2 MB',
  previewClassName = 'h-20 w-auto max-w-[200px] object-contain rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-2',
}: {
  label: string; help: string; value?: string; onChange: (value: string | undefined) => void;
  types?: string[]; maxBytes?: number; formatsLabel?: string; previewClassName?: string;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!types.includes(file.type)) {
      toast.error(`${label}: formato no permitido (${formatsLabel.split(' · ')[0]}).`);
      e.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`${label}: el archivo es demasiado grande (${formatsLabel.split(' · ')[1] ?? ''}).`);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{help}</p>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative group">
            <img
              src={value}
              alt={label}
              className={previewClassName}
            />
            <button
              type="button"
              onClick={() => { onChange(undefined); if (fileRef.current) fileRef.current.value = ''; }}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              title="Eliminar logo"
              aria-label={`Eliminar ${label.toLowerCase()}`}
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
          <input ref={fileRef} type="file" accept={types.join(',')} className="hidden" onChange={handleFile} />
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => fileRef.current?.click()}>
            {value ? 'Cambiar' : 'Subir'} {label === 'Favicon' ? 'Favicon' : 'Logo'}
          </Button>
          <p className="text-xs text-gray-400 dark:text-slate-500">{formatsLabel}</p>
        </div>
      </div>
    </div>
  );
}

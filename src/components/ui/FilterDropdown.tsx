import React from 'react';
import { ChevronDown, X } from 'lucide-react';

interface FilterDropdownProps {
  /** Nombre del filtro, p. ej. "Fecha". */
  label: string;
  /** Texto que se muestra en el botón cuando el filtro está activo. */
  valueLabel?: string;
  active: boolean;
  icon: React.ReactNode;
  onClear: () => void;
  /** Alineación del menú en pantallas grandes. */
  align?: 'left' | 'right';
  children: (close: () => void) => React.ReactNode;
}

/**
 * Botón de filtro con menú desplegable. En escritorio abre un menú flotante
 * bajo el botón; en móvil abre una hoja inferior a todo el ancho.
 */
export default function FilterDropdown({
  label, valueLabel, active, icon, onClear, align = 'left', children,
}: FilterDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <div
        className={[
          'flex items-center rounded-xl border text-sm font-medium shadow-sm transition-colors',
          active
            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-900/30 dark:text-blue-300'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60',
          open ? 'ring-2 ring-blue-500/30' : '',
        ].join(' ')}
      >
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 pr-2.5 outline-none"
        >
          <span className="shrink-0 opacity-80">{icon}</span>
          <span className="max-w-[11rem] sm:max-w-[16rem] truncate">{active && valueLabel ? valueLabel : label}</span>
          {!active && <ChevronDown size={15} className={`shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />}
        </button>
        {active && (
          <button
            type="button"
            aria-label={`Quitar filtro ${label}`}
            onClick={() => { onClear(); setOpen(false); }}
            className="mr-1.5 shrink-0 rounded-md p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800/50"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <>
          {/* Fondo oscuro solo en móvil */}
          <div className="fixed inset-0 z-40 bg-slate-900/30 sm:hidden" onClick={close} />
          <div
            role="dialog"
            aria-label={label}
            className={[
              'z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl',
              // móvil: hoja inferior
              'fixed inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
              // escritorio: menú flotante
              'sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:mt-2 sm:w-72 sm:max-h-96 sm:rounded-2xl sm:p-2',
              align === 'right' ? 'sm:right-0' : 'sm:left-0',
            ].join(' ')}
          >
            <div className="mb-3 flex items-center justify-between sm:hidden">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Filtrar por {label.toLowerCase()}</p>
              <button type="button" onClick={close} aria-label="Cerrar" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            {children(close)}
          </div>
        </>
      )}
    </div>
  );
}

/** Opción de lista dentro de un FilterDropdown. */
export function FilterOption({
  selected, onClick, children, trailing,
}: { selected: boolean; onClick: () => void; children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 sm:py-2 text-left text-sm transition-colors',
        selected
          ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60',
      ].join(' ')}
    >
      <span className="min-w-0 truncate">{children}</span>
      {trailing}
    </button>
  );
}

import React from 'react';

type Tone = 'blue' | 'green' | 'amber' | 'rose';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: Tone;
  hint?: string;
}

const toneClass: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
};

/** Tarjeta de indicador (KPI): icono de color, etiqueta y valor grande. */
export default function StatCard({ label, value, icon, tone = 'blue', hint }: StatCardProps) {
  return (
    <div className="card p-4 sm:p-5 flex items-start gap-3 sm:gap-4 min-w-0">
      <span className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-2xl ${toneClass[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 truncate">{hint}</p>}
      </div>
    </div>
  );
}

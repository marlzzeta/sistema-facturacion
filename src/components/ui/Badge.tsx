import React from 'react';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-400/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-400/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-400/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20',
  default: 'bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-400/20',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset whitespace-nowrap',
        variantClass[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

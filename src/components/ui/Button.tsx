import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm shadow-blue-600/30 focus-visible:ring-blue-500 disabled:bg-blue-400',
  secondary: 'bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 shadow-sm focus-visible:ring-slate-400',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-sm shadow-rose-600/30 focus-visible:ring-rose-500 disabled:bg-rose-400',
  ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent focus-visible:ring-slate-400',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1 rounded-lg',
  md: 'text-sm px-4 py-2.5 gap-1.5 rounded-xl',
  lg: 'text-base px-5 py-3 gap-2 rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold border',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} /> : icon}
      {children}
    </button>
  );
}

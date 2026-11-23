import React from 'react';

type InputSize = 'sm' | 'default';

interface BaseProps {
  label?: string;
  error?: string;
  inputSize?: InputSize;
  wrapperClassName?: string;
}

interface InputProps extends BaseProps, React.InputHTMLAttributes<HTMLInputElement> {
  as?: 'input';
}

interface SelectProps extends BaseProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  as: 'select';
  options?: { value: string; label: string }[];
}

interface TextareaProps extends BaseProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
}

type Props = InputProps | SelectProps | TextareaProps;

const baseClass = (size: InputSize = 'default', hasError?: boolean) =>
  [
    'block w-full min-w-0 max-w-full rounded-xl border bg-white dark:bg-slate-700',
    'text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500',
    'focus:outline-none focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500',
    'transition-colors duration-150',
    hasError
      ? 'border-red-500 dark:border-red-400'
      : 'border-slate-200 dark:border-slate-600',
    size === 'sm' ? 'text-sm px-2.5 py-1.5' : 'text-sm px-3.5 py-2.5',
  ].join(' ');

export default function Input(props: Props) {
  const { label, error, inputSize, wrapperClassName, ...rest } = props;
  const fieldClass = baseClass(inputSize, !!error);

  const field = (() => {
    if (rest.as === 'select') {
      const { as: omittedAs, options, children, ...selectRest } = rest as SelectProps & { children?: React.ReactNode };
      void omittedAs;
      return (
        <select className={fieldClass} {...selectRest}>
          {options
            ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
            : children}
        </select>
      );
    }
    if (rest.as === 'textarea') {
      const { as: omittedAs, ...taRest } = rest as TextareaProps;
      void omittedAs;
      return <textarea className={fieldClass} rows={3} {...taRest} />;
    }
    const { as: omittedAs, ...inputRest } = rest as InputProps;
    void omittedAs;
    return <input className={fieldClass} {...inputRest} />;
  })();

  if (!label && !error) return field;

  return (
    <div className={['min-w-0', wrapperClassName ?? ''].join(' ')}>
      {label && (
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      {field}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

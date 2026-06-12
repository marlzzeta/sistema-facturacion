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
    'block w-full rounded-md border bg-white dark:bg-slate-700',
    'text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'transition-colors duration-150',
    hasError
      ? 'border-red-500 dark:border-red-400'
      : 'border-gray-300 dark:border-slate-600',
    size === 'sm' ? 'text-sm px-2.5 py-1.5' : 'text-sm px-3 py-2',
  ].join(' ');

export default function Input(props: Props) {
  const { label, error, inputSize, wrapperClassName, ...rest } = props;
  const fieldClass = baseClass(inputSize, !!error);

  const field = (() => {
    if (rest.as === 'select') {
      const { as: _as, options, children, ...selectRest } = rest as SelectProps & { children?: React.ReactNode };
      return (
        <select className={fieldClass} {...selectRest}>
          {options
            ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
            : children}
        </select>
      );
    }
    if (rest.as === 'textarea') {
      const { as: _as, ...taRest } = rest as TextareaProps;
      return <textarea className={fieldClass} rows={3} {...taRest} />;
    }
    const { as: _as, ...inputRest } = rest as InputProps;
    return <input className={fieldClass} {...inputRest} />;
  })();

  if (!label && !error) return field;

  return (
    <div className={wrapperClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      {field}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

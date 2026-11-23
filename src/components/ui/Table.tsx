import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  /** Clases extra para la celda y su encabezado (p. ej. ocultar en móvil). */
  className?: string;
}

interface TableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export default function Table<T extends { id: string }>({ columns, data, emptyMessage = 'Sin registros' }: TableProps<T>) {
  return (
    <div className="card w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-700">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-12 text-center text-slate-400 dark:text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-5 py-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap ${col.className ?? ''}`}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

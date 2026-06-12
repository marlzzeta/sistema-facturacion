import { Moon, Sun, LogOut, User } from 'lucide-react';
import { useStore } from '../../store';

interface TopbarProps {
  currentPage: string;
}

const pageTitles: Record<string, string> = {
  empresa: 'Configuración de Empresa',
  establecimientos: 'Establecimientos',
  'puntos-emision': 'Puntos de Emisión',
  empleados: 'Empleados',
  usuarios: 'Usuarios',
  clientes: 'Clientes',
  articulos: 'Artículos',
  servicios: 'Servicios',
  'datos-fiscales': 'Datos Fiscales',
  'tipos-impuesto': 'Tipos de Impuesto',
  'tipos-retencion': 'Tipos de Retención',
  monedas: 'Monedas',
  'formas-pago': 'Formas de Pago',
  facturas: 'Facturas',
};

export default function Topbar({ currentPage }: TopbarProps) {
  const { state, dispatch } = useStore();
  const { temaOscuro, usuarioActual, empleados } = state;

  const empleado = empleados.find(e => e.id === usuarioActual?.empleadoId);
  const displayName = empleado ? `${empleado.nombre} ${empleado.apellido}` : usuarioActual?.username ?? 'Usuario';

  const toggleTema = () => dispatch({ type: 'SET_TEMA', payload: !temaOscuro });
  const logout = () => dispatch({ type: 'SET_USUARIO', payload: null });

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 md:px-6 h-14 flex items-center justify-between shadow-sm">
      <div className="pl-10 md:pl-0">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          {pageTitles[currentPage] ?? 'Sistema de Facturación'}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTema}
          title={temaOscuro ? 'Modo claro' : 'Modo oscuro'}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          {temaOscuro ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User info */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
            <User size={13} className="text-white" />
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-800 dark:text-slate-200 leading-tight">{displayName}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 leading-tight">{usuarioActual?.username}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Cerrar sesión"
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

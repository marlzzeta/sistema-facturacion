import { Moon, Sun, LogOut, User } from 'lucide-react';
import { useStore } from '../../store';
import { useAuth } from '../../auth/AuthContext';
import SessionBar from '../../auth/SessionBar';
import type { Usuario } from '../../types';

interface TopbarProps {
  currentPage: string;
  usuarioActual?: Usuario | null;
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

export default function Topbar({ currentPage, usuarioActual: usuarioProp }: TopbarProps) {
  const { state, dispatch } = useStore();
  const auth = useAuth();
  const { temaOscuro, empleados } = state;

  // Prefer prop passed from AppContent (comes from AuthContext), fallback to store
  const usuarioActual = usuarioProp ?? state.usuarioActual;
  const empleado = empleados.find(e => e.id === usuarioActual?.empleadoId);
  const displayName = empleado
    ? `${empleado.nombre} ${empleado.apellido}`
    : usuarioActual?.username ?? 'Usuario';
  const rolNombre = state.roles.find(r => r.id === usuarioActual?.rolId)?.nombre ?? '';

  const toggleTema = () => dispatch({ type: 'SET_TEMA', payload: !temaOscuro });
  const logout = () => auth.logout();

  return (
    <header className="sticky top-0 z-30 bg-[#f3f6fb]/85 dark:bg-slate-900/85 backdrop-blur px-4 md:px-8 h-16 flex items-center justify-between gap-3">
      <div className="pl-12 md:pl-0 min-w-0">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate">
          {pageTitles[currentPage] ?? 'Sistema de Facturación'}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Session countdown */}
        <SessionBar />

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleTema}
          title={temaOscuro ? 'Modo claro' : 'Modo oscuro'}
          aria-label={temaOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm transition-colors"
        >
          {temaOscuro ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User info */}
        <div className="hidden sm:flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <User size={15} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{displayName}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">{rolNombre || usuarioActual?.username}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

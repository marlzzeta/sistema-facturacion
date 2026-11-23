import React, { useState } from 'react';
import {
  Building2, MapPin, Printer, Users, UserCheck,
  BookUser, Package, Wrench, FileText, Percent,
  RefreshCw, Coins, CreditCard, FileSpreadsheet,
  ChevronDown, ChevronRight, Menu, X, Receipt,
} from 'lucide-react';
import { useStore } from '../../store';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'Administración',
    items: [
      { key: 'empresa', label: 'Empresa', icon: <Building2 size={18} /> },
      { key: 'establecimientos', label: 'Establecimientos', icon: <MapPin size={18} /> },
      { key: 'puntos-emision', label: 'Puntos de Emisión', icon: <Printer size={18} /> },
      { key: 'empleados', label: 'Empleados', icon: <Users size={18} /> },
      { key: 'usuarios', label: 'Usuarios', icon: <UserCheck size={18} /> },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { key: 'clientes', label: 'Clientes', icon: <BookUser size={18} /> },
      { key: 'articulos', label: 'Artículos', icon: <Package size={18} /> },
      { key: 'servicios', label: 'Servicios', icon: <Wrench size={18} /> },
      { key: 'datos-fiscales', label: 'Datos Fiscales', icon: <FileText size={18} /> },
    ],
  },
  {
    title: 'Parámetros',
    items: [
      { key: 'tipos-impuesto', label: 'Tipos de Impuesto', icon: <Percent size={18} /> },
      { key: 'tipos-retencion', label: 'Tipos de Retención', icon: <RefreshCw size={18} /> },
      { key: 'monedas', label: 'Monedas', icon: <Coins size={18} /> },
      { key: 'formas-pago', label: 'Formas de Pago', icon: <CreditCard size={18} /> },
    ],
  },
  {
    title: 'Documentos',
    items: [
      { key: 'facturas', label: 'Facturas', icon: <FileSpreadsheet size={18} /> },
    ],
  },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { state } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Administración: true, Catálogos: true, Parámetros: false, Documentos: true,
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleNav = (key: string) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  // El logo del sistema tiene prioridad; si no existe se usa el de la empresa.
  const systemLogo = state.empresa.logoSistema || state.empresa.logo;

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className={[
        'flex items-center gap-3 px-5 pt-6 pb-5',
        collapsed ? 'md:justify-center md:px-2' : '',
      ].join(' ')}>
        <div className={[
          'relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden',
          systemLogo ? 'bg-white ring-1 ring-slate-200/70' : 'bg-blue-600 shadow-md shadow-blue-600/30',
          collapsed ? 'md:hidden' : '',
        ].join(' ')}>
          {systemLogo
            ? <img src={systemLogo} alt="Logo del sistema" className="w-full h-full object-contain p-0.5" />
            : <Receipt size={19} className="text-white" />}
        </div>
        <div className={['overflow-hidden', collapsed ? 'md:hidden' : ''].join(' ')}>
          <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">SisFactura</p>
        </div>
        <button
          type="button"
          aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
          className={[
            'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hidden md:flex items-center justify-center rounded-lg p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700',
            collapsed ? 'md:mx-auto' : 'ml-auto',
          ].join(' ')}
          onClick={() => setCollapsed(c => !c)}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map(section => (
          <div key={section.title} className="mb-3">
            {!collapsed && (
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                aria-expanded={!!openSections[section.title]}
                className="w-full flex items-center gap-1 px-3 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300"
              >
                {openSections[section.title] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {section.title}
              </button>
            )}
            {(collapsed || openSections[section.title]) && section.items.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNav(item.key)}
                title={collapsed ? item.label : undefined}
                aria-current={currentPage === item.key ? 'page' : undefined}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-xl text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  collapsed ? 'md:justify-center' : '',
                  currentPage === item.key
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200',
                ].join(' ')}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={mobileOpen}
        className="md:hidden fixed top-3 left-3 z-50 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          'md:hidden fixed top-0 left-0 h-full z-40 bg-white dark:bg-slate-800 w-72 max-w-[85vw] pt-12 transition-transform duration-200',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={[
          'hidden md:flex flex-col bg-white/70 dark:bg-slate-800 border-r border-slate-200/60 dark:border-slate-700 h-dvh sticky top-0 flex-shrink-0 transition-all duration-200',
          collapsed ? 'w-20' : 'w-60 lg:w-64',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

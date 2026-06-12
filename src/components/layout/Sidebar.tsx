import React, { useState } from 'react';
import {
  Building2, MapPin, Printer, Users, UserCheck,
  BookUser, Package, Wrench, FileText, Percent,
  RefreshCw, Coins, CreditCard, FileSpreadsheet,
  ChevronDown, ChevronRight, Menu, X, Receipt,
} from 'lucide-react';

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
      { key: 'empresa', label: 'Empresa', icon: <Building2 size={16} /> },
      { key: 'establecimientos', label: 'Establecimientos', icon: <MapPin size={16} /> },
      { key: 'puntos-emision', label: 'Puntos de Emisión', icon: <Printer size={16} /> },
      { key: 'empleados', label: 'Empleados', icon: <Users size={16} /> },
      { key: 'usuarios', label: 'Usuarios', icon: <UserCheck size={16} /> },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { key: 'clientes', label: 'Clientes', icon: <BookUser size={16} /> },
      { key: 'articulos', label: 'Artículos', icon: <Package size={16} /> },
      { key: 'servicios', label: 'Servicios', icon: <Wrench size={16} /> },
      { key: 'datos-fiscales', label: 'Datos Fiscales', icon: <FileText size={16} /> },
    ],
  },
  {
    title: 'Parámetros',
    items: [
      { key: 'tipos-impuesto', label: 'Tipos de Impuesto', icon: <Percent size={16} /> },
      { key: 'tipos-retencion', label: 'Tipos de Retención', icon: <RefreshCw size={16} /> },
      { key: 'monedas', label: 'Monedas', icon: <Coins size={16} /> },
      { key: 'formas-pago', label: 'Formas de Pago', icon: <CreditCard size={16} /> },
    ],
  },
  {
    title: 'Documentos',
    items: [
      { key: 'facturas', label: 'Facturas', icon: <FileSpreadsheet size={16} /> },
    ],
  },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
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

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Receipt size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">SisFactura</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Honduras</p>
          </div>
        )}
        <button
          className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hidden md:block"
          onClick={() => setCollapsed(c => !c)}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map(section => (
          <div key={section.title} className="mb-1">
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-slate-300"
              >
                {openSections[section.title] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {section.title}
              </button>
            )}
            {(collapsed || openSections[section.title]) && section.items.map(item => (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                title={collapsed ? item.label : undefined}
                className={[
                  'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                  collapsed ? 'justify-center' : '',
                  currentPage === item.key
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-slate-200',
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
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          'md:hidden fixed top-0 left-0 h-full z-40 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 w-64 transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={[
          'hidden md:flex flex-col border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-screen sticky top-0 flex-shrink-0 transition-all duration-200',
          collapsed ? 'w-16' : 'w-56',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store';
import { ToastProvider } from './components/ui/Toast';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

// Admin
import EmpresaPage from './modules/admin/Empresa';
import EstablecimientosPage from './modules/admin/Establecimientos';
import PuntosEmisionPage from './modules/admin/PuntosEmision';
import EmpleadosPage from './modules/admin/Empleados';
import UsuariosPage from './modules/admin/Usuarios';

// Catalogos
import ClientesPage from './modules/catalogos/Clientes';
import DatosFiscalesPage from './modules/catalogos/DatosFiscales';
import ArticulosPage from './modules/catalogos/Articulos';
import ServiciosPage from './modules/catalogos/Servicios';

// Parametros
import TiposImpuestoPage from './modules/parametros/TiposImpuesto';
import TiposRetencionPage from './modules/parametros/TiposRetencion';
import TiposMonedaPage from './modules/parametros/TiposMoneda';
import FormasPagoPage from './modules/parametros/FormasPago';

// Documentos
import FacturasPage from './modules/documentos/Facturas';

function AppContent() {
  const { state } = useStore();
  const [currentPage, setCurrentPage] = useState('facturas');

  // Apply dark class to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (state.temaOscuro) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [state.temaOscuro]);

  const renderPage = () => {
    switch (currentPage) {
      case 'empresa': return <EmpresaPage />;
      case 'establecimientos': return <EstablecimientosPage />;
      case 'puntos-emision': return <PuntosEmisionPage />;
      case 'empleados': return <EmpleadosPage />;
      case 'usuarios': return <UsuariosPage />;
      case 'clientes': return <ClientesPage />;
      case 'datos-fiscales': return <DatosFiscalesPage />;
      case 'articulos': return <ArticulosPage />;
      case 'servicios': return <ServiciosPage />;
      case 'tipos-impuesto': return <TiposImpuestoPage />;
      case 'tipos-retencion': return <TiposRetencionPage />;
      case 'monedas': return <TiposMonedaPage />;
      case 'formas-pago': return <FormasPagoPage />;
      case 'facturas': return <FacturasPage />;
      default: return <FacturasPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar currentPage={currentPage} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </StoreProvider>
  );
}

import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import { applyBrowserBranding } from './utils/browserBranding';

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
  const { sesion, usuarioActual, syncError } = useAuth();
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

  // Título y favicon de la pestaña (dentro del sistema; el login aplica los suyos).
  useEffect(() => {
    if (sesion) applyBrowserBranding(state.empresa.tituloPestana, state.empresa.favicon);
  }, [sesion, state.empresa.tituloPestana, state.empresa.favicon]);

  if (!sesion) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'empresa': return <EmpresaPage key={state.empresa.version} />;
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
    <div className="flex h-dvh bg-[#f3f6fb] dark:bg-slate-900 overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Topbar currentPage={currentPage} usuarioActual={usuarioActual} />
        {syncError && <div role="alert" className="mx-4 md:mx-8 mb-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{syncError}</div>}
        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-2 md:px-8 md:pb-8">
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
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </StoreProvider>
  );
}

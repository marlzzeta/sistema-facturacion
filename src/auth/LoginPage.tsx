import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

const shakeStyle = `
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%,60%  { transform: translateX(-6px); }
  40%,80%  { transform: translateX(6px); }
}
.shake { animation: shake 0.4s ease; }
`;

export default function LoginPage() {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capsLock, setCapsLock] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const handleCapsLock = (e: KeyboardEvent) => {
    setCapsLock(e.getModifierState('CapsLock'));
  };

  useEffect(() => {
    window.addEventListener('keydown', handleCapsLock);
    window.addEventListener('keyup', handleCapsLock);
    return () => {
      window.removeEventListener('keydown', handleCapsLock);
      window.removeEventListener('keyup', handleCapsLock);
    };
  }, []);

  const triggerShake = () => {
    const el = errorRef.current;
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth; // reflow to restart animation
    el.classList.add('shake');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Ingrese usuario y contraseña.');
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');
    const result = await auth.login(username, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Error desconocido.');
      triggerShake();
    }
  };

  // Determine warning color for attempt messages
  const isWarning =
    error.includes('restantes: 1') ||
    error.includes('restantes: 2') ||
    error.includes('bloqueada');

  return (
    <>
      <style>{shakeStyle}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Building2 size={32} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Sistema de Facturación
              </h1>
              <p className="text-blue-200 text-sm mt-1">Tecnologías Honduras S.A.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  placeholder="Nombre de usuario"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Contraseña"
                    className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                    title={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {capsLock && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Bloq Mayús activado
                  </p>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div
                  ref={errorRef}
                  className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
                    isWarning
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-5 text-center space-y-1">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              v1.0.0 · Tecnologías Honduras S.A.
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-600">
              Demo: <span className="font-mono">admin</span> /{' '}
              <span className="font-mono">Admin1234!</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useStore, workspaceSnapshot, type WorkspaceState } from '../store';
import type { Usuario, Sesion, Empresa } from '../types';
import { apiUserToLocal, roleIdFor, type ApiUser } from './user-mapper';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const API_BASE = '/api/v1';

interface ApiSessionUser {
  id: string;
  username: string;
  displayName: string;
  companyId: string;
  companyName: string;
  role: 'administrador' | 'facturador' | 'auditor';
  permissions: string[];
}
interface ApiSessionResponse { user: ApiSessionUser; csrfToken?: string | null; }
interface ApiClient { id: string; version: number; nombre: string; rtn: string; dni: string; correo: string; telefono: string; direccion: string; condicionPago: 'contado' | 'credito'; limitCredito: string; exentoImpuesto: boolean; activo: boolean; }
interface ApiCompany extends Omit<Empresa, 'logo'> { logo: string | null; }
interface AuthContextType {
  sesion: Sesion | null;
  usuarioActual: Usuario | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  tiempoRestante: number;
  csrfToken: string | null;
  syncError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toLocalUser(user: ApiSessionUser): Usuario {
  return { id: user.id, empleadoId: '', displayName: user.displayName, username: user.username, rolId: roleIdFor(user.role), activo: true, version: 1 };
}

function toLocalSession(userId: string, expiresAt?: string): Sesion {
  const ahora = new Date().toISOString();
  return { usuarioId: userId, token: 'api-cookie', creadaEn: ahora, expiraEn: expiresAt ?? new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString(), ultimaActividad: ahora };
}

function toLocalClient(client: ApiClient) {
  return { ...client, limitCredito: Number(client.limitCredito) };
}

async function readApiError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: { message?: string } };
    return body.error?.message ?? 'No se pudo completar la operación.';
  } catch { return 'No se pudo completar la operación.'; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useStore();
  const [tiempoRestante, setTiempoRestante] = useState(SESSION_TIMEOUT_MS / 1000);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [workspaceReadyUser, setWorkspaceReadyUser] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const csrfRef = useRef<string | null>(null);
  const workspaceVersionRef = useRef(0);
  const lastWorkspaceRef = useRef('');
  const saveQueueRef = useRef(Promise.resolve());
  const sesion = state.sesion;
  const sessionUserId = sesion?.usuarioId;
  const usuarioActual = sesion ? state.usuarios.find(u => u.id === sesion.usuarioId) ?? state.usuarioActual : null;

  const clearLocalSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTiempoRestante(SESSION_TIMEOUT_MS / 1000);
    dispatch({ type: 'SET_SESION', payload: null });
    dispatch({ type: 'SET_USUARIO', payload: null });
  }, [dispatch]);

  const logout = useCallback(() => {
    const csrfToken = csrfRef.current;
    void fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include', headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined })
      .catch(() => undefined).finally(() => { csrfRef.current = null; setCsrfToken(null); clearLocalSession(); });
  }, [clearLocalSession]);

  useEffect(() => {
    let activo = true;
    void fetch(`${API_BASE}/auth/session`, { credentials: 'include' }).then(async response => {
      if (!activo || !response.ok) return;
      const data = await response.json() as ApiSessionResponse;
      if (!data.user) return;
      csrfRef.current = data.csrfToken ?? null; setCsrfToken(csrfRef.current);
      const user = toLocalUser(data.user);
      dispatch({ type: 'SET_USUARIO', payload: user });
      dispatch({ type: 'SET_SESION', payload: toLocalSession(user.id) });
    }).catch(() => undefined);
    return () => { activo = false; };
  }, [dispatch]);

  useEffect(() => {
    if (!sessionUserId) return;
    let activo = true;
    void Promise.all([
      fetch(API_BASE + '/clients', { credentials: 'include' }),
      fetch(API_BASE + '/company', { credentials: 'include' }),
    ]).then(async ([clientsResponse, companyResponse]) => {
      if (!activo) return;
      if (clientsResponse.ok) {
        const data = await clientsResponse.json() as { data: ApiClient[] };
        dispatch({ type: 'SET_CLIENTES', payload: data.data.map(toLocalClient) });
      }
      if (companyResponse.ok) {
        const data = await companyResponse.json() as { data: ApiCompany };
        dispatch({ type: 'UPDATE_EMPRESA', payload: { ...data.data, logo: data.data.logo ?? undefined } });
      }
    }).catch(() => undefined);
    return () => { activo = false; };
  }, [dispatch, sessionUserId]);

  useEffect(() => {
    const userId = sessionUserId;
    if (!userId) return;
    let active = true;
    void Promise.all([
      fetch(`${API_BASE}/workspace`, { credentials: 'include' }),
      fetch(`${API_BASE}/users`, { credentials: 'include' }),
    ]).then(async ([workspaceResponse, usersResponse]) => {
      if (!active) return;
      if (usersResponse.ok) {
        const users = await usersResponse.json() as { data: ApiUser[] };
        dispatch({ type: 'SET_USUARIOS', payload: users.data.map(apiUserToLocal) });
      }
      if (!workspaceResponse.ok) { setSyncError('No se pudo cargar la configuración guardada.'); return; }
      const workspace = await workspaceResponse.json() as { data: WorkspaceState | null; version: number };
      let data = workspace.data;
      let version = workspace.version;
      if (!data) {
        data = workspaceSnapshot(state);
        const csrf = csrfRef.current;
        const created = await fetch(`${API_BASE}/workspace`, {
          method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
          body: JSON.stringify({ data, version: 0 }),
        });
        if (!created.ok) { setSyncError('No se pudo inicializar la configuración persistente.'); return; }
        version = ((await created.json()) as { version: number }).version;
      } else {
        dispatch({ type: 'SET_WORKSPACE', payload: data });
      }
      workspaceVersionRef.current = version;
      lastWorkspaceRef.current = JSON.stringify(data);
      if (active) { setSyncError(null); setWorkspaceReadyUser(userId); }
    }).catch(() => { if (active) setSyncError('No se pudo conectar con el almacenamiento del sistema.'); });
    return () => { active = false; };
    // Hydrate once per authenticated user; state is intentionally captured as the first-login seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, sessionUserId]);

  const workspace = workspaceSnapshot(state);
  const serializedWorkspace = JSON.stringify(workspace);
  useEffect(() => {
    if (!sessionUserId || workspaceReadyUser !== sessionUserId || serializedWorkspace === lastWorkspaceRef.current) return;
    const data = workspace;
    lastWorkspaceRef.current = serializedWorkspace;
    const timeout = setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        const csrf = csrfRef.current;
        const response = await fetch(`${API_BASE}/workspace`, {
          method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
          body: JSON.stringify({ data, version: workspaceVersionRef.current }),
        });
        if (response.ok) {
          workspaceVersionRef.current = ((await response.json()) as { version: number }).version;
          setSyncError(null);
          return;
        }
        if (response.status === 409) {
          const latest = await fetch(`${API_BASE}/workspace`, { credentials: 'include' });
          if (latest.ok) {
            const body = await latest.json() as { data: WorkspaceState; version: number };
            workspaceVersionRef.current = body.version;
            lastWorkspaceRef.current = JSON.stringify(body.data);
            dispatch({ type: 'SET_WORKSPACE', payload: body.data });
            setSyncError('La información cambió en otra sesión; se cargó la versión más reciente.');
          }
          return;
        }
        setSyncError('No se pudieron guardar los últimos cambios. Actualiza la página antes de continuar.');
      }).catch(() => setSyncError('No se pudieron sincronizar los cambios con el servidor.'));
    }, 250);
    return () => clearTimeout(timeout);
  }, [dispatch, serializedWorkspace, workspace, workspaceReadyUser, sessionUserId]);

  const resetTimer = useCallback(() => {
    if (!sesion) return;
    dispatch({ type: 'SET_SESION', payload: { ...sesion, ultimaActividad: new Date().toISOString(), expiraEn: new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString() } });
    setTiempoRestante(SESSION_TIMEOUT_MS / 1000);
  }, [dispatch, sesion]);

  useEffect(() => {
    if (!sesion) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(event => window.addEventListener(event, resetTimer));
    return () => events.forEach(event => window.removeEventListener(event, resetTimer));
  }, [sesion, resetTimer]);

  useEffect(() => {
    if (!sesion) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(sesion.expiraEn).getTime() - Date.now()) / 1000));
      setTiempoRestante(remaining);
      if (remaining <= 0) logout();
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [logout, sesion]);

  const login = async (username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ company: 'demo', username: username.trim(), password }) });
      if (!response.ok) return { ok: false, error: await readApiError(response) };
      const data = await response.json() as ApiSessionResponse;
      csrfRef.current = data.csrfToken ?? null; setCsrfToken(csrfRef.current);
      const user = toLocalUser(data.user);
      dispatch({ type: 'SET_USUARIO', payload: user });
      dispatch({ type: 'SET_SESION', payload: toLocalSession(user.id) });
      return { ok: true };
    } catch { return { ok: false, error: 'No se pudo conectar con el servidor.' }; }
  };

  return <AuthContext.Provider value={{ sesion, usuarioActual, login, logout, tiempoRestante, csrfToken, syncError }}>{children}</AuthContext.Provider>;
}

// This hook intentionally shares the provider module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

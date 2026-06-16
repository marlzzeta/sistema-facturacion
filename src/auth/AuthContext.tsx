import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import bcryptjs from 'bcryptjs';
import { useStore } from '../store';
import type { Usuario, Sesion } from '../types';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_INTENTOS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface AuthContextType {
  sesion: Sesion | null;
  usuarioActual: Usuario | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  tiempoRestante: number; // seconds until session expires
}

const AuthContext = createContext<AuthContextType | null>(null);

function generarToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useStore();
  const [tiempoRestante, setTiempoRestante] = useState(SESSION_TIMEOUT_MS / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actividadRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sesion = state.sesion;
  const usuarioActual = sesion
    ? state.usuarios.find(u => u.id === sesion.usuarioId) ?? null
    : null;

  const logout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (actividadRef.current) clearTimeout(actividadRef.current);
    dispatch({ type: 'SET_SESION', payload: null });
    dispatch({ type: 'SET_USUARIO', payload: null });
  };

  // Reset inactivity timer on user activity
  const resetTimer = () => {
    if (!sesion) return;
    const nuevaExpiracion = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
    dispatch({
      type: 'SET_SESION',
      payload: { ...sesion, ultimaActividad: new Date().toISOString(), expiraEn: nuevaExpiracion },
    });
    setTiempoRestante(SESSION_TIMEOUT_MS / 1000);
  };

  useEffect(() => {
    if (!sesion) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => events.forEach(e => window.removeEventListener(e, resetTimer));
  }, [sesion]);

  // Countdown timer
  useEffect(() => {
    if (!sesion) {
      setTiempoRestante(SESSION_TIMEOUT_MS / 1000);
      return;
    }
    timerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(sesion.expiraEn).getTime() - Date.now()) / 1000),
      );
      setTiempoRestante(remaining);
      if (remaining <= 0) logout();
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sesion]);

  const login = async (
    username: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    const usuario = state.usuarios.find(
      u => u.username === username.trim() && u.activo,
    );
    if (!usuario) return { ok: false, error: 'Usuario o contraseña incorrectos.' };

    // Check lockout
    if (usuario.bloqueadoHasta && new Date(usuario.bloqueadoHasta) > new Date()) {
      const min = Math.ceil(
        (new Date(usuario.bloqueadoHasta).getTime() - Date.now()) / 60000,
      );
      return { ok: false, error: `Cuenta bloqueada. Intente en ${min} minuto(s).` };
    }

    const passwordOk = await bcryptjs.compare(password, usuario.passwordHash ?? '');
    if (!passwordOk) {
      const intentos = (usuario.intentosFallidos ?? 0) + 1;
      const bloqueado =
        intentos >= MAX_INTENTOS
          ? new Date(Date.now() + LOCKOUT_MS).toISOString()
          : undefined;
      dispatch({
        type: 'UPDATE_USUARIO',
        payload: { ...usuario, intentosFallidos: intentos, bloqueadoHasta: bloqueado },
      });
      if (bloqueado)
        return { ok: false, error: 'Demasiados intentos. Cuenta bloqueada por 15 minutos.' };
      return {
        ok: false,
        error: `Contraseña incorrecta. Intentos restantes: ${MAX_INTENTOS - intentos}.`,
      };
    }

    // Success - reset failed attempts
    const ahora = new Date().toISOString();
    dispatch({
      type: 'UPDATE_USUARIO',
      payload: { ...usuario, intentosFallidos: 0, bloqueadoHasta: undefined, ultimoAcceso: ahora },
    });
    dispatch({ type: 'SET_USUARIO', payload: usuario });

    const sesionNueva: Sesion = {
      usuarioId: usuario.id,
      token: generarToken(),
      creadaEn: ahora,
      expiraEn: new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString(),
      ultimaActividad: ahora,
    };
    dispatch({ type: 'SET_SESION', payload: sesionNueva });
    return { ok: true };
  };

  return (
    <AuthContext.Provider value={{ sesion, usuarioActual, login, logout, tiempoRestante }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

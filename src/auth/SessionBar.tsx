import { Clock } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function SessionBar() {
  const { tiempoRestante, resetTimer } = useAuthWithReset();

  const minutes = Math.floor(tiempoRestante / 60);
  const seconds = tiempoRestante % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const colorClass =
    tiempoRestante > 600
      ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
      : tiempoRestante > 300
      ? 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
      : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';

  const pulse = tiempoRestante <= 300 ? 'animate-pulse' : '';

  return (
    <button
      onClick={resetTimer}
      title="Click para renovar sesión"
      className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-colors ${colorClass} ${pulse}`}
    >
      <Clock size={13} />
      <span>{formatted}</span>
    </button>
  );
}

// Small hook to expose resetTimer without breaking AuthContext shape
function useAuthWithReset() {
  const auth = useAuth();
  // Derive a resetTimer from the login mechanism — we trigger activity by calling
  // a no-op that the activity listeners will pick up. We expose it via a manual
  // dispatch workaround using a synthetic event.
  const resetTimer = () => {
    window.dispatchEvent(new MouseEvent('mousedown'));
  };
  return { tiempoRestante: auth.tiempoRestante, resetTimer };
}

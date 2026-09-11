import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { API_BASE_URL, apiClient } from '@/api/client';

type HealthState = 'checking' | 'operational' | 'unavailable';

interface HealthResponse {
  status: string;
  service?: string;
}

export function ApiHealthCard() {
  const [state, setState] = useState<HealthState>('checking');
  const [message, setMessage] = useState('Checking Supabase services...');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setState('checking');
    setMessage('Checking Supabase services...');
    try {
      const health = await apiClient.get<HealthResponse>('/api/health');
      setState('operational');
      setMessage(health.status === 'ok' ? 'Supabase database and storage configured' : 'Supabase configuration incomplete');
    } catch (error) {
      setState('unavailable');
      setMessage(error instanceof Error ? error.message : 'Supabase API unavailable');
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    void checkHealth();
  }, []);

  const isOperational = state === 'operational';
  const isChecking = state === 'checking';

  return (
    <section
      aria-live="polite"
      className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm md:mx-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isOperational ? 'bg-emerald-500/10 text-emerald-400' : state === 'unavailable' ? 'bg-red-500/10 text-red-400' : 'bg-[var(--soft-blue)]/20 text-[var(--primary-blue)]'}`}
        >
          {isOperational ? <CheckCircle2 className="size-4" /> : state === 'unavailable' ? <XCircle className="size-4" /> : <Activity className="size-4 animate-pulse" />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--foreground)]">Supabase backend</p>
          <p className={`truncate text-xs ${state === 'unavailable' ? 'text-red-400' : 'text-[var(--muted-foreground)]'}`}>{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-[10px] text-[var(--muted-foreground)] lg:inline">{API_BASE_URL}</span>
        {lastChecked && <span className="hidden text-[10px] text-[var(--muted-foreground)] sm:inline">Checked {lastChecked.toLocaleTimeString()}</span>}
          <button
          type="button"
          onClick={() => void checkHealth()}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </div>
    </section>
  );
}
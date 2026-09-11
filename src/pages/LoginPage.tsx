import { useState } from 'react';
import { Shield, Chrome, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const { signInWithGoogle, signInWithPassword, resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start Google sign-in.');
      setBusy(false);
    }
  };

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithPassword(email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send password reset email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05080C] text-slate-100 flex items-center justify-center px-6">
      <section className="w-full max-w-md border border-slate-800 bg-[#0a1018] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="size-10 bg-[var(--secondary-blue)] flex items-center justify-center">
            <Shield className="size-5 text-white" />
          </div>
          <div>
            <p className="font-bold tracking-[0.24em]">NISQ VANGUARD</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Net State Loom · security intelligence
            </p>
          </div>
        </div>
        <p className="text-xs text-[var(--primary-blue)] uppercase tracking-widest mb-3">Secure access</p>
        <h1 className="text-2xl font-semibold mb-2">Sign in to FORTEXA</h1>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-8">
          Use your organization-managed Google account to access network data, forecasts and
          reports.
        </p>
        <form onSubmit={handlePasswordLogin} className="space-y-3">
          <label className="block text-xs font-medium text-slate-300">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required className="mt-1.5 h-10 w-full border border-slate-700 bg-[#05080C] px-3 text-sm outline-none focus:border-cyan-500" />
          </label>
          <label className="block text-xs font-medium text-slate-300">
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="mt-1.5 h-10 w-full border border-slate-700 bg-[#05080C] px-3 text-sm outline-none focus:border-cyan-500" />
          </label>
          <button type="submit" disabled={busy} className="w-full h-11 flex items-center justify-center bg-[#0b84b8] hover:bg-[#0996cf] disabled:opacity-60 text-white text-sm font-medium transition-colors">
            {busy ? 'Signing in...' : 'Sign in securely'}
          </button>
        </form>
        <div className="mt-3 flex justify-between text-[11px]">
          <button type="button" onClick={() => void handleReset()} disabled={busy} className="text-cyan-400 hover:text-cyan-300">Forgot password?</button>
          {resetSent && <span className="text-emerald-400">Reset email sent.</span>}
        </div>
        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-600"><span className="h-px flex-1 bg-slate-800" />or<span className="h-px flex-1 bg-slate-800" /></div>
        <button
          type="button"
          onClick={handleLogin}
          disabled={busy}
          className="w-full h-11 flex items-center justify-center gap-3 border border-slate-700 hover:border-cyan-500 disabled:opacity-60 text-slate-200 text-sm font-medium transition-colors"
        >
          <Chrome className="size-4" /> {busy ? 'Redirecting...' : 'Continue with Google'}
        </button>
        {error && (
          <p role="alert" className="mt-4 text-xs text-red-400">
            {error}
          </p>
        )}
        <div className="mt-8 pt-5 border-t border-slate-800 flex gap-2 text-[11px] text-slate-500">
          <LockKeyhole className="size-3.5 shrink-0" />
          Sessions are managed by Supabase Authentication.
        </div>
      </section>
    </main>
  );
}

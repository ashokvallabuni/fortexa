'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Chrome, LockKeyhole, Shield } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">Loading secure sign-in...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('error'));
  const [busy, setBusy] = useState(false);

  async function checkAccess(email: string) {
    const supabase = createClient();
    const { data: req } = await supabase
      .from('access_requests')
      .select('status')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!req) {
      router.push('/request-access');
      return false;
    }
    if (req.status === 'PENDING') {
      router.push('/pending');
      return false;
    }
    if (req.status === 'REJECTED') {
      router.push('/rejected');
      return false;
    }
    return true;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    if (data.user?.email) {
      const hasAccess = await checkAccess(data.user.email);
      if (hasAccess) {
        window.location.assign('/workspace');
      }
    } else {
      window.location.assign('/workspace');
    }
  }

  async function google() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="mb-10 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center bg-[var(--red)] text-black">
            <Shield className="size-5" />
          </span>
          <div>
            <p className="font-semibold tracking-[.2em]">FORTEXA</p>
            <p className="text-xs text-[var(--muted)]">Secure security operations access</p>
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Use your organization account to continue.</p>
        
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm">
            Email
            <input 
              className="mt-2 h-11 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]" 
              type="email" 
              required 
              value={email} 
              onChange={(event) => setEmail(event.target.value)} 
            />
          </label>
          <label className="block text-sm">
            Password
            <input 
              className="mt-2 h-11 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]" 
              type="password" 
              required 
              value={password} 
              onChange={(event) => setPassword(event.target.value)} 
            />
          </label>
          <button disabled={busy} className="h-11 w-full bg-[var(--red)] text-sm font-semibold text-black disabled:opacity-50">
            {busy ? 'Signing in...' : 'Sign in securely'}
          </button>
        </form>
        
        <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />or<span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        
        <button disabled={busy} onClick={google} className="flex h-11 w-full items-center justify-center gap-2 border border-[var(--border)] text-sm hover:border-[var(--red)]">
          <Chrome className="size-4" /> Continue with Google
        </button>
        
        {error && <p role="alert" className="mt-4 text-sm text-[var(--red)]">Authentication failed: {error}</p>}
        
        <p className="mt-7 flex gap-2 border-t border-[var(--border)] pt-5 text-xs text-[var(--muted)]">
          <LockKeyhole className="size-4 shrink-0" />Sessions are managed by Supabase Auth.
        </p>
      </section>
    </main>
  );
}
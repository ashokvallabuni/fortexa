'use client';

import { FormEvent, useEffect, useState, Suspense } from 'react';
import { Shield, LockKeyhole, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">Loading password reset...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validToken, setValidToken] = useState(true);

  useEffect(() => {
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    
    if (!code || type !== 'recovery') {
      setValidToken(false);
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, [searchParams]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    if (!validToken) return;
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one special character');
      return;
    }

    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    router.push('/login?reset=success');
  }

  if (!validToken) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <div className="mx-auto mb-6 flex size-12 items-center justify-center bg-[var(--red)] text-black">
            <LockKeyhole className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Invalid Reset Link</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            This password reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password" className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--red)] hover:underline">
            Request new link <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>
    );
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
            <p className="text-xs text-[var(--muted)]">Secure password reset</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">Reset Password</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Enter your new password below. It must be at least 12 characters with uppercase, lowercase, number, and special character.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm">
            New Password
            <div className="relative mt-2">
              <input 
                className="h-11 w-full border border-[var(--border)] bg-black/20 px-3 pr-11 outline-none focus:border-[var(--red)]" 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={password} 
                onChange={(event) => setPassword(event.target.value)} 
                autoComplete="new-password"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>
          <label className="block text-sm">
            Confirm Password
            <input 
              className="mt-2 h-11 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]" 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={(event) => setConfirmPassword(event.target.value)} 
              autoComplete="new-password"
              placeholder="Confirm new password"
            />
          </label>
          <button disabled={busy} className="h-11 w-full bg-[var(--red)] text-sm font-semibold text-black disabled:opacity-50">
            {busy ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 text-sm text-[var(--red)]">{error}</p>}

        <p className="mt-7 flex gap-2 border-t border-[var(--border)] pt-5 text-xs text-[var(--muted)]">
          <Link href="/login" className="hover:text-white"><LockKeyhole className="size-4 shrink-0" /> Back to login</Link>
        </p>
      </section>
    </main>
  );
}
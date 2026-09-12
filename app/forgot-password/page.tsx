'use client';

import { FormEvent, useState, Suspense } from 'react';
import { Shield, LockKeyhole, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">Loading password reset...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    setSuccess(true);
    setBusy(false);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <div className="mx-auto mb-6 flex size-12 items-center justify-center bg-[var(--red)] text-black">
            <Mail className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Reset Link Sent</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            If an account exists for that email, you will receive a password reset link shortly.
          </p>
          <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--red)] hover:underline">
            Return to login <ArrowRight className="size-4" />
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

        <h1 className="text-2xl font-semibold">Forgot Password</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm">
            Email
            <input 
              className="mt-2 h-11 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]" 
              type="email" 
              required 
              value={email} 
              onChange={(event) => setEmail(event.target.value)} 
              autoComplete="email"
            />
          </label>
          <button disabled={busy} className="h-11 w-full bg-[var(--red)] text-sm font-semibold text-black disabled:opacity-50">
            {busy ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 text-sm text-[var(--red)]">Failed to send reset link: {error}</p>}

        <p className="mt-7 flex gap-2 border-t border-[var(--border)] pt-5 text-xs text-[var(--muted)]">
          <Link href="/login" className="hover:text-white"><LockKeyhole className="size-4 shrink-0" /> Back to login</Link>
        </p>
      </section>
    </main>
  );
}
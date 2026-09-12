import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function WorkspacePage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  return <main className="min-h-screen p-6"><div className="mx-auto max-w-6xl"><p className="text-xs uppercase tracking-[.2em] text-[var(--red)]">Authenticated workspace</p><h1 className="mt-3 text-3xl font-semibold">Welcome back</h1><p className="mt-2 text-[var(--muted)]">{user.email}</p><div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-6"><h2 className="font-medium">Workspace resolution</h2><p className="mt-2 text-sm text-[var(--muted)]">Your organization membership and role are resolved from Supabase. No frontend-selected role is trusted.</p></div></div></main>;
}
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isPrimarySuperAdmin, normalizeEmail } from '@/utils/auth';
import { ensurePrimarySuperAdmin } from '@/utils/supabase/primary-super-admin';

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const email = normalizeEmail(user.email);

  if (isPrimarySuperAdmin(email)) {
    const result = await ensurePrimarySuperAdmin(user);
    if (!result.ok) {
      console.warn('Primary Super Admin provisioning failed (non-blocking):', result.error);
    }
    redirect('/admin/access-requests');
  }

  if (!email) {
    redirect('/login?error=missing_identity');
  }

  const { data: req, error: reqError } = await supabase
    .from('access_requests')
    .select('status')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reqError) {
    console.error('Access request check failed:', reqError.message);
    redirect('/login?error=access_check_failed');
  }

  if (!req) {
    redirect('/request-access');
  }
  if (req.status === 'PENDING') {
    redirect('/pending');
  }
  if (req.status === 'REJECTED') {
    redirect('/rejected');
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[.2em] text-[var(--red)]">Authenticated workspace</p>
        <h1 className="mt-3 text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-[var(--muted)]">{user.email}</p>
        <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-medium">Workspace resolution</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Your organization membership and role are resolved from Supabase. No frontend-selected role is trusted.</p>
        </div>
      </div>
    </main>
  );
}

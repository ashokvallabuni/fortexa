import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import { isPrimarySuperAdmin, normalizeEmail } from '@/utils/auth';

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = normalizeEmail(user?.email ?? null);

  if (user && isPrimarySuperAdmin(email)) {
    redirect('/admin/access-requests');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div className="mx-auto mb-6 flex size-12 items-center justify-center bg-[var(--red)] text-black">
          <Clock className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Access Pending</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          Your access request is currently pending review by a Super Admin. You will be notified once it has been processed.
        </p>
        <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--red)] hover:underline">
          Return to login
        </Link>
      </section>
    </main>
  );
}


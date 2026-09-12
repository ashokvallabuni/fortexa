import { Shield, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function RejectedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div className="mx-auto mb-6 flex size-12 items-center justify-center bg-[var(--red)] text-black">
          <XCircle className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Access Rejected</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          Your access request was reviewed and rejected. If you believe this was an error, please contact your administrator.
        </p>
        <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--red)] hover:underline">
          Return to login
        </Link>
      </section>
    </main>
  );
}

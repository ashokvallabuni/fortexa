'use client';

import { FormEvent, useState, useEffect } from 'react';
import { Shield, ArrowRight, Building } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { PRIMARY_SUPER_ADMIN_EMAIL } from '@/utils/auth';

type Organization = { id: string; name: string };

export default function RequestAccessPage() {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    organization_id: '',
    requested_role: 'SOC_ANALYST',
    reason: ''
  });

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('organizations').select('id, name');
        if (!error && data) {
          setOrganizations(data);
        }
      } catch (err) {
        console.error('Failed to load organizations:', err);
      } finally {
        setOrgLoading(false);
      }
    }
    loadOrganizations();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: dbError } = await supabase.from('access_requests').insert([
      {
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        organization_id: formData.organization_id || null,
        requested_role: formData.requested_role,
        reason: formData.reason,
        reviewer_email: PRIMARY_SUPER_ADMIN_EMAIL,
      }
    ]);

    if (dbError) {
      setError(dbError.message);
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
            <Shield className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Request Received</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Your access request has been submitted to the administration team. You will be notified once it is reviewed.
          </p>
          <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--red)] hover:underline">
            Return to login <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="mb-10 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center bg-[var(--red)] text-black">
            <Shield className="size-5" />
          </span>
          <div>
            <p className="font-semibold tracking-[.2em]">FORTEXA</p>
            <p className="text-xs text-[var(--muted)]">Zero Trust Access Provisioning</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">Request Access</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Submit your details to request access to the platform. All requests are manually reviewed.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm">
            Full Name
            <input 
              className="mt-2 h-11 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]" 
              type="text" 
              required 
              value={formData.full_name} 
              onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
            />
          </label>
          <label className="block text-sm">
            Username
            <input 
              className="mt-2 h-11 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]" 
              type="text" 
              required 
              value={formData.username} 
              onChange={e => setFormData({ ...formData, username: e.target.value })} 
              placeholder="Preferred username"
            />
          </label>
          <label className="block text-sm">
            Business Email
            <input 
              className="mt-2 h-11 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]" 
              type="email" 
              required 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
            />
          </label>
          <label className="block text-sm">
            Organization
            <select 
              className="mt-2 h-11 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]"
              value={formData.organization_id}
              onChange={e => setFormData({ ...formData, organization_id: e.target.value })}
              disabled={orgLoading}
            >
              <option value="" disabled>Select an organization...</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
              {orgLoading && <option value="" disabled>Loading...</option>}
            </select>
          </label>
          <label className="block text-sm">
            Requested Role
            <select 
              className="mt-2 h-11 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]"
              value={formData.requested_role}
              onChange={e => setFormData({ ...formData, requested_role: e.target.value })}
            >
              <option value="SOC_ANALYST">SOC / Security Analyst</option>
              <option value="NETWORK_SECURITY_ADMIN">Network Administrator</option>
              <option value="RESEARCHER">Security Researcher</option>
            </select>
          </label>
          <label className="block text-sm">
            Reason for Access
            <textarea 
              className="mt-2 w-full resize-none border border-[var(--border)] bg-black/20 p-3 outline-none focus:border-[var(--red)]" 
              rows={3}
              required 
              value={formData.reason} 
              onChange={e => setFormData({ ...formData, reason: e.target.value })} 
            />
          </label>
          
          <button disabled={busy} className="mt-2 h-11 w-full bg-[var(--red)] text-sm font-semibold text-black disabled:opacity-50">
            {busy ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 text-sm text-[var(--red)]">Submission failed: {error}</p>}
        
        <p className="mt-7 flex gap-2 border-t border-[var(--border)] pt-5 text-xs text-[var(--muted)]">
          <Link href="/login" className="hover:text-white">Already have access? Sign in</Link>
        </p>
      </section>
    </main>
  );
}

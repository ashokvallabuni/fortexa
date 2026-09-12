'use client';

import { useEffect, useState } from 'react';
import { Shield, Check, X, Building, UserPlus, AlertCircle } from 'lucide-react';
import { SuperAdminGate } from '@/components/auth/super-admin-guard';

type AccessRequest = {
  id: string;
  full_name: string;
  email: string;
  reason: string;
  requested_role: string;
  created_at: string;
};

type Organization = { id: string; name: string };

export default function AccessRequestsDashboard() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selections, setSelections] = useState<Record<string, { orgId: string; role: string }>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/access-requests', { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to load access requests');

      const loadedRequests: AccessRequest[] = payload.requests ?? [];
      const loadedOrgs: Organization[] = payload.organizations ?? [];

      setRequests(loadedRequests);
      setOrganizations(loadedOrgs);

      const initialSelections: Record<string, { orgId: string; role: string }> = {};
      loadedRequests.forEach((req) => {
        initialSelections[req.id] = {
          orgId: loadedOrgs[0]?.id || '',
          role: req.requested_role || 'analyst',
        };
      });
      setSelections(initialSelections);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load access requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: string) {
    const selection = selections[id];
    if (!selection?.orgId || !selection.role) {
      alert('Please select an organization and role.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/access-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: selection.orgId, role: selection.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    }
  }

  async function handleReject(id: string) {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/admin/access-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
    }
  }

  if (loading) return <div className="p-8 text-[var(--muted)]">Loading access requests...</div>;

  return (
    <SuperAdminGate>
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center gap-3 border-b border-[var(--border)] pb-6">
            <Shield className="size-8 text-[var(--red)]" />
            <div>
              <h1 className="text-2xl font-semibold">Access Requests</h1>
              <p className="text-sm text-[var(--muted)]">Super Admin provisioning & zero-trust approvals</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 border border-[var(--red)] bg-[var(--red)]/10 p-4 text-[var(--red)]">
              <AlertCircle className="size-5" />
              <p>{error}</p>
            </div>
          )}

          {requests.length === 0 ? (
            <div className="border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
              <UserPlus className="mx-auto mb-4 size-10 text-[var(--muted)]" />
              <h2 className="text-lg font-medium">No pending requests</h2>
              <p className="text-sm text-[var(--muted)]">All access requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="grid items-start gap-6 border border-[var(--border)] bg-[var(--surface)] p-6 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <h3 className="font-medium">{req.full_name}</h3>
                    <p className="text-sm text-[var(--muted)]">{req.email}</p>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wider text-[var(--red)]">Reason:</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{req.reason}</p>
                    <p className="mt-4 text-xs text-[var(--muted)]">Requested: {new Date(req.created_at).toLocaleString()}</p>
                  </div>

                  <div className="space-y-4 md:col-span-5">
                    <label className="block text-sm">
                      <span className="flex items-center gap-2 text-[var(--muted)]"><Building className="size-4" /> Assign Organization</span>
                      <select
                        className="mt-2 h-10 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]"
                        value={selections[req.id]?.orgId || ''}
                        onChange={(e) => setSelections({ ...selections, [req.id]: { ...selections[req.id], orgId: e.target.value } })}
                      >
                        <option value="" disabled>Select an organization...</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm">
                      <span className="flex items-center gap-2 text-[var(--muted)]"><Shield className="size-4" /> Assign Role</span>
                      <select
                        className="mt-2 h-10 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)]"
                        value={selections[req.id]?.role || ''}
                        onChange={(e) => setSelections({ ...selections, [req.id]: { ...selections[req.id], role: e.target.value } })}
                      >
                        <option value="analyst">SOC / Security Analyst</option>
                        <option value="admin">Network Administrator</option>
                        <option value="researcher">Security Researcher</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 md:col-span-3">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="flex h-10 items-center justify-center gap-2 bg-[var(--red)] text-sm font-semibold text-black hover:brightness-110"
                    >
                      <Check className="size-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="flex h-10 items-center justify-center gap-2 border border-[var(--border)] text-sm text-[var(--muted)] hover:border-[var(--red)] hover:text-[var(--red)]"
                    >
                      <X className="size-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </SuperAdminGate>
  );
}

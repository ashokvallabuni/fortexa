'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AdminUsersDashboard() {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        
        // Load stats from access requests
        const { data: reqData } = await supabase.from('access_requests').select('status');
        if (reqData) {
          setStats({
            pending: reqData.filter(r => r.status === 'PENDING').length,
            approved: reqData.filter(r => r.status === 'APPROVED').length,
            rejected: reqData.filter(r => r.status === 'REJECTED').length,
          });
        }

        // Load users from profiles and memberships
        const { data: userData } = await supabase
          .from('profiles')
          .select(`
            id, email, display_name, created_at,
            user_roles ( role ),
            organization_memberships ( role, organizations ( name ) )
          `);
          
        if (userData) {
          setUsers(userData);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-[var(--muted)]">Loading user management...</div>;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between border-b border-[var(--border)] pb-6">
          <div className="flex items-center gap-3">
            <Users className="size-8 text-[var(--red)]" />
            <div>
              <h1 className="text-2xl font-semibold">User Management</h1>
              <p className="text-sm text-[var(--muted)]">Manage platform identities and roles</p>
            </div>
          </div>
        </div>

        {/* Dynamic Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center gap-3 text-[var(--muted)]">
              <Clock className="size-5 text-[var(--red)]" />
              <h3 className="font-medium">Pending Requests</h3>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{stats.pending}</p>
          </div>
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center gap-3 text-[var(--muted)]">
              <CheckCircle className="size-5 text-[var(--red)]" />
              <h3 className="font-medium">Approved Requests</h3>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{stats.approved}</p>
          </div>
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center gap-3 text-[var(--muted)]">
              <XCircle className="size-5 text-[var(--red)]" />
              <h3 className="font-medium">Rejected Requests</h3>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{stats.rejected}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h2 className="font-medium">Active Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-[var(--muted)]">
                <tr>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Organization</th>
                  <th className="px-6 py-3 font-medium">Roles</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {users.map(user => (
                  <tr key={user.id} className="transition-colors hover:bg-black/10">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.display_name}</div>
                      <div className="text-[var(--muted)]">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {user.organization_memberships?.map((m: any, i: number) => (
                        <div key={i}>{m.organizations?.name}</div>
                      ))}
                      {(!user.organization_memberships || user.organization_memberships.length === 0) && (
                        <span className="text-[var(--muted)]">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.user_roles?.map((r: any, i: number) => (
                          <span key={i} className="inline-flex rounded border border-[var(--red)]/30 bg-[var(--red)]/10 px-2 py-1 text-xs text-[var(--red)]">
                            {r.role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[var(--muted)] hover:text-[var(--red)] hover:underline">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

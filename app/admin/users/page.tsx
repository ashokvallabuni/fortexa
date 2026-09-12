'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  UserCog,
  Building2,
  UserX,
  UserCheck,
  Eye,
  MoreVertical,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { SuperAdminGate } from '@/components/auth/super-admin-guard';

type User = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  status: 'PENDING' | 'ACTIVE' | 'DISABLED' | 'REJECTED';
  last_login_at: string | null;
  user_roles: { role: string }[];
  organization_memberships: { role: string; organizations: { name: string; id: string }[] | null }[];
};

type Organization = { id: string; name: string };

const ROLE_OPTIONS = [
  { value: 'SOC_ANALYST', label: 'SOC / Security Analyst' },
  { value: 'NETWORK_SECURITY_ADMIN', label: 'Network Administrator' },
  { value: 'RESEARCHER', label: 'Security Researcher' },
  { value: 'viewer', label: 'Viewer' },
] as const;

export default function AdminUsersDashboard() {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [editOrgId, setEditOrgId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const { data: reqData } = await supabase.from('access_requests').select('status');
      if (reqData) {
        setStats({
          pending: reqData.filter(r => r.status === 'PENDING').length,
          approved: reqData.filter(r => r.status === 'APPROVED').length,
          rejected: reqData.filter(r => r.status === 'REJECTED').length,
        });
      }

      const { data: userData } = await supabase
        .from('profiles')
        .select(`
          id, email, display_name, created_at, status, last_login_at,
          user_roles ( role ),
          organization_memberships ( role, organizations ( name, id ) )
        `);

      if (userData) {
        setUsers(userData as User[]);
      }

      const { data: orgData } = await supabase.from('organizations').select('id, name');
      if (orgData) {
        setOrganizations(orgData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change role');
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setActionLoading(null);
      setEditingUserId(null);
    }
  }

  async function handleOrgChange(userId: string, newOrgId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/organization`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: newOrgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change organization');
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to change organization');
    } finally {
      setActionLoading(null);
      setEditingUserId(null);
    }
  }

  async function handleDisable(userId: string) {
    if (!confirm('Disable this user? They will lose access to the platform.')) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/disable`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disable user');
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to disable user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEnable(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/enable`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enable user');
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to enable user');
    } finally {
      setActionLoading(null);
    }
  }

  function startEditRole(user: User) {
    const currentRole = user.user_roles?.[0]?.role || '';
    setEditRole(currentRole);
    setEditingUserId(user.id);
  }

  function startEditOrg(user: User) {
    const membership = user.organization_memberships?.[0];
    const orgs = membership?.organizations as { id: string; name: string }[] | { id: string; name: string } | null | undefined;
    let currentOrgId = '';
    if (Array.isArray(orgs) && orgs.length > 0) {
      currentOrgId = orgs[0].id;
    } else if (orgs && !Array.isArray(orgs)) {
      currentOrgId = orgs.id;
    }
    setEditOrgId(currentOrgId);
    setEditingUserId(user.id);
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      PENDING: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="size-3" /> },
      ACTIVE: { label: 'Active', className: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <CheckCircle className="size-3" /> },
      DISABLED: { label: 'Disabled', className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="size-3" /> },
      REJECTED: { label: 'Rejected', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <AlertTriangle className="size-3" /> },
    };
    return badges[status] || badges.PENDING;
  }

  if (loading) return <div className="p-8 text-[var(--muted)]">Loading user management...</div>;

  return (
    <SuperAdminGate>
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between border-b border-[var(--border)] pb-6">
            <div className="flex items-center gap-3">
              <Users className="size-8 text-[var(--red)]" />
              <div>
                <h1 className="text-2xl font-semibold">User Management</h1>
                <p className="text-sm text-[var(--muted)]">Manage platform identities, roles, and access</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 border border-[var(--red)] bg-[var(--red)]/10 p-4 text-[var(--red)]">
              <AlertTriangle className="size-5" />
              <p>{error}</p>
            </div>
          )}

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

          <div className="border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-6 py-4">
              <h2 className="font-medium">Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-[var(--muted)]">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Organization</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Last Login</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {users.map(user => {
                    const statusBadge = getStatusBadge(user.status);
                    const currentRole = user.user_roles?.[0]?.role || '';
                    const membership = user.organization_memberships?.[0];
                    const orgs = membership?.organizations as { id: string; name: string }[] | { id: string; name: string } | null | undefined;
                    const currentOrg = orgs;
                    const currentOrgId = Array.isArray(orgs) ? orgs[0]?.id : orgs?.id || '';
                    const isEditing = editingUserId === user.id;

                    return (
                      <tr key={user.id} className="transition-colors hover:bg-black/10">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{user.display_name || 'Unknown'}</div>
                          <div className="text-[var(--muted)]">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing && editRole === '' ? (
                            <select
                              className="h-9 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)] text-sm"
                              value={editOrgId}
                              onChange={e => setEditOrgId(e.target.value)}
                              onBlur={() => handleOrgChange(user.id, editOrgId)}
                            >
                              <option value="" disabled>Select organization...</option>
                              {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                              ))}
                            </select>
                          ) : (
                            <>
                              {currentOrg ? (
                                <div className="font-medium">{Array.isArray(currentOrg) ? currentOrg[0]?.name : currentOrg.name}</div>
                              ) : (
                                <span className="text-[var(--muted)]">None</span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing && editOrgId === '' ? (
                            <select
                              className="h-9 w-full border border-[var(--border)] bg-black/20 px-3 outline-none focus:border-[var(--red)] text-sm"
                              value={editRole}
                              onChange={e => setEditRole(e.target.value)}
                              onBlur={() => handleRoleChange(user.id, editRole)}
                            >
                              {ROLE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {user.user_roles?.map((r: any, i: number) => (
                                <span key={i} className="inline-flex rounded border border-[var(--red)]/30 bg-[var(--red)]/10 px-2 py-1 text-xs text-[var(--red)]">
                                  {r.role}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                            {statusBadge.icon} {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[var(--muted)]">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.status === 'DISABLED' ? (
                              <button
                                disabled={actionLoading === user.id}
                                onClick={() => handleEnable(user.id)}
                                className="flex h-9 items-center justify-center gap-2 bg-green-500/20 text-green-400 px-3 text-sm font-medium rounded border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />} Enable
                              </button>
                            ) : user.status === 'ACTIVE' ? (
                              <button
                                disabled={actionLoading === user.id}
                                onClick={() => handleDisable(user.id)}
                                className="flex h-9 items-center justify-center gap-2 bg-red-500/20 text-red-400 px-3 text-sm font-medium rounded border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4" />} Disable
                              </button>
                            ) : (
                              <span className="text-xs text-[var(--muted)]">No actions</span>
                            )}
                            <div className="relative">
                              <button
                                className="h-9 w-9 rounded border border-[var(--border)] text-[var(--muted)] hover:bg-black/20 hover:text-white"
                                onClick={() => isEditing ? setEditingUserId(null) : startEditRole(user)}
                              >
                                {isEditing && editRole === '' ? <UserCheck className="size-4" /> : <UserCog className="size-4" />}
                              </button>
                              <button
                                className="h-9 w-9 rounded border border-[var(--border)] text-[var(--muted)] hover:bg-black/20 hover:text-white"
                                onClick={() => isEditing && editRole === '' ? setEditingUserId(null) : startEditOrg(user)}
                              >
                                {isEditing && editOrgId === '' ? <UserCheck className="size-4" /> : <Building2 className="size-4" />}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </SuperAdminGate>
  );
}
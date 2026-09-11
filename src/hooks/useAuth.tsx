import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'SUPER_ADMIN' | 'SECURITY_MANAGER' | 'SOC_ANALYST' | 'NETWORK_SECURITY_ADMIN' | 'RESEARCHER' | 'admin' | 'analyst' | 'researcher' | 'viewer';
export type WorkspaceKey = 'admin' | 'security' | 'soc' | 'network' | 'research';

export interface WorkspaceIdentity {
  profile: { displayName: string | null; email: string | null } | null;
  organization: { id: string; name: string; slug: string } | null;
  role: AppRole | null;
  permissions: string[];
  workspace: WorkspaceKey | null;
  error: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  identity: WorkspaceIdentity;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function workspaceForRole(role: AppRole | null): WorkspaceKey | null {
  if (role === 'SUPER_ADMIN' || role === 'admin') return 'admin';
  if (role === 'SECURITY_MANAGER' || role === 'viewer') return 'security';
  if (role === 'SOC_ANALYST' || role === 'analyst') return 'soc';
  if (role === 'NETWORK_SECURITY_ADMIN') return 'network';
  if (role === 'RESEARCHER' || role === 'researcher') return 'research';
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<WorkspaceIdentity>({ profile: null, organization: null, role: null, permissions: [], workspace: null, error: null });

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (!nextSession) {
        setRole(null);
        setIdentity({ profile: null, organization: null, role: null, permissions: [], workspace: null, error: null });
      }
      if (nextSession?.user) {
        window.setTimeout(() => {
          void supabase.from('profiles').upsert({
            id: nextSession.user.id,
            email: nextSession.user.email ?? null,
            display_name: nextSession.user.user_metadata?.full_name ?? nextSession.user.email ?? null,
          });
        }, 0);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user.id) return;
    let cancelled = false;
    setIdentity((current) => ({ ...current, error: null }));
    void (async () => {
      const userId = session.user.id;
      const [{ data: profile, error: profileError }, { data: memberships, error: membershipError }, { data: legacyRole, error: roleError }] = await Promise.all([
        supabase.from('profiles').select('email,display_name').eq('id', userId).maybeSingle(),
        supabase.from('organization_memberships').select('organization_id,role').eq('user_id', userId).limit(1),
        supabase.from('user_roles').select('role').eq('user_id', userId).limit(1).maybeSingle(),
      ]);
      if (cancelled) return;
      const membership = memberships?.[0];
      const resolvedRole = (membership?.role ?? legacyRole?.role ?? null) as AppRole | null;
      let organization: WorkspaceIdentity['organization'] = null;
      let permissions: string[] = [];
      if (membership?.organization_id) {
        const [{ data: org }, { data: grants }] = await Promise.all([
          supabase.from('organizations').select('id,name,slug').eq('id', membership.organization_id).maybeSingle(),
          supabase.from('role_permissions').select('permission_code').eq('role', membership.role),
        ]);
        organization = org;
        permissions = (grants ?? []).map((grant) => grant.permission_code);
      }
      const nextIdentity = {
        profile: profile ? { displayName: profile.display_name, email: profile.email } : null,
        organization,
        role: resolvedRole,
        permissions,
        workspace: workspaceForRole(resolvedRole),
        error: profileError?.message ?? membershipError?.message ?? roleError?.message ?? (!resolvedRole ? 'Access configuration required.' : null),
      } satisfies WorkspaceIdentity;
      setRole(resolvedRole);
      setIdentity(nextIdentity);
    })();
    return () => { cancelled = true; };
  }, [session?.user.id]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    role,
    identity,
    loading,
    signInWithGoogle: async () => {
      const redirectTo = `${window.location.origin}/workspace`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    },
    signInWithPassword: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

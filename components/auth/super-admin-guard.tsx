'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { isPrimarySuperAdmin } from '@/utils/auth';

export function SuperAdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;

      if (cancelled) return;
      if (error || !user?.email || !isPrimarySuperAdmin(user.email)) {
        router.replace('/login?error=super_admin_required');
        return;
      }

      const { data: canAccess, error: adminError } = await supabase.rpc('can_access_admin', {
        _user_id: user.id,
        _permission_code: 'admin.console',
      });

      if (cancelled) return;
      if (adminError || !canAccess) {
        router.replace('/workspace');
        return;
      }
      setAuthorized(true);
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!authorized) {
    return <div className="p-8 text-[var(--muted)]">Checking Super Admin access...</div>;
  }

  return <>{children}</>;
}

export function SuperAdminRedirector() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!cancelled && user?.email && isPrimarySuperAdmin(user.email)) {
        router.replace('/admin/access-requests');
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

import { redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import type { WorkspaceKey } from '@/hooks/useAuth';

const permissionByWorkspace: Record<WorkspaceKey, string> = {
  admin: 'admin.console',
  security: 'security.workspace',
  soc: 'soc.workspace',
  network: 'network.workspace',
  research: 'research.workspace',
};

export function workspaceBeforeLoad(workspace: WorkspaceKey) {
  return async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw redirect({ to: '/login' });
    const { data: allowed } = await supabase.rpc('can_access_admin', {
      _user_id: sessionData.session.user.id,
      _permission_code: permissionByWorkspace[workspace],
    });
    if (!allowed) throw redirect({ to: '/workspace' });
  };
}
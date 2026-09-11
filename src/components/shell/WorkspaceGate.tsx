import type { ReactNode } from 'react';
import { useAuth, type WorkspaceKey } from '@/hooks/useAuth';
import { WorkspaceInitializingPage } from '@/pages/WorkspaceInitializingPage';
import { AccessConfigurationPage } from '@/pages/AccessConfigurationPage';
import { RoleWorkspacePage } from '@/pages/RoleWorkspacePage';

export function WorkspaceGate({ workspace }: { workspace: WorkspaceKey; children?: ReactNode }) {
  const { loading, session, identity } = useAuth();
  if (loading || (session && !identity.role && !identity.error)) return <WorkspaceInitializingPage />;
  if (!session || identity.workspace !== workspace) return <AccessConfigurationPage />;
  return <RoleWorkspacePage identity={identity} />;
}
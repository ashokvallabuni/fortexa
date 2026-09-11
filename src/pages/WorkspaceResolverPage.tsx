import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceInitializingPage } from './WorkspaceInitializingPage';
import { AccessConfigurationPage } from './AccessConfigurationPage';

export function WorkspaceResolverPage() {
  const { loading, session, identity } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session && identity.workspace) void navigate({ to: `/${identity.workspace}` as never, replace: true });
  }, [identity.workspace, loading, navigate, session]);

  if (loading || (session && !identity.role && !identity.error)) return <WorkspaceInitializingPage />;
  if (!session) return <AccessConfigurationPage />;
  if (!identity.workspace) return <AccessConfigurationPage />;
  return <WorkspaceInitializingPage />;
}
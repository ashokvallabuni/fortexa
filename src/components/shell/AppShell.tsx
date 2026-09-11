import { useState } from 'react';
import { Outlet, useLocation } from '@/lib/router-compat';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { ApiHealthCard } from './ApiHealthCard';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceInitializingPage } from '@/pages/WorkspaceInitializingPage';
import { AccessConfigurationPage } from '@/pages/AccessConfigurationPage';

export function AppShell() {
  const { loading, session, identity } = useAuth();
  const location = useLocation();

  if (loading || (session && !identity.role && !identity.error)) return <WorkspaceInitializingPage />;
  if (!session) return <AccessConfigurationPage />;
  if (!identity.workspace && location.pathname !== '/workspace') return <AccessConfigurationPage />;
  if (['/workspace', '/admin', '/security', '/soc', '/research', '/network'].includes(location.pathname)) return <Outlet />;

  return <div className="flex h-full flex-col bg-[var(--background)]"><div className="flex min-h-0 flex-1"><div className="hidden md:flex"><Sidebar /></div><div className="flex min-w-0 flex-1 flex-col"><Navbar /><main className="flex-1 overflow-auto pb-14 md:pb-0"><ApiHealthCard /><Outlet /></main></div></div><MobileNav /></div>;
}

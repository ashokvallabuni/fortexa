import { createFileRoute } from '@tanstack/react-router';
import { AdminConsolePage } from '@/pages/AdminConsolePage';
import { workspaceBeforeLoad } from '@/lib/workspace-route-auth';

export const Route = createFileRoute('/_app/admin')({
  beforeLoad: workspaceBeforeLoad('admin'),
  head: () => ({ meta: [{ title: 'Admin Console | FORTEXA' }] }),
  component: AdminConsolePage,
});
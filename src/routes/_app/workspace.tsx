import { createFileRoute } from '@tanstack/react-router';
import { WorkspaceResolverPage } from '@/pages/WorkspaceResolverPage';

export const Route = createFileRoute('/_app/workspace')({
  head: () => ({ meta: [{ title: 'Initializing Workspace | FORTEXA' }] }),
  component: WorkspaceResolverPage,
});
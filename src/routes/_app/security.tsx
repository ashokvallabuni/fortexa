import { createFileRoute } from '@tanstack/react-router';
import { WorkspaceGate } from '@/components/shell/WorkspaceGate';
import { workspaceBeforeLoad } from '@/lib/workspace-route-auth';

export const Route = createFileRoute('/_app/security')({ beforeLoad: workspaceBeforeLoad('security'), component: () => <WorkspaceGate workspace="security" /> });
import { createFileRoute } from '@tanstack/react-router';
import { WorkspaceGate } from '@/components/shell/WorkspaceGate';
import { workspaceBeforeLoad } from '@/lib/workspace-route-auth';

export const Route = createFileRoute('/_app/soc')({ beforeLoad: workspaceBeforeLoad('soc'), component: () => <WorkspaceGate workspace="soc" /> });
import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceGate } from "@/components/shell/WorkspaceGate";
import { workspaceBeforeLoad } from "@/lib/workspace-route-auth";

export const Route = createFileRoute("/_app/network")({
  head: () => ({
    meta: [
      { title: "Network States | FORTEXA" },
      { name: "description", content: "Time-windowed network state S(t) metrics derived from canonical flows." },
      { property: "og:title", content: "Network States | FORTEXA" },
      { property: "og:description", content: "Time-windowed network state S(t) metrics derived from canonical flows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: workspaceBeforeLoad('network'),
  component: () => <WorkspaceGate workspace="network" />,
});

import { createFileRoute } from "@tanstack/react-router";
import { LiveFeatureEmptyPage } from "@/pages/LiveFeatureEmptyPage";

export const Route = createFileRoute("/_app/graph")({
  head: () => ({
    meta: [
      { title: "Network Graph | FORTEXA" },
      { name: "description", content: "Dynamic entity graph of hosts, servers, ports and domains with their relationships." },
      { property: "og:title", content: "Network Graph | FORTEXA" },
      { property: "og:description", content: "Dynamic entity graph of hosts, servers, ports and domains with their relationships." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LiveFeatureEmptyPage feature="graph" />,
});

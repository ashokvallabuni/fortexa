import { createFileRoute } from "@tanstack/react-router";
import { LiveFeatureEmptyPage } from "@/pages/LiveFeatureEmptyPage";

export const Route = createFileRoute("/_app/copilot")({
  head: () => ({
    meta: [
      { title: "Copilot | FORTEXA" },
      { name: "description", content: "Ask questions about the ingested network data." },
      { property: "og:title", content: "Copilot | FORTEXA" },
      { property: "og:description", content: "Ask questions about the ingested network data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LiveFeatureEmptyPage feature="copilot" />,
});

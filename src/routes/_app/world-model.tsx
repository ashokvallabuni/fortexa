import { createFileRoute } from "@tanstack/react-router";
import { LiveFeatureEmptyPage } from "@/pages/LiveFeatureEmptyPage";

export const Route = createFileRoute("/_app/world-model")({
  head: () => ({
    meta: [
      { title: "World Model | FORTEXA" },
      { name: "description", content: "State transition exploration across generated network states." },
      { property: "og:title", content: "World Model | FORTEXA" },
      { property: "og:description", content: "State transition exploration across generated network states." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LiveFeatureEmptyPage feature="world-model" />,
});

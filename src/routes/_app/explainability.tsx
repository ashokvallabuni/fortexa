import { createFileRoute } from "@tanstack/react-router";
import { LiveFeatureEmptyPage } from "@/pages/LiveFeatureEmptyPage";

export const Route = createFileRoute("/_app/explainability")({
  head: () => ({
    meta: [
      { title: "Explainability | FORTEXA" },
      { name: "description", content: "Feature attributions behind each risk assessment." },
      { property: "og:title", content: "Explainability | FORTEXA" },
      { property: "og:description", content: "Feature attributions behind each risk assessment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LiveFeatureEmptyPage feature="explainability" />,
});

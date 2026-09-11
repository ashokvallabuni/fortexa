import { createFileRoute } from "@tanstack/react-router";
import { LiveFeatureEmptyPage } from "@/pages/LiveFeatureEmptyPage";

export const Route = createFileRoute("/_app/evaluation")({
  head: () => ({
    meta: [
      { title: "Evaluation | FORTEXA" },
      { name: "description", content: "Model and pipeline evaluation metrics." },
      { property: "og:title", content: "Evaluation | FORTEXA" },
      { property: "og:description", content: "Model and pipeline evaluation metrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LiveFeatureEmptyPage feature="evaluation" />,
});

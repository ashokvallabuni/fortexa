import { createFileRoute } from "@tanstack/react-router";
import { ProductionReportsPage } from "@/pages/ProductionReportsPage";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports | FORTEXA" },
      { name: "description", content: "Exportable analysis reports from processed datasets." },
      { property: "og:title", content: "Reports | FORTEXA" },
      { property: "og:description", content: "Exportable analysis reports from processed datasets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductionReportsPage,
});

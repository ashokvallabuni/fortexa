import { createFileRoute } from "@tanstack/react-router";
import { AlertsPage } from "@/pages/AlertsPage";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts | FORTEXA" },
      { name: "description", content: "Anomaly alerts raised from generated network states." },
      { property: "og:title", content: "Alerts | FORTEXA" },
      { property: "og:description", content: "Anomaly alerts raised from generated network states." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

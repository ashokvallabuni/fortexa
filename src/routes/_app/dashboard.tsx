import { createFileRoute } from "@tanstack/react-router";
import { RealDashboard } from "@/pages/RealDashboard";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | FORTEXA" },
      { name: "description", content: "Live network risk overview built from ingested traffic and generated network states." },
      { property: "og:title", content: "Dashboard | FORTEXA" },
      { property: "og:description", content: "Live network risk overview built from ingested traffic and generated network states." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RealDashboard,
});

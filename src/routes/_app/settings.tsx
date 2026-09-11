import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/SettingsPage";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings | FORTEXA" },
      { name: "description", content: "Workspace, ingestion and display preferences." },
      { property: "og:title", content: "Settings | FORTEXA" },
      { property: "og:description", content: "Workspace, ingestion and display preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

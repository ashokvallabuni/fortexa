import { createFileRoute } from "@tanstack/react-router";
import { AttackTimelinePage } from "@/pages/AttackTimelinePage";

export const Route = createFileRoute("/_app/attack-timeline")({
  head: () => ({
    meta: [
      { title: "Timeline | FORTEXA" },
      { name: "description", content: "Chronological view of notable behavioural changes in the captured traffic." },
      { property: "og:title", content: "Timeline | FORTEXA" },
      { property: "og:description", content: "Chronological view of notable behavioural changes in the captured traffic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttackTimelinePage,
});

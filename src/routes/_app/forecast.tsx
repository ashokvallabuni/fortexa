import { createFileRoute } from "@tanstack/react-router";
import { ForecastPage } from "@/pages/ForecastPage";

export const Route = createFileRoute("/_app/forecast")({
  head: () => ({
    meta: [
      { title: "Forecast | FORTEXA" },
      { name: "description", content: "Forward-looking network risk projections." },
      { property: "og:title", content: "Forecast | FORTEXA" },
      { property: "og:description", content: "Forward-looking network risk projections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForecastPage,
});

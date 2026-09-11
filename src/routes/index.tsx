import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FORTEXA — Network Traffic Intelligence Platform" },
      {
        name: "description",
        content:
          "Ingest PCAP, CSV, NetFlow and IPFIX traffic, generate canonical flows, network states and a live entity graph.",
      },
      { property: "og:title", content: "FORTEXA — Network Traffic Intelligence Platform" },
      {
        property: "og:description",
        content:
          "Ingest PCAP, CSV, NetFlow and IPFIX traffic, generate canonical flows, network states and a live entity graph.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

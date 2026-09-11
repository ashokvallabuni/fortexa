import { createFileRoute } from "@tanstack/react-router";
import { IngestionPage } from "@/pages/IngestionPage";

export const Route = createFileRoute("/_app/ingestion")({
  head: () => ({
    meta: [
      { title: "Data Ingestion | FORTEXA" },
      { name: "description", content: "Upload PCAP, CSV, NetFlow or IPFIX captures and track the processing pipeline end to end." },
      { property: "og:title", content: "Data Ingestion | FORTEXA" },
      { property: "og:description", content: "Upload PCAP, CSV, NetFlow or IPFIX captures and track the processing pipeline end to end." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IngestionPage,
});

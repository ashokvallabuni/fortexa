import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated } from "@/lib/core/admin-auth.server";

export const Route = createFileRoute("/api/graph")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const access = await requireAuthenticated(request);
        if (access instanceof Response) return access;
        const { getGraph, resolveDatasetId } = await import("@/lib/core/queries.server");
        const url = new URL(request.url);
        const maxNodes = Math.min(1000, Number(url.searchParams.get("maxNodes") ?? 250) || 250);
        try {
          const datasetId = await resolveDatasetId(url.searchParams.get("datasetId"));
          if (!datasetId) return Response.json({ success: true, data: { nodes: [], edges: [] }, datasetId: null });
          return Response.json({ success: true, datasetId, data: await getGraph(datasetId, maxNodes) });
        } catch (error) {
          return Response.json(
            { success: false, message: error instanceof Error ? error.message : "Failed to load graph" },
            { status: 500 },
          );
        }
      },
    },
  },
});

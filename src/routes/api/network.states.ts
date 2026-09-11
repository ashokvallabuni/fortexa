import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated } from "@/lib/core/admin-auth.server";

export const Route = createFileRoute("/api/network/states")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const access = await requireAuthenticated(request);
        if (access instanceof Response) return access;
        const { getNetworkStates, resolveDatasetId } = await import("@/lib/core/queries.server");
        const url = new URL(request.url);
        const limit = Math.min(500, Number(url.searchParams.get("limit") ?? 40) || 40);
        try {
          const datasetId = await resolveDatasetId(url.searchParams.get("datasetId"));
          if (!datasetId) return Response.json({ success: true, data: [], datasetId: null });
          return Response.json({ success: true, datasetId, data: await getNetworkStates(datasetId, limit) });
        } catch (error) {
          return Response.json(
            { success: false, message: error instanceof Error ? error.message : "Failed to load network states" },
            { status: 500 },
          );
        }
      },
    },
  },
});

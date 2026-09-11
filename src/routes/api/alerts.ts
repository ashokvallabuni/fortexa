import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated } from "@/lib/core/admin-auth.server";

export const Route = createFileRoute("/api/alerts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const access = await requireAuthenticated(request);
        if (access instanceof Response) return access;
        const { getAlerts, resolveDatasetId } = await import("@/lib/core/queries.server");
        const url = new URL(request.url);
        const limit = Math.min(200, Number(url.searchParams.get("limit") ?? 50) || 50);
        try {
          const datasetId = await resolveDatasetId(url.searchParams.get("datasetId"));
          if (!datasetId) return Response.json({ success: true, data: [], datasetId: null });
          return Response.json({ success: true, datasetId, data: await getAlerts(datasetId, limit) });
        } catch (error) {
          return Response.json(
            { success: false, message: error instanceof Error ? error.message : "Failed to load alerts" },
            { status: 500 },
          );
        }
      },
    },
  },
});

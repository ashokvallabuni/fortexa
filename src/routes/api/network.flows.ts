import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated } from "@/lib/core/admin-auth.server";

export const Route = createFileRoute("/api/network/flows")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const access = await requireAuthenticated(request);
        if (access instanceof Response) return access;
        const { getFlows, resolveDatasetId } = await import("@/lib/core/queries.server");
        const url = new URL(request.url);
        const page = Math.max(0, Number(url.searchParams.get("page") ?? 0) || 0);
        const pageSize = Math.min(200, Number(url.searchParams.get("pageSize") ?? 25) || 25);
        try {
          const datasetId = await resolveDatasetId(url.searchParams.get("datasetId"));
          if (!datasetId) return Response.json({ success: true, data: { flows: [], total: 0 }, datasetId: null });
          return Response.json({ success: true, datasetId, data: await getFlows(datasetId, page, pageSize) });
        } catch (error) {
          return Response.json(
            { success: false, message: error instanceof Error ? error.message : "Failed to load flows" },
            { status: 500 },
          );
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated } from "@/lib/core/admin-auth.server";

export const Route = createFileRoute("/api/datasets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const access = await requireAuthenticated(request);
        if (access instanceof Response) return access;
        const { listDatasets } = await import("@/lib/core/queries.server");
        try {
          return Response.json({ success: true, data: await listDatasets() });
        } catch (error) {
          return Response.json(
            { success: false, message: error instanceof Error ? error.message : "Failed to list datasets" },
            { status: 500 },
          );
        }
      },
    },
  },
});

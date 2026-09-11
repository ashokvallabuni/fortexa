import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/core/admin-auth.server";

export const Route = createFileRoute("/api/demo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const access = await requireAdmin(request);
        if (access instanceof Response) return access;
        const { loadDemoDataset } = await import("@/lib/core/demo.server");
        try {
          return Response.json({ success: true, data: await loadDemoDataset() });
        } catch (error) {
          return Response.json(
            { success: false, message: error instanceof Error ? error.message : "Failed to load demo dataset." },
            { status: 500 },
          );
        }
      },
    },
  },
});

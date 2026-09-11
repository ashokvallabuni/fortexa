import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/core/admin-auth.server";

export const Route = createFileRoute("/api/uploads/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const access = await requireAdmin(request);
        if (access instanceof Response) return access;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.from("uploads").select("*").eq("id", params.id).maybeSingle();
        if (error) return Response.json({ success: false, message: error.message }, { status: 500 });
        if (!data) return Response.json({ success: false, message: "Upload not found." }, { status: 404 });
        return Response.json({ success: true, data });
      },
    },
  },
});

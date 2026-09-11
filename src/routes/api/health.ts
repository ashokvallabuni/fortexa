import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const configured = {
          supabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
          publishableKey: Boolean(
            process.env.SUPABASE_PUBLISHABLE_KEY ||
              process.env.SUPABASE_ANON_KEY ||
              process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
              process.env.VITE_SUPABASE_ANON_KEY,
          ),
          serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        };
        const ready = Object.values(configured).every(Boolean);
        return Response.json(
          {
            success: ready,
            service: "fortexa",
            configured,
            timestamp: new Date().toISOString(),
          },
          { status: ready ? 200 : 503 },
        );
      },
    },
  },
});
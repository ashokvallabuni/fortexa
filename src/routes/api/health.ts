import { createFileRoute } from '@tanstack/react-router';

/**
 * Deep health endpoint used by uptime monitors (Sixth) and by the in-app
 * `ApiHealthCard`.
 *
 * Contract:
 *   200 `{ status: "ok",   database: "connected", ... }`    Supabase reachable
 *   503 `{ status: "error", database: "disconnected" | "unconfigured", ... }`
 *
 * The handler never throws: an unreachable database is reported as a 503 body
 * rather than a 5xx crash, so monitors can distinguish "down" from "broken".
 */

const NO_STORE_HEADERS = { 'cache-control': 'no-store, max-age=0' };

async function runHealthCheck(): Promise<{ status: number; body: unknown }> {
  const { checkHealth } = await import('@/lib/core/health.server');
  const report = await checkHealth();
  return { status: report.status === 'ok' ? 200 : 503, body: report };
}

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const { status, body } = await runHealthCheck();
        return Response.json(body, { status, headers: NO_STORE_HEADERS });
      },
      HEAD: async () => {
        const { status } = await runHealthCheck();
        return new Response(null, { status, headers: NO_STORE_HEADERS });
      },
    },
  },
});

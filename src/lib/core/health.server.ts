/**
 * Deep server-health probe for the Supabase backend that backs FORTEXA.
 *
 * Server-only module. Import it dynamically from route handlers
 * (see `src/routes/api/health.ts`) so it never reaches the browser bundle.
 *
 * The probe deliberately performs a real HTTP request against the project's
 * PostgREST endpoint instead of only inspecting environment variables, so an
 * uptime monitor pinging `/api/health` detects an unreachable database.
 */

export type DatabaseState = 'connected' | 'disconnected' | 'unconfigured';

export interface HealthConfiguredFlags {
  supabaseUrl: boolean;
  publishableKey: boolean;
  serviceRoleKey: boolean;
}

export interface HealthReport {
  status: 'ok' | 'error';
  database: DatabaseState;
  service: 'fortexa';
  /** Legacy flag kept for existing consumers (`ApiHealthCard`, docs, ops scripts). */
  success: boolean;
  latencyMs: number;
  checkedAt: string;
  configured: HealthConfiguredFlags;
  warnings: string[];
  message: string;
}

const DEFAULT_PROBE_TIMEOUT_MS = 2000;
const MAX_PROBE_TIMEOUT_MS = 10_000;

/** A read against a real table: proves PostgREST can reach PostgreSQL. */
const ORGANIZATIONS_QUERY_PATH = '/rest/v1/organizations?select=id&limit=1';
/** PostgREST root document: proves the API is up even when RLS hides tables. */
const REST_ROOT_PATH = '/rest/v1/';

type ProbeOutcome = 'reachable' | 'auth_rejected' | 'server_error' | 'unreachable';

interface SupabaseProbeTarget {
  url: string;
  key: string;
}

function probeTimeoutMs(): number {
  const configured = Number(process.env['HEALTH_PROBE_TIMEOUT_MS']);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_PROBE_TIMEOUT_MS;
  return Math.min(configured, MAX_PROBE_TIMEOUT_MS);
}

function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

/** New-style Supabase keys are opaque strings, not bearer JWTs. */
function isOpaqueApiKey(key: string): boolean {
  return key.startsWith('sb_publishable_') || key.startsWith('sb_secret_');
}

function configuredFlags(): HealthConfiguredFlags {
  return {
    supabaseUrl: Boolean(readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')),
    publishableKey: Boolean(
      readEnv(
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_ANON_KEY',
        'VITE_SUPABASE_PUBLISHABLE_KEY',
        'VITE_SUPABASE_ANON_KEY',
      ),
    ),
    serviceRoleKey: Boolean(readEnv('SUPABASE_SERVICE_ROLE_KEY')),
  };
}

function resolveProbeTarget(): SupabaseProbeTarget | null {
  const url = readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key =
    readEnv('SUPABASE_SERVICE_ROLE_KEY') ??
    readEnv(
      'SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_ANON_KEY',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_SUPABASE_ANON_KEY',
    );
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

function probeHeaders(key: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: key, accept: 'application/json' };
  if (!isOpaqueApiKey(key)) headers['authorization'] = `Bearer ${key}`;
  return headers;
}

async function probeEndpoint(target: SupabaseProbeTarget, path: string): Promise<ProbeOutcome> {
  const endpoint = `${target.url}${path}`;
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: probeHeaders(target.key),
      signal: AbortSignal.timeout(probeTimeoutMs()),
    });
    if (response.status < 400) return 'reachable';
    if (response.status === 401 || response.status === 403) return 'auth_rejected';
    if (response.status >= 500) return 'server_error';
    return 'reachable';
  } catch {
    return 'unreachable';
  }
}

interface ProbeResult {
  database: DatabaseState;
  warnings: string[];
}

/**
 * Runs the table read and the API-root probe in parallel and resolves them with
 * a strict precedence: a reachable endpoint wins, then a Supabase 5xx means the
 * database is down, otherwise the project is unreachable from this runtime.
 */
async function probeDatabase(target: SupabaseProbeTarget): Promise<ProbeResult> {
  const outcomes = await Promise.all([
    probeEndpoint(target, ORGANIZATIONS_QUERY_PATH),
    probeEndpoint(target, REST_ROOT_PATH),
  ]);

  if (outcomes.includes('reachable')) return { database: 'connected', warnings: [] };
  if (outcomes.includes('auth_rejected')) {
    // Supabase answered, so PostgreSQL is up; the configured key is not accepted.
    return { database: 'connected', warnings: ['supabase_key_rejected'] };
  }
  if (outcomes.includes('server_error')) {
    return { database: 'disconnected', warnings: ['supabase_server_error'] };
  }
  return { database: 'disconnected', warnings: ['supabase_unreachable'] };
}

function buildMessage(database: DatabaseState, warnings: string[]): string {
  if (database === 'connected') {
    return warnings.length > 0
      ? 'Supabase database connected (API key rejected).'
      : 'Supabase database connected.';
  }
  if (database === 'disconnected') return 'Supabase database unavailable.';
  return 'Supabase configuration incomplete.';
}

/** Resolves the full health report. Never throws; failures become report state. */
export async function checkHealth(): Promise<HealthReport> {
  const startedAt = performance.now();
  const configured = configuredFlags();
  const target = resolveProbeTarget();

  const { database, warnings }: ProbeResult = target
    ? await probeDatabase(target)
    : { database: 'unconfigured', warnings: ['supabase_env_missing'] };

  const latencyMs = Math.round(performance.now() - startedAt);
  const status: HealthReport['status'] = database === 'connected' ? 'ok' : 'error';

  return {
    status,
    database,
    service: 'fortexa',
    success: status === 'ok',
    latencyMs,
    checkedAt: new Date().toISOString(),
    configured,
    warnings,
    message: buildMessage(database, warnings),
  };
}

import { API_BASE_URL } from '@/api/client';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

async function authHeaders(): Promise<HeadersInit> {
  if (typeof window === "undefined") return { Accept: "application/json" };
  const { supabase } = await import("@/integrations/supabase/client");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    Accept: "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

/** Simulated latency helper, still used by the not-yet-backed (Phase 2+) services. */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockFetch<T>(data: T, latencyMs = 400): Promise<ApiResponse<T>> {
  await delay(latencyMs);
  return {
    data,
    success: true,
    timestamp: new Date().toISOString(),
  };
}

interface BackendEnvelope<T> {
  success: boolean;
  data?: T;
  datasetId?: string | null;
  message?: string;
}

/** Calls a backend endpoint and unwraps the standard response envelope. */
export async function apiGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query}` : "";
  const response = await fetch(`${API_BASE_URL}${path}${suffix}`, { headers: await authHeaders() });
  const body = (await response.json()) as BackendEnvelope<T>;
  if (!response.ok || !body.success) throw new Error(body.message ?? `Request to ${path} failed`);
  return body.data as T;
}

export async function apiPost<T>(path: string, payload?: BodyInit | Record<string, unknown>): Promise<T> {
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    ...(payload === undefined
      ? {}
      : isForm
        ? { body: payload as FormData }
        : { headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
  });
  const body = (await response.json()) as BackendEnvelope<T>;
  if (!response.ok || !body.success) throw new Error(body.message ?? `Request to ${path} failed`);
  return body.data as T;
}

/** Active dataset selection, shared across pages. */
const DATASET_KEY = "fortexa.activeDatasetId";

export function getActiveDatasetId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(DATASET_KEY) ?? undefined;
}

export function setActiveDatasetId(datasetId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DATASET_KEY, datasetId);
}

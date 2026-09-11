const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_BASE_URL = configuredApiUrl?.replace(/\/$/, '') || '';

type ApiErrorBody = { detail?: string; message?: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(import.meta.env.DEV
      ? 'Analytics API unavailable. Start FastAPI at http://localhost:8000 or set VITE_API_URL.'
      : 'Analytics API unavailable. Set VITE_API_URL to the deployed Render backend URL.');
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init.headers },
    });
  } catch {
    throw new Error(
      API_BASE_URL
        ? `Analytics API unavailable at ${API_BASE_URL}`
        : 'Analytics API unavailable. Set VITE_API_URL to the deployed FastAPI URL.',
    );
  }

  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) throw new Error(body.detail || body.message || `Request failed: ${path}`);
  return body;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, {
      method: 'POST',
      ...(payload === undefined
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
    }),
};
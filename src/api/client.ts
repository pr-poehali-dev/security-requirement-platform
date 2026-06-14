/**
 * Базовый API-клиент.
 * В Docker/production запросы идут через nginx на /api/v1/...
 * В режиме разработки (Vite) — проксируется через vite.config.ts.
 */
const BASE = "/api/v1";

async function request<T>(
  method: string,
  path: string,
  params?: Record<string, string>,
  body?: unknown,
): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
  }
  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || "Ошибка сервера");
  return data as T;
}

export const api = {
  get:    <T>(path: string, params?: Record<string, string>) => request<T>("GET",    path, params),
  post:   <T>(path: string, body?: unknown)                  => request<T>("POST",   path, undefined, body),
  put:    <T>(path: string, body?: unknown)                  => request<T>("PUT",    path, undefined, body),
  delete: <T>(path: string)                                  => request<T>("DELETE", path),
};

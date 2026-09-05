// agent_plugin_dev/multi-session-plugin/src/ui/api.ts —— 会话 REST 客户端
export interface SessionItem { id: string; title: string; createdAt: string; updatedAt: string }
interface ApiResult { ok: boolean; data?: unknown; message?: string }

async function apiFetch(path: string, init?: RequestInit): Promise<ApiResult> {
  const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...init })
  let body: ApiResult | null = null
  try { body = (await res.json()) as ApiResult } catch { /* 非 JSON */ }
  if (!res.ok || !body?.ok) throw new Error(body?.message || `HTTP ${res.status}`)
  return body
}

export function listSessions(): Promise<SessionItem[]> {
  return apiFetch('/api/session/list').then((r) => r.data as SessionItem[])
}
export function createSession(): Promise<SessionItem> {
  return apiFetch('/api/session/create', { method: 'POST' }).then((r) => r.data as SessionItem)
}
export function removeSession(id: string): Promise<void> {
  return apiFetch('/api/session/' + id, { method: 'DELETE' }).then(() => undefined)
}
export function getActive(): Promise<string | null> {
  return apiFetch('/api/session/active').then((r) => r.data as string | null)
}
export function setActive(id: string): Promise<void> {
  return apiFetch('/api/session/active', { method: 'PUT', body: JSON.stringify({ sessionId: id }) }).then(() => undefined)
}

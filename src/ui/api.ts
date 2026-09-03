// agent_plugin_dev/llm-plugin/src/ui/api.ts
import type { PresetListItem } from './provider.ts'

export type { PresetListItem }

export interface ApiResult {
  ok: boolean
  data?: unknown
  message?: string
}

export async function apiFetch(path: string, init?: RequestInit): Promise<ApiResult> {
  const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...init })
  return res.json() as Promise<ApiResult>
}

export function listPresets(): Promise<PresetListItem[]> {
  return apiFetch('/api/llm/presets').then((r) => (r.ok ? (r.data as PresetListItem[]) : []))
}

export function createPreset(input: object): Promise<{ id: number }> {
  return apiFetch('/api/llm/presets', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data as { id: number })
}

export function updatePreset(id: number, input: object): Promise<{ id: number }> {
  return apiFetch(`/api/llm/presets/${id}`, { method: 'PUT', body: JSON.stringify(input) }).then((r) => r.data as { id: number })
}

export function deletePreset(id: number): Promise<{ id: number }> {
  return apiFetch(`/api/llm/presets/${id}`, { method: 'DELETE' }).then((r) => r.data as { id: number })
}

export function fetchModels(id: number): Promise<string[]> {
  return apiFetch('/api/llm/models', { method: 'POST', body: JSON.stringify({ id }) })
    .then((r) => { if (!r.ok) throw new Error(r.message || '拉取失败'); return (r.data as { models: string[] }).models })
}

export function fetchModelsByInput(input: { format: string; baseUrl: string; apiKey: string }): Promise<string[]> {
  return apiFetch('/api/llm/models', { method: 'POST', body: JSON.stringify(input) })
    .then((r) => { if (!r.ok) throw new Error(r.message || '拉取失败'); return (r.data as { models: string[] }).models })
}

export function testPreset(id: number): Promise<boolean> {
  return apiFetch('/api/llm/test', { method: 'POST', body: JSON.stringify({ id }) })
    .then((r) => r.ok && !!(r.data as { ok?: boolean })?.ok)
}

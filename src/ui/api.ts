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
  return apiFetch('/api/llm/presets').then((r) => {
    if (!r.ok) throw new Error(r.message || '加载预设失败')
    return r.data as PresetListItem[]
  })
}

export function createPreset(input: object): Promise<{ id: number }> {
  return apiFetch('/api/llm/presets', { method: 'POST', body: JSON.stringify(input) })
    .then((r) => { if (!r.ok) throw new Error(r.message || '保存失败'); return r.data as { id: number } })
}

export function updatePreset(id: number, input: object): Promise<{ id: number }> {
  return apiFetch(`/api/llm/presets/${id}`, { method: 'PUT', body: JSON.stringify(input) })
    .then((r) => { if (!r.ok) throw new Error(r.message || '保存失败'); return r.data as { id: number } })
}

export function deletePreset(id: number): Promise<{ id: number }> {
  return apiFetch(`/api/llm/presets/${id}`, { method: 'DELETE' })
    .then((r) => { if (!r.ok) throw new Error(r.message || '删除失败'); return r.data as { id: number } })
}

export function fetchModels(id: number): Promise<string[]> {
  return apiFetch('/api/llm/models', { method: 'POST', body: JSON.stringify({ id }) })
    .then((r) => { if (!r.ok) throw new Error(r.message || '拉取失败'); return (r.data as { models: string[] }).models })
}

export function fetchModelsByInput(input: { format: string; baseUrl: string; apiKey: string; timeout?: number }): Promise<string[]> {
  return apiFetch('/api/llm/models', { method: 'POST', body: JSON.stringify(input) })
    .then((r) => { if (!r.ok) throw new Error(r.message || '拉取失败'); return (r.data as { models: string[] }).models })
}

export type TestTarget =
  | { id: number }
  | { format: string; baseUrl: string; model: string; apiKey: string; timeout?: number }

export function testPreset(target: TestTarget): Promise<boolean> {
  return apiFetch('/api/llm/test', { method: 'POST', body: JSON.stringify(target) })
    .then((r) => { if (!r.ok) throw new Error(r.message || '测试失败'); return !!(r.data as { ok?: boolean })?.ok })
}

export function setActive(id: number): Promise<void> {
  return apiFetch('/api/llm/active', { method: 'PUT', body: JSON.stringify({ id }) })
    .then((r) => { if (!r.ok) throw new Error(r.message || '设置当前预设失败') })
}

export function getActive(): Promise<number | null> {
  return apiFetch('/api/llm/active').then((r) => {
    if (!r.ok) throw new Error(r.message || '读取当前预设失败')
    return (r.data as { id: number | null }).id
  })
}

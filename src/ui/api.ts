import type { FormRow } from './state.ts'
import type { Entry, EntryRole } from '../types.ts'

export interface ApiResult { ok: boolean; data?: unknown; message?: string }

export async function apiFetch(path: string, init?: RequestInit): Promise<ApiResult> {
  const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...init })
  let body: ApiResult | null = null
  try { body = (await res.json()) as ApiResult } catch { /* 非 JSON */ }
  if (!res.ok || !body?.ok) throw new Error(body?.message || `HTTP ${res.status}`)
  return body
}

export interface EntryInput {
  name?: string
  role?: EntryRole
  text?: string
  kind?: 'group'
  base?: string
  enabled?: boolean
}
export interface LayoutInput { entries?: string[]; children?: Record<string, string[]> }

export function listForms(): Promise<FormRow[]> {
  return apiFetch('/api/prompt/forms').then((r) => r.data as FormRow[])
}
export function createForm(name: string): Promise<{ id: string }> {
  return apiFetch('/api/prompt/forms', { method: 'POST', body: JSON.stringify({ name }) }).then((r) => r.data as { id: string })
}
export function renameForm(id: string, name: string): Promise<void> {
  return apiFetch(`/api/prompt/forms/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }).then(() => undefined)
}
export function deleteForm(id: string): Promise<void> {
  return apiFetch(`/api/prompt/forms/${id}`, { method: 'DELETE' }).then(() => undefined)
}
export function listEntries(formId: string): Promise<Entry[]> {
  return apiFetch(`/api/prompt/forms/${formId}/entries`).then((r) => r.data as Entry[])
}
export function createEntry(formId: string, input: EntryInput): Promise<{ entryId: string }> {
  return apiFetch(`/api/prompt/forms/${formId}/entries`, { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data as { entryId: string })
}
export function updateEntry(formId: string, entryId: string, input: EntryInput): Promise<void> {
  return apiFetch(`/api/prompt/forms/${formId}/entries/${entryId}`, { method: 'PUT', body: JSON.stringify(input) }).then(() => undefined)
}
export function deleteEntry(formId: string, entryId: string): Promise<void> {
  return apiFetch(`/api/prompt/forms/${formId}/entries/${entryId}`, { method: 'DELETE' }).then(() => undefined)
}
export function saveLayout(formId: string, layout: LayoutInput): Promise<void> {
  return apiFetch(`/api/prompt/forms/${formId}/order`, { method: 'PUT', body: JSON.stringify(layout) }).then(() => undefined)
}
export interface PreviewMessage { role: 'system' | 'user' | 'assistant'; content: string }
export function previewPrompt(formId: string): Promise<{ messages: PreviewMessage[] }> {
  return apiFetch(`/api/prompt/forms/${formId}/preview`, { method: 'POST', body: JSON.stringify({}) }).then((r) => r.data as { messages: PreviewMessage[] })
}
export interface RegisteredInjection { id: string; name: string }
export function listRegistered(): Promise<RegisteredInjection[]> {
  return apiFetch('/api/prompt/registered').then((r) => r.data as RegisteredInjection[])
}
export function addRegisteredEntry(formId: string, id: string): Promise<{ entryId: string }> {
  return apiFetch(`/api/prompt/forms/${formId}/registered-entry`, { method: 'POST', body: JSON.stringify({ id }) }).then((r) => r.data as { entryId: string })
}

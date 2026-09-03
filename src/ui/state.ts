// agent_plugin_dev/llm-plugin/src/ui/state.ts
import type { PresetListItem } from './provider.ts'
import { computeAutoValues } from './provider.ts'

export interface PresetState {
  id: number | null
  name: string
  format: string
  vendor: string
  baseUrl: string
  model: string
  timeout: number
  hasKey: boolean
}

export function createEmptyState(): PresetState {
  return { id: null, name: '新预设', format: 'openai_compatible', vendor: '', baseUrl: '', model: '', timeout: 30, hasKey: false }
}

export function fromRow(row: PresetListItem): PresetState {
  return { id: row.id, name: row.presetName, format: row.format, vendor: row.vendor, baseUrl: row.baseUrl, model: row.model, timeout: row.timeout, hasKey: row.hasKey }
}

export function applyVendor(state: PresetState, vendor: string): PresetState {
  const auto = computeAutoValues(vendor)
  if (!vendor) return { ...state, vendor: '', baseUrl: '', format: 'openai_compatible' }
  return { ...state, vendor, baseUrl: auto.baseUrl, format: auto.format }
}

export type SaveCheck = { ok: true } | { ok: false; field: 'baseUrl' | 'model' | 'apiKey' }

export function checkSave(state: PresetState, key: string): SaveCheck {
  if (!state.baseUrl.trim()) return { ok: false, field: 'baseUrl' }
  if (!state.model.trim()) return { ok: false, field: 'model' }
  if (state.id === null && !key.trim()) return { ok: false, field: 'apiKey' }
  return { ok: true }
}

export type TestCheck =
  | { mode: 'id' }
  | { mode: 'fields' }
  | { missing: 'baseUrl' | 'model' | 'apiKey' }

export function checkTest(state: PresetState, form: { format: string; baseUrl: string; model: string }, key: string): TestCheck {
  if (!form.baseUrl.trim()) return { missing: 'baseUrl' }
  if (!form.model.trim()) return { missing: 'model' }
  if (!key.trim()) return state.id !== null ? { mode: 'id' } : { missing: 'apiKey' }
  return state.id !== null ? { mode: 'id' } : { mode: 'fields' }
}

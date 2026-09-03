// agent_plugin_dev/llm-plugin/src/db.ts
import type { DatabaseSync } from 'node:sqlite'

export interface PresetInput {
  presetName: string
  format: string        // openai_compatible | anthropic | google
  vendor: string
  baseUrl: string
  model: string
  timeout: number
}
export interface Preset extends PresetInput {
  id: number
  hasKey: boolean
  updatedAt: string
}

export function initPresets(db: DatabaseSync): void {
  db.exec(`CREATE TABLE IF NOT EXISTS presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    presetName TEXT NOT NULL,
    format TEXT NOT NULL,
    vendor TEXT NOT NULL DEFAULT '',
    baseUrl TEXT NOT NULL,
    model TEXT DEFAULT '',
    timeout INTEGER NOT NULL DEFAULT 30,
    updatedAt TEXT NOT NULL
  )`)
}

function rowToPreset(r: Record<string, unknown>): Preset {
  return {
    id: Number(r.id),
    presetName: String(r.presetName),
    format: String(r.format),
    vendor: String(r.vendor),
    baseUrl: String(r.baseUrl),
    model: String(r.model ?? ''),
    timeout: Number(r.timeout),
    hasKey: false,
    updatedAt: String(r.updatedAt),
  }
}

export function listPresets(db: DatabaseSync): Preset[] {
  const rows = db.prepare('SELECT * FROM presets ORDER BY id').all() as Record<string, unknown>[]
  return rows.map(rowToPreset)
}

export function getPreset(db: DatabaseSync, id: number): Preset | null {
  const r = db.prepare('SELECT * FROM presets WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return r ? rowToPreset(r) : null
}

export function createPreset(db: DatabaseSync, input: PresetInput): number {
  const res = db.prepare(
    'INSERT INTO presets (presetName, format, vendor, baseUrl, model, timeout, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(input.presetName, input.format, input.vendor, input.baseUrl, input.model, input.timeout, new Date().toISOString())
  return Number(res.lastInsertRowid)
}

export function updatePreset(db: DatabaseSync, id: number, input: PresetInput): boolean {
  const res = db.prepare(
    'UPDATE presets SET presetName=?, format=?, vendor=?, baseUrl=?, model=?, timeout=?, updatedAt=? WHERE id=?',
  ).run(input.presetName, input.format, input.vendor, input.baseUrl, input.model, input.timeout, new Date().toISOString(), id)
  return Number(res.changes) > 0
}

export function deletePreset(db: DatabaseSync, id: number): boolean {
  const res = db.prepare('DELETE FROM presets WHERE id=?').run(id)
  return Number(res.changes) > 0
}

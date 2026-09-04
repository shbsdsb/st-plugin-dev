import type { Entry } from '../types.ts'

export interface FormRow {
  id: string
  name: string
  entryCount: number
}

export interface PanelState {
  forms: FormRow[]
  currentId: string | null
  expandedId: string | null
}

export function createPanelState(): PanelState {
  return { forms: [], currentId: null, expandedId: null }
}

function fallback(forms: FormRow[], currentId: string | null): string | null {
  if (currentId && forms.some((f) => f.id === currentId)) return currentId
  return forms.length > 0 ? forms[0].id : null
}

export function applyList(s: PanelState, forms: FormRow[]): PanelState {
  return { forms, currentId: fallback(forms, s.currentId), expandedId: s.expandedId }
}

export function upsertForm(s: PanelState, row: FormRow): PanelState {
  const idx = s.forms.findIndex((f) => f.id === row.id)
  const forms = idx >= 0 ? s.forms.map((f, i) => (i === idx ? row : f)) : [...s.forms, row]
  return { forms, currentId: s.currentId, expandedId: s.expandedId }
}

export function removeForm(s: PanelState, id: string): PanelState {
  const forms = s.forms.filter((f) => f.id !== id)
  const currentId = s.currentId === id ? fallback(forms, null) : s.currentId
  const expandedId = s.expandedId === id ? null : s.expandedId
  return { forms, currentId, expandedId }
}

export function selectForm(s: PanelState, id: string): PanelState {
  if (!s.forms.some((f) => f.id === id)) return s
  return { forms: s.forms, currentId: id, expandedId: s.expandedId }
}

export function setExpand(s: PanelState, id: string | null): PanelState {
  return { forms: s.forms, currentId: s.currentId, expandedId: id }
}

export function toggleExpand(s: PanelState, id: string): PanelState {
  return { forms: s.forms, currentId: s.currentId, expandedId: s.expandedId === id ? null : id }
}

/** 条目内容块数量(n 段徽标;容错空条目与非数组) */
export function segmentCount(e: Pick<Entry, 'blocks'> | null | undefined): number {
  return e && Array.isArray(e.blocks) ? e.blocks.length : 0
}

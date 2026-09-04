import type { ChildEntry, Entry } from '../types.ts'

export interface FormRow { id: string; name: string; entryCount: number }

export interface PanelState {
  forms: FormRow[]
  currentId: string | null
  expandedId: string | null
  /** 顶层顺序(拖拽后内存序;服务端序的镜像),未保存时与后端不一致 */
  topOrder: string[]
  /** 各父的子序(拖拽后内存序) */
  childOrder: Record<string, string[]>
  /** 顺序是否有未保存变更 */
  dirtyOrder: boolean
}

export function createPanelState(): PanelState {
  return { forms: [], currentId: null, expandedId: null, topOrder: [], childOrder: {}, dirtyOrder: false }
}

function fallback(forms: FormRow[], currentId: string | null): string | null {
  if (currentId && forms.some((f) => f.id === currentId)) return currentId
  return forms.length > 0 ? forms[0].id : null
}

export function applyList(s: PanelState, forms: FormRow[]): PanelState {
  return { ...s, forms, currentId: fallback(forms, s.currentId) }
}
export function upsertForm(s: PanelState, row: FormRow): PanelState {
  const idx = s.forms.findIndex((f) => f.id === row.id)
  const forms = idx >= 0 ? s.forms.map((f, i) => (i === idx ? row : f)) : [...s.forms, row]
  return { ...s, forms }
}
export function removeForm(s: PanelState, id: string): PanelState {
  const forms = s.forms.filter((f) => f.id !== id)
  const currentId = s.currentId === id ? fallback(forms, null) : s.currentId
  return { ...s, forms, currentId, expandedId: s.expandedId === id || s.currentId === id ? null : s.expandedId }
}
export function selectForm(s: PanelState, id: string): PanelState {
  if (!s.forms.some((f) => f.id === id)) return s
  return { ...s, currentId: id }
}
export function setExpand(s: PanelState, id: string | null): PanelState {
  return { ...s, expandedId: id }
}
export function toggleExpand(s: PanelState, id: string): PanelState {
  return { ...s, expandedId: s.expandedId === id ? null : id }
}

/** 归组纯函数:平铺(父后紧跟其子) → 顶层 + childrenByParent */
export function toTree(entries: readonly Entry[]): { top: Entry[]; childrenByParent: Record<string, ChildEntry[]> } {
  const top: Entry[] = []
  const childrenByParent: Record<string, ChildEntry[]> = {}
  const isChild = (e: Entry): e is ChildEntry => typeof (e as ChildEntry).base === 'string'
  for (const e of entries) {
    if (isChild(e)) {
      const arr = childrenByParent[e.base] ?? []
      arr.push(e)
      childrenByParent[e.base] = arr
    } else {
      top.push(e)
    }
  }
  return { top, childrenByParent }
}

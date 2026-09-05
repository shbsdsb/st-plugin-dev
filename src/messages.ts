import type { ChildEntry, Entry, GroupEntry, PlainEntry } from './types.ts'

export function isGroup(e: Entry): e is GroupEntry { return (e as GroupEntry).kind === 'group' }
export function isChild(e: Entry): e is ChildEntry { return typeof (e as ChildEntry).base === 'string' }
export function isPlain(e: Entry): e is PlainEntry { return !isGroup(e) && !isChild(e) }

/** 普通条目或子条目的可发送文本(trim 语义在调用方) */
export function entryText(e: PlainEntry | ChildEntry): string {
  return typeof e.text === 'string' ? e.text : ''
}

/** 占位符子条:由 registered-entry 创建、带 placeholder 关联字段(见 spec D10/D11) */
export function isPlaceholder(e: Entry): boolean {
  return isChild(e) && (e as ChildEntry).placeholder !== undefined
}

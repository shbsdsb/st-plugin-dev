import type { ChildEntry, Entry, GroupEntry, PlainEntry } from './types.ts'

export function isGroup(e: Entry): e is GroupEntry { return (e as GroupEntry).kind === 'group' }
export function isChild(e: Entry): e is ChildEntry { return typeof (e as ChildEntry).base === 'string' }
export function isPlain(e: Entry): e is PlainEntry { return !isGroup(e) && !isChild(e) }

/** 普通条目或子条目的可发送文本(trim 非空才有效) */
export function entryText(e: PlainEntry | ChildEntry): string {
  return typeof e.text === 'string' ? e.text : ''
}

/** 前端发送可用性 + 组装共用:children 需已按序(由调用方传 childrenMap[父id] 对应条目) */
export function contentFor(e: Entry, children: ChildEntry[] = []): string {
  if (isGroup(e)) {
    const parts = children.map((c) => c.text).filter((s) => typeof s === 'string' && s.trim() !== '')
    return parts.join('\n\n')
  }
  const t = entryText(e as PlainEntry | ChildEntry)
  return t.trim() === '' ? '' : t
}

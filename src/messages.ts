import type { Entry, Message } from './types.ts'

/** 单条目拼接:父 text 与各块中 trim 非空者按序以 \n\n 连接;全空返回 '' */
export function entryContent(e: Entry): string {
  if (!e) return ''
  const parts = [e.text, ...(Array.isArray(e.blocks) ? e.blocks.map((b) => b.text) : [])]
  return parts.filter((s) => typeof s === 'string' && s.trim() !== '').join('\n\n')
}

/** 按序组装 messages:跳过 content 为空(父 text 与块全空)的条目 */
export function buildMessages(entries: readonly Entry[]): Message[] {
  const out: Message[] = []
  for (const e of entries) {
    if (!e) continue
    const content = entryContent(e)
    if (content === '') continue
    out.push({ role: e.role, content })
  }
  return out
}

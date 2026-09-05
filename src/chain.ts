// agent_plugin_dev/prompt-plugin/src/chain.ts —— 拼接核心(只拼不发;注入/开关/残留校验)
import type { ChildEntry, Entry, GroupEntry, Message, PlainEntry } from './types.ts'
import { isGroup, isPlain, isPlaceholder } from './messages.ts'
import type { PromptRegisterService } from './register.ts'

export interface TreeReader {
  readTree(formId: string): Promise<{ top: Entry[]; childrenByParent: Record<string, ChildEntry[]> }>
}

function seg(s: string): string {
  return typeof s === 'string' && s.trim() !== '' ? s.trim() : ''
}

async function injectText(reg: NonNullable<ReturnType<PromptRegisterService['get']>>, parentName: string): Promise<string> {
  let raw: unknown
  try {
    raw = await reg.fn()
  } catch (e) {
    throw new Error(`动态注入失败(${parentName}): ${e instanceof Error ? e.message : String(e)}`)
  }
  if (typeof raw !== 'string') throw new Error(`动态注入失败(${parentName}): 注入函数必须返回字符串`)
  const text = seg(raw)
  if (!text) throw new Error(`动态注入失败(${parentName}): 注入内容为空`)
  return text
}

export async function buildMessages(formId: string, deps: { reader: TreeReader; registry: PromptRegisterService }): Promise<Message[]> {
  const { reader, registry } = deps
  const { top, childrenByParent } = await reader.readTree(formId)
  const out: Message[] = []
  for (const e of top) {
    if (e.enabled === false) continue            // 顶层开关;子条无开关跟随父
    if (isGroup(e)) {
      const g = e as GroupEntry
      const children = childrenByParent[g.id] ?? []
      const hasPh = children.some(isPlaceholder)
      const reg = hasPh ? registry.get(g.id) : undefined
      if (hasPh && !reg) {
        throw new Error(`条目 "${g.name}" 依赖的插件未加载,请加载对应插件或手动删除该条目`)
      }
      const parts: string[] = []
      for (const c of children) {
        if (isPlaceholder(c)) {
          parts.push(await injectText(reg!, g.name))   // 占位符段位 = 注入文本(仅出现一次,见 D10)
        } else {
          const t = seg(c.text)
          if (t) parts.push(t)
        }
      }
      const content = parts.join('\n\n')
      if (content === '') continue
      out.push({ role: g.role, content })
    } else if (isPlain(e)) {
      const content = seg((e as PlainEntry).text)
      if (content === '') continue
      out.push({ role: e.role, content })
    }
    // 顶层游离子条(异常数据)跳过
  }
  return out
}

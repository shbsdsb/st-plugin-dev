// agent_plugin_dev/prompt-plugin/src/chain.ts —— 拼接核心(只拼不发;注入/开关/残留校验)
import type { ChildEntry, Entry, GroupEntry, Message, PlainEntry } from './types.ts'
import { isGroup, isPlain, isPlaceholder } from './messages.ts'
import type { PromptRegisterService } from './register.ts'
import { NotFoundError, type PromptStore } from './store.ts'

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
    if (isGroup(e)) {
      const g = e as GroupEntry
      if (g.enabled === false) continue          // 顶层开关;子条无开关跟随父
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
      const p = e as PlainEntry
      if (p.enabled === false) continue          // 顶层开关
      const content = seg(p.text)
      if (content === '') continue
      out.push({ role: p.role, content })
    }
    // 顶层游离子条(异常数据)跳过
  }
  return out
}

/** v4.1: formId 缺省取「使用表单(active)」;无 active/表单已删 → 中文错误 */
export async function buildWithActive(
  store: PromptStore,
  registry: PromptRegisterService,
  formId?: string,
): Promise<Message[]> {
  const fid = formId ?? (await store.getActiveFormId())
  if (!fid) throw new Error('未选择使用表单,请先在 Prompt 面板停留选择一张表单')
  try {
    return await buildMessages(fid, { reader: store, registry })
  } catch (e) {
    if (e instanceof NotFoundError) throw new Error('使用表单不存在或已删除,请重新选择')
    throw e
  }
}

/** v5: 预览静态拼接 —— 注册占位 JSON 化(不依赖 registry、不调用注入 fn);发送仍走 buildMessages */
export async function buildPreview(formId: string, reader: TreeReader): Promise<Message[]> {
  const { top, childrenByParent } = await reader.readTree(formId)
  const out: Message[] = []
  for (const e of top) {
    if (isGroup(e)) {
      const g = e as GroupEntry
      if (g.enabled === false) continue          // 顶层开关;子条无开关跟随父
      const children = childrenByParent[g.id] ?? []
      const parts: string[] = []
      for (const c of children) {
        if (isPlaceholder(c)) {
          parts.push(JSON.stringify({ [g.id]: `${g.name}(发送时注入)` }))
        } else {
          const t = seg(c.text)
          if (t) parts.push(t)
        }
      }
      const content = parts.join('\n\n')
      if (content === '') continue
      out.push({ role: g.role, content })
    } else if (isPlain(e)) {
      const p = e as PlainEntry
      if (p.enabled === false) continue          // 顶层开关
      const content = seg(p.text)
      if (content === '') continue
      out.push({ role: p.role, content })
    }
    // 顶层游离子条(异常数据)跳过
  }
  return out
}

// agent_plugin_dev/chat-plugin/src/send.ts —— 发送数据流:active 探测 → 显式 build → llm → 整轮回滚
import type { ChatStore } from './store.ts'
import { extractAssistant } from './extract.ts'

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface ChainingLike {
  active(): Promise<string | null>
  hasRegistered(formId: string, regId: string): Promise<boolean>
  build(formId?: string): Promise<ChatMessage[]>
}
export interface LlmLike { send(messages: ChatMessage[]): Promise<unknown> }
export interface PendingLike { get(): string | null; set(v: string | null): void }
export interface SendDep { store: ChatStore; chaining: ChainingLike; llm: LlmLike; pending: PendingLike }

export async function sendMessage(dep: SendDep, text: string): Promise<string> {
  const t = typeof text === 'string' ? text.trim() : ''
  if (t === '') throw new Error('消息内容不能为空')
  const { store, chaining, llm, pending } = dep
  pending.set(t)
  try {
    const fid = await chaining.active()
    if (!fid) throw new Error('未选择使用表单,请先在 Prompt 面板停留选择一张表单')
    const hasH = await chaining.hasRegistered(fid, 'history')
    const hasI = await chaining.hasRegistered(fid, 'input')
    if (!hasH || !hasI) {
      throw new Error('使用表单缺少动态注入条目(history/input),请先在 Prompt 面板为表单添加注册条目')
    }
    const messages = await chaining.build(fid)
    const json = await llm.send(messages)
    const reply = extractAssistant(json)
    store.append('user', t)
    store.append('assistant', reply)
    return reply
  } finally {
    pending.set(null)
  }
}

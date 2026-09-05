// agent_plugin_dev/chat-plugin/src/session.ts —— 当前会话适配层(消费 ctx.multiSession)
import type { ChatMessage } from './send.ts'

export interface MultiSessionLike {
  getActiveSessionId(): Promise<string | null>
  listMessages(sessionId: string): Promise<Array<{ role: string; content: string }>>
  appendMessage(sessionId: string, role: string, content: string): Promise<void>
}
export interface SessionLike {
  getActive(): Promise<string | null>
  getMessages(): Promise<ChatMessage[]>
  append(role: 'user' | 'assistant', content: string): Promise<void>
}

export function createSessionAdapter(multi: MultiSessionLike): SessionLike {
  return {
    async getActive() {
      return multi.getActiveSessionId()
    },
    async getMessages() {
      const id = await multi.getActiveSessionId()
      if (!id) return []
      const rows = await multi.listMessages(id)
      return rows.map((r) => ({ role: r.role as ChatMessage['role'], content: r.content }))
    },
    async append(role, content) {
      const id = await multi.getActiveSessionId()
      if (!id) throw new Error('请先在右侧新建或选择会话')
      await multi.appendMessage(id, role, content)
    },
  }
}

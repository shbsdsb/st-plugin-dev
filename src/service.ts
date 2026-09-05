// agent_plugin_dev/multi-session-plugin/src/service.ts —— 异步服务壳(async 包装 store,契约供 chat-plugin 注入)
import type { MsgRole, MultiStore, SessionMessage, SessionRow } from './store.ts'

export interface MultiSessionService {
  listSessions(): Promise<SessionRow[]>
  createSession(): Promise<{ id: string; title: string }>
  deleteSession(id: string): Promise<void>
  getActiveSessionId(): Promise<string | null>
  setActiveSessionId(id: string): Promise<void>
  listMessages(sessionId: string): Promise<SessionMessage[]>
  appendMessage(sessionId: string, role: MsgRole, content: string): Promise<void>
}

export function createSessionService(store: MultiStore): MultiSessionService {
  const tick = () => new Promise<void>((r) => setTimeout(r, 0))
  return {
    async listSessions() { await tick(); return store.listSessions() },
    async createSession() { await tick(); const { id } = store.createSession(); return { id, title: store.getSession(id).title } },
    async deleteSession(id) { await tick(); store.deleteSession(id) },
    async getActiveSessionId() { await tick(); return store.getActive() },
    async setActiveSessionId(id) { await tick(); store.getSession(id); store.setActive(id) },
    async listMessages(sessionId) { await tick(); return store.listMessages(sessionId) },
    async appendMessage(sessionId, role, content) { await tick(); store.appendMessage(sessionId, role, content) },
  }
}

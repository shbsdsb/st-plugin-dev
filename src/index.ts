// agent_plugin_dev/chat-plugin/src/index.ts —— 服务入口:注册 history/input 注入 + /api/chat/* 路由
import { Context } from 'cordis'
import type { DatabaseSync } from 'node:sqlite'
import { createChatStore, type ChatStore } from './store.ts'
import { createHistoryText } from './history.ts'
import { sendMessage, type ChainingLike, type LlmLike, type ChatMessage } from './send.ts'
import { registerRoutes } from './routes.ts'

type WebServerRegister = (o: { kind: 'exact' | 'prefix'; path: string; handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void> }) => () => void

declare module 'cordis' {
  interface Context {
    webServer: { register: WebServerRegister }
    persistDb: { open(relativePath: string): Promise<DatabaseSync> }
    promptChaining: ChainingLike
    promptRegister: { register(o: { id: string; name: string; fn: () => string | Promise<string> }): () => void }
    llmPrompt: { send(messages: ChatMessage[]): Promise<unknown> }
  }
}

export const name = 'chat-plugin'

const EmptyConfigSchema = {
  '~standard': { version: 1, vendor: 'chat-plugin', validate: (value: unknown) => ({ value: value ?? {} }) },
}

export function apply(ctx: Context, _config: Record<string, unknown>) {
  ctx.effect(async () => {
    let db: DatabaseSync | null = null
    let pending: string | null = null
    const disposers: Array<() => void> = []
    try {
      db = await ctx.persistDb.open('data/message/chat.db')
      const store: ChatStore = createChatStore(db)
      const pendingBox = {
        get: () => pending,
        set: (v: string | null) => { pending = v },
      }
      disposers.push(ctx.promptRegister.register({
        id: 'history',
        name: 'chat-history',
        fn: createHistoryText(() => store.listMessages()),
      }))
      disposers.push(ctx.promptRegister.register({
        id: 'input',
        name: 'user-input',
        fn: () => {
          const v = pendingBox.get()
          if (!v) throw new Error('未在发送会话中,user-input 仅可在发送时注入')
          return v
        },
      }))
      disposers.push(registerRoutes(ctx.webServer.register.bind(ctx.webServer), {
        store,
        send: (text) => sendMessage({ store, chaining: ctx.promptChaining, llm: ctx.llmPrompt, pending: pendingBox }, text),
      }))
      return () => {
        for (const d of disposers) d()
        db?.close()
        db = null
      }
    } catch (e) {
      console.error('[chat-plugin] init error:', (e as Error)?.message ?? e)
      return () => {}
    }
  })
}

apply.inject = ['webServer', 'persistDb', 'promptChaining', 'promptRegister', 'llmPrompt']
apply.provide = [] as string[]
apply.Config = EmptyConfigSchema

export default apply

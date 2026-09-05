// agent_plugin_dev/multi-session-plugin/src/index.ts —— 服务入口:provide multiSession + /api/session/* 路由
import { Context } from 'cordis'
import type { DatabaseSync } from 'node:sqlite'
import { createMultiStore } from './store.ts'
import { createSessionService, type MultiSessionService } from './service.ts'
import { registerRoutes } from './routes.ts'

type WebServerRegister = (o: { kind: 'exact' | 'prefix'; path: string; handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void> }) => () => void

declare module 'cordis' {
  interface Context {
    webServer: { register: WebServerRegister }
    persistDb: { open(relativePath: string): Promise<DatabaseSync> }
  }
}

export const name = 'multi-session-plugin'

export function apply(ctx: Context, _config: Record<string, unknown>) {
  // 数据库异步就绪:服务对象同步 provide(host-plugin 运行时 provide 先例),方法体 await ready
  const ready: Promise<{ svc: MultiSessionService; close(): void }> = ctx.persistDb.open('data/session/sessions.db').then((db) => {
    const store = createMultiStore(db)
    return {
      svc: createSessionService(store),
      close: () => { db.close() },
    }
  })
  const multiSession: MultiSessionService = {
    listSessions: async () => (await ready).svc.listSessions(),
    createSession: async () => (await ready).svc.createSession(),
    deleteSession: async (id) => { await (await ready).svc.deleteSession(id) },
    getActiveSessionId: async () => (await ready).svc.getActiveSessionId(),
    setActiveSessionId: async (id) => { await (await ready).svc.setActiveSessionId(id) },
    listMessages: async (sid) => (await ready).svc.listMessages(sid),
    appendMessage: async (sid, role, content) => { await (await ready).svc.appendMessage(sid, role, content) },
  }
  ctx.provide('multiSession', multiSession)

  ctx.effect(() => {
    let disposed = false
    let disposer: (() => void) | undefined
    let handle: { close(): void } | undefined
    void ready.then((r) => {
      if (disposed) { r.close(); return }
      handle = r
      disposer = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { svc: r.svc })
    }).catch((e) => { console.error('[multi-session-plugin] init error:', (e as Error)?.message ?? e) })
    return () => {
      disposed = true
      disposer?.()
      handle?.close()
    }
  })
}

apply.inject = ['webServer', 'persistDb']
apply.provide = [] as string[]
apply.Config = {
  '~standard': { version: 1, vendor: 'multi-session-plugin', validate: (value: unknown) => ({ value: value ?? {} }) },
}

export default apply

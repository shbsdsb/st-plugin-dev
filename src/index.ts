// agent_plugin_dev/llm-plugin/src/index.ts
import { Context } from 'cordis'
import { initPresets } from './db.ts'
import { registerRoutes } from './routes.ts'
import { createLlmPromptService } from './service.ts'

declare module 'cordis' {
  interface Context {
    webServer: {
      register(o: { kind: 'exact' | 'prefix'; path: string; handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void> }): () => void
    }
    persistDb: { open(relativePath: string): Promise<import('node:sqlite').DatabaseSync> }
    credential: { set(n: string, s: string): Promise<void>; get(n: string): Promise<string | null>; delete(n: string): Promise<void> }
    llmPrompt: import('./service.ts').LlmPromptService
  }
}

export const name = 'llm-plugin'

const EmptyConfigSchema = {
  '~standard': { version: 1, vendor: 'llm-plugin', validate: (value: unknown) => ({ value: value ?? {} }) },
}

export function apply(ctx: Context, _config: Record<string, unknown>) {
  let db: import('node:sqlite').DatabaseSync | null = null
  let disposeRoutes: (() => void) | null = null
  ctx.effect(async () => {
    try {
      db = await ctx.persistDb.open('data/llm/presets.db')
      initPresets(db)
      ctx.llmPrompt = createLlmPromptService({ db, cred: ctx.credential })
      disposeRoutes = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { db, cred: ctx.credential })
      return () => {
        disposeRoutes?.()
        disposeRoutes = null
        ctx.llmPrompt = null as never
        db?.close()
        db = null
      }
    } catch (e) {
      console.error('[llm-plugin] init error:', (e as Error)?.message ?? e)
      return () => {}
    }
  })
}

apply.inject = ['webServer', 'persistDb', 'credential']
apply.provide = ['llmPrompt']
apply.Config = EmptyConfigSchema

export default apply

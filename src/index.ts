import { Context } from 'cordis'
import { registerRoutes, type LlmPromptLike } from './routes.ts'
import { createStore, type PersistJsonLike } from './store.ts'
import type { Message } from './types.ts'

declare module 'cordis' {
  interface Context {
    webServer: {
      register(o: { kind: 'exact' | 'prefix'; path: string; handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void> }): () => void
    }
    persistJson: PersistJsonLike
    llmPrompt: LlmPromptLike & { send(messages: Message[]): Promise<unknown> }
  }
}

export const name = 'prompt-plugin'

const EmptyConfigSchema = {
  '~standard': { version: 1, vendor: 'prompt-plugin', validate: (value: unknown) => ({ value: value ?? {} }) },
}

export function apply(ctx: Context, _config: Record<string, unknown>) {
  ctx.effect(async () => {
    let disposeRoutes: (() => void) | null = null
    try {
      const store = createStore(ctx.persistJson)
      disposeRoutes = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { store, llm: ctx.llmPrompt })
      return () => { disposeRoutes?.(); disposeRoutes = null }
    } catch (e) {
      console.error('[prompt-plugin] init error:', (e as Error)?.message ?? e)
      return () => {}
    }
  })
}

apply.inject = ['webServer', 'persistJson', 'llmPrompt']
apply.provide = [] as string[]
apply.Config = EmptyConfigSchema

export default apply

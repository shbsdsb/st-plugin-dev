import { Context } from 'cordis'
import { registerRoutes } from './routes.ts'
import { createStore, type PromptStore } from './store.ts'
import { createRegisterTable, type PromptRegisterService } from './register.ts'
import { buildWithActive, buildPreview } from './chain.ts'
import type { Message } from './types.ts'

declare module 'cordis' {
  interface Context {
    webServer: {
      register(o: { kind: 'exact' | 'prefix'; path: string; handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void> }): () => void
    }
    persistJson: { read(p: string): Promise<unknown>; write(p: string, d: unknown): Promise<void>; list(p: string): Promise<string[]>; delete(p: string): Promise<void> }
    promptRegister: PromptRegisterService
    promptChaining: {
      active(): Promise<string | null>
      hasRegistered(formId: string, regId: string): Promise<boolean>
      build(formId?: string): Promise<Message[]>
    }
  }
}

export const name = 'prompt-plugin'

const EmptyConfigSchema = {
  '~standard': { version: 1, vendor: 'prompt-plugin', validate: (value: unknown) => ({ value: value ?? {} }) },
}

export function apply(ctx: Context, _config: Record<string, unknown>) {
  ctx.effect(async () => {
    let disposeRoutes: (() => void) | null = null
    let disposeReg: (() => void) | null = null
    let disposeChain: (() => void) | null = null
    try {
      const store: PromptStore = createStore(ctx.persistJson)
      const registry = createRegisterTable()
      const chaining = {
        active: () => store.getActiveFormId(),
        hasRegistered: (formId: string, regId: string) => store.hasRegisteredEntry(formId, regId),
        build: (formId?: string) => buildWithActive(store, registry, formId),
      }
      disposeReg = ctx.provide('promptRegister', registry)
      disposeChain = ctx.provide('promptChaining', chaining)
      disposeRoutes = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { store, registry, chaining, preview: (formId: string) => buildPreview(formId, store) })
      return () => {
        disposeRoutes?.()
        disposeRoutes = null
        disposeReg?.()
        disposeReg = null
        disposeChain?.()
        disposeChain = null
      }
    } catch (e) {
      console.error('[prompt-plugin] init error:', (e as Error)?.message ?? e)
      return () => {}
    }
  })
}

apply.inject = ['webServer', 'persistJson']   // v4:不再依赖 llmPrompt(只拼不发,发送由调用方决定)
apply.provide = ['promptChaining', 'promptRegister']
apply.Config = EmptyConfigSchema

export default apply

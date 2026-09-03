// agent_plugin_dev/llm-plugin/src/index.ts
import { Context } from 'cordis'

declare module 'cordis' {
  interface Context {
    webServer: {
      register(o: { kind: 'exact' | 'prefix'; path: string; handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void> }): () => void
    }
    persistDb: { open(relativePath: string): Promise<import('node:sqlite').DatabaseSync> }
    credential: { set(n: string, s: string): Promise<void>; get(n: string): Promise<string | null>; delete(n: string): Promise<void> }
  }
}

export const name = 'llm-plugin'

const EmptyConfigSchema = {
  '~standard': { version: 1, vendor: 'llm-plugin', validate: (value: unknown) => ({ value: value ?? {} }) },
}

export function apply(_ctx: Context, _config: Record<string, unknown>) {
  // 后续接线:db + routes
}

apply.inject = ['webServer', 'persistDb', 'credential']
apply.Config = EmptyConfigSchema

export default apply

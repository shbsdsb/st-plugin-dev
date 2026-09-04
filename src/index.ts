import { Context } from 'cordis'

export const name = 'prompt-plugin'

const EmptyConfigSchema = {
  '~standard': { version: 1, vendor: 'prompt-plugin', validate: (value: unknown) => ({ value: value ?? {} }) },
}

export function apply(_ctx: Context, _config: Record<string, unknown>) {
  // Task 3 在此挂载 HTTP 路由
}

apply.inject = ['webServer', 'persistJson', 'llmPrompt']
apply.provide = [] as string[]
apply.Config = EmptyConfigSchema

export default apply

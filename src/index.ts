import { Context } from 'cordis'

export const name = 'chat-plugin'

export function apply(ctx: Context, _config: Record<string, unknown>) {
  ctx.logger.info('[chat-plugin] 待实现')
}

apply.inject = [] as string[]
apply.provide = [] as string[]
apply.Config = {
  '~standard': { version: 1, vendor: 'chat-plugin', validate: (value: unknown) => ({ value: value ?? {} }) },
}

export default apply

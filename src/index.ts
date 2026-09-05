import { Context } from 'cordis'

export const name = 'multi-session-plugin'

export function apply(ctx: Context, _config: Record<string, unknown>) {
  ctx.logger.info('[multi-session-plugin] 待实现')
}

apply.inject = [] as string[]
apply.provide = [] as string[]
apply.Config = {
  '~standard': { version: 1, vendor: 'multi-session-plugin', validate: (value: unknown) => ({ value: value ?? {} }) },
}

export default apply

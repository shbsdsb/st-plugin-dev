import { Context } from 'cordis'
import { registerRoutes, type Register } from './routes.ts'

export const name = 'ui-polish'

// webServer 由 host-plugin 提供;cordis Context 无内建该属性,须按工程惯例扩展其类型
interface WebServerLike {
  register: Register
}

declare module 'cordis' {
  interface Context {
    webServer: WebServerLike
  }
}

const ConfigSchema = {
  '~standard': {
    version: 1,
    vendor: 'ui-polish',
    validate: (value: unknown) => ({ value: (value ?? {}) as { active?: string } }),
  },
}

export function apply(ctx: Context, config: { active?: string } | undefined) {
  const stHome = process.env.ST_HOME ?? ''
  ctx.effect(() => {
    if (stHome.length === 0) {
      ctx.logger.warn('[ui-polish] ST_HOME 未设置,定制主题不可用(仅默认 token 层)')
    }
    const dispose = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { stHome, config })
    return () => dispose()
  })
}

apply.inject = ['webServer']
apply.provide = [] as string[]
apply.Config = ConfigSchema

export default apply

// agent_plugin_dev/web-module/src/index.ts
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Context } from 'cordis'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import { ModuleTable } from './module-table.ts'
import { renderShellPage } from './shell-page.ts'

declare module 'cordis' {
  interface Context {
    /** host-plugin 提供的 HTTP 路由服务 */
    webServer: {
      register(opts: {
        kind: 'exact' | 'prefix'
        path: string
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
      }): () => void
    }
  }
}

export interface WebModuleConfig {
  /** 默认前端插件(访问根路径 / 或 /shell 无 plugin 参数时自动加载,如 'st-ui-slots') */
  defaultPlugin?: string
}

/** web-module Config schema(cordis Standard Schema v1):defaultPlugin 校验 */
export const WebModuleConfigSchema = {
  '~standard': {
    version: 1,
    vendor: 'web-module',
    validate(value: unknown) {
      const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
      return { value: { defaultPlugin: typeof raw.defaultPlugin === 'string' ? raw.defaultPlugin : undefined } }
    },
  },
} satisfies StandardSchemaV1<Record<string, unknown>, WebModuleConfig>

export const name = 'web-module'

export function apply(ctx: Context, config: WebModuleConfig) {
  const table = new ModuleTable()
  ctx.provide('webModule', table)
  const boot = ctx.clientBoot.boot   // inject ['clientBoot'] 保证可用(必需依赖)
  const defaultPlugin = config.defaultPlugin

  const write = (res: ServerResponse, status: number, body: string, type: string) => {
    res.writeHead(status, { 'content-type': type })
    res.end(body)
  }

  // 收集所有路由的 disposer,插件卸载/热重载时统一清理,避免路由残留
  const disposers: Array<() => void> = []

  // 根路径:重定向到 /shell(宿主按 defaultPlugin 自动加载主页面)
  disposers.push(ctx.webServer.register({
    kind: 'exact',
    path: '/',
    handler: (_req, res) => {
      res.writeHead(302, { location: '/shell' })
      res.end()
    },
  }))

  disposers.push(ctx.webServer.register({
    kind: 'exact',
    path: '/shell',
    handler: (_req, res) => write(res, 200, renderShellPage(table, boot, defaultPlugin), 'text/html; charset=utf-8'),
  }))

  disposers.push(ctx.webServer.register({
    kind: 'exact',
    path: '/shell/importmap.json',
    handler: (_req, res) => write(res, 200, JSON.stringify(table.importmap), 'application/json; charset=utf-8'),
  }))

  disposers.push(ctx.webServer.register({
    kind: 'prefix',
    path: '/shell/modules',
    handler: async (req, res) => {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
      const out = pathname.slice('/shell/modules/'.length)   // 'react.cjs' 等,不再 strip 扩展名
      try {
        const code = await table.build(out)
        if (code === undefined) {
          write(res, 404, '404 module not found: ' + pathname, 'text/plain; charset=utf-8')
          return
        }
        write(res, 200, code, 'text/javascript; charset=utf-8')
      } catch (error) {
        ctx.logger.error('[web-module] esbuild 打包失败 %s: %s', pathname, (error as Error).message)
        write(res, 500, '500 build failed: ' + (error as Error).message, 'text/plain; charset=utf-8')
      }
    },
  }))

  // 插件卸载时逐个调用路由 disposer,移除已注册的路由
  ctx.effect(() => () => disposers.forEach((dispose) => dispose()))
}

apply.inject = ['webServer', 'clientBoot']
apply.provide = ['webModule']
apply.Config = WebModuleConfigSchema

// cordis-loader 的 unwrapExports 取 default export 作为插件对象;
// 无 default 时返回整个 namespace,registry.plugin 会读 namespace.inject(undefined),
// 导致 apply 上的 inject/provide 静态属性失效 → 必须显式 default 导出 apply
export default apply

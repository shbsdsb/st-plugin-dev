// agent_plugin_dev/web-module/src/index.ts
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Context } from 'cordis'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import * as yaml from 'js-yaml'
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
  // 无配置项:默认宿主由 web-module 自生成(boot 清单第一个可加载插件);
  // config 仅作为功能开关入口,不承载实现方式信息
}

/** web-module Config schema(空:不接收任何实现信息,默认宿主自生成) */
export const WebModuleConfigSchema = {
  '~standard': {
    version: 1,
    vendor: 'web-module',
    validate() {
      return { value: {} }
    },
  },
} satisfies StandardSchemaV1<Record<string, unknown>, WebModuleConfig>

export const name = 'web-module'

export function apply(ctx: Context, config: WebModuleConfig) {
  const table = new ModuleTable()
  ctx.provide('webModule', table)
  const boot = ctx.clientBoot.boot   // inject ['clientBoot'] 保证可用(必需依赖)
  // 自生成默认宿主:不从 config 取实现信息,自动选 boot 清单第一个可加载插件
  const defaultPlugin = boot[0]?.id

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
    handler: async (_req, res) => {
      // 注入前端插件 config:读 cordis 实际生效配置(YAML)→ 按 boot 条目 id 映射为 window.__CLIENT_CONFIG__
      let clientConfig: Record<string, unknown> = {}
      if (typeof ctx.registry?.git === 'function') {
        try {
          const yamlText = await ctx.registry.git()
          const rows = yaml.load(yamlText) as Array<{ id?: string; config?: unknown }> | null
          for (const row of rows ?? []) {
            if (row?.id && boot.some((e) => e.id === row.id)) clientConfig[row.id] = row.config
          }
        } catch (error) {
          ctx.logger.warn('[web-module] 读取生效配置失败: %s', (error as Error).message)
        }
      }
      write(res, 200, renderShellPage(table, boot, defaultPlugin, clientConfig), 'text/html; charset=utf-8')
    },
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

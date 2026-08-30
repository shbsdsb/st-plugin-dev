import { existsSync, readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join, resolve, sep } from 'node:path'
import { Context } from 'cordis'
import { scanBundleDirs, scanBundlesSync } from './scan.ts'

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

// 显式「无配置」schema(cordis Standard Schema v1):validate 透传输入,undefined → {}
const EmptyConfigSchema = {
  '~standard': {
    version: 1,
    vendor: 'client-find',
    validate: (value: unknown) => ({ value: value ?? {} }),
  },
}

export const name = 'client-find'

export function apply(ctx: Context) {
  const stHome = process.env.ST_HOME
  const profile = process.env.ST_PROFILE ?? 'default'
  const warn = (msg: string) => ctx.logger.warn(msg)

  // 扫描生成 boot(启动时一次;stHome 缺失 → 空清单)。
  // 注:brief 的 `bootPromise.then(...)` 异步 provide 会让 apply 返回时 ctx.clientBoot 仍为
  // undefined(微任务晚于消费方同步读取,测试/注入方会读空抛错);scanBundles 内部全同步
  // (无 IO await),故改用同步版 scanBundlesSync 同步 provide,保证 apply 返回即立即可用。
  const boot = stHome ? scanBundlesSync({ stHome, profile, warn }) : []
  ctx.provide('clientBoot', { boot })

  // 包名 → 目录 映射(字符串条目 → node_modules/<name>;对象条目 → stHome/<file>),
  // 供 serve 按包名定位:对象条目包不在 node_modules 下,仅凭 node_modules 会 404。
  const dirs = stHome ? scanBundleDirs(stHome, profile) : new Map<string, string>()

  const disposers: Array<() => void> = []

  disposers.push(ctx.webServer.register({
    kind: 'prefix',
    path: '/plugins',
    handler: async (req, res) => {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
      const rest = pathname.slice('/plugins/'.length)
      const slash = rest.indexOf('/')
      if (slash <= 0) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('404 plugin not found')
        return
      }
      const pkgName = rest.slice(0, slash)
      const rel = rest.slice(slash + 1)
      if (!stHome) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('500 ST_HOME 未设置')
        return
      }
      // 路径安全校验:规范化后必须位于包目录内(包目录按 scanBundleDirs 映射优先,
      // 未在 st.profile 声明的包回退 node_modules 定位)
      const pkgDir = dirs.get(pkgName) ?? resolve(join(stHome, 'node_modules'), pkgName)
      const file = resolve(pkgDir, rel)
      const within = file === pkgDir || file.startsWith(pkgDir + sep)
      if (!within || !existsSync(file)) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('404 not found: ' + pathname)
        return
      }
      try {
        const body = readFileSync(file)
        const type = rel.endsWith('.json') ? 'application/json; charset=utf-8'
          : rel.endsWith('.cjs') || rel.endsWith('.js') || rel.endsWith('.mjs') ? 'text/javascript; charset=utf-8'
          : 'application/octet-stream'
        res.writeHead(200, { 'content-type': type })
        res.end(body)
      } catch {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('500 read failed: ' + pathname)
      }
    },
  }))

  ctx.effect(() => () => disposers.forEach((dispose) => dispose()))
}

apply.inject = ['webServer']
apply.provide = ['clientBoot']
apply.Config = EmptyConfigSchema

export default apply

// agent_plugin_dev/plugin-setting/src/index.ts
// 后端:注册 webServer JSON API(GET 生效表 / PUT 写 profile patch)。
// 生效表来自开发者工具 ctx.registry.git()(实际生效配置 YAML),非 cordis 内部 registry.get()。
import { existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import * as yaml from 'js-yaml'
import { Context } from 'cordis'
import { readPatch, applyEntries, writePatch } from './patch.ts'

declare module 'cordis' {
  interface Context {
    webServer: {
      register(opts: {
        kind: 'exact' | 'prefix'
        path: string
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
      }): () => void
    }
  }
}

export const name = 'plugin-setting'

export interface SettingEntry {
  id: string
  name: string
  config?: unknown
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function apply(ctx: Context) {
  const stHome = process.env.ST_HOME
  if (!stHome) {
    ctx.logger.warn('[plugin-setting] ST_HOME 未设置,设置服务不可用')
    return
  }
  const profile = process.env.ST_PROFILE ?? 'default'
  const patchPath = join(stHome, 'profile', profile, 'cordis.patch.yml')

  const disposers: Array<() => void> = []

  disposers.push(ctx.webServer.register({
    kind: 'exact',
    path: '/api/setting/list',
    handler: async (_req, res) => {
      try {
        const yamlText = await ctx.registry.git()
        const rows = yaml.load(yamlText) as SettingEntry[] | null
        json(res, 200, { ok: true, entries: rows ?? [] })
      } catch (error) {
        json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
      }
    },
  }))

  disposers.push(ctx.webServer.register({
    kind: 'exact',
    path: '/api/setting/save',
    handler: async (req, res) => {
      try {
        const payload = JSON.parse(await readBody(req)) as { entries?: unknown }
        if (!Array.isArray(payload.entries)) {
          json(res, 400, { ok: false, error: 'entries 必须为数组' })
          return
        }
        const entries: Array<{ id: string; config?: unknown }> = []
        for (const item of payload.entries) {
          const rec = item as { id?: unknown; config?: unknown }
          if (typeof rec?.id !== 'string' || rec.id.length === 0) {
            json(res, 400, { ok: false, error: 'entry.id 必须为非空字符串' })
            return
          }
          const cfg = rec.config
          if (cfg !== undefined && cfg !== null && typeof cfg !== 'object') {
            json(res, 400, { ok: false, error: 'entry.config 必须为对象或 null' })
            return
          }
          entries.push({ id: rec.id, config: cfg })
        }
        if (!existsSync(join(stHome, 'profile', profile))) {
          json(res, 500, { ok: false, error: `profile 目录不存在: ${profile}` })
          return
        }
        const current = await readPatch(patchPath)
        const next = applyEntries(current, entries)
        await writePatch(patchPath, next)
        json(res, 200, { ok: true, count: entries.length })
      } catch (error) {
        json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
      }
    },
  }))

  ctx.effect(() => () => { for (const dispose of disposers) dispose() })
}

apply.inject = ['webServer']
export default apply

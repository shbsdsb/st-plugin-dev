// agent_plugin_dev/prompt-plugin/src/routes.ts
import type { IncomingMessage, ServerResponse } from 'node:http'
import { NotFoundError, type PromptStore } from './store.ts'
import type { Message } from './types.ts'
import type { PromptRegisterService } from './register.ts'

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
type Register = (o: { kind: 'exact' | 'prefix'; path: string; handler: Handler }) => () => void

const PREFIX = '/api/prompt/'

export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c: Buffer | string) => { raw += c })
    req.on('end', () => resolve(raw))
  })
}

function ok(res: ServerResponse, data: unknown): void {
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify({ ok: true, data }))
}
function fail(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify({ ok: false, message }))
}
function errStatus(e: unknown): number {
  if (e instanceof NotFoundError) return 404
  if (e instanceof SyntaxError) return 400
  const msg = (e as Error)?.message ?? ''
  if (/名称|role 非法|kind|base|text|children|顺序|父条目|子条目|内容|插件|注册|注入|占位/.test(msg)) return 400
  return 500
}
function decode(seg: string): string {
  try { return decodeURIComponent(seg) } catch { return seg }
}
function parseBody<T>(req: IncomingMessage): Promise<T> {
  return readBody(req).then((raw) => JSON.parse(raw || '{}') as T)
}
function notAllowed(res: ServerResponse): void {
  fail(res, 405, '不支持的方法')
}

/**
 * 路由分派(spec v4 §7):
 *   GET/POST /api/prompt/forms                     表单集合
 *   PUT/DELETE /api/prompt/forms/:id               改名/删除
 *   GET/POST /api/prompt/forms/:id/entries         平铺条目 / 建条目(普通|父|子)
 *   PUT/DELETE /api/prompt/forms/:id/entries/:eid  更新/删除(级联/剔父)
 *   PUT /api/prompt/forms/:id/order                保存全层级顺序 {entries?, children?}
 *   GET /api/prompt/registered                     已注册动态注入列表
 *   POST /api/prompt/forms/:id/registered-entry    添加注册条目(父+占位符子条)
 *   POST /api/prompt/forms/:id/preview             只拼不发的预览
 */
export function registerRoutes(register: Register, dep: {
  store: PromptStore
  registry: PromptRegisterService
  chaining: { build(formId: string): Promise<Message[]> }
}): () => void {
  const disposers: Array<() => void> = []
  const { store, registry, chaining } = dep

  disposers.push(register({
    kind: 'prefix', path: PREFIX,
    handler: async (req, res) => {
      try {
        const url = (req.url ?? '/').split('?')[0]
        const rest = url.startsWith(PREFIX) ? url.slice(PREFIX.length) : ''
        const seg = rest.split('/').filter((s) => s !== '').map(decode)
        const method = req.method ?? 'GET'
        if (seg.length === 0) return fail(res, 404, '接口不存在')
        if (seg[0] === 'registered' && seg.length === 1) {
          if (method !== 'GET') return notAllowed(res)
          return ok(res, registry.list())
        }
        if (seg[0] !== 'forms') return fail(res, 404, '接口不存在')
        if (seg.length === 1) {
          if (method === 'GET') return ok(res, await store.listForms())
          if (method === 'POST') {
            const { name } = await parseBody<{ name?: unknown }>(req)
            return ok(res, await store.createForm(String(name ?? '')))
          }
          return notAllowed(res)
        }
        const fid = seg[1]
        if (seg.length === 2) {
          if (method === 'PUT') {
            const { name } = await parseBody<{ name?: unknown }>(req)
            await store.renameForm(fid, String(name ?? ''))
            return ok(res, { id: fid })
          }
          if (method === 'DELETE') { await store.deleteForm(fid); return ok(res, { id: fid }) }
          return notAllowed(res)
        }
        const sub = seg[2]
        if (sub === 'entries') {
          if (seg.length === 3) {
            if (method === 'GET') return ok(res, await store.listEntries(fid))
            if (method === 'POST') {
              const b = await parseBody<Record<string, unknown>>(req)
              return ok(res, await store.createEntry(fid, b))
            }
            return notAllowed(res)
          }
          if (seg.length === 4) {
            const eid = seg[3]
            if (method === 'PUT') {
              const b = await parseBody<Record<string, unknown>>(req)
              await store.updateEntry(fid, eid, b)
              return ok(res, { entryId: eid })
            }
            if (method === 'DELETE') {
              await store.deleteEntry(fid, eid)
              return ok(res, { entryId: eid })
            }
            return notAllowed(res)
          }
          return fail(res, 404, '接口不存在')
        }
        if (sub === 'order' && seg.length === 3) {
          if (method !== 'PUT') return notAllowed(res)
          const b = await parseBody<{ entries?: unknown; children?: unknown }>(req)
          await store.saveLayout(fid, b)
          return ok(res, { id: fid })
        }
        if (sub === 'preview' && seg.length === 3) {
          if (method !== 'POST') return notAllowed(res)
          const messages = await chaining.build(fid)
          if (messages.length === 0) return fail(res, 400, '当前表单没有可拼接的内容')
          return ok(res, { messages })
        }
        if (sub === 'registered-entry' && seg.length === 3) {
          if (method !== 'POST') return notAllowed(res)
          const { id } = await parseBody<{ id?: unknown }>(req)
          const inj = registry.get(String(id ?? ''))
          if (!inj) return fail(res, 400, `注册条目不存在: ${String(id ?? '')}`)
          return ok(res, await store.addRegisteredEntry(fid, { regId: inj.id, name: inj.name }))
        }
        return fail(res, 404, '接口不存在')
      } catch (e) {
        fail(res, errStatus(e), (e as Error).message)
      }
    },
  }))
  return () => { disposers.forEach((d) => d()) }
}

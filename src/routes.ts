// agent_plugin_dev/prompt-plugin/src/routes.ts
import type { IncomingMessage, ServerResponse } from 'node:http'
import { NotFoundError, type PromptStore } from './store.ts'
import type { Message } from './types.ts'

export interface LlmPromptLike { send(messages: Message[]): Promise<unknown> }

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
  if (e instanceof SyntaxError) return 400 // JSON.parse 失败
  const msg = (e as Error)?.message ?? ''
  if (/名称|role 非法|kind 非法|内容块|顺序|普通条目/.test(msg)) return 400
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
 * 路由分派(单 prefix 注册,内部按 URL 形态分发):
 *   GET  /api/prompt/forms                     → 表单列表
 *   POST /api/prompt/forms                     → 新建表单
 *   PUT  /api/prompt/forms/:id                 → 改名
 *   DELETE /api/prompt/forms/:id               → 删除表单
 *   GET  /api/prompt/forms/:id/entries         → 条目列表
 *   POST /api/prompt/forms/:id/entries         → 新建条目
 *   PUT/DELETE /api/prompt/forms/:id/entries/:eid → 更新/删除条目
 *   POST /api/prompt/forms/:id/send            → 组装并发送
 */
export function registerRoutes(register: Register, dep: { store: PromptStore; llm: LlmPromptLike }): () => void {
  const disposers: Array<() => void> = []
  const { store, llm } = dep

  disposers.push(register({
    kind: 'prefix', path: PREFIX,
    handler: async (req, res) => {
      try {
        const url = (req.url ?? '/').split('?')[0]
        const rest = url.startsWith(PREFIX) ? url.slice(PREFIX.length) : ''
        const body = rest.startsWith('forms') ? rest.slice('forms'.length).replace(/^\//, '') : null
        if (body === null) return fail(res, 404, '接口不存在')

        // GET/POST /forms(集合)
        if (body === '') {
          if (req.method === 'GET') return ok(res, await store.listForms())
          if (req.method === 'POST') {
            const { name } = await parseBody<{ name?: unknown }>(req)
            return ok(res, await store.createForm(String(name ?? '')))
          }
          return notAllowed(res)
        }

        const seg = body.split('/').map(decode)
        // /forms/:id(单表单)
        if (seg.length === 1) {
          const [id] = seg
          if (req.method === 'PUT') {
            const { name } = await parseBody<{ name?: unknown }>(req)
            await store.renameForm(id, String(name ?? ''))
            return ok(res, { id })
          }
          if (req.method === 'DELETE') { await store.deleteForm(id); return ok(res, { id }) }
          return notAllowed(res)
        }

        // /forms/:id/send
        if (seg.length === 2 && seg[1] === 'send') {
          if (req.method !== 'POST') return notAllowed(res)
          const messages = await store.getMessages(seg[0])
          if (messages.length === 0) return fail(res, 400, '当前表单没有可发送的非空条目')
          return ok(res, await llm.send(messages))
        }

        // /forms/:id/order(重排条目)
        if (seg.length === 2 && seg[1] === 'order') {
          if (req.method !== 'PUT') return notAllowed(res)
          const { ids } = await parseBody<{ ids?: unknown }>(req)
          await store.reorderEntries(seg[0], Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [])
          return ok(res, { formId: seg[0] })
        }

        // /forms/:id/entries 集合
        if (seg.length === 2 && seg[1] === 'entries') {
          const formId = seg[0]
          if (req.method === 'GET') return ok(res, await store.listEntries(formId))
          if (req.method === 'POST') {
            const b = await parseBody<{ name?: unknown; role?: unknown; text?: unknown; kind?: unknown; blocks?: unknown }>(req)
            const { entryId } = await store.createEntry(formId, {
              name: String(b.name ?? ''), role: b.role as never, text: String(b.text ?? ''), kind: b.kind as never, blocks: b.blocks as never,
            })
            return ok(res, { entryId })
          }
          return notAllowed(res)
        }

        // /forms/:id/entries/:eid 单个条目
        if (seg.length === 3 && seg[1] === 'entries') {
          const [formId, , entryId] = seg
          if (req.method === 'PUT') {
            const b = await parseBody<{ name?: unknown; role?: unknown; text?: unknown; kind?: unknown; blocks?: unknown }>(req)
            await store.updateEntry(formId, entryId, {
              name: String(b.name ?? ''), role: b.role as never, text: String(b.text ?? ''), kind: b.kind as never, blocks: b.blocks as never,
            })
            return ok(res, { entryId })
          }
          if (req.method === 'DELETE') { await store.deleteEntry(formId, entryId); return ok(res, { entryId }) }
          return notAllowed(res)
        }

        return fail(res, 404, '接口不存在')
      } catch (e) {
        fail(res, errStatus(e), (e as Error).message)
      }
    },
  }))
  return () => { disposers.forEach((d) => d()) }
}

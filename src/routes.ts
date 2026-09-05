// agent_plugin_dev/multi-session-plugin/src/routes.ts —— /api/session/* REST
import type { IncomingMessage, ServerResponse } from 'node:http'
import { NotFoundError } from './store.ts'
import type { MultiSessionService } from './service.ts'

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
type Register = (o: { kind: 'exact' | 'prefix'; path: string; handler: Handler }) => () => void

const PREFIX = '/api/session/'

function readBody(req: IncomingMessage): Promise<string> {
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
  return 500
}
function parseBody<T>(req: IncomingMessage): Promise<T> {
  return readBody(req).then((raw) => JSON.parse(raw || '{}') as T)
}
function notAllowed(res: ServerResponse): void {
  fail(res, 405, '不支持的方法')
}

/**
 * 路由:
 *   GET    /api/session/list            会话列表(updated_at DESC)
 *   POST   /api/session/create          新建(标题「新会话」,不激活)
 *   DELETE /api/session/:id             删除 + active 回退
 *   GET/PUT /api/session/active         读写 active 会话(PUT body {sessionId})
 *   GET    /api/session/:id/messages    会话消息(id 升序)
 */
export function registerRoutes(register: Register, dep: { svc: MultiSessionService }): () => void {
  const disposers: Array<() => void> = []
  const { svc } = dep

  disposers.push(register({
    kind: 'prefix', path: PREFIX,
    handler: async (req, res) => {
      try {
        const url = (req.url ?? '/').split('?')[0]
        const rest = url.startsWith(PREFIX) ? url.slice(PREFIX.length) : ''
        const seg = rest.split('/').filter((s) => s !== '')
        const method = req.method ?? 'GET'
        if (seg.length === 0) return fail(res, 404, '接口不存在')
        if (seg[0] === 'list' && seg.length === 1) {
          if (method !== 'GET') return notAllowed(res)
          return ok(res, await svc.listSessions())
        }
        if (seg[0] === 'create' && seg.length === 1) {
          if (method !== 'POST') return notAllowed(res)
          return ok(res, await svc.createSession())
        }
        if (seg[0] === 'active' && seg.length === 1) {
          if (method === 'GET') return ok(res, await svc.getActiveSessionId())
          if (method === 'PUT') {
            const { sessionId } = await parseBody<{ sessionId?: unknown }>(req)
            await svc.setActiveSessionId(String(sessionId ?? ''))
            return ok(res, { sessionId: String(sessionId ?? '') })
          }
          return notAllowed(res)
        }
        if (seg.length === 1) { // 单段资源仅支持 DELETE;其它方法 → 405
          if (method !== 'DELETE') return notAllowed(res)
          await svc.deleteSession(seg[0])
          return ok(res, {})
        }
        if (seg.length === 2 && seg[1] === 'messages') {
          if (method !== 'GET') return notAllowed(res)
          return ok(res, await svc.listMessages(seg[0]))
        }
        return fail(res, 404, '接口不存在')
      } catch (e) {
        fail(res, errStatus(e), (e as Error).message)
      }
    },
  }))
  return () => { disposers.forEach((d) => d()) }
}

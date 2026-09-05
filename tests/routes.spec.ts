import { describe, it, expect } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { createMultiStore } from '../src/store.ts'
import { createSessionService, type MultiSessionService } from '../src/service.ts'
import { registerRoutes } from '../src/routes.ts'

function capture() {
  const db = new DatabaseSync(':memory:')
  const svc: MultiSessionService = createSessionService(createMultiStore(db))
  const handlers = new Map<string, (req: IncomingMessage, res: ServerResponse) => void | Promise<void>>()
  const dispose = registerRoutes((o) => { handlers.set(o.path, o.handler); return () => handlers.delete(o.path) }, { svc })
  const call = async (path: string, body?: unknown, method = 'GET') => {
    const h = handlers.get('/api/session/')!
    const req = {
      url: path, method,
      on(type: string, cb: (c?: unknown) => void) {
        if (type === 'data') cb(Buffer.from(body === undefined ? '' : JSON.stringify(body)))
        if (type === 'end') cb()
      },
    } as unknown as IncomingMessage
    let out = ''; let status = 0
    const res = { writeHead(s: number) { status = s }, end(b: string) { out = b } } as unknown as ServerResponse
    await h(req, res)
    return { status, json: JSON.parse(out || '{}') }
  }
  return { call, dispose, db }
}

describe('multi session routes', () => {
  it('create → list 含新会话;messages 空数组;active 默认 null', async () => {
    const c = capture()
    const created = await c.call('/api/session/create', {}, 'POST')
    expect(created.status).toBe(200)
    const id = created.json.data.id as string
    expect(id.startsWith('s_')).toBe(true)
    expect(created.json.data.title).toBe('新会话')
    const list = await c.call('/api/session/list')
    expect(list.json.data).toHaveLength(1)
    expect(list.json.data[0].title).toBe('新会话')
    expect((await c.call('/api/session/active')).json.data).toBeNull()
    const msgs = await c.call('/api/session/' + id + '/messages')
    expect(msgs.status).toBe(200)
    expect(msgs.json.data).toEqual([])
    c.dispose(); c.db.close()
  })

  it('PUT active 后 GET 返回;不存在的会话 → 404 中文', async () => {
    const c = capture()
    const id = (await c.call('/api/session/create', {}, 'POST')).json.data.id as string
    expect((await c.call('/api/session/active', { sessionId: id }, 'PUT')).status).toBe(200)
    expect((await c.call('/api/session/active')).json.data).toBe(id)
    const r = await c.call('/api/session/active', { sessionId: 's_ghost' }, 'PUT')
    expect(r.status).toBe(404)
    expect(r.json.message).toContain('会话不存在')
    c.dispose(); c.db.close()
  })

  it('DELETE 会话(active)→ 回退;DELETE 不存在 → 404;方法不符 405;未知路径 404', async () => {
    const c = capture()
    const a = (await c.call('/api/session/create', {}, 'POST')).json.data.id as string
    await c.call('/api/session/create', {}, 'POST')
    await c.call('/api/session/active', { sessionId: a }, 'PUT')
    expect((await c.call('/api/session/' + a, undefined, 'DELETE')).status).toBe(200)
    expect((await c.call('/api/session/active')).json.data).not.toBe(a) // 回退到剩余会话
    expect((await c.call('/api/session/' + a, undefined, 'DELETE')).status).toBe(404)
    expect((await c.call('/api/session/list', undefined, 'POST')).status).toBe(405)
    expect((await c.call('/api/session/nope')).status).toBe(405) // 单段资源仅支持 DELETE
    expect((await c.call('/api/session/x/y')).status).toBe(404) // 未知子路径
    c.dispose(); c.db.close()
  })
})

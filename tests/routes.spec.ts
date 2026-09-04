import { describe, it, expect } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { registerRoutes } from '../src/routes.ts'
import { createStore, type PersistJsonLike, type PromptStore } from '../src/store.ts'
import type { Message } from '../src/types.ts'

function memPersist(): PersistJsonLike {
  const map = new Map<string, unknown>()
  return {
    async read(p) { return map.has(p) ? map.get(p)! : null },
    async write(p, d) { map.set(p, d) },
    async list(p) {
      const prefix = p.endsWith('/') ? p : p + '/'
      const names = new Set<string>()
      for (const k of map.keys()) {
        if (!k.startsWith(prefix)) continue
        const seg = k.slice(prefix.length).split('/')[0]
        if (seg) names.add(seg)
      }
      return [...names]
    },
    async delete(p) {
      for (const k of [...map.keys()]) { if (k === p || k.startsWith(p + '/')) map.delete(k) }
    },
  }
}

function capture(dep: { llm: { send(m: Message[]): Promise<unknown> } }) {
  const store: PromptStore = createStore(memPersist())
  const handlers = new Map<string, (req: IncomingMessage, res: ServerResponse) => void | Promise<void>>()
  const dispose = registerRoutes((o) => { handlers.set(o.path, o.handler); return () => handlers.delete(o.path) }, { store, llm: dep.llm })
  const call = async (path: string, body?: unknown, method = 'GET') => {
    const h = handlers.get('/api/prompt/')!
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
  return { store, call, dispose }
}

describe('prompt routes v3', () => {
  it('表单 CRUD', async () => {
    const c = capture({ llm: { send: async () => ({}) } })
    const fid: string = (await c.call('/api/prompt/forms', { name: '客服' }, 'POST')).json.data.id
    expect((await c.call('/api/prompt/forms')).json.data).toEqual([{ id: fid, name: '客服', entryCount: 0 }])
    expect((await c.call(`/api/prompt/forms/${fid}`, { name: '客服2' }, 'PUT')).json.ok).toBe(true)
    expect((await c.call(`/api/prompt/forms/${fid}`, undefined, 'DELETE')).json.ok).toBe(true)
    c.dispose()
  })

  it('三类条目创建与平铺返回;非法 → 400', async () => {
    const c = capture({ llm: { send: async () => ({}) } })
    const fid: string = (await c.call('/api/prompt/forms', { name: 'f' }, 'POST')).json.data.id
    const plain = await c.call(`/api/prompt/forms/${fid}/entries`, { name: '普', role: 'user', text: 't' }, 'POST')
    expect(plain.status).toBe(200)
    const group = await c.call(`/api/prompt/forms/${fid}/entries`, { name: '父', role: 'system', kind: 'group' }, 'POST')
    const gid: string = group.json.data.entryId
    const child = await c.call(`/api/prompt/forms/${fid}/entries`, { name: '子', base: gid, text: '段' }, 'POST')
    expect(child.status).toBe(200)
    const list = await c.call(`/api/prompt/forms/${fid}/entries`)
    expect(list.json.data).toHaveLength(3)
    expect(list.json.data[0].id).toBe(plain.json.data.entryId)
    expect(list.json.data[1].kind).toBe('group')
    expect(list.json.data[1].children).toEqual([child.json.data.entryId])
    expect(list.json.data[2].base).toBe(gid)
    const bad = await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'x', base: 'e_no', text: 't' }, 'POST')
    expect(bad.status).toBe(400)
    c.dispose()
  })

  it('update 改 base → 400;delete 父级联;order 保存全层级', async () => {
    const c = capture({ llm: { send: async () => ({}) } })
    const fid: string = (await c.call('/api/prompt/forms', { name: 'f' }, 'POST')).json.data.id
    const g = await c.call(`/api/prompt/forms/${fid}/entries`, { name: '父', role: 'user', kind: 'group' }, 'POST')
    const gid: string = g.json.data.entryId
    const c1 = await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'c1', base: gid, text: '1' }, 'POST')
    const c2 = await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'c2', base: gid, text: '2' }, 'POST')
    expect((await c.call(`/api/prompt/forms/${fid}/entries/${c1.json.data.entryId}`, { base: 'f_other' }, 'PUT')).status).toBe(400)
    const ord = await c.call(`/api/prompt/forms/${fid}/order`, { entries: [gid], children: { [gid]: [c2.json.data.entryId, c1.json.data.entryId] } }, 'PUT')
    expect(ord.status).toBe(200)
    const list = await c.call(`/api/prompt/forms/${fid}/entries`)
    expect(list.json.data.map((x: { id: string }) => x.id)).toEqual([gid, c2.json.data.entryId, c1.json.data.entryId])
    expect((await c.call(`/api/prompt/forms/${fid}/entries/${gid}`, undefined, 'DELETE')).json.ok).toBe(true)
    expect((await c.call(`/api/prompt/forms/${fid}/entries`)).json.data).toEqual([])
    c.dispose()
  })

  it('send:普通独立 + 父聚合', async () => {
    const sent: Message[][] = []
    const c = capture({ llm: { send: async (m: Message[]) => { sent.push(m); return {} } } })
    const fid: string = (await c.call('/api/prompt/forms', { name: 'f' }, 'POST')).json.data.id
    await c.call(`/api/prompt/forms/${fid}/entries`, { name: '系统', role: 'system', text: 'sys' }, 'POST')
    const g = await c.call(`/api/prompt/forms/${fid}/entries`, { name: '父', role: 'user', kind: 'group' }, 'POST')
    const gid: string = g.json.data.entryId
    await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'c1', base: gid, text: '一' }, 'POST')
    await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'c2', base: gid, text: '二' }, 'POST')
    const r = await c.call(`/api/prompt/forms/${fid}/send`, undefined, 'POST')
    expect(r.status).toBe(200)
    expect(sent).toEqual([[{ role: 'system', content: 'sys' }, { role: 'user', content: '一\n\n二' }]])
    expect((await c.call(`/api/prompt/forms/f_ghost/send`, undefined, 'POST')).status).toBe(404)
    c.dispose()
  })
})

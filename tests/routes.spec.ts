import { describe, it, expect } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { registerRoutes } from '../src/routes.ts'
import { createStore, type PersistJsonLike, type PromptStore } from '../src/store.ts'
import type { Message } from '../src/types.ts'

/** 与 store.spec 相同的内存 persist(重复声明;文件级内聚优先) */
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

describe('prompt routes', () => {
  it('表单 CRUD:创建→改名→列表→删除(状态码 200)', async () => {
    const c = capture({ llm: { send: async () => ({}) } })
    const r1 = await c.call('/api/prompt/forms', { name: '客服' }, 'POST')
    expect(r1.status).toBe(200); expect(r1.json.ok).toBe(true)
    const fid: string = r1.json.data.id
    const r2 = await c.call(`/api/prompt/forms/${fid}`, { name: '客服2' }, 'PUT')
    expect(r2.json.ok).toBe(true)
    const r3 = await c.call('/api/prompt/forms')
    expect(r3.json.data).toEqual([{ id: fid, name: '客服2', entryCount: 0 }])
    const r4 = await c.call(`/api/prompt/forms/${fid}`, undefined, 'DELETE')
    expect(r4.json.ok).toBe(true)
    expect((await c.call('/api/prompt/forms')).json.data).toEqual([])
    c.dispose()
  })

  it('表单名非法 → 400;操作不存在表单 → 404', async () => {
    const c = capture({ llm: { send: async () => ({}) } })
    expect((await c.call('/api/prompt/forms', { name: ' ' }, 'POST')).status).toBe(400)
    expect((await c.call('/api/prompt/forms/f_no', { name: 'x' }, 'PUT')).status).toBe(404)
    expect((await c.call('/api/prompt/forms/f_no', undefined, 'DELETE')).status).toBe(404)
    c.dispose()
  })

  it('条目 CRUD + getMessages 顺序,非法 role → 400', async () => {
    const c = capture({ llm: { send: async () => ({}) } })
    const fid: string = (await c.call('/api/prompt/forms', { name: 'f' }, 'POST')).json.data.id
    const e1 = await c.call(`/api/prompt/forms/${fid}/entries`, { name: '系统', role: 'system', text: '你是助手' }, 'POST')
    const eid1: string = e1.json.data.entryId
    const e2 = await c.call(`/api/prompt/forms/${fid}/entries`, { name: '用户', role: 'user', text: '你好' }, 'POST')
    expect(e2.status).toBe(200)
    const bad = await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'x', role: 'admin', text: '' }, 'POST')
    expect(bad.status).toBe(400)
    const upd = await c.call(`/api/prompt/forms/${fid}/entries/${eid1}`, { name: '系统改', role: 'system', text: '新文本' }, 'PUT')
    expect(upd.json.ok).toBe(true)
    const listR = await c.call(`/api/prompt/forms/${fid}/entries`)
    expect(listR.status).toBe(200)
    expect(listR.json.data.map((x: { name: string }) => x.name)).toEqual(['系统改', '用户'])
    const del = await c.call(`/api/prompt/forms/${fid}/entries/${eid1}`, undefined, 'DELETE')
    expect(del.json.ok).toBe(true)
    expect((await c.call(`/api/prompt/forms/${fid}/entries/${eid1}`, { name: 'x', role: 'user', text: '' }, 'PUT')).status).toBe(404)
    c.dispose()
  })

  it('send 组装并透传 llmPrompt 返回;空消息 → 400;llm 抛错透传', async () => {
    const sent: Message[][] = []
    const c = capture({
      llm: { send: async (m: Message[]) => { sent.push(m); return { choices: [{ message: { content: 'hi' } }] } } },
    })
    const fid: string = (await c.call('/api/prompt/forms', { name: 'f' }, 'POST')).json.data.id
    await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'a', role: 'system', text: 'sys' }, 'POST')
    await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'b', role: 'user', text: '' }, 'POST')
    await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'c', role: 'user', text: 'hi' }, 'POST')
    const r = await c.call(`/api/prompt/forms/${fid}/send`, undefined, 'POST')
    expect(r.status).toBe(200); expect(r.json.data).toEqual({ choices: [{ message: { content: 'hi' } }] })
    expect(sent).toEqual([[{ role: 'system', content: 'sys' }, { role: 'user', content: 'hi' }]])
    // 空表单:全部条目 text 为空
    const fid2: string = (await c.call('/api/prompt/forms', { name: 'f2' }, 'POST')).json.data.id
    const r2 = await c.call(`/api/prompt/forms/${fid2}/send`, undefined, 'POST')
    expect(r2.status).toBe(400)
    c.dispose()
  })

  it('send 时 llm 抛错 → message 原样透传(status 500)', async () => {
    const c = capture({ llm: { send: async () => { throw new Error('未选择预设,请先在 LLM 面板选择一套预设') } } })
    const fid: string = (await c.call('/api/prompt/forms', { name: 'f' }, 'POST')).json.data.id
    await c.call(`/api/prompt/forms/${fid}/entries`, { name: 'a', role: 'user', text: 'hi' }, 'POST')
    const r = await c.call(`/api/prompt/forms/${fid}/send`, undefined, 'POST')
    expect(r.status).toBe(500)
    expect(r.json.message).toBe('未选择预设,请先在 LLM 面板选择一套预设')
    c.dispose()
  })
})

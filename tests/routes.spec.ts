import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { initPresets, createPreset } from '../src/db.ts'
import { registerRoutes } from '../src/routes.ts'

const fakeCred = {
  map: new Map<string, string>(),
  async set(n: string, s: string) { this.map.set(n, s) },
  async get(n: string) { return this.map.get(n) ?? null },
  async delete(n: string) { this.map.delete(n) },
}

function capture(db: DatabaseSync, fetchImpl?: typeof fetch) {
  const handlers = new Map<string, (req: IncomingMessage, res: ServerResponse) => void | Promise<void>>()
  const dispose = registerRoutes((o) => { handlers.set(o.path, o.handler); return () => handlers.delete(o.path) }, { db, cred: fakeCred, fetchImpl })
  const call = async (path: string, body?: unknown, method = 'POST') => {
    const h = handlers.get(path) ?? [...handlers.entries()].find(([k]) => k.endsWith('/') && path.startsWith(k))?.[1]
    const req = {
      url: path, method,
      on(type: string, cb: (c?: unknown) => void) { if (type === 'data') cb(Buffer.from(JSON.stringify(body ?? {}))); if (type === 'end') cb() },
    } as unknown as IncomingMessage
    let out = ''; let status = 0
    const res = { writeHead(s: number) { status = s }, end(b: string) { out = b } } as unknown as ServerResponse
    await h(req, res)
    return { status, json: JSON.parse(out || '{}') }
  }
  return { call, dispose }
}

describe('routes', () => {
  let db: DatabaseSync
  beforeEach(() => { db = new DatabaseSync(':memory:'); initPresets(db) })

  it('GET presets 返回列表', async () => {
    createPreset(db, { presetName: 'a', format: 'openai_compatible', vendor: 'deepseek', baseUrl: 'x', model: 'm', timeout: 30 })
    const c = capture(db)
    const r = await c.call('/api/llm/presets', undefined, 'GET')
    expect(r.json.ok).toBe(true)
    expect(r.json.data[0].id).toBe(1)
    expect(r.json.data[0].hasKey).toBe(false)
    c.dispose()
  })

  it('POST 新建返回 id 并写凭据', async () => {
    const c = capture(db)
    const r = await c.call('/api/llm/presets', { presetName: 'a', format: 'openai_compatible', vendor: 'deepseek', baseUrl: 'x', model: 'm', timeout: 30, apiKey: 'sk-1' })
    expect(r.json.ok).toBe(true)
    expect(r.json.data.id).toBe(1)
    expect(fakeCred.map.get('llm:1')).toBe('sk-1')
    c.dispose()
  })

  it('POST 无 apiKey 报错', async () => {
    const c = capture(db)
    const r = await c.call('/api/llm/presets', { presetName: 'a', format: 'openai_compatible', vendor: 'deepseek', baseUrl: 'x', model: 'm', timeout: 30 })
    expect(r.json.ok).toBe(false)
    c.dispose()
  })

  it('models 拉取(openai) + test 发送', async () => {
    const id = createPreset(db, { presetName: 'a', format: 'openai_compatible', vendor: 'deepseek', baseUrl: 'api.deepseek.com/v1', model: 'deepseek-chat', timeout: 30 })
    fakeCred.map.set(`llm:${id}`, 'sk-1')
    const calls: string[] = []
    const fetchImpl = (async (url: unknown) => {
      const u = String(url)
      calls.push(u)
      if (u.includes('chat/completions')) return { status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: 'pong' } }] }) }
      return { status: 200, text: async () => JSON.stringify({ data: [{ id: 'deepseek-chat' }] }) }
    }) as unknown as typeof fetch
    const c = capture(db, fetchImpl)
    const m = await c.call('/api/llm/models', { id })
    expect(m.json.ok).toBe(true)
    expect(m.json.data.models).toEqual(['deepseek-chat'])
    const t = await c.call('/api/llm/test', { id })
    expect(t.json.ok).toBe(true)
    expect(t.json.data.ok).toBe(true)
    expect(calls.some((u) => u.includes('chat/completions'))).toBe(true)
    c.dispose()
  })

  it('DELETE 删除配置与凭据', async () => {
    const id = createPreset(db, { presetName: 'a', format: 'openai_compatible', vendor: 'deepseek', baseUrl: 'x', model: 'm', timeout: 30 })
    fakeCred.map.set(`llm:${id}`, 'sk')
    const c = capture(db)
    const r = await c.call(`/api/llm/presets/${id}`, undefined, 'DELETE')
    expect(r.json.ok).toBe(true)
    expect(fakeCred.map.has(`llm:${id}`)).toBe(false)
    c.dispose()
  })
})

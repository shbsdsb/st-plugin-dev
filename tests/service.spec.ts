import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { initPresets, createPreset, setActivePresetId } from '../src/db.ts'
import { createLlmPromptService } from '../src/service.ts'

const fakeCred = {
  map: new Map<string, string>(),
  async set(n: string, s: string) { this.map.set(n, s) },
  async get(n: string) { return this.map.get(n) ?? null },
  async delete(n: string) { this.map.delete(n) },
}

describe('llmPrompt service', () => {
  let db: DatabaseSync
  beforeEach(() => { db = new DatabaseSync(':memory:'); initPresets(db) })

  it('messages 非法(空数组)抛错且不请求', async () => {
    const svc = createLlmPromptService({ db, cred: fakeCred })
    await expect(svc.send([])).rejects.toThrow('messages')
  })
  it('messages 项 role 非法抛错', async () => {
    const svc = createLlmPromptService({ db, cred: fakeCred })
    await expect(svc.send([{ role: 'tool' as never, content: 'x' }])).rejects.toThrow('role')
  })
  it('无 active 预设抛错', async () => {
    const svc = createLlmPromptService({ db, cred: fakeCred })
    await expect(svc.send([{ role: 'user', content: 'x' }])).rejects.toThrow('未选择预设')
  })
  it('active 预设无密钥抛错', async () => {
    createPreset(db, { presetName: 'a', format: 'openai_compatible', vendor: '', baseUrl: 'x', model: 'm', timeout: 30 })
    setActivePresetId(db, 1)
    const svc = createLlmPromptService({ db, cred: fakeCred })
    await expect(svc.send([{ role: 'user', content: 'x' }])).rejects.toThrow('密钥')
  })
  it('HTTP 非 2xx 抛错', async () => {
    createPreset(db, { presetName: 'a', format: 'openai_compatible', vendor: '', baseUrl: 'api.x.com/v1', model: 'm', timeout: 30 })
    setActivePresetId(db, 1)
    await fakeCred.set('llm:1', 'k')
    const fetchImpl = (async () => new Response('err', { status: 500 })) as unknown as typeof fetch
    const svc = createLlmPromptService({ db, cred: fakeCred, fetchImpl })
    await expect(svc.send([{ role: 'user', content: 'x' }])).rejects.toThrow('HTTP 500')
  })
  it('成功返回原始响应 json(透传不解析)', async () => {
    createPreset(db, { presetName: 'a', format: 'openai_compatible', vendor: '', baseUrl: 'api.x.com/v1', model: 'm', timeout: 30 })
    setActivePresetId(db, 1)
    await fakeCred.set('llm:1', 'k')
    const raw = { choices: [{ message: { content: '答复' } }], usage: { total_tokens: 9 } }
    const fetchImpl = (async () => new Response(JSON.stringify(raw), { status: 200 })) as unknown as typeof fetch
    const svc = createLlmPromptService({ db, cred: fakeCred, fetchImpl })
    await expect(svc.send([{ role: 'user', content: 'hi' }])).resolves.toEqual(raw)
  })
  it('网络错误(fetch reject)包装为中文 请求失败', async () => {
    createPreset(db, { presetName: 'a', format: 'openai_compatible', vendor: '', baseUrl: 'api.x.com/v1', model: 'm', timeout: 30 })
    setActivePresetId(db, 1)
    await fakeCred.set('llm:1', 'k')
    const fetchImpl = (async () => { throw new TypeError('fetch failed') }) as unknown as typeof fetch
    const svc = createLlmPromptService({ db, cred: fakeCred, fetchImpl })
    await expect(svc.send([{ role: 'user', content: 'x' }])).rejects.toThrow('请求失败')
  })
  it('超时(DOMException TimeoutError)抛中文 请求超时', async () => {
    createPreset(db, { presetName: 'a', format: 'openai_compatible', vendor: '', baseUrl: 'api.x.com/v1', model: 'm', timeout: 30 })
    setActivePresetId(db, 1)
    await fakeCred.set('llm:1', 'k')
    const fetchImpl = (async () => { throw new DOMException('The operation timed out', 'TimeoutError') }) as unknown as typeof fetch
    const svc = createLlmPromptService({ db, cred: fakeCred, fetchImpl })
    await expect(svc.send([{ role: 'user', content: 'x' }])).rejects.toThrow('请求超时')
  })
})

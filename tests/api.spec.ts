import { describe, it, expect, vi } from 'vitest'
import { apiFetch, listPresets, testPreset } from '../src/ui/api.ts'

describe('api', () => {
  it('apiFetch 解析响应', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, data: [1] }) })))
    const r = await apiFetch('/api/llm/presets')
    expect(r.ok).toBe(true)
    expect(r.data).toEqual([1])
    vi.unstubAllGlobals()
  })

  it('listPresets 失败抛错(不再静默 [])', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: false, message: 'boom' }) })))
    await expect(listPresets()).rejects.toThrow('boom')
    vi.unstubAllGlobals()
  })

  it('testPreset 字段入参转发 body', async () => {
    const fetchMock = vi.fn(async (_url: unknown, _init?: unknown) => ({ ok: true, json: async () => ({ ok: true, data: { ok: true } }) }))
    vi.stubGlobal('fetch', fetchMock)
    const input = { format: 'openai', baseUrl: 'https://api.example.com/v1', model: 'gpt-4o', apiKey: 'sk-test-123' }
    await expect(testPreset(input)).resolves.toBe(true)
    const [url, init] = fetchMock.mock.calls[0] as [string, { method?: string; body?: string }]
    expect(url).toBe('/api/llm/test')
    expect(init.method).toBe('POST')
    const sent = JSON.parse(init.body ?? '') as { format?: string; baseUrl?: string; model?: string; apiKey?: string }
    expect(sent).toMatchObject(input)
    vi.unstubAllGlobals()
  })

  it('testPreset ok:false 抛错', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: false, message: '请求失败: HTTP 401' }) })))
    await expect(testPreset({ id: 1 })).rejects.toThrow('HTTP 401')
    vi.unstubAllGlobals()
  })
})

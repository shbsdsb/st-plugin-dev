import { describe, it, expect, vi } from 'vitest'
import { apiFetch } from '../src/ui/api.ts'

describe('api', () => {
  it('apiFetch 解析响应', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, data: [1] }) })))
    const r = await apiFetch('/api/llm/presets')
    expect(r.ok).toBe(true)
    expect(r.data).toEqual([1])
    vi.unstubAllGlobals()
  })
})

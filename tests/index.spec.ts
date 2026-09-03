import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import apply from '../src/index.ts'

describe('llm-plugin 骨架', () => {
  it('inject 依赖 webServer/persistDb/credential', () => {
    expect((apply as unknown as { inject?: string[] }).inject).toEqual(['webServer', 'persistDb', 'credential'])
  })
  it('Config 为无配置 schema(~standard validate 透传)', () => {
    const cfg = (apply as unknown as { Config?: { '~standard'?: { validate: (v: unknown) => { value: unknown } } } }).Config
    expect(cfg?.['~standard']?.validate(undefined)).toEqual({ value: {} })
  })
  it('默认导出为函数', () => {
    expect(typeof apply).toBe('function')
  })
})

describe('llm-plugin 接线', () => {
  it('apply 打开 db 并注册路由', async () => {
    let opened = 0
    const registered: string[] = []
    const db = new DatabaseSync(':memory:')
    const ctx = {
      effect: (fn: () => void | Promise<unknown>) => { void fn() },
      persistDb: { open: async () => { opened += 1; return db } },
      webServer: { register: (o: { path: string }) => { registered.push(o.path); return () => {} } },
      credential: { set: async () => {}, get: async () => null, delete: async () => {} },
    } as never
    ;(apply as (c: unknown, cfg: unknown) => void)(ctx, {})
    await new Promise((r) => setTimeout(r, 0))
    expect(opened).toBe(1)
    expect(registered).toContain('/api/llm/presets')
    expect(registered).toContain('/api/llm/presets/')
    expect(registered).toContain('/api/llm/models')
    expect(registered).toContain('/api/llm/test')
    expect(registered.length).toBeGreaterThanOrEqual(4)
  })
})

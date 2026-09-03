import { describe, it, expect } from 'vitest'
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

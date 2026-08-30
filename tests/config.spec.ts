// agent_plugin_dev/host-plugin/tests/config.spec.ts(替换 loadConfig 用例)
import { describe, expect, it } from 'vitest'
import { HostConfigSchema, DEFAULT_CONFIG, normalizeConfig, resolveListenTarget, type HostConfig } from '../src/config.ts'

function validate(raw: unknown): HostConfig {
  return (HostConfigSchema['~standard'].validate(raw) as { value: HostConfig }).value
}

describe('HostConfigSchema', () => {
  it('空/缺失 → 默认配置', () => {
    expect(validate(undefined)).toEqual(DEFAULT_CONFIG)
    expect(validate({})).toEqual(DEFAULT_CONFIG)
  })

  it('合法值通过', () => {
    expect(validate({ host: '0.0.0.0', port: 8080, listen: true, listenWhitelist: ['127.0.0.1'], open: false }))
      .toEqual({ host: '0.0.0.0', port: 8080, listen: true, listenWhitelist: ['127.0.0.1'], open: false })
  })

  it('非法 port(非整数/越界/非数字)→ 默认', () => {
    expect(validate({ port: 70000 }).port).toBe(3000)
    expect(validate({ port: 0 }).port).toBe(3000)
    expect(validate({ port: '8080' }).port).toBe(3000)
  })

  it('类型容错:非白名单数组/非布尔 → 默认', () => {
    expect(validate({ listenWhitelist: 'x' }).listenWhitelist).toEqual([])
    expect(validate({ open: 'yes' }).open).toBe(true)
  })
})

describe('normalizeConfig/resolveListenTarget', () => {
  it('normalizeConfig 与 schema 一致(单源默认)', () => {
    expect(normalizeConfig({ port: 8080 }).port).toBe(8080)
    expect(normalizeConfig(undefined)).toEqual(DEFAULT_CONFIG)
  })

  it('resolveListenTarget:listen=false → host;listen=true+白名单 → 白名单[0];无白名单 → 0.0.0.0', () => {
    expect(resolveListenTarget({ ...DEFAULT_CONFIG, listen: false })).toBe('127.0.0.1')
    expect(resolveListenTarget({ ...DEFAULT_CONFIG, listen: true, listenWhitelist: ['10.0.0.1'] })).toBe('10.0.0.1')
    expect(resolveListenTarget({ ...DEFAULT_CONFIG, listen: true })).toBe('0.0.0.0')
  })
})

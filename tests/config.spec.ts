// agent_plugin_dev/host-plugin/tests/config.spec.ts(替换 loadConfig 用例)
import { describe, expect, it } from 'vitest'
import { HostConfigSchema, DEFAULT_CONFIG, normalizeConfig, resolveListenTarget, ipInWhitelist, parseCIDR, ipv4ToInt, type HostConfig } from '../src/config.ts'

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

  it('resolveListenTarget:listen=false → host;listen=true 恒 → 0.0.0.0(监听所有接口,白名单仅过滤)', () => {
    expect(resolveListenTarget({ ...DEFAULT_CONFIG, listen: false })).toBe('127.0.0.1')
    expect(resolveListenTarget({ ...DEFAULT_CONFIG, listen: true, listenWhitelist: ['10.0.0.1'] })).toBe('0.0.0.0')
    expect(resolveListenTarget({ ...DEFAULT_CONFIG, listen: true })).toBe('0.0.0.0')
    expect(resolveListenTarget({ ...DEFAULT_CONFIG, listen: true, listenWhitelist: ['192.168.1.0/24'] })).toBe('0.0.0.0')
  })
})

describe('CIDR 来源白名单', () => {
  it('ipv4ToInt/parseCIDR 解析', () => {
    expect(ipv4ToInt('192.168.1.1')).toBe(0xc0a80101)
    expect(ipv4ToInt('999.1.1.1')).toBeNull()
    expect(ipv4ToInt('127.0.0.1')).toBe(0x7f000001)
    expect(parseCIDR('192.168.1.0/24')).toEqual({ base: 0xc0a80100, prefix: 24 })
    expect(parseCIDR('127.0.0.1')).toBeNull()
    expect(parseCIDR('1.2.3.4/33')).toBeNull()
  })

  it('ipInWhitelist:精确 IP / CIDR / ::ffff: 前缀匹配', () => {
    expect(ipInWhitelist('10.0.0.1', ['10.0.0.1'])).toBe(true)
    expect(ipInWhitelist('10.0.0.2', ['10.0.0.1'])).toBe(false)
    expect(ipInWhitelist('192.168.1.55', ['192.168.1.0/24'])).toBe(true)
    expect(ipInWhitelist('192.168.2.55', ['192.168.1.0/24'])).toBe(false)
    expect(ipInWhitelist('::ffff:10.0.0.1', ['10.0.0.1'])).toBe(true)
    expect(ipInWhitelist('10.0.0.1', [])).toBe(false)
  })
})

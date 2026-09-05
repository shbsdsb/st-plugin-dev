import { describe, it, expect } from 'vitest'
import { makeTime, truncate, jsonArgs, renderLine } from '../src/format.ts'

describe('format 时间戳/截断/行', () => {
  it('makeTime:HH:mm:ss 与 HH:mm:ss.SSS', () => {
    const d = new Date(2026, 0, 5, 9, 8, 7, 12)
    expect(makeTime(d, 'HH:mm:ss')).toBe('2026-01-05 09:08:07')
    expect(makeTime(d, 'HH:mm:ss.SSS')).toBe('2026-01-05 09:08:07.012')
  })
  it('truncate:超长截断带标记,短于等于原样', () => {
    expect(truncate('abc', 5)).toBe('abc')
    const out = truncate('a'.repeat(30), 10)
    expect(out.startsWith('a'.repeat(10))).toBe(true)
    expect(out).toContain('截断 20 字符')
  })
  it('jsonArgs:序列化多参;函数/undefined/循环引用不抛', () => {
    expect(jsonArgs(['x', { a: 1 }], 120)).toBe('"x", {"a":1}')
    const cyc: Record<string, unknown> = {}; cyc.self = cyc
    const out = jsonArgs([undefined, function () {}, cyc], 120)
    expect(out).toContain('undefined')
    expect(out).toContain('function')
    expect(out).toContain('[object Object]')
  })
  it('renderLine:无 detail 不尾随空格', () => {
    expect(renderLine({ time: 't', kind: 'load', plugin: 'prompt-plugin', detail: '' })).toBe('[t] [load] prompt-plugin')
    expect(renderLine({ time: 't', kind: 'service', plugin: 'core', detail: 'provide webServer' })).toBe('[t] [service] core provide webServer')
  })
})

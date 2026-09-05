import { describe, it, expect } from 'vitest'
import { normalizeConfig } from '../src/config.ts'

describe('config 归一', () => {
  it('缺省输入 → 全开默认(file true,timeFormat HH:mm:ss.SSS)', () => {
    expect(normalizeConfig(undefined)).toEqual({
      lifecycle: true, service: true, events: true, file: true, timeFormat: 'HH:mm:ss.SSS',
    })
  })
  it('显式 false/true 覆盖;未知字段忽略', () => {
    expect(normalizeConfig({ lifecycle: false, events: false, file: false, extra: 1 })).toEqual({
      lifecycle: false, service: true, events: false, file: false, timeFormat: 'HH:mm:ss.SSS',
    })
  })
  it('timeFormat 仅接受 HH:mm:ss 或 HH:mm:ss.SSS,否则回落默认', () => {
    expect(normalizeConfig({ timeFormat: 'HH:mm:ss' }).timeFormat).toBe('HH:mm:ss')
    expect(normalizeConfig({ timeFormat: 'xx' as never }).timeFormat).toBe('HH:mm:ss.SSS')
  })
})

import { describe, it, expect } from 'vitest'
import { buildModelOptions } from '../src/ui/config-panel.ts'

describe('config-panel', () => {
  it('buildModelOptions 按当前值标记 active', () => {
    const opts = buildModelOptions(['deepseek-chat', 'glm-4'], 'glm-4')
    expect(opts).toEqual([
      { name: 'deepseek-chat', active: false },
      { name: 'glm-4', active: true },
    ])
  })
  it('当前值不在列表则全部 inactive', () => {
    const opts = buildModelOptions(['a', 'b'], 'x')
    expect(opts.every((o) => o.active === false)).toBe(true)
  })
})

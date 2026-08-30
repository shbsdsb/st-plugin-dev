// agent_plugin_dev/client-find/tests/topo.spec.ts
import { describe, expect, it } from 'vitest'
import { topoSort, checkImmedConsistency } from '../src/topo.ts'
import type { ClientBootEntry } from '../src/types.ts'

describe('topoSort', () => {
  it('依赖在前(链 A→B→C 输出 C,B,A 序)', () => {
    const { order, warnings } = topoSort([
      { id: 'A', deps: ['B'] },
      { id: 'B', deps: ['C'] },
      { id: 'C', deps: [] },
    ])
    expect(order).toEqual(['C', 'B', 'A'])
    expect(warnings).toEqual([])
  })

  it('多依赖与无依赖条目(无依赖按输入序)', () => {
    const { order, warnings } = topoSort([
      { id: 'X', deps: ['Y', 'Z'] },
      { id: 'Y', deps: [] },
      { id: 'Z', deps: [] },
    ])
    expect(order.indexOf('Y')).toBeLessThan(order.indexOf('X'))
    expect(order.indexOf('Z')).toBeLessThan(order.indexOf('X'))
    expect(warnings).toEqual([])
  })

  it('环 → 警告 + 剩余条目置末尾', () => {
    const { order, warnings } = topoSort([
      { id: 'A', deps: ['B'] },
      { id: 'B', deps: ['A'] },
    ])
    expect(order).toHaveLength(2)
    expect(warnings.some((w) => w.includes('环'))).toBe(true)
  })

  it('缺失依赖 → 警告,条目保留', () => {
    const { order, warnings } = topoSort([{ id: 'A', deps: ['missing'] }])
    expect(order).toEqual(['A'])
    expect(warnings.some((w) => w.includes('missing'))).toBe(true)
  })
})

describe('checkImmedConsistency', () => {
  it('immed true 依赖 immed false → 警告', () => {
    const entries: ClientBootEntry[] = [
      { id: 'A', url: '/plugins/A/a.cjs', inject: ['B'], immed: true },
      { id: 'B', url: '/plugins/B/b.cjs', inject: [], immed: false },
    ]
    const warnings = checkImmedConsistency(entries)
    expect(warnings.some((w) => w.includes('A') && w.includes('B'))).toBe(true)
  })

  it('依赖均为 immed true / 依赖方 immed false → 无警告', () => {
    const entries: ClientBootEntry[] = [
      { id: 'A', url: '/plugins/A/a.cjs', inject: ['B'], immed: true },
      { id: 'B', url: '/plugins/B/b.cjs', inject: [], immed: true },
      { id: 'C', url: '/plugins/C/c.cjs', inject: ['D'], immed: false },
      { id: 'D', url: '/plugins/D/d.cjs', inject: [], immed: false },
    ]
    expect(checkImmedConsistency(entries)).toEqual([])
  })
})

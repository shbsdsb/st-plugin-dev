import { describe, it, expect } from 'vitest'
import { buildMessages } from '../src/messages.ts'
import type { Entry } from '../src/types.ts'

const entry = (over: Partial<Entry>): Entry => ({ id: 'e1', name: 'n', role: 'user', text: 'hello', ...over })

describe('buildMessages', () => {
  it('按传入顺序输出 role/content', () => {
    const es = [entry({ id: '1', role: 'system', text: 'sys' }), entry({ id: '2', role: 'user', text: 'u' })]
    expect(buildMessages(es)).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'u' },
    ])
  })
  it('跳过 text 为空或纯空白的条目,保留其余顺序', () => {
    const es = [entry({ id: '1', text: 'a' }), entry({ id: '2', text: '' }), entry({ id: '3', text: '   ' }), entry({ id: '4', role: 'assistant', text: 'b' })]
    expect(buildMessages(es)).toEqual([
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
    ])
  })
  it('空数组 → 空数组', () => {
    expect(buildMessages([])).toEqual([])
  })
})

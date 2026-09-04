import { describe, it, expect } from 'vitest'
import { buildMessages, entryContent } from '../src/messages.ts'
import type { Entry } from '../src/types.ts'

const entry = (over: Partial<Entry>): Entry => ({ id: 'e1', name: 'n', role: 'user', text: 'hello', blocks: [], ...over })

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

describe('messages v2 blocks 拼接', () => {
  const entry = (over: Partial<Entry> = {}): Entry => ({ id: 'e_1', name: 'n', role: 'user', text: '', blocks: [], ...over })

  it('entryContent:父 text 与块按序以 \\n\\n 拼接,空段跳过', () => {
    expect(entryContent(entry({ text: '主', blocks: [{ id: 'b1', text: '块1' }, { id: 'b2', text: '' }, { id: 'b3', text: '块3' }] })))
      .toBe('主\n\n块1\n\n块3')
  })

  it('entryContent:仅块/仅 text/全空', () => {
    expect(entryContent(entry({ blocks: [{ id: 'b1', text: '  单块  ' }] }))).toBe('  单块  ')
    expect(entryContent(entry({ text: '  只有主  ' }))).toBe('  只有主  ')
    expect(entryContent(entry())).toBe('')
    expect(entryContent(entry({ text: '  ', blocks: [{ id: 'b1', text: '\n \n' }] }))).toBe('')
  })

  it('buildMessages 跳过全空条目,role 保留', () => {
    const msgs = buildMessages([
      entry({ role: 'system', text: 'sys', blocks: [{ id: 'b1', text: '附' }] }),
      entry({ text: '', blocks: [{ id: 'b1', text: '' }] }),
      entry({ role: 'assistant', blocks: [{ id: 'b1', text: '只块' }] }),
    ])
    expect(msgs).toEqual([
      { role: 'system', content: 'sys\n\n附' },
      { role: 'assistant', content: '只块' },
    ])
  })
})

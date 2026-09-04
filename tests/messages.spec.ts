import { describe, it, expect } from 'vitest'
import { contentFor, isGroup, isChild, isPlain } from '../src/messages.ts'
import type { ChildEntry, GroupEntry, PlainEntry } from '../src/types.ts'

describe('messages v3 三态判定', () => {
  it('isGroup/isChild/isPlain 互斥判定', () => {
    const plain: PlainEntry = { id: 'e1', name: 'n', role: 'user', text: 'hi' }
    const group: GroupEntry = { id: 'g1', name: 'g', role: 'system', kind: 'group', children: [] }
    const child: ChildEntry = { id: 'c1', name: 'c', base: 'g1', text: '块' }
    expect(isPlain(plain)).toBe(true); expect(isGroup(plain)).toBe(false); expect(isChild(plain)).toBe(false)
    expect(isGroup(group)).toBe(true); expect(isPlain(group)).toBe(false)
    expect(isChild(child)).toBe(true); expect(isGroup(child)).toBe(false)
  })
})

describe('messages v3 父聚合组装', () => {
  it('父 content = 子 text 按序拼接,空子跳过', () => {
    const g: GroupEntry = { id: 'g1', name: 'g', role: 'user', kind: 'group', children: [] }
    const children: ChildEntry[] = [
      { id: 'c1', name: 'c', base: 'g1', text: '段一' },
      { id: 'c2', name: 'c', base: 'g1', text: '   ' },
      { id: 'c3', name: 'c', base: 'g1', text: '段三' },
    ]
    expect(contentFor(g, children)).toBe('段一\n\n段三')
  })
  it('父无子或全空 → 空串(发送时整父跳过)', () => {
    const g: GroupEntry = { id: 'g1', name: 'g', role: 'user', kind: 'group', children: [] }
    expect(contentFor(g, [])).toBe('')
    expect(contentFor(g, [{ id: 'c1', name: 'c', base: 'g1', text: ' \n ' }])).toBe('')
  })
  it('普通条目 text 非空返回自身,空返回空串', () => {
    const p: PlainEntry = { id: 'e1', name: 'n', role: 'user', text: '直接文本' }
    expect(contentFor(p)).toBe('直接文本')
    expect(contentFor({ ...p, text: '  ' })).toBe('')
  })
})

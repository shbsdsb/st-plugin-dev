import { describe, it, expect } from 'vitest'
import { isGroup, isChild, isPlain, isPlaceholder, entryText } from '../src/messages.ts'
import type { ChildEntry, GroupEntry, PlainEntry } from '../src/types.ts'

describe('messages 三态判定', () => {
  it('isGroup/isChild/isPlain 互斥判定', () => {
    const plain: PlainEntry = { id: 'e1', name: 'n', role: 'user', text: 'hi' }
    const group: GroupEntry = { id: 'g1', name: 'g', role: 'system', kind: 'group', children: [] }
    const child: ChildEntry = { id: 'c1', name: 'c', base: 'g1', text: '块' }
    expect(isPlain(plain)).toBe(true); expect(isGroup(plain)).toBe(false); expect(isChild(plain)).toBe(false)
    expect(isGroup(group)).toBe(true); expect(isPlain(group)).toBe(false)
    expect(isChild(child)).toBe(true); expect(isGroup(child)).toBe(false)
  })
  it('isPlaceholder:仅带 placeholder 字段的子条为 true;普通子/父/普通条 false', () => {
    const ph: ChildEntry = { id: 'c2', name: '注入', base: 'kb', text: '', placeholder: { regId: 'kb', name: '知识库' } }
    const child: ChildEntry = { id: 'c1', name: 'c', base: 'g1', text: '块' }
    const group: GroupEntry = { id: 'g1', name: 'g', role: 'user', kind: 'group', children: [] }
    const plain: PlainEntry = { id: 'e1', name: 'n', role: 'user', text: 'hi' }
    expect(isPlaceholder(ph)).toBe(true)
    expect(isPlaceholder(child)).toBe(false)
    expect(isPlaceholder(group)).toBe(false)
    expect(isPlaceholder(plain)).toBe(false)
  })
  it('entryText:返回文本原样(trim 语义在调用方)', () => {
    expect(entryText({ id: 'c', name: 'c', base: 'g', text: '  ' })).toBe('  ')
    expect(entryText({ id: 'p', name: 'p', role: 'user', text: 'hi' })).toBe('hi')
  })
})

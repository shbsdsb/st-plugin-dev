import { describe, it, expect } from 'vitest'
import { createPanelState, applyList, upsertForm, removeForm, selectForm, setExpand, toggleExpand, segmentCount } from '../src/ui/state.ts'

const row = (id: string, name: string, n = 0) => ({ id, name, entryCount: n })

describe('panel state', () => {
  it('applyList:空列表 → currentId null;首载自动选第一个', () => {
    const s0 = createPanelState()
    expect(applyList(s0, [])).toEqual({ forms: [], currentId: null, expandedId: null })
    const s1 = applyList(s0, [row('a', 'A'), row('b', 'B')])
    expect(s1.currentId).toBe('a')
  })
  it('applyList:currentId 仍存在则保留;失效回退第一个', () => {
    const s0 = { forms: [row('a', 'A')], currentId: 'a' }
    expect(applyList(s0, [row('a', 'A'), row('b', 'B')]).currentId).toBe('a')
    expect(applyList(s0, [row('b', 'B')]).currentId).toBe('b')
  })
  it('upsertForm:同 id 更新,新 id 追加且不切换当前', () => {
    const s0 = { forms: [row('a', 'A')], currentId: 'a' }
    const s1 = upsertForm(s0, row('a', 'A2', 3))
    expect(s1.forms[0].name).toBe('A2')
    expect(s1.forms[0].entryCount).toBe(3)
    const s2 = upsertForm(s0, row('b', 'B'))
    expect(s2.forms.map((f) => f.id)).toEqual(['a', 'b'])
    expect(s2.currentId).toBe('a')
  })
  it('removeForm:删除当前 → 回退第一个;删到空 → null', () => {
    const s0 = { forms: [row('a', 'A'), row('b', 'B')], currentId: 'b' }
    const s1 = removeForm(s0, 'b')
    expect(s1.currentId).toBe('a')
    const s2 = removeForm({ forms: [row('a', 'A')], currentId: 'a', expandedId: null }, 'a')
    expect(s2).toEqual({ forms: [], currentId: null, expandedId: null })
  })
  it('selectForm:切换;非法 id 原样返回', () => {
    const s0 = { forms: [row('a', 'A'), row('b', 'B')], currentId: 'a' }
    expect(selectForm(s0, 'b').currentId).toBe('b')
    expect(selectForm(s0, 'zzz')).toBe(s0)
  })
})

describe('panel state v2', () => {
  it('toggleExpand/setExpand 维护 expandedId;removeForm 清空同表单展开态', () => {
    const s0 = createPanelState()
    expect(s0.expandedId).toBeNull()
    const s1 = setExpand({ ...s0, forms: [{ id: 'f1', name: 'a', entryCount: 1 }], currentId: 'f1' }, 'f1')
    expect(s1.expandedId).toBe('f1')
    expect(toggleExpand(s1, 'f1').expandedId).toBeNull()
    expect(toggleExpand(s1, 'other').expandedId).toBe('other')
    const s2 = removeForm({ forms: [{ id: 'f1', name: 'a', entryCount: 1 }], currentId: 'f1', expandedId: 'f1' }, 'f1')
    expect(s2.expandedId).toBeNull()
  })

  it('segmentCount 返回块数(容错空条目与非数组)', () => {
    expect(segmentCount({ id: 'e', name: 'n', role: 'user', text: '', blocks: [{ id: 'b1', text: 'x' }] })).toBe(1)
    expect(segmentCount({ id: 'e', name: 'n', role: 'user', text: '', blocks: [] })).toBe(0)
    expect(segmentCount(null)).toBe(0)
  })
})

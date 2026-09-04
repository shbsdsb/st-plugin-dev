import { describe, it, expect } from 'vitest'
import { createPanelState, applyList, upsertForm, removeForm, selectForm, setExpand, toggleExpand, toTree } from '../src/ui/state.ts'
import type { ChildEntry, Entry, GroupEntry, PlainEntry } from '../src/types.ts'

const row = (id: string, name: string): { id: string; name: string; entryCount: number } => ({ id, name, entryCount: 0 })

describe('state v3 面板状态', () => {
  it('createPanelState 初始态;applyList 保留 currentId/回退首项', () => {
    const s0 = createPanelState()
    expect(s0).toEqual({ forms: [], currentId: null, expandedId: null, topOrder: [], childOrder: {}, dirtyOrder: false })
    const s1 = applyList({ ...s0, currentId: 'f1' }, [row('f1', 'A')])
    expect(s1.currentId).toBe('f1')
    const s2 = applyList(s1, [row('f2', 'B')])
    expect(s2.currentId).toBe('f2')
  })
  it('setExpand/toggleExpand;removeForm 清展开态', () => {
    const s = { ...createPanelState(), forms: [row('f1', 'A')], currentId: 'f1' }
    expect(setExpand(s, 'e1').expandedId).toBe('e1')
    expect(toggleExpand(s, 'e1').expandedId).toBe('e1')
    expect(toggleExpand({ ...s, expandedId: 'e1' }, 'e1').expandedId).toBeNull()
    expect(removeForm({ ...s, expandedId: 'f1' }, 'f1').expandedId).toBeNull()
  })
})

describe('state v3 toTree 归组', () => {
  it('父后紧跟子平铺 → top 不含子、childrenByParent 聚合', () => {
    const g: GroupEntry = { id: 'g1', name: '父', role: 'user', kind: 'group', children: ['c1', 'c2'] }
    const c1: ChildEntry = { id: 'c1', name: 'c1', base: 'g1', text: '1' }
    const p: PlainEntry = { id: 'p1', name: '普', role: 'system', text: 'x' }
    const c2: ChildEntry = { id: 'c2', name: 'c2', base: 'g1', text: '2' }
    const entries: Entry[] = [g, c1, c2, p]
    const { top, childrenByParent } = toTree(entries)
    expect(top.map((e) => e.id)).toEqual(['g1', 'p1'])
    expect(childrenByParent.g1.map((c) => c.id)).toEqual(['c1', 'c2'])
  })
  it('普通父混排保持相对序;子保持平铺相对序', () => {
    const g: GroupEntry = { id: 'g1', name: '父', role: 'user', kind: 'group', children: ['c1'] }
    const c1: ChildEntry = { id: 'c1', name: 'c1', base: 'g1', text: '1' }
    const p: PlainEntry = { id: 'p1', name: '普', role: 'user', text: 'a' }
    const { top } = toTree([g, p, c1])
    expect(top.map((e) => e.id)).toEqual(['g1', 'p1'])
    void c1
  })
})

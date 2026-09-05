import { describe, it, expect, beforeEach } from 'vitest'
import { createStore, NotFoundError, type PersistJsonLike, type PromptStore } from '../src/store.ts'
import type { ChildEntry, GroupEntry, PlainEntry } from '../src/types.ts'

function memPersist(): PersistJsonLike {
  const map = new Map<string, unknown>()
  return {
    async read(p) { return map.has(p) ? map.get(p)! : null },
    async write(p, d) { map.set(p, d) },
    async list(p) {
      const prefix = p.endsWith('/') ? p : p + '/'
      const names = new Set<string>()
      for (const k of map.keys()) {
        if (!k.startsWith(prefix)) continue
        const seg = k.slice(prefix.length).split('/')[0]
        if (seg) names.add(seg)
      }
      return [...names]
    },
    async delete(p) {
      for (const k of [...map.keys()]) { if (k === p || k.startsWith(p + '/')) map.delete(k) }
    },
  }
}

let store: PromptStore
let mem: PersistJsonLike
beforeEach(() => { mem = memPersist(); store = createStore(mem) })

describe('prompt store v3 表单', () => {
  it('createForm/listForms/rename/delete;名称 trim 空 → 抛错', async () => {
    const { id } = await store.createForm('客服')
    expect(await store.listForms()).toEqual([{ id, name: '客服', entryCount: 0 }])
    await store.renameForm(id, 'b')
    expect((await store.listForms())[0].name).toBe('b')
    await expect(store.createForm('   ')).rejects.toThrow('名称不能为空')
    await store.deleteForm(id)
    expect(await store.listForms()).toEqual([])
  })
})

describe('prompt store v3 三类条目 CRUD', () => {
  let fid: string
  beforeEach(async () => { fid = (await store.createForm('f')).id })

  it('普通条目创建/更新/读回;顶层 entryCount 计数', async () => {
    const { entryId } = await store.createEntry(fid, { name: '普通', role: 'user', text: '你好' })
    const rows = await store.listEntries(fid)
    expect(rows).toEqual([{ id: entryId, name: '普通', role: 'user', text: '你好' }])
    await store.updateEntry(fid, entryId, { name: '改', role: 'system', text: 'x' })
    expect((await store.listEntries(fid))[0]).toEqual({ id: entryId, name: '改', role: 'system', text: 'x' })
    expect((await store.listForms())[0].entryCount).toBe(1)
  })

  it('父条目创建:kind group + children 空;读回含 children', async () => {
    const { entryId } = await store.createEntry(fid, { name: '父', role: 'system', kind: 'group' })
    expect((await store.listEntries(fid))[0]).toEqual({ id: entryId, name: '父', role: 'system', kind: 'group', children: [] })
  })

  it('子条目创建:base 自动 append 父.children;顶层不含子', async () => {
    const g = await store.createEntry(fid, { name: '父', role: 'user', kind: 'group' })
    const c1 = await store.createEntry(fid, { name: '子一', base: g.entryId, text: '段一' })
    const c2 = await store.createEntry(fid, { name: '子二', base: g.entryId, text: '段二' })
    const rows = await store.listEntries(fid)
    expect(rows).toHaveLength(3) // 父 + 2 子(平铺紧邻)
    expect(rows[0]).toEqual({ id: g.entryId, name: '父', role: 'user', kind: 'group', children: [c1.entryId, c2.entryId] })
    expect(rows[1]).toEqual({ id: c1.entryId, name: '子一', base: g.entryId, text: '段一' })
    expect((await store.listForms())[0].entryCount).toBe(1) // 只计顶层
  })

  it('createEntry 校验:base 指向不存在/非父 → 400;kind+base 同现 → 400;role 非法 → 400', async () => {
    await expect(store.createEntry(fid, { name: 'x', role: 'user', base: 'e_no', text: 't' })).rejects.toThrow('base 必须指向本表单存在的父条目')
    const p = await store.createEntry(fid, { name: '普', role: 'user', text: '' })
    await expect(store.createEntry(fid, { name: 'x', base: p.entryId, text: 't' })).rejects.toThrow('base 必须指向本表单存在的父条目')
    await expect(store.createEntry(fid, { name: 'x', role: 'user', kind: 'group', base: 'e_x', text: '' })).rejects.toThrow('kind 与 base 不能同时出现')
    await expect(store.createEntry(fid, { name: 'x', role: 'admin' as never, text: '' })).rejects.toThrow('role 非法')
  })

  it('update 限制:父不能含 text、改 base → 400;子无 role', async () => {
    const g = await store.createEntry(fid, { name: '父', role: 'user', kind: 'group' })
    const c = await store.createEntry(fid, { name: '子', base: g.entryId, text: 'a' })
    await expect(store.updateEntry(fid, g.entryId, { name: '父2', text: 'x' })).rejects.toThrow('父条目不能包含 text')
    await expect(store.updateEntry(fid, c.entryId, { base: 'f_other' })).rejects.toThrow('base 不可修改')
    await store.updateEntry(fid, g.entryId, { name: '父2', role: 'assistant' })
    await store.updateEntry(fid, c.entryId, { name: '子改', text: 'b' })
    const rows = await store.listEntries(fid)
    expect((rows.find((r) => r.id === g.entryId) as { name: string; role: string }).name).toBe('父2')
    expect((rows.find((r) => r.id === c.entryId) as { name: string; text: string }).text).toBe('b')
  })

  it('deleteEntry:删子剔父;删父级联删子;删普通', async () => {
    const g = await store.createEntry(fid, { name: '父', role: 'user', kind: 'group' })
    const c1 = await store.createEntry(fid, { name: 'c1', base: g.entryId, text: '1' })
    const c2 = await store.createEntry(fid, { name: 'c2', base: g.entryId, text: '2' })
    await store.deleteEntry(fid, c1.entryId)
    let rows = await store.listEntries(fid)
    expect((rows[0] as { children: string[] }).children).toEqual([c2.entryId])
    await store.deleteEntry(fid, g.entryId)
    rows = await store.listEntries(fid)
    expect(rows).toEqual([])
    expect(await store.listForms()).toEqual([{ id: fid, name: 'f', entryCount: 0 }])
    await expect(store.deleteEntry(fid, 'e_ghost')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('孤儿数据:父 children 引用文件缺失 → 读取跳过;顶层 entries 引用缺失 → 跳过', async () => {
    const g = await store.createEntry(fid, { name: '父', role: 'user', kind: 'group' })
    const c = await store.createEntry(fid, { name: '子', base: g.entryId, text: 'x' })
    await mem.delete(`data/prompt/${fid}/e-${c.entryId}.json`)
    const rows = await store.listEntries(fid)
    expect(rows).toHaveLength(1)
    expect((rows[0] as { children: string[] }).children).toEqual([c.entryId]) // 引用保留(读端仅跳过,不写)
  })

  it('saveLayout:顶层重排 + 子重排;非法排列 → 400;缺父 → 400;不存在表单 → 404', async () => {
    const a = await store.createEntry(fid, { name: 'a', role: 'user', text: '1' })
    const g = await store.createEntry(fid, { name: '父', role: 'user', kind: 'group' })
    const c1 = await store.createEntry(fid, { name: 'c1', base: g.entryId, text: 'x' })
    const c2 = await store.createEntry(fid, { name: 'c2', base: g.entryId, text: 'y' })
    await store.saveLayout(fid, { entries: [g.entryId, a.entryId], children: { [g.entryId]: [c2.entryId, c1.entryId] } })
    const rows = await store.listEntries(fid)
    expect(rows.map((r) => r.id)).toEqual([g.entryId, c2.entryId, c1.entryId, a.entryId])
    await expect(store.saveLayout(fid, { entries: [a.entryId] })).rejects.toThrow('顺序与当前条目不一致')
    await expect(store.saveLayout(fid, { children: { [g.entryId]: [c1.entryId] } })).rejects.toThrow('顺序与当前子条目不一致')
    await expect(store.saveLayout(fid, { children: { e_ghost: [c1.entryId] } })).rejects.toThrow('父条目不存在')
    await expect(store.saveLayout('f_ghost', { entries: [] })).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('prompt store v4 扩展', () => {
  it('readTree:平铺转树(顶层序 + children 按序)', async () => {
    const fid: string = (await store.createForm('f')).id
    const g = await store.createEntry(fid, { name: 'g', role: 'user', kind: 'group' })
    await store.createEntry(fid, { name: 'c1', role: 'user', text: '一', base: g.entryId })
    await store.createEntry(fid, { name: 'c2', role: 'user', text: '二', base: g.entryId })
    await store.createEntry(fid, { name: 'p', role: 'system', text: '顶' })
    const { top, childrenByParent } = await store.readTree(fid)
    expect(top.map((e) => e.name)).toEqual(['g', 'p'])
    expect(childrenByParent[g.entryId].map((c) => c.text)).toEqual(['一', '二'])
  })
  it('enabled 读写:顶层条目写入/读出;缺省 undefined(视为 true)', async () => {
    const fid: string = (await store.createForm('f')).id
    const e = await store.createEntry(fid, { name: 'p', role: 'user', text: 'hi' })
    await store.updateEntry(fid, e.entryId, { enabled: false })
    const rows = await store.listEntries(fid)
    expect((rows[0] as PlainEntry).enabled).toBe(false)
    await store.updateEntry(fid, e.entryId, { enabled: true })
    const rows2 = await store.listEntries(fid)
    // enabled:true 与缺省同义,读回省略(undefined);false 才显式存储
    expect((rows2[0] as PlainEntry).enabled).toBeUndefined()
  })
  it('enabled 非法(非 boolean/写子条)→ 抛错', async () => {
    const fid: string = (await store.createForm('f')).id
    const g = await store.createEntry(fid, { name: 'g', role: 'user', kind: 'group' })
    const c = await store.createEntry(fid, { name: 'c', text: 'x', base: g.entryId })
    await expect(store.updateEntry(fid, g.entryId, { enabled: 'no' as never })).rejects.toThrow()
    await expect(store.updateEntry(fid, c.entryId, { enabled: false })).rejects.toThrow()
  })
  it('addRegisteredEntry:创建父(固定 id)+占位符子条;重复/非法 400;父可删(级联)', async () => {
    const fid: string = (await store.createForm('f')).id
    const r = await store.addRegisteredEntry(fid, { regId: 'kb-context', name: '知识库上下文' })
    expect(r.entryId).toBe('kb-context')
    await expect(store.addRegisteredEntry(fid, { regId: 'kb-context', name: '知识库上下文' })).rejects.toThrow('已添加')
    const rows = await store.listEntries(fid)
    expect(rows).toHaveLength(2)
    const parent = rows[0] as GroupEntry
    expect(parent.id).toBe('kb-context'); expect(parent.kind).toBe('group')
    const child = rows[1] as ChildEntry
    expect(child.placeholder).toEqual({ regId: 'kb-context', name: '知识库上下文' })
    expect(child.base).toBe('kb-context'); expect(child.text).toBe('')
    // 占位符保护
    await expect(store.updateEntry(fid, child.id, { text: '改' })).rejects.toThrow('不可编辑')
    await expect(store.deleteEntry(fid, child.id)).rejects.toThrow('不可单独删除')
    await expect(store.createEntry(fid, { name: 'x', text: 'y', base: child.id })).rejects.toThrow()
    // 注册父 name 锁定
    await expect(store.updateEntry(fid, 'kb-context', { name: '改名' })).rejects.toThrow('不可修改')
    // 父删除 = 级联清占位符
    await store.deleteEntry(fid, 'kb-context')
    expect(await store.listEntries(fid)).toHaveLength(0)
  })
  it('非法 regId(含 ../)拒绝', async () => {
    const fid: string = (await store.createForm('f')).id
    await expect(store.addRegisteredEntry(fid, { regId: '../evil', name: 'x' })).rejects.toThrow()
  })
})

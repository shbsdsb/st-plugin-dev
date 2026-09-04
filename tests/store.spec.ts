import { describe, it, expect, beforeEach } from 'vitest'
import { createStore, NotFoundError, type PersistJsonLike, type PromptStore } from '../src/store.ts'
import type { FormRow } from '../src/types.ts'

/** 内存版 persist,行为对齐 persist 包 json store */
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
        const rest = k.slice(prefix.length)
        const seg = rest.split('/')[0]
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

describe('prompt store', () => {
  it('createForm → listForms 可见且 entryCount=0', async () => {
    const { id } = await store.createForm('客服')
    const rows: FormRow[] = await store.listForms()
    expect(rows).toEqual([{ id, name: '客服', entryCount: 0 }])
  })
  it('表单名 trim 后为空 → 抛错', async () => {
    await expect(store.createForm('   ')).rejects.toThrow('名称不能为空')
  })
  it('renameForm 更新名称', async () => {
    const { id } = await store.createForm('a')
    await store.renameForm(id, 'b')
    expect(await store.listForms()).toEqual([{ id, name: 'b', entryCount: 0 }])
  })
  it('操作不存在的表单 → NotFoundError', async () => {
    await expect(store.renameForm('f_no', 'x')).rejects.toBeInstanceOf(NotFoundError)
    await expect(store.deleteForm('f_no')).rejects.toBeInstanceOf(NotFoundError)
    await expect(store.createEntry('f_no', { name: 'e', role: 'user', text: '' })).rejects.toBeInstanceOf(NotFoundError)
  })
  it('createEntry 追加条目,getMessages 按顺序返回并跳过缺失文件', async () => {
    const { id } = await store.createForm('客服')
    const a = await store.createEntry(id, { name: '系统', role: 'system', text: '你是客服' })
    const b = await store.createEntry(id, { name: '用户', role: 'user', text: '你好' })
    const rows: FormRow[] = await store.listForms()
    expect(rows[0].entryCount).toBe(2)
    expect(await store.getMessages(id)).toEqual([
      { role: 'system', content: '你是客服' },
      { role: 'user', content: '你好' },
    ])
    // 模拟一个条目文件丢失:删除 e-b 文件后 getMessages 应跳过它
    await mem.delete(`data/prompt/${id}/e-${b.entryId}.json`)
    expect(await store.getMessages(id)).toEqual([{ role: 'system', content: '你是客服' }])
    // 空 text 条目被过滤
    await store.updateEntry(id, a.entryId, { name: '系统', role: 'system', text: '   ' })
    expect(await store.getMessages(id)).toEqual([])
  })
  it('listEntries 按 form.json 顺序返回,缺失文件跳过,空 text 保留', async () => {
    const { id } = await store.createForm('f')
    const a = await store.createEntry(id, { name: 'a', role: 'user', text: '1' })
    const b = await store.createEntry(id, { name: 'b', role: 'assistant', text: '' })
    await store.createEntry(id, { name: 'c', role: 'system', text: '3' })
    await mem.delete(`data/prompt/${id}/e-${b.entryId}.json`) // b 的条目文件丢失
    const rows = await store.listEntries(id)
    expect(rows.map((r) => r.name)).toEqual(['a', 'c'])
    expect(rows.map((r) => r.role)).toEqual(['user', 'system'])
  })
  it('updateEntry 校验角色;deleteEntry 移除条目与顺序', async () => {
    const { id } = await store.createForm('f')
    const a = await store.createEntry(id, { name: 'a', role: 'user', text: '1' })
    const b = await store.createEntry(id, { name: 'b', role: 'user', text: '2' })
    await expect(store.createEntry(id, { name: 'x', role: 'admin' as never, text: '' })).rejects.toThrow('role 非法')
    await store.deleteEntry(id, a.entryId)
    expect(await store.getMessages(id)).toEqual([{ role: 'user', content: '2' }])
    await expect(store.deleteEntry(id, 'e_missing')).rejects.toBeInstanceOf(NotFoundError)
    expect(b.entryId.length).toBeGreaterThan(0)
  })
  it('deleteForm 递归删除(目录下所有条目随之消失)', async () => {
    const { id } = await store.createForm('f')
    await store.createEntry(id, { name: 'a', role: 'user', text: '1' })
    await store.deleteForm(id)
    expect(await store.listForms()).toEqual([])
    await expect(store.getMessages(id)).rejects.toBeInstanceOf(NotFoundError)
  })
})

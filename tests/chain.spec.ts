import { describe, it, expect } from 'vitest'
import { buildMessages, buildWithActive, buildPreview } from '../src/chain.ts'
import { createRegisterTable } from '../src/register.ts'
import { createStore } from '../src/store.ts'
import type { ChildEntry, Entry, GroupEntry, PlainEntry } from '../src/types.ts'

function reader(top: Entry[], childrenByParent: Record<string, ChildEntry[]>) {
  return { async readTree() { return { top, childrenByParent } } }
}
const ph = (id: string, base: string, regId: string, name: string): ChildEntry =>
  ({ id, name, base, text: '', placeholder: { regId, name } })

describe('chain v4 拼接', () => {
  const plain = (p: Partial<PlainEntry> & { id: string }): PlainEntry => ({ name: p.name ?? 'p', role: 'user', text: '', ...p })
  const group = (g: Partial<GroupEntry> & { id: string }): GroupEntry => ({ name: g.name ?? 'g', role: 'user', kind: 'group', children: [], ...g })

  it('普通条目与普通父:同 v3 语义;空内容跳过', async () => {
    const reg = createRegisterTable()
    const top: Entry[] = [
      plain({ id: 'p1', name: '系统', role: 'system', text: '你是助手' }),
      group({ id: 'g1', name: '块', role: 'user', children: ['c1'] }),
    ]
    const msgs = await buildMessages('f', { reader: reader(top, { g1: [{ id: 'c1', name: 'c', base: 'g1', text: '段一' }] }), registry: reg })
    expect(msgs).toEqual([
      { role: 'system', content: '你是助手' },
      { role: 'user', content: '段一' },
    ])
  })

  it('顶层 enabled=false 整树跳过', async () => {
    const reg = createRegisterTable()
    const top: Entry[] = [
      plain({ id: 'p1', name: '关', role: 'user', text: 'x', enabled: false }),
      plain({ id: 'p2', name: '开', role: 'user', text: 'y' }),
    ]
    const msgs = await buildMessages('f', { reader: reader(top, {}), registry: reg })
    expect(msgs).toEqual([{ role: 'user', content: 'y' }])
  })

  it('注册父:占位符子条位注入 fn 文本;用户子条照常', async () => {
    const reg = createRegisterTable()
    reg.register({ id: 'kb', name: '知识库', fn: () => '检索到的知识' })
    const top: Entry[] = [group({ id: 'kb', name: '知识库', role: 'user', children: ['ph1', 'u1'] })]
    const childrenByParent = {
      kb: [ph('ph1', 'kb', 'kb', '知识库'), { id: 'u1', name: '补充', base: 'kb', text: '用户补充' }],
    }
    const msgs = await buildMessages('f', { reader: reader(top, childrenByParent), registry: reg })
    expect(msgs).toEqual([{ role: 'user', content: '检索到的知识\n\n用户补充' }])
  })

  it('注册父存在但注册表缺失(插件卸载)→ 报中文错', async () => {
    const reg = createRegisterTable()   // 空注册表
    const top: Entry[] = [group({ id: 'kb', name: '知识库', role: 'user', children: ['ph1'] })]
    await expect(buildMessages('f', { reader: reader(top, { kb: [ph('ph1', 'kb', 'kb', '知识库')] }), registry: reg }))
      .rejects.toThrow(/插件未加载/)
  })

  it('fn 抛错 / 返回非字符串 / 返回空白 → 中止并报中文错', async () => {
    const reg = createRegisterTable()
    reg.register({ id: 'bad', name: '坏注入', fn: () => { throw new Error('boom') } })
    reg.register({ id: 'num', name: '数字', fn: () => 42 as unknown as string })
    reg.register({ id: 'blank', name: '空白', fn: () => '   ' })
    const mk = (id: string): { top: Entry[]; childrenByParent: Record<string, ChildEntry[]> } =>
      ({ top: [group({ id, name: id, role: 'user', children: [id + '-ph'] })], childrenByParent: { [id]: [ph(id + '-ph', id, id, id)] } })
    await expect(buildMessages('f', { reader: reader(mk('bad').top, mk('bad').childrenByParent), registry: reg })).rejects.toThrow(/动态注入失败\(bad\)/)
    await expect(buildMessages('f', { reader: reader(mk('num').top, mk('num').childrenByParent), registry: reg })).rejects.toThrow(/动态注入失败\(num\)/)
    await expect(buildMessages('f', { reader: reader(mk('blank').top, mk('blank').childrenByParent), registry: reg })).rejects.toThrow(/动态注入失败\(blank\)/)
  })

  it('async fn 正常注入', async () => {
    const reg = createRegisterTable()
    reg.register({ id: 'a', name: '异步', fn: async () => '异步内容' })
    const top: Entry[] = [group({ id: 'a', name: '异步', role: 'user', children: ['ph'] })]
    const msgs = await buildMessages('f', { reader: reader(top, { a: [ph('ph', 'a', 'a', '异步')] }), registry: reg })
    expect(msgs).toEqual([{ role: 'user', content: '异步内容' }])
  })
})

function memPersist() {
  const map = new Map<string, unknown>()
  return {
    async read(p: string) { return map.has(p) ? map.get(p) : null },
    async write(p: string, d: unknown) { map.set(p, d) },
    async list(p: string) {
      const prefix = p.endsWith('/') ? p : p + '/'
      const names = new Set<string>()
      for (const k of map.keys()) { if (k.startsWith(prefix)) { const seg = k.slice(prefix.length).split('/')[0]; if (seg) names.add(seg) } }
      return [...names]
    },
    async delete(p: string) { for (const k of [...map.keys()]) { if (k === p || k.startsWith(p + '/')) map.delete(k) } },
  }
}

describe('prompt chain v4.1 active', () => {
  it('缺省 formId 用 active;无 active → 中文错', async () => {
    const s = createStore(memPersist())
    const reg = createRegisterTable()
    await expect(buildWithActive(s, reg)).rejects.toThrow('未选择使用表单')
  })

  it('active 表单可正常拼接;缺省与显式结果一致', async () => {
    const s = createStore(memPersist())
    const reg = createRegisterTable()
    const fid = (await s.createForm('聊天')).id
    await s.createEntry(fid, { name: '角色', role: 'system', text: '你是助手' })
    await s.setActiveFormId(fid)
    const viaActive = await buildWithActive(s, reg)
    const viaExplicit = await buildWithActive(s, reg, fid)
    expect(viaActive).toEqual([{ role: 'system', content: '你是助手' }])
    expect(viaExplicit).toEqual(viaActive)
  })

  it('active 指向已删表单 → 包装中文错', async () => {
    const mem = memPersist()
    const s = createStore(mem)
    const reg = createRegisterTable()
    const fid = (await s.createForm('聊天')).id
    await s.setActiveFormId(fid)
    await s.deleteForm(fid) // 联动清空 active(见 A1)
    expect(await s.getActiveFormId()).toBeNull()
    // 直写悬挂 active(模拟数据不一致):active 指向已不存在的表单
    await mem.write('data/prompt/active.json', { formId: fid })
    await expect(buildWithActive(s, reg)).rejects.toThrow('使用表单不存在或已删除,请重新选择')
  })
})

// —— v5 预览:静态拼接,注册占位 JSON 化,不调用 fn ——
describe('prompt chain v5 preview', () => {
  const vplain = (p: Partial<PlainEntry> & { id: string }): PlainEntry => ({ name: p.name ?? 'p', role: 'user', text: '', ...p })
  const vgroup = (g: Partial<GroupEntry> & { id: string }): GroupEntry => ({ name: g.name ?? 'g', role: 'user', kind: 'group', children: [], ...g })

  it('占位符子条产 JSON 占位段,普通子条照常;父消息聚合', async () => {
    const top: Entry[] = [vgroup({ id: 'history', name: 'chat-history', role: 'user', children: ['ph'] })]
    const rows = await buildPreview('f', reader(top, {
      history: [
        ph('ph', 'history', 'history', 'chat-history'),
        { id: 'c2', name: 'c2', base: 'history', text: '补充说明' },
      ],
    }))
    expect(rows).toEqual([{ role: 'user', content: '{"history":"chat-history(发送时注入)"}\n\n补充说明' }])
  })

  it('注册插件缺失(registry 不存在)也能拼,不抛错', async () => {
    const top: Entry[] = [vgroup({ id: 'input', name: 'user-input', role: 'user', children: ['ph'] })]
    const rows = await buildPreview('f', reader(top, { input: [ph('ph', 'input', 'input', 'user-input')] }))
    expect(rows).toEqual([{ role: 'user', content: '{"input":"user-input(发送时注入)"}' }])
  })

  it('顶层 enabled=false 整组跳过;普通条目照常;空文本跳过', async () => {
    const top: Entry[] = [
      vgroup({ id: 'sys', name: '系统', role: 'system', enabled: false, children: [] }),
      vplain({ id: 'p', name: '系统', role: 'system', text: '你是助手' }),
      vplain({ id: 'b', name: '', role: 'user', text: '   ' }),
    ]
    const rows = await buildPreview('f', reader(top, {}))
    expect(rows).toEqual([{ role: 'system', content: '你是助手' }])
  })
})

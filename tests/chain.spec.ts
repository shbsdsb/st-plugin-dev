import { describe, it, expect } from 'vitest'
import { buildMessages } from '../src/chain.ts'
import { createRegisterTable } from '../src/register.ts'
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

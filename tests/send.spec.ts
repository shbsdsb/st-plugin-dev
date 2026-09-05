import { describe, it, expect, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { createChatStore, type ChatStore } from '../src/store.ts'
import { sendMessage, type ChainingLike, type LlmLike, type PendingLike } from '../src/send.ts'

function makeDep(over: Partial<{ chaining: ChainingLike; llm: LlmLike }> = {}) {
  const db = new DatabaseSync(':memory:')
  const store: ChatStore = createChatStore(db)
  const chaining: ChainingLike = {
    active: vi.fn(async () => 'f_chat'),
    hasRegistered: vi.fn(async () => true),
    build: vi.fn(async () => [{ role: 'system' as const, content: '你是助手' }]),
    ...(over.chaining ?? {}),
  }
  const llm: LlmLike = {
    send: vi.fn(async () => ({ choices: [{ message: { content: '你好!' } }] })),
    ...(over.llm ?? {}),
  }
  const pending: PendingLike = { get: () => null, set: vi.fn() }
  return { store, chaining, llm, pending, db }
}

describe('chat send', () => {
  it('成功:探测 active+history/input → build(fid) → llm → 落库 user+assistant 两行,返回 reply,pending 清空', async () => {
    const d = makeDep()
    const reply = await sendMessage(d, '  你好  ')
    expect(reply).toBe('你好!')
    expect(d.chaining.build).toHaveBeenCalledWith('f_chat')
    const rows = d.store.listMessages()
    expect(rows.map((r) => r.role)).toEqual(['user', 'assistant'])
    expect(rows[0].content).toBe('你好') // trim 后落库
    expect(d.pending.set).toHaveBeenLastCalledWith(null)
    d.db.close()
  })

  it('text 为空 → throw 消息内容不能为空,零落库,pending 未 set', async () => {
    const d = makeDep()
    await expect(sendMessage(d, '   ')).rejects.toThrow('消息内容不能为空')
    expect(d.store.listMessages()).toHaveLength(0)
    expect(d.pending.set).not.toHaveBeenCalled()
    d.db.close()
  })

  it('无 active → throw 中文,pending 清空,零落库', async () => {
    const d = makeDep({ chaining: { active: vi.fn(async () => null) } })
    await expect(sendMessage(d, 'hi')).rejects.toThrow('未选择使用表单')
    expect(d.store.listMessages()).toHaveLength(0)
    expect(d.pending.set).toHaveBeenLastCalledWith(null)
    d.db.close()
  })

  it('缺注册条目 → throw 中文,零落库', async () => {
    const d = makeDep({ chaining: { hasRegistered: vi.fn(async () => false) } })
    await expect(sendMessage(d, 'hi')).rejects.toThrow('缺少动态注入条目')
    expect(d.store.listMessages()).toHaveLength(0)
    d.db.close()
  })

  it('llm 失败 → 原样上抛中文,零落库,pending 清空', async () => {
    const d = makeDep({ llm: { send: vi.fn(async () => { throw new Error('请求超时') }) } })
    await expect(sendMessage(d, 'hi')).rejects.toThrow('请求超时')
    expect(d.store.listMessages()).toHaveLength(0)
    expect(d.pending.set).toHaveBeenLastCalledWith(null)
    d.db.close()
  })

  it('回复无法解析 → throw 无法解析模型回复,零落库', async () => {
    const d = makeDep({ llm: { send: vi.fn(async () => ({ choices: [] })) } })
    await expect(sendMessage(d, 'hi')).rejects.toThrow('无法解析模型回复')
    expect(d.store.listMessages()).toHaveLength(0)
    d.db.close()
  })
})

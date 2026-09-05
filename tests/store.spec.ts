import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { createMultiStore, type MultiStore } from '../src/store.ts'

function fresh(): { db: DatabaseSync; s: MultiStore } {
  const db = new DatabaseSync(':memory:')
  const s = createMultiStore(db)
  return { db, s }
}

describe('multi session store', () => {
  it('createSession 生成会话,标题新会话,listSessions 含它(单条)', () => {
    const { db, s } = fresh()
    const { id } = s.createSession()
    expect(id.startsWith('s_')).toBe(true)
    const list = s.listSessions()
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('新会话')
    expect(list[0].createdAt).toBe(list[0].updatedAt)
    db.close()
  })

  it('appendMessage 落库并刷新 updated_at;首条 user 设标题(去换行前 20 字);空内容拒绝', () => {
    const { db, s } = fresh()
    const id = s.createSession().id
    s.appendMessage(id, 'user', '一二三四五六七八九十一二三四五六七八九十尾') // 21 字,末字被截
    const msg = s.listMessages(id)
    expect(msg).toHaveLength(1)
    expect(msg[0].role).toBe('user')
    expect(s.getSession(id).title).toBe('一二三四五六七八九十一二三四五六七八九十') // 前 20 字
    const before = s.getSession(id).updatedAt
    s.appendMessage(id, 'assistant', '回复')
    expect(s.getSession(id).title).toBe('一二三四五六七八九十一二三四五六七八九十') // 仅首条 user 触发
    expect(s.getSession(id).updatedAt >= before).toBe(true)
    expect(() => s.appendMessage(id, 'user', '   ')).toThrow('消息内容不能为空')
    expect(s.listMessages(id)).toHaveLength(2)
    db.close()
  })

  it('多会话:listSessions 按 updated_at DESC;deleteSession 级联删消息;会话不存在 NotFoundError', () => {
    const { db, s } = fresh()
    const a = s.createSession().id
    s.createSession()
    expect(s.listSessions()).toHaveLength(2)
    // 给 a 追加消息使其 updated_at 最新
    s.appendMessage(a, 'user', 'hi')
    expect(s.listSessions()[0].id).toBe(a)
    s.deleteSession(a)
    expect(s.listSessions()).toHaveLength(1)
    expect(() => s.deleteSession('s_ghost')).toThrow('会话不存在')
    expect(() => s.listMessages('s_ghost')).toThrow('会话不存在')
    expect(() => s.getSession('s_ghost')).toThrow('会话不存在')
    db.close()
  })

  it('appendMessage 会话不存在 / role 非法抛错', () => {
    const { db, s } = fresh()
    expect(() => s.appendMessage('s_ghost', 'user', 'x')).toThrow('会话不存在')
    expect(() => s.appendMessage(s.createSession().id, 'robot' as never, 'x')).toThrow('非法消息角色')
    db.close()
  })

  it('meta active:默认 null;set/get;deleteSession 联动回退最新/清空', () => {
    const { db, s } = fresh()
    expect(s.getActive()).toBeNull()
    const a = s.createSession().id
    const b = s.createSession().id
    s.appendMessage(b, 'user', '使 b 更新')
    s.setActive(a)
    expect(s.getActive()).toBe(a)
    // 删 a(active)→ 回退到最新会话 b
    s.deleteSession(a)
    expect(s.getActive()).toBe(b)
    // 删 b(active)→ 无剩余 → null
    s.deleteSession(b)
    expect(s.getActive()).toBeNull()
    // 悬挂容忍
    s.setActive('s_ghost')
    expect(s.getActive()).toBe('s_ghost')
    db.close()
  })

  it('幂等建表:重复 createMultiStore 不抛', () => {
    const db = new DatabaseSync(':memory:')
    createMultiStore(db)
    const again = createMultiStore(db)
    expect(again.listSessions()).toEqual([])
    db.close()
  })
})

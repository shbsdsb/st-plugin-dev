import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { createChatStore } from '../src/store.ts'

describe('chat store', () => {
  it('append 追加两行;list 按 id 升序全量返回', () => {
    const db = new DatabaseSync(':memory:')
    const s = createChatStore(db)
    const u = s.append('user', '你好')
    const a = s.append('assistant', '你好!有什么可以帮你?')
    expect(u.role).toBe('user'); expect(a.id).toBeGreaterThan(u.id)
    const rows = s.listMessages()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ id: u.id, role: 'user', content: '你好', createdAt: u.createdAt })
    expect(rows[1].content).toBe('你好!有什么可以帮你?')
    db.close()
  })

  it('幂等建表:重复 createChatStore 不报错', () => {
    const db = new DatabaseSync(':memory:')
    createChatStore(db); createChatStore(db)
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'").get()).toBeTruthy()
    db.close()
  })
})

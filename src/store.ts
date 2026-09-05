// agent_plugin_dev/multi-session-plugin/src/store.ts —— sessions/messages/meta 三表;同步 API(DB 同步驱动)
import type { DatabaseSync } from 'node:sqlite'

export type MsgRole = 'system' | 'user' | 'assistant'
export interface SessionRow { id: string; title: string; createdAt: string; updatedAt: string }
export interface SessionMessage { id: number; role: MsgRole; content: string; createdAt: string }

export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'NotFoundError' }
}

export interface MultiStore {
  listSessions(): SessionRow[]
  createSession(): { id: string }
  getSession(id: string): SessionRow
  deleteSession(id: string): void
  listMessages(sessionId: string): SessionMessage[]
  appendMessage(sessionId: string, role: MsgRole, content: string): void
  getActive(): string | null
  setActive(id: string | null): void
}

export function genSessionId(): string {
  return 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function seg(text: string): string {
  return typeof text === 'string' ? text.trim() : ''
}

/** 去换行/空白折叠为单空格,按码点取前 max 字(防拆代理对) */
export function makeTitle(content: string, max = 20): string {
  const flat = seg(content).replace(/\s+/g, ' ')
  const chars = Array.from(flat)
  return chars.slice(0, max).join('')
}

export function createMultiStore(db: DatabaseSync): MultiStore {
  db.exec(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)
  db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('system','user','assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)`)
  db.exec(`CREATE TABLE IF NOT EXISTS meta (
    k TEXT PRIMARY KEY,
    v TEXT
  )`)

  const now = (): string => new Date().toISOString()

  function getActiveId(): string | null {
    const row = db.prepare("SELECT v FROM meta WHERE k = 'active_session_id'").get()
    const v = row ? String((row as Record<string, unknown>).v) : null
    return v && v !== '' ? v : null
  }
  function setActiveId(id: string | null): void {
    if (id === null) {
      db.prepare("DELETE FROM meta WHERE k = 'active_session_id'").run()
      return
    }
    db.prepare("INSERT INTO meta (k, v) VALUES ('active_session_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").run(id)
  }

  function requireSession(id: string): void {
    const row = db.prepare('SELECT id FROM sessions WHERE id = ?').get(id)
    if (!row) throw new NotFoundError('会话不存在')
  }
  function toSession(r: Record<string, unknown>): SessionRow {
    return { id: String(r.id), title: String(r.title), createdAt: String(r.created_at), updatedAt: String(r.updated_at) }
  }
  function toMessage(r: Record<string, unknown>): SessionMessage {
    return { id: Number(r.id), role: String(r.role) as MsgRole, content: String(r.content), createdAt: String(r.created_at) }
  }

  return {
    listSessions() {
      const rows = db.prepare('SELECT id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC, id DESC').all()
      return rows.map((r) => toSession(r as Record<string, unknown>))
    },
    createSession() {
      const id = genSessionId()
      const t = now()
      db.prepare('INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, '新会话', t, t)
      return { id }
    },
    getSession(id) {
      requireSession(id)
      const row = db.prepare('SELECT id, title, created_at, updated_at FROM sessions WHERE id = ?').get(id)
      return toSession(row as Record<string, unknown>)
    },
    deleteSession(id) {
      requireSession(id)
      db.prepare('DELETE FROM messages WHERE session_id = ?').run(id)
      db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
      const active = getActiveId() // 内部函数,避免 this 依赖
      if (active === id) {
        const next = db.prepare('SELECT id FROM sessions ORDER BY updated_at DESC, id DESC LIMIT 1').get()
        setActiveId(next ? String((next as Record<string, unknown>).id) : null)
      }
    },
    listMessages(sessionId) {
      requireSession(sessionId)
      const rows = db.prepare('SELECT id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY id ASC').all(sessionId)
      return rows.map((r) => toMessage(r as Record<string, unknown>))
    },
    appendMessage(sessionId, role, content) {
      requireSession(sessionId)
      const c = seg(content)
      if (!c) throw new Error('消息内容不能为空')
      if (!['system', 'user', 'assistant'].includes(role)) throw new Error('非法消息角色')
      const t = now()
      db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)').run(sessionId, role, c, t)
      const row = db.prepare('SELECT title FROM sessions WHERE id = ?').get(sessionId) as { title: string }
      if (role === 'user' && row.title === '新会话') {
        const title = makeTitle(c)
        if (title !== '') db.prepare('UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?').run(title, t, sessionId)
        else db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(t, sessionId)
      } else {
        db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(t, sessionId)
      }
    },
    getActive() {
      return getActiveId()
    },
    setActive(id) {
      setActiveId(id)
    },
  }
}

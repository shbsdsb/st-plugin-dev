// agent_plugin_dev/chat-plugin/src/store.ts —— 单对话消息表(固定会话,无会话维度)
import type { DatabaseSync } from 'node:sqlite'

export type MessageRole = 'system' | 'user' | 'assistant'
export interface MessageRow { id: number; role: MessageRole; content: string; createdAt: string }
export interface ChatStore {
  listMessages(): MessageRow[]
  append(role: MessageRole, content: string): MessageRow
}

export function createChatStore(db: DatabaseSync): ChatStore {
  db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK (role IN ('system','user','assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`)

  const toRow = (r: Record<string, unknown>): MessageRow => ({
    id: Number(r.id),
    role: String(r.role) as MessageRole,
    content: String(r.content),
    createdAt: String(r.created_at),
  })

  return {
    listMessages() {
      const rows = db.prepare('SELECT id, role, content, created_at FROM messages ORDER BY id ASC').all()
      return rows.map((r) => toRow(r as Record<string, unknown>))
    },
    append(role, content) {
      const now = new Date().toISOString()
      const info = db.prepare('INSERT INTO messages (role, content, created_at) VALUES (?, ?, ?)').run(role, content, now)
      return { id: Number(info.lastInsertRowid), role, content, createdAt: now }
    },
  }
}

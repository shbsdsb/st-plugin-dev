export type EntryRole = 'system' | 'user' | 'assistant'

/** 条目类型:plain=普通条目(无内容块);grouped=带内容块的条目 */
export type EntryKind = 'plain' | 'grouped'

export interface Block {
  id: string
  text: string
}

export interface Entry {
  id: string
  name: string
  role: EntryRole
  text: string
  kind: EntryKind
  blocks: Block[]
}

export interface Message {
  role: EntryRole
  content: string
}

export interface FormRow {
  id: string
  name: string
  entryCount: number
}

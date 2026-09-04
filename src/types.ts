export type EntryRole = 'system' | 'user' | 'assistant'

/** 条目类型:仅父条目显式写 kind:'group';普通/子条目不写 kind */
export type EntryKind = 'group'

export interface PlainEntry { id: string; name: string; role: EntryRole; text: string }
export interface GroupEntry { id: string; name: string; role: EntryRole; kind: 'group'; children: string[] }
export interface ChildEntry { id: string; name: string; base: string; text: string }
export type Entry = PlainEntry | GroupEntry | ChildEntry

export interface Message { role: EntryRole; content: string }
export interface FormRow { id: string; name: string; entryCount: number }

export type EntryRole = 'system' | 'user' | 'assistant'

export interface Entry {
  id: string
  name: string
  role: EntryRole
  text: string
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

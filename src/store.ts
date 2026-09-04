import { buildMessages } from './messages.ts'
import type { Block, Entry, EntryRole, FormRow, Message } from './types.ts'

export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'NotFoundError' }
}

export interface PersistJsonLike {
  read(p: string): Promise<unknown>
  write(p: string, d: unknown): Promise<void>
  list(p: string): Promise<string[]>
  delete(p: string): Promise<void>
}

export interface BlockInput { id: string; text: string }

export interface EntryInput { name: string; role: EntryRole; text: string; blocks?: BlockInput[] }

export interface PromptStore {
  listForms(): Promise<FormRow[]>
  listEntries(formId: string): Promise<Entry[]>
  createForm(name: string): Promise<{ id: string }>
  renameForm(id: string, name: string): Promise<void>
  deleteForm(id: string): Promise<void>
  createEntry(formId: string, input: EntryInput): Promise<{ entryId: string }>
  updateEntry(formId: string, entryId: string, input: EntryInput): Promise<void>
  deleteEntry(formId: string, entryId: string): Promise<void>
  getMessages(formId: string): Promise<Message[]>
}

const ROOT = 'data/prompt'
const VALID_ROLES: EntryRole[] = ['system', 'user', 'assistant']
const MAX_BLOCKS = 50
const MAX_BLOCK_TEXT = 20000

function genId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
function dirOf(formId: string): string { return `${ROOT}/${formId}` }
function formFile(formId: string): string { return `${dirOf(formId)}/form.json` }
function entryFile(formId: string, entryId: string): string { return `${dirOf(formId)}/e-${entryId}.json` }

function cleanName(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : ''
  if (!s) throw new Error('名称不能为空')
  if (s.length > 50) throw new Error('名称最长 50 字符')
  return s
}
function cleanRole(v: unknown): EntryRole {
  const r = String(v ?? '')
  if (!(VALID_ROLES as string[]).includes(r)) throw new Error('role 非法,仅支持 system/user/assistant')
  return r as EntryRole
}
function cleanText(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
interface CleanEntryInput extends EntryInput { blocks: BlockInput[] }

function cleanEntryInput(b: Record<string, unknown>): CleanEntryInput {
  return { name: cleanName(b.name), role: cleanRole(b.role), text: cleanText(b.text), blocks: cleanBlocks(b.blocks) }
}

function cleanBlocks(v: unknown): BlockInput[] {
  if (v === undefined || v === null) return []
  if (!Array.isArray(v)) throw new Error('内容块必须为数组')
  if (v.length > MAX_BLOCKS) throw new Error(`内容块最多 ${MAX_BLOCKS} 个`)
  const seen = new Set<string>()
  return v.map((item, i) => {
    if (!item || typeof item !== 'object') throw new Error(`内容块第 ${i + 1} 项格式非法`)
    const b = item as { id?: unknown; text?: unknown }
    const id = typeof b.id === 'string' ? b.id.trim() : ''
    if (!id) throw new Error('内容块 id 不能为空')
    if (seen.has(id)) throw new Error('内容块 id 重复')
    seen.add(id)
    const text = typeof b.text === 'string' ? b.text : ''
    if (text.length > MAX_BLOCK_TEXT) throw new Error(`内容块文本最长 ${MAX_BLOCK_TEXT} 字符`)
    return { id, text }
  })
}

interface FormFile { name: string; entries: string[] }

async function readForm(persist: PersistJsonLike, formId: string): Promise<FormFile> {
  const raw = await persist.read(formFile(formId))
  if (!raw || typeof raw !== 'object') throw new NotFoundError('表单不存在')
  const f = raw as { name?: unknown; entries?: unknown }
  const entries = Array.isArray(f.entries) ? f.entries.filter((x): x is string => typeof x === 'string') : []
  return { name: typeof f.name === 'string' ? f.name : '未命名', entries }
}

/** 读取归一化:损坏文件/缺 id 或 text → null;缺 blocks → [] */
function parseEntry(raw: unknown): Entry | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Partial<Entry>
  if (typeof e.id !== 'string' || typeof e.text !== 'string') return null
  const role = (VALID_ROLES as string[]).includes(e.role as string) ? e.role as EntryRole : 'user'
  const blocks = Array.isArray(e.blocks)
    ? e.blocks.filter((b): b is Block => !!b && typeof b === 'object' && typeof (b as { id?: unknown }).id === 'string' && typeof (b as { text?: unknown }).text === 'string')
    : []
  return { id: e.id, name: typeof e.name === 'string' ? e.name : '未命名', role, text: e.text, blocks }
}

export function createStore(persist: PersistJsonLike): PromptStore {
  return {
    async listForms() {
      const dirs = await persist.list(ROOT)
      const out: FormRow[] = []
      for (const d of dirs) {
        try {
          const f = await readForm(persist, d)
          out.push({ id: d, name: f.name, entryCount: f.entries.length })
        } catch {
          // 损坏/缺失 form.json 的目录跳过,不作为表单暴露
        }
      }
      out.sort((a, b) => a.name.localeCompare(b.name, 'zh') || a.id.localeCompare(b.id))
      return out
    },
    async listEntries(formId) {
      const f = await readForm(persist, formId)
      const out: Entry[] = []
      for (const eid of f.entries) {
        const e = parseEntry(await persist.read(entryFile(formId, eid)))
        if (e) out.push(e)
      }
      return out
    },
    async createForm(name) {
      const id = genId('f')
      await persist.write(formFile(id), { name: cleanName(name), entries: [] } satisfies FormFile)
      return { id }
    },
    async renameForm(id, name) {
      const f = await readForm(persist, id)
      f.name = cleanName(name)
      await persist.write(formFile(id), f)
    },
    async deleteForm(id) {
      await readForm(persist, id) // 不存在 → NotFoundError
      await persist.delete(dirOf(id))
    },
    async createEntry(formId, input) {
      const f = await readForm(persist, formId)
      const clean = cleanEntryInput(input as unknown as Record<string, unknown>)
      const entryId = genId('e')
      const entry: Entry = { id: entryId, name: clean.name, role: clean.role, text: clean.text, blocks: clean.blocks }
      await persist.write(entryFile(formId, entryId), entry)
      f.entries.push(entryId)
      await persist.write(formFile(formId), f)
      return { entryId }
    },
    async updateEntry(formId, entryId, input) {
      const f = await readForm(persist, formId)
      if (!f.entries.includes(entryId)) throw new NotFoundError('条目不存在')
      const clean = cleanEntryInput(input as unknown as Record<string, unknown>)
      const existing = await persist.read(entryFile(formId, entryId))
      if (!existing) throw new NotFoundError('条目不存在')
      await persist.write(entryFile(formId, entryId), { id: entryId, name: clean.name, role: clean.role, text: clean.text, blocks: clean.blocks } satisfies Entry)
    },
    async deleteEntry(formId, entryId) {
      const f = await readForm(persist, formId)
      if (!f.entries.includes(entryId)) throw new NotFoundError('条目不存在')
      f.entries = f.entries.filter((x) => x !== entryId)
      // 先移除顺序引用,后删文件(删失败仅留孤儿文件,无害)
      await persist.write(formFile(formId), f)
      await persist.delete(entryFile(formId, entryId))
    },
    async getMessages(formId) {
      const f = await readForm(persist, formId)
      const entries: Entry[] = []
      for (const eid of f.entries) {
        const e = parseEntry(await persist.read(entryFile(formId, eid)))
        if (e) entries.push(e)
      }
      return buildMessages(entries)
    },
  }
}

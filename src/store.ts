import { isChild, isGroup, isPlaceholder } from './messages.ts'
import type { ChildEntry, Entry, EntryRole, FormRow, GroupEntry, PlainEntry } from './types.ts'

export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'NotFoundError' }
}

export interface PersistJsonLike {
  read(p: string): Promise<unknown>
  write(p: string, d: unknown): Promise<void>
  list(p: string): Promise<string[]>
  delete(p: string): Promise<void>
}

export interface EntryCreateInput { name?: string; role?: unknown; text?: unknown; kind?: unknown; base?: unknown }
export interface EntryUpdateInput { name?: string; role?: unknown; text?: unknown; kind?: unknown; base?: unknown; enabled?: unknown }
export interface LayoutInput { entries?: unknown; children?: unknown }

export interface PromptStore {
  listForms(): Promise<FormRow[]>
  listEntries(formId: string): Promise<Entry[]>
  createForm(name: string): Promise<{ id: string }>
  renameForm(id: string, name: string): Promise<void>
  deleteForm(id: string): Promise<void>
  createEntry(formId: string, input: EntryCreateInput): Promise<{ entryId: string }>
  updateEntry(formId: string, entryId: string, input: EntryUpdateInput): Promise<void>
  deleteEntry(formId: string, entryId: string): Promise<void>
  saveLayout(formId: string, input: LayoutInput): Promise<void>
  readTree(formId: string): Promise<{ top: Entry[]; childrenByParent: Record<string, ChildEntry[]> }>
  addRegisteredEntry(formId: string, input: { regId: string; name: string }): Promise<{ entryId: string }>
  /** v4.1: 使用表单(active form)读写与注册父探测 */
  getActiveFormId(): Promise<string | null>
  setActiveFormId(formId: string): Promise<void>
  hasRegisteredEntry(formId: string, regId: string): Promise<boolean>
}

const ROOT = 'data/prompt'
const ACTIVE_FILE = `${ROOT}/active.json`
const VALID_ROLES: EntryRole[] = ['system', 'user', 'assistant']
const MAX_NAME = 50
/** 注册 id 用作条目文件名,字符集受限防路径穿越 */
const REG_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

function genId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
function dirOf(formId: string): string { return `${ROOT}/${formId}` }
function formFile(formId: string): string { return `${dirOf(formId)}/form.json` }
function entryFile(formId: string, entryId: string): string { return `${dirOf(formId)}/e-${entryId}.json` }

function cleanName(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : ''
  if (!s) throw new Error('名称不能为空')
  if (s.length > MAX_NAME) throw new Error(`名称最长 ${MAX_NAME} 字符`)
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
function cleanPerm(v: unknown, current: string[], msg: string): string[] {
  if (!Array.isArray(v)) throw new Error(msg)
  if (v.length !== current.length) throw new Error(msg)
  const curSet = new Set(current)
  const idSet = new Set(v)
  if (idSet.size !== v.length || v.some((x) => typeof x !== 'string' || !curSet.has(x))) throw new Error(msg)
  return v as string[]
}
function cleanChildren(v: unknown, currentIds: string[]): string[] {
  return cleanPerm(v, currentIds, '顺序与当前子条目不一致')
}

/** 读取 active form 文件:缺失/损坏/非 {formId:string} → null(不抛) */
async function readActiveFile(persist: PersistJsonLike): Promise<string | null> {
  const raw = await persist.read(ACTIVE_FILE)
  if (raw && typeof raw === 'object' && typeof (raw as { formId?: unknown }).formId === 'string') {
    return (raw as { formId: string }).formId
  }
  return null
}

interface FormFile { name: string; entries: string[] }

async function readForm(persist: PersistJsonLike, formId: string): Promise<FormFile> {
  const raw = await persist.read(formFile(formId))
  if (!raw || typeof raw !== 'object') throw new NotFoundError('表单不存在')
  const f = raw as { name?: unknown; entries?: unknown }
  return {
    name: typeof f.name === 'string' ? f.name : '未命名',
    entries: Array.isArray(f.entries) ? f.entries.filter((x): x is string => typeof x === 'string') : [],
  }
}

/** 读取归一化:损坏文件 → null */
async function readEntry(persist: PersistJsonLike, formId: string, id: string): Promise<Entry | null> {
  const raw = await persist.read(entryFile(formId, id))
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  if (typeof e.id !== 'string') return null
  const role = (VALID_ROLES as string[]).includes(e.role as string) ? e.role as EntryRole : 'user'
  const name = typeof e.name === 'string' ? e.name : '未命名'
  if (e.kind === 'group') {
    const children = Array.isArray(e.children) ? e.children.filter((x): x is string => typeof x === 'string') : []
    return {
      id, name, role, kind: 'group', children,
      ...(e.enabled === false ? { enabled: false } : {}),
    } as GroupEntry
  }
  if (typeof e.base === 'string' && e.base !== '') {
    const phRaw = e.placeholder
    const ph = phRaw && typeof phRaw === 'object'
      ? { regId: String((phRaw as { regId?: unknown }).regId ?? ''), name: String((phRaw as { name?: unknown }).name ?? '') }
      : undefined
    return {
      id, name, base: e.base, text: typeof e.text === 'string' ? e.text : '',
      ...(ph && ph.regId ? { placeholder: ph } : {}),
    } as ChildEntry
  }
  return {
    id, name, role, text: typeof e.text === 'string' ? e.text : '',
    ...(e.enabled === false ? { enabled: false } : {}),
  } as PlainEntry
}

/** 顶层条目数组(entries 引用不存在文件则跳过) + 父条目 map */
async function loadFormEntries(persist: PersistJsonLike, formId: string): Promise<{ top: Entry[]; groupMap: Map<string, GroupEntry> }> {
  const f = await readForm(persist, formId)
  const groupMap = new Map<string, GroupEntry>()
  const top: Entry[] = []
  for (const id of f.entries) {
    const e = await readEntry(persist, formId, id)
    if (!e) continue
    top.push(e)
    if (isGroup(e)) groupMap.set(e.id, e)
  }
  return { top, groupMap }
}

/** 依父 children 顺序收集子条目(文件缺失/非子跳过) */
async function childrenOf(persist: PersistJsonLike, formId: string, g: GroupEntry): Promise<ChildEntry[]> {
  const out: ChildEntry[] = []
  for (const cid of g.children) {
    const c = await readEntry(persist, formId, cid)
    if (c && isChild(c)) out.push(c)
  }
  return out
}

/** 父条目 children 中是否含占位符子条(即"注册父") */
async function readPlaceholderOwner(persist: PersistJsonLike, formId: string, g: GroupEntry): Promise<boolean> {
  for (const cid of g.children) {
    const c = await readEntry(persist, formId, cid)
    if (c && isPlaceholder(c)) return true
  }
  return false
}

export function createStore(persist: PersistJsonLike): PromptStore {
  async function writeForm(formId: string, f: FormFile): Promise<void> {
    await persist.write(formFile(formId), f)
  }
  async function writeEntry(formId: string, e: Entry): Promise<void> {
    await persist.write(entryFile(formId, e.id), e)
  }
  return {
    async listForms() {
      const dirs = await persist.list(ROOT)
      const out: FormRow[] = []
      for (const d of dirs) {
        try {
          const f = await readForm(persist, d)
          out.push({ id: d, name: f.name, entryCount: f.entries.length })
        } catch { /* 损坏目录跳过 */ }
      }
      out.sort((a, b) => a.name.localeCompare(b.name, 'zh') || a.id.localeCompare(b.id))
      return out
    },
    async listEntries(formId) {
      const { top, groupMap } = await loadFormEntries(persist, formId)
      const out: Entry[] = []
      for (const e of top) {
        out.push(e)
        if (isGroup(e)) {
          const g = groupMap.get(e.id)!
          for (const c of await childrenOf(persist, formId, g)) out.push(c)
        }
      }
      return out
    },
    async createForm(name) {
      const id = genId('f')
      await writeForm(id, { name: cleanName(name), entries: [] })
      return { id }
    },
    async renameForm(id, name) {
      const f = await readForm(persist, id)
      f.name = cleanName(name)
      await writeForm(id, f)
    },
    async deleteForm(id) {
      await readForm(persist, id)
      await persist.delete(dirOf(id))
      const active = await readActiveFile(persist)
      if (active === id) await persist.delete(ACTIVE_FILE)
    },
    async createEntry(formId, input) {
      const f = await readForm(persist, formId)
      const entryId = genId('e')
      const kindIsGroup = input.kind === 'group'
      const baseIsSet = typeof input.base === 'string' && input.base !== ''
      if (kindIsGroup && baseIsSet) throw new Error('kind 与 base 不能同时出现')
      if (kindIsGroup) {
        const e: GroupEntry = { id: entryId, name: cleanName(input.name), role: cleanRole(input.role), kind: 'group', children: [] }
        await writeEntry(formId, e)
        f.entries.push(entryId)
        await writeForm(formId, f)
        return { entryId }
      }
      if (baseIsSet) {
        const baseId = input.base as string
        const parent = await readEntry(persist, formId, baseId)
        if (!parent || !isGroup(parent)) throw new Error('base 必须指向本表单存在的父条目')
        if (isPlaceholder(parent)) throw new Error('占位符子条不能作为父条目')
        const e: ChildEntry = { id: entryId, name: cleanName(input.name), base: baseId, text: cleanText(input.text) }
        await writeEntry(formId, e)
        const g = parent as GroupEntry
        const gp: GroupEntry = { ...g, children: [...g.children, entryId] }
        await writeEntry(formId, gp)
        return { entryId }
      }
      // 普通条目
      const e: PlainEntry = { id: entryId, name: cleanName(input.name), role: cleanRole(input.role), text: cleanText(input.text) }
      await writeEntry(formId, e)
      f.entries.push(entryId)
      await writeForm(formId, f)
      return { entryId }
    },
    async updateEntry(formId, entryId, input) {
      const cur = await readEntry(persist, formId, entryId)
      if (!cur) throw new NotFoundError('条目不存在')
      if (isPlaceholder(cur)) throw new Error('该子条由插件注册,不可编辑')
      if (input.kind !== undefined && input.kind !== 'group') throw new Error('kind 非法,仅支持 group')
      if (input.kind !== undefined && !isGroup(cur)) throw new Error('kind 不可修改')
      if (input.base !== undefined && !(isChild(cur) && cur.base === String(input.base))) throw new Error('base 不可修改')
      if (input.enabled !== undefined && typeof input.enabled !== 'boolean') throw new Error('enabled 必须为布尔值')
      if (isGroup(cur)) {
        if (input.text !== undefined) throw new Error('父条目不能包含 text')
        // 注册父(children 含占位符子条)名称锁定,只允许改 role/enabled
        if (await readPlaceholderOwner(persist, formId, cur)
          && input.name !== undefined && cleanName(input.name) !== cur.name) {
          throw new Error('该条目由插件注册,名称不可修改')
        }
        const g: GroupEntry = {
          id: cur.id, kind: 'group',
          name: input.name !== undefined ? cleanName(input.name) : cur.name,
          role: cleanRole(input.role ?? cur.role),
          children: cur.children,
          ...(input.enabled === undefined ? {} : { enabled: input.enabled }),
        }
        await writeEntry(formId, g)
        return
      }
      if (isChild(cur)) {
        if (input.enabled !== undefined) throw new Error('子条目不支持启用开关')
        const c: ChildEntry = { id: cur.id, name: cleanName(input.name ?? cur.name), base: cur.base, text: cleanText(input.text ?? cur.text) }
        await writeEntry(formId, c)
        return
      }
      const p: PlainEntry = {
        id: cur.id,
        name: cleanName(input.name ?? cur.name),
        role: cleanRole(input.role ?? cur.role),
        text: cleanText(input.text ?? cur.text),
        ...(input.enabled === undefined ? {} : { enabled: input.enabled }),
      }
      await writeEntry(formId, p)
    },
    async deleteEntry(formId, entryId) {
      const f = await readForm(persist, formId)
      const cur = await readEntry(persist, formId, entryId)
      if (!cur) throw new NotFoundError('条目不存在')
      if (isPlaceholder(cur)) throw new Error('占位符子条不可单独删除,请删除其父条目')
      if (isGroup(cur)) {
        // 级联:先删 children,再从顶层移除父
        for (const cid of cur.children) await persist.delete(entryFile(formId, cid))
        f.entries = f.entries.filter((x) => x !== entryId)
        await writeForm(formId, f)
        await persist.delete(entryFile(formId, entryId))
        return
      }
      if (isChild(cur)) {
        const parent = await readEntry(persist, formId, cur.base)
        if (parent && isGroup(parent)) {
          const g: GroupEntry = { ...parent, children: parent.children.filter((x) => x !== entryId) }
          await writeEntry(formId, g)
        }
        await persist.delete(entryFile(formId, entryId))
        return
      }
      f.entries = f.entries.filter((x) => x !== entryId)
      await writeForm(formId, f)
      await persist.delete(entryFile(formId, entryId))
    },
    async saveLayout(formId, input) {
      const f = await readForm(persist, formId)
      if (input.entries !== undefined) {
        const ids = cleanPerm(input.entries, f.entries, '顺序与当前条目不一致')
        await writeForm(formId, { ...f, entries: ids })
      }
      if (input.children !== undefined) {
        if (!input.children || typeof input.children !== 'object' || Array.isArray(input.children)) throw new Error('children 必须为对象')
        const map = input.children as Record<string, unknown>
        for (const [pid, ids] of Object.entries(map)) {
          const g = await readEntry(persist, formId, pid)
          if (!g || !isGroup(g)) throw new Error('父条目不存在: ' + pid)
          const cleaned = cleanChildren(ids, g.children)
          const next: GroupEntry = { ...g, children: cleaned }
          await writeEntry(formId, next)
        }
      }
    },
    async readTree(formId) {
      const { top, groupMap } = await loadFormEntries(persist, formId)
      const childrenByParent: Record<string, ChildEntry[]> = {}
      for (const e of top) {
        if (isGroup(e)) {
          const g = groupMap.get(e.id)!
          childrenByParent[g.id] = await childrenOf(persist, formId, g)
        }
      }
      return { top, childrenByParent }
    },
    async addRegisteredEntry(formId, input) {
      const regId = typeof input.regId === 'string' ? input.regId : ''
      const regName = typeof input.name === 'string' ? input.name.trim() : ''
      if (!regId || !REG_ID_RE.test(regId)) throw new Error('注册 id 非法:需为非空且仅含字母/数字/._-')
      if (!regName || regName.length > MAX_NAME) throw new Error(`注册名称最长 ${MAX_NAME} 字符`)
      const f = await readForm(persist, formId)
      if (f.entries.includes(regId)) throw new Error('该注册条目已添加')
      const phId = genId('e')
      const parent: GroupEntry = { id: regId, name: regName, role: 'user', kind: 'group', children: [phId] }
      const child: ChildEntry = { id: phId, name: regName, base: regId, text: '', placeholder: { regId, name: regName } }
      await writeEntry(formId, parent)
      await writeEntry(formId, child)
      f.entries.push(regId)
      await writeForm(formId, f)
      return { entryId: regId }
    },
    async getActiveFormId() {
      return readActiveFile(persist)
    },
    async setActiveFormId(formId) {
      const clean = typeof formId === 'string' && formId !== '' ? formId : ''
      if (!clean) throw new Error('表单 id 不能为空')
      await readForm(persist, clean) // 不存在 → NotFoundError('表单不存在')
      await persist.write(ACTIVE_FILE, { formId: clean })
    },
    async hasRegisteredEntry(formId, regId) {
      const { top } = await loadFormEntries(persist, formId)
      return top.some((e) => isGroup(e) && e.id === regId)
    },
  }
}

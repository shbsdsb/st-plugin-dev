import type { FormRow, PanelState } from './state.ts'
import { createPanelState, applyList, upsertForm, removeForm, selectForm, setExpand, toggleExpand, toTree } from './state.ts'
import * as api from './api.ts'
import type { ChildEntry, Entry, GroupEntry } from '../types.ts'
import { isGroup, isPlain } from '../messages.ts'
import { ensureStyle } from './style.ts'
import { el, button } from './dom.ts'
import { openEntryEditor, openGroupCreator, openChildCreator, openChildEditor } from './sub-modal.ts'
import { confirmDialog } from './confirm.ts'
import { openResult } from './result-modal.ts'
import { createLayer, headOf, footOf } from './layers.ts'
import { attachDrag } from './drag.ts'

type ToastFn = (msg: string) => void

export function createPanel(toast: ToastFn): HTMLElement {
  ensureStyle()
  const root = el('div', 'prp')
  let state: PanelState = createPanelState()
  let rows: Entry[] = []
  let savingOrder = false // 保存顺序在途保护
  const toastError = (e: unknown) => toast((e as Error)?.message || '操作失败')

  // ===== DOM 骨架 =====
  const formBar = el('div', 'prp row-preset')
  const actionsRow = el('div', 'prp row-actions')
  const entriesLabel = el('label')
  entriesLabel.textContent = '条目(父条目聚合其子条目组成一条消息)'
  const listBox = el('div', 'prp entry-list')
  const entriesWrap = el('div', 'prp fg')
  entriesWrap.append(entriesLabel, listBox)
  const sendBtn = button('prp send-btn', '发送 Prompt', () => void doSend())
  sendBtn.disabled = true
  const saveOrderBtn = button('prp save-order-btn', '保存顺序', () => void doSaveOrder())
  saveOrderBtn.disabled = true
  const beta = el('span', 'prp pid', '测试版')
  const dot = el('span', 'prp status-dot')
  const statusText = el('span', 'prp status-text', '就绪')
  const statusRow = el('div', 'prp status-row')
  statusRow.append(dot, statusText)
  const sendRow = el('div', 'prp row-bottom')
  sendRow.append(sendBtn, saveOrderBtn, beta, statusRow)
  root.append(formBar, actionsRow, entriesWrap, sendRow)

  const setStatus = (msg: string, type: 'success' | 'error' | 'idle') => {
    dot.className = 'prp status-dot' + (type === 'success' ? ' success' : type === 'error' ? ' error' : '')
    statusText.textContent = msg
    if (type !== 'idle') setTimeout(() => { statusText.textContent = '就绪' }, 3000)
  }

  const current = (): FormRow | null => state.forms.find((f) => f.id === state.currentId) ?? null

  function curId(): string {
    const cur = current()
    if (!cur) throw new Error('请先新建一个表单')
    return cur.id
  }

  async function refreshAll(): Promise<void> {
    const cur = current()
    if (!cur) { renderEmpty('暂无表单,点击「新建表单」开始'); updateSendAndSave(); return }
    try {
      rows = await api.listEntries(cur.id)
      // 首次载入或保存成功后,以服务端序重置内存序(仅当无未保存脏序时)
      if (!state.dirtyOrder) {
        const { top } = toTree(rows)
        state = { ...state, topOrder: top.map((e) => e.id), childOrder: childOrderOf(rows) }
      }
      renderList()
    } catch (e) {
      renderEmpty('条目加载失败:' + ((e as Error)?.message ?? e))
    }
    updateSendAndSave()
  }

  function childOrderOf(list: Entry[]): Record<string, string[]> {
    const out: Record<string, string[]> = {}
    for (const e of list) {
      if (isGroup(e)) out[e.id] = [...e.children]
    }
    return out
  }

  function renderEmpty(msg: string): void {
    listBox.innerHTML = ''
    listBox.appendChild(el('div', 'prp empty-state', msg))
  }

  function renderList(): void {
    const { top, childrenByParent } = toTree(rows)
    listBox.innerHTML = ''
    if (top.length === 0) {
      listBox.appendChild(el('div', 'prp empty-state', '当前表单没有条目,点击「新建条目」添加'))
      return
    }
    for (const e of top) {
      const wrap = renderTopRow(e, childrenByParent)
      listBox.appendChild(wrap)
      bindTopDrag(wrap, e)
    }
  }

  function renderTopRow(e: Entry, childrenByParent: Record<string, ChildEntry[]>): HTMLElement {
    const wrap = el('div', 'prp entry-wrap')
    wrap.dataset.entryId = e.id
    const head = el('div', 'prp entry-head')
    const handle = el('span', 'prp drag-handle', '⋮⋮')
    handle.title = '拖动排序(纯前端,点「保存顺序」提交)'
    const name = el('span', 'prp entry-name', e.name)
    name.title = e.name
    const group = isGroup(e)
    const role = el('span', 'prp entry-role', isGroup(e) ? e.role : isPlain(e) ? e.role : '')
    const expanded = state.expandedId === e.id
    const caretBtn = button('prp text-btn', '', () => { if (group) void doToggleExpand(e.id) })
    caretBtn.textContent = group ? (expanded ? '收起' : '展开') : ''
    if (!group) caretBtn.style.visibility = 'hidden'
    const segPid = group
      ? el('span', 'prp pid', `${(e as GroupEntry).children.length} 子`)
      : el('span', 'prp pid-empty')
    const spacer = el('span', 'prp entry-spacer')
    const editBtn = button('prp text-btn', '编辑', () => {
      if (group) {
        openEntryEditor({
          title: '编辑父条目', entry: { name: e.name, role: e.role }, withRole: true, withText: false,
          onSave: async (input) => {
            if (!input.name) { toast('名称不能为空'); throw new Error('名称不能为空') }
            try { await api.updateEntry(curId(), e.id, { name: input.name, role: input.role }); await refreshAll(); toast('已保存') }
            catch (err) { toastError(err); throw err }
          },
        })
      } else if (isPlain(e)) {
        openEntryEditor({
          title: '编辑条目', entry: { name: e.name, role: e.role, text: e.text }, withRole: true, withText: true,
          onSave: async (input) => {
            if (!input.name) { toast('名称不能为空'); throw new Error('名称不能为空') }
            try { await api.updateEntry(curId(), e.id, { name: input.name, role: input.role, text: input.text }); await refreshAll(); toast('已保存') }
            catch (err) { toastError(err); throw err }
          },
        })
      }
    })
    const delBtn = button('prp text-btn danger', '删除', () => {
      const children = group ? (e as GroupEntry).children.length : 0
      confirmDialog({
        title: group ? '删除父条目' : '删除条目',
        desc: group && children > 0
          ? `确定要删除父条目「${e.name}」及其 ${children} 个子条目吗?此操作不可撤销。`
          : `确定要删除${group ? '父条目' : '条目'}「${e.name}」吗?`,
        onOk: () => { void (async () => {
          try { await api.deleteEntry(curId(), e.id); await refreshAll(); toast('已删除') }
          catch (err) { toastError(err) }
        })() },
      })
    })
    head.append(handle, name, role, segPid, caretBtn, spacer, editBtn, delBtn)
    wrap.appendChild(head)
    if (group && expanded) {
      const children = childrenByParent[e.id] ?? []
      wrap.appendChild(renderDetail(e as GroupEntry, children))
    }
    return wrap
  }

  function renderDetail(g: GroupEntry, children: ChildEntry[]): HTMLElement {
    const detail = el('div', 'prp entry-detail')
    const label = el('label', 'prp detail-label')
    label.textContent = `子条目(${children.length})—— role 取父条目 ${g.role},text 按序拼入父内容`
    detail.append(label)
    const childList = el('div', 'prp block-list')
    if (children.length === 0) {
      childList.appendChild(el('div', 'prp block-empty', '暂无子条目,点击下方「新建子条目」'))
    } else {
      for (const c of children) {
        const rowEl = renderChildRow(g, c)
        childList.appendChild(rowEl)
        bindChildDrag(rowEl, g)
      }
    }
    detail.append(childList)
    detail.appendChild(button('prp dashed-btn', '新建子条目', () => void doCreateChild(g)))
    return detail
  }

  function renderChildRow(g: GroupEntry, c: ChildEntry): HTMLElement {
    const rowEl = el('div', 'prp block-row')
    rowEl.dataset.blockId = c.id
    const handle = el('span', 'prp drag-handle', '⋮⋮')
    handle.title = '拖动排序(纯前端,点「保存顺序」提交)'
    const name = el('span', 'prp entry-name', c.name)
    const preview = el('span', 'prp child-preview', c.text.trim() === '' ? '(空)' : c.text)
    preview.title = c.text
    const editBtn = button('prp text-btn', '编辑', () => {
      openChildEditor({
        entry: { name: c.name, text: c.text },
        onSave: async (input) => {
          if (!input.name) { toast('名称不能为空'); throw new Error('名称不能为空') }
          try { await api.updateEntry(curId(), c.id, { name: input.name, text: input.text }); await refreshAll(); toast('已保存') }
          catch (err) { toastError(err); throw err }
        },
      })
    })
    const delBtn = button('prp text-btn danger', '删除', () => {
      confirmDialog({
        title: '删除子条目', desc: `确定要删除子条目「${c.name}」吗?`, onOk: () => { void (async () => {
          try { await api.deleteEntry(curId(), c.id); await refreshAll(); toast('已删除') }
          catch (err) { toastError(err) }
        })() },
      })
    })
    rowEl.append(handle, name, preview, editBtn, delBtn)
    void g
    return rowEl
  }

  // ---------- 顶层拖拽(纯前端内存序) ----------
  function bindTopDrag(w: HTMLElement, _e: Entry): void {
    const h = w.querySelector<HTMLElement>('.entry-head .drag-handle')
    if (!h) return
    attachDrag({ handle: h, item: w, container: listBox, onDrop: (items) => {
      const ids = items.map((it) => it.dataset.entryId ?? '').filter((x) => x !== '')
      if (ids.length !== state.topOrder.length) return
      if (ids.join('|') === state.topOrder.join('|')) return
      state = { ...state, topOrder: ids, dirtyOrder: true }
      updateSendAndSave()
    } })
  }

  // ---------- 子条目拖拽(纯前端内存序) ----------
  function bindChildDrag(rowEl: HTMLElement, g: GroupEntry): void {
    const h = rowEl.querySelector<HTMLElement>('.drag-handle')
    if (!h || !rowEl.parentElement) return
    const container = rowEl.parentElement
    attachDrag({ handle: h, item: rowEl, container, onDrop: (items) => {
      const ids = items.map((it) => it.dataset.blockId ?? '').filter((x) => x !== '')
      const cur = state.childOrder[g.id] ?? []
      if (ids.length !== cur.length) return
      if (ids.join('|') === cur.join('|')) return
      state = { ...state, childOrder: { ...state.childOrder, [g.id]: ids }, dirtyOrder: true }
      updateSendAndSave()
    } })
  }

  async function doSaveOrder(): Promise<void> {
    if (savingOrder) return
    const cur = current()
    if (!cur || !state.dirtyOrder) return
    savingOrder = true
    saveOrderBtn.disabled = true
    try {
      await api.saveLayout(cur.id, { entries: state.topOrder, children: state.childOrder })
      state = { ...state, dirtyOrder: false }
      await refreshAll()
      toast('已保存顺序')
    } catch (e) {
      toastError(e)
      // 回滚:重新拉服务端序
      state = { ...state, dirtyOrder: false }
      await refreshAll()
    } finally {
      savingOrder = false
      updateSendAndSave()
    }
  }

  // ---------- 发送 ----------
  function updateSendAndSave(): void {
    const cur = current()
    const { childrenByParent } = toTree(rows)
    const hasContent = rows.some((e) => {
      if (isGroup(e)) {
        const children = childrenByParent[e.id] ?? []
        return children.some((c) => c.text.trim() !== '')
      }
      if (isPlain(e)) return e.text.trim() !== ''
      return false
    })
    sendBtn.disabled = !cur || !hasContent
    saveOrderBtn.disabled = !state.dirtyOrder
  }

  async function doSend(): Promise<void> {
    const cur = current()
    if (!cur) return
    try {
      const payload = await api.sendPrompt(cur.id)
      openResult('已发送(普通条目独立成消息;父条目聚合其子条目)', payload)
      setStatus('已发送', 'success')
    } catch (e) {
      openResult('发送失败', { ok: false, message: (e as Error)?.message || '发送失败' })
      setStatus('发送失败', 'error')
    }
  }

  // ---------- 表单/操作行 ----------
  function renderBar(): void {
    formBar.innerHTML = ''
    if (state.forms.length === 0) {
      formBar.appendChild(el('span', '', '暂无表单'))
      return
    }
    const sel = document.createElement('select')
    for (const f of state.forms) {
      const o = document.createElement('option')
      o.value = f.id
      o.textContent = f.name
      if (f.id === state.currentId) o.selected = true
      sel.appendChild(o)
    }
    sel.addEventListener('change', () => {
      state = selectForm(state, sel.value)
      state = { ...state, expandedId: null, dirtyOrder: false, topOrder: [], childOrder: {} }
      void refreshAll(); renderBar()
    })
    const cur = current()
    formBar.appendChild(sel)
    if (cur) formBar.appendChild(el('span', 'prp pid', `${cur.entryCount} 个条目`))
    formBar.appendChild(button('prp text-btn', '改名', () => startRename()))
    formBar.appendChild(button('prp text-btn', '新建表单', () => void doCreateForm()))
  }

  function startRename(): void {
    const cur = current()
    if (!cur) return
    formBar.innerHTML = ''
    const input = el('input') as HTMLInputElement
    input.value = cur.name
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void confirmRename(input)
      if (e.key === 'Escape') renderBar()
    })
    formBar.append(input, button('prp text-btn', '确定', () => void confirmRename(input)), button('prp text-btn', '取消', () => renderBar()))
    input.focus(); input.select()
  }

  async function confirmRename(input: HTMLInputElement): Promise<void> {
    const cur = current()
    if (!cur) return
    const name = input.value.trim()
    if (!name) { toast('名称不能为空'); return }
    try {
      await api.renameForm(cur.id, name)
      state = upsertForm(state, { ...cur, name })
      renderBar(); toast('已更新表单名称')
    } catch (e) { toastError(e) }
  }

  function defaultFormName(): string {
    const base = '新预设'
    const names = new Set(state.forms.map((f) => f.name))
    let n = 1
    while (names.has(base + (n > 1 ? ' ' + n : ''))) n++
    return n > 1 ? base + ' ' + n : base
  }

  async function doCreateForm(): Promise<void> {
    const name = defaultFormName()
    try {
      const { id } = await api.createForm(name)
      state = selectForm(upsertForm(state, { id, name, entryCount: 0 }), id)
      state = { ...state, expandedId: null, dirtyOrder: false, topOrder: [], childOrder: {} }
      await refreshAll(); renderBar(); renderActions(); toast('已创建新表单')
    } catch (e) { toastError(e) }
  }

  function renderActions(): void {
    actionsRow.innerHTML = ''
    const hasForm = state.forms.length > 0
    const newEntryBtn = button('', '新建条目', () => doCreateEntryWizard())
    const deleteFormBtn = button('danger', '删除表单', () => confirmDeleteForm())
    newEntryBtn.disabled = !hasForm
    deleteFormBtn.disabled = !hasForm
    actionsRow.append(newEntryBtn, deleteFormBtn)
  }

  function doCreateEntryWizard(): void {
    if (!current()) { toast('请先新建一个表单'); return }
    askEntryKind()
  }

  function askEntryKind(): void {
    const { modal, close } = createLayer('min(380px,90vw)')
    headOf(modal, '新建条目', close)
    const body = el('div', 'prp float-body')
    body.appendChild(el('div', 'prp wizard-tip', '请选择要创建的条目类型'))
    const plainBtn = document.createElement('button')
    plainBtn.className = 'prp wizard-opt'; plainBtn.type = 'button'; plainBtn.textContent = '普通条目(独立成一条消息)'
    plainBtn.addEventListener('click', () => { close(); void createPlainEntry() })
    const groupBtn = document.createElement('button')
    groupBtn.className = 'prp wizard-opt'; groupBtn.type = 'button'; groupBtn.textContent = '父条目(占位,子条目聚合为一条消息)'
    groupBtn.addEventListener('click', () => { close(); createGroupEntry() })
    body.append(plainBtn, groupBtn)
    modal.appendChild(body)
    footOf(modal, [{ label: '取消', variant: 's', onClick: close }])
    setTimeout(() => plainBtn.focus(), 30)
  }

  async function createPlainEntry(): Promise<void> {
    const id = curId()
    try {
      const { entryId } = await api.createEntry(id, { name: '新条目', role: 'user', text: '' })
      await refreshAll()
      const created = rows.find((r) => r.id === entryId)
      if (created && isPlain(created)) {
        openEntryEditor({
          title: '编辑条目', entry: { name: created.name, role: created.role, text: created.text }, withRole: true, withText: true,
          onSave: async (input) => {
            if (!input.name) { toast('名称不能为空'); throw new Error('名称不能为空') }
            try { await api.updateEntry(id, entryId, { name: input.name, role: input.role, text: input.text }); await refreshAll(); toast('已保存') }
            catch (err) { toastError(err); throw err }
          },
        })
      }
    } catch (e) { toastError(e) }
  }

  function createGroupEntry(): void {
    const id = curId()
    openGroupCreator({
      title: '新建父条目(选择 role 作为聚合消息角色)',
      onSave: async (input) => {
        try {
          const { entryId } = await api.createEntry(id, { name: input.name, role: input.role, kind: 'group' })
          state = setExpand(state, entryId)
          await refreshAll()
          const addBtn = listBox.querySelector<HTMLButtonElement>(`.entry-wrap[data-entry-id="${entryId}"] .dashed-btn`)
          addBtn?.focus()
          toast('已创建父条目,点击「新建子条目」填入内容')
        } catch (e) { toastError(e) }
      },
    })
  }

  async function doCreateChild(g: GroupEntry): Promise<void> {
    const id = curId()
    openChildCreator({
      onSave: async (input) => {
        try {
          await api.createEntry(id, { name: input.name, base: g.id, text: input.text })
          await refreshAll()
          toast('已新建子条目')
        } catch (e) { toastError(e) }
      },
    })
  }

  async function doToggleExpand(entryId: string): Promise<void> {
    state = toggleExpand(state, entryId)
    renderList()
  }

  function confirmDeleteForm(): void {
    const cur = current()
    if (!cur) return
    confirmDialog({
      title: '删除表单', desc: `确定要删除表单「${cur.name}」及其所有条目吗?此操作不可撤销。`, onOk: () => { void (async () => {
        try {
          await api.deleteForm(cur.id)
          state = removeForm(state, cur.id)
          state = { ...state, dirtyOrder: false, topOrder: [], childOrder: {} }
          await refreshAll(); renderBar(); renderActions()
          toast('已删除表单')
        } catch (e) { toastError(e) }
      })() },
    })
  }

  // ---------- 初始化 ----------
  void (async () => {
    try {
      state = applyList(state, await api.listForms())
      renderBar(); renderActions()
      await refreshAll()
    } catch (e) { toastError(e) }
  })()
  return root
}

import type { FormRow, PanelState } from './state.ts'
import { createPanelState, applyList, upsertForm, removeForm, selectForm, setExpand, toggleExpand, segmentCount } from './state.ts'
import * as api from './api.ts'
import type { Block, Entry } from '../types.ts'
import { entryContent } from '../messages.ts'
import { ensureStyle } from './style.ts'
import { el, button } from './dom.ts'
import { openEntryEditor } from './sub-modal.ts'
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
  let seq = 0 // 防条目渲染竞态:切表单后丢弃过期响应
  let sending = false // doSend in-flight 保护
  let statusTimer: ReturnType<typeof setTimeout> | null = null
  const toastError = (e: unknown) => toast((e as Error)?.message || '操作失败')

  // ===== DOM 骨架(三段 + 发送行;布局对应验收 demo) =====
  const formBar = el('div', 'prp row-preset')
  const actionsRow = el('div', 'prp row-actions')
  const entriesLabel = el('label')
  entriesLabel.textContent = '条目(按顺序组成 messages)'
  const listBox = el('div', 'prp entry-list')
  const entriesWrap = el('div', 'prp fg')
  entriesWrap.append(entriesLabel, listBox)
  const sendBtn = button('prp send-btn', '发送 Prompt', () => void doSend())
  sendBtn.disabled = true
  const beta = el('span', 'prp pid', '测试版')
  const dot = el('span', 'prp status-dot')
  const statusText = el('span', 'prp status-text', '就绪')
  const statusRow = el('div', 'prp status-row')
  statusRow.append(dot, statusText)
  const sendRow = el('div', 'prp row-bottom')
  sendRow.append(sendBtn, beta, statusRow)
  root.append(formBar, actionsRow, entriesWrap, sendRow)

  const setStatus = (msg: string, type: 'success' | 'error' | 'idle') => {
    dot.className = 'prp status-dot' + (type === 'success' ? ' success' : type === 'error' ? ' error' : '')
    statusText.textContent = msg
    if (statusTimer) clearTimeout(statusTimer)
    if (type === 'idle') return
    statusTimer = setTimeout(() => { dot.className = 'prp status-dot'; statusText.textContent = '就绪' }, 3000)
  }

  // ===== 数据 =====
  const current = (): FormRow | null => state.forms.find((f) => f.id === state.currentId) ?? null
  /** 取 rows 缓存中该条目最新实例(连续操作不复活旧 blocks) */
  const fresh = (entryId: string): Entry | undefined => rows.find((r) => r.id === entryId)

  async function refreshForms(): Promise<void> {
    try {
      state = applyList(state, await api.listForms())
      renderBar()
      renderActions()
      await renderEntries()
    } catch (e) { toastError(e) }
  }

  async function renderAll(): Promise<void> {
    renderBar()
    renderActions()
    await renderEntries()
  }

  // ---------- 顶部条:下拉切换 + pid + 改名/新建表单 ----------
  function renderBar(): void {
    formBar.innerHTML = ''
    if (state.forms.length === 0) {
      const hint = el('span')
      hint.textContent = '暂无表单'
      hint.style.cssText = 'color:#a1a1aa;flex:1;min-width:0'
      formBar.appendChild(hint)
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
      void renderAll()
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
    formBar.appendChild(input)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void confirmRename(input)
      if (e.key === 'Escape') renderBar()
    })
    formBar.appendChild(button('prp text-btn', '确定', () => void confirmRename(input)))
    formBar.appendChild(button('prp text-btn', '取消', () => renderBar()))
    input.focus()
    input.select()
  }

  async function confirmRename(input: HTMLInputElement): Promise<void> {
    const cur = current()
    if (!cur) return
    const name = input.value.trim()
    if (!name) { toast('名称不能为空'); return }
    try {
      await api.renameForm(cur.id, name)
      state = upsertForm(state, { ...cur, name })
      await renderEntries()
      renderBar()
      toast('已更新表单名称')
    } catch (e) { toastError(e) }
  }

  // ---------- 操作行 ----------
  function renderActions(): void {
    actionsRow.innerHTML = ''
    const hasForm = state.forms.length > 0
    const newFormBtn = button('', '新建表单', () => void doCreateForm())
    const newEntryBtn = button('', '新建条目', () => void doCreateEntry())
    const deleteFormBtn = button('danger', '删除表单', () => confirmDeleteForm())
    newEntryBtn.disabled = !hasForm
    deleteFormBtn.disabled = !hasForm
    actionsRow.append(newFormBtn, newEntryBtn, deleteFormBtn)
  }

  // ---------- 表单操作 ----------
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
      state = upsertForm(state, { id, name, entryCount: 0 })
      state = selectForm(state, id)
      await renderAll()
      toast('已创建新表单')
    } catch (e) { toastError(e) }
  }

  function confirmDeleteForm(): void {
    const cur = current()
    if (!cur) return
    confirmDialog({
      title: '删除表单',
      desc: `确定要删除表单「${cur.name}」及其所有条目吗?此操作不可撤销。`,
      onOk: () => {
        void (async () => {
          try {
            await api.deleteForm(cur.id)
            state = removeForm(state, cur.id)
            await renderAll()
            toast('已删除表单')
          } catch (e) { toastError(e) }
        })()
      },
    })
  }

  // ---------- 新建条目(类型向导) ----------
  async function doCreateEntry(): Promise<void> {
    const cur = current()
    if (!cur) { toast('请先新建一个表单'); return }
    askEntryKind(cur)
  }

  function askEntryKind(cur: FormRow): void {
    const { modal, close } = createLayer('min(380px,90vw)')
    headOf(modal, '新建条目', close)

    const body = el('div', 'prp float-body')
    const tip = el('div', 'prp wizard-tip', '请选择要创建的条目类型')
    const normal = document.createElement('button')
    normal.className = 'prp wizard-opt'
    normal.type = 'button'
    normal.textContent = '普通条目'
    normal.addEventListener('click', () => { close(); void createPlain(cur) })
    const grouped = document.createElement('button')
    grouped.className = 'prp wizard-opt'
    grouped.type = 'button'
    grouped.textContent = '带内容块的条目'
    grouped.addEventListener('click', () => { close(); void createGrouped(cur) })
    body.append(tip, normal, grouped)
    modal.appendChild(body)
    footOf(modal, [{ label: '取消', variant: 's', onClick: close }])
    setTimeout(() => normal.focus(), 30)
  }

  async function createPlain(cur: FormRow): Promise<void> {
    try {
      const { entryId } = await api.createEntry(cur.id, { name: '新条目', role: 'user', text: '', blocks: [] })
      await renderAll()
      openEntryEditor({
        entry: { id: entryId, name: '新条目', role: 'user', text: '', blocks: [] },
        onSave: async (input) => {
          if (!input.name) { toast('条目名称不能为空'); throw new Error('条目名称不能为空') }
          try {
            await api.updateEntry(cur.id, entryId, { ...input, blocks: [] })
            await renderAll()
            toast('已保存条目')
          } catch (e) { toastError(e); throw e }
        },
      })
    } catch (e) { toastError(e) }
  }

  async function createGrouped(cur: FormRow): Promise<void> {
    try {
      const { entryId } = await api.createEntry(cur.id, { name: '新条目', role: 'user', text: '', blocks: [] })
      state = setExpand(state, entryId)
      await renderAll()
      toast('已创建,点击「添加内容块」填入段落')
    } catch (e) { toastError(e) }
  }

  // ---------- 条目列表 ----------
  async function renderEntries(): Promise<void> {
    const my = ++seq
    const cur = current()
    entriesLabel.style.display = cur ? '' : 'none'
    if (!cur) {
      listBox.innerHTML = ''
      listBox.appendChild(el('div', 'prp empty-state', '暂无表单,点击「新建表单」开始'))
      rows = []
      updateSend()
      return
    }
    try {
      const list = await api.listEntries(cur.id)
      if (my !== seq) return // 已切换表单,丢弃过期渲染
      rows = list
      listBox.innerHTML = ''
      if (rows.length === 0) {
        listBox.appendChild(el('div', 'prp empty-state', '当前表单没有条目,点击「新建条目」添加'))
      } else {
        const wraps: HTMLElement[] = []
        for (const e of rows) wraps.push(renderEntryWrap(e, cur.id))
        for (const w of wraps) {
          listBox.appendChild(w)
          const h = w.querySelector<HTMLElement>('.prp-entry-head .prp-drag-handle')
          if (h) {
            attachDrag({
              handle: h,
              item: w,
              container: listBox,
              onDrop: (items) => {
                const ids = items.map((it) => it.dataset.entryId ?? '').filter((x) => x !== '')
                void (async () => {
                  try {
                    await api.reorderEntries(cur.id, ids)
                    await renderAll() // 以服务端为准刷新(失败即回滚)
                    toast('已保存条目顺序')
                  } catch (err) { toastError(err) }
                })()
              },
            })
          }
        }
      }
      updateSend()
    } catch (e) {
      if (my !== seq) return
      listBox.innerHTML = ''
      listBox.appendChild(el('div', 'prp empty-state', '条目加载失败:' + ((e as Error)?.message ?? e)))
      rows = []
      updateSend()
    }
  }

  function renderEntryWrap(e: Entry, formId: string): HTMLElement {
    const wrap = el('div', 'prp entry-wrap')
    wrap.dataset.entryId = e.id
    const head = el('div', 'prp entry-head')
    const handle = el('span', 'prp drag-handle', '⋮⋮')
    handle.title = '拖动排序'
    const name = el('span', 'prp entry-name', e.name)
    name.title = e.name
    const role = el('span', 'prp entry-role', e.role)
    const segs = segmentCount(e)
    const segPid = segs > 0 ? el('span', 'prp pid', `${segs} 段`) : el('span', 'prp pid-empty')
    const expanded = state.expandedId === e.id
    const caretBtn = button('prp text-btn', '', () => { if (segs > 0) void doToggleExpand(e.id) })
    caretBtn.textContent = segs > 0 ? (expanded ? '收起' : '展开') : ''
    if (segs === 0) caretBtn.style.visibility = 'hidden' // 普通条目无展开能力,仍占位保持对齐
    const spacer = el('span', 'prp entry-spacer')
    const editBtn = button('prp text-btn', '编辑', () => {
      openEntryEditor({
        entry: e,
        onSave: async (input) => {
          if (!input.name) { toast('条目名称不能为空'); throw new Error('条目名称不能为空') }
          try {
            const latest = fresh(e.id)
            await api.updateEntry(formId, e.id, { ...input, blocks: latest?.blocks ?? [] })
            await renderAll()
            toast('已保存条目')
          } catch (err) { toastError(err); throw err }
        },
      })
    })
    const delBtn = button('prp text-btn danger', '删除', () => {
      confirmDialog({
        title: '删除条目',
        desc: segs > 0 ? `确定要删除条目「${e.name}」及其 ${segs} 个内容块吗?` : `确定要删除条目「${e.name}」吗?`,
        onOk: () => {
          void (async () => {
            try {
              await api.deleteEntry(formId, e.id)
              if (state.expandedId === e.id) state = setExpand(state, null)
              await renderAll()
              toast('已删除条目')
            } catch (err) { toastError(err) }
          })()
        },
      })
    })
    head.append(handle, name, role, segPid, caretBtn, spacer, editBtn, delBtn)
    wrap.appendChild(head)
    if (segs > 0 && expanded) wrap.appendChild(renderDetail(e, formId))
    return wrap
  }

  async function doToggleExpand(entryId: string): Promise<void> {
    state = toggleExpand(state, entryId)
    await renderAll()
  }

  /** 展开区:父 text 只读摘要 + 内容块列表 + 添加按钮 */
  function renderDetail(e: Entry, formId: string): HTMLElement {
    const detail = el('div', 'prp entry-detail')
    const main = el('div', 'prp detail-main')
    const mainLabel = el('label', 'prp detail-label')
    mainLabel.textContent = '主文本(请在编辑弹窗修改)'
    const mainText = el('div', 'prp detail-text')
    const mainVal = e.text.trim() === '' ? '(空)' : e.text
    mainText.textContent = mainVal
    mainText.title = mainVal
    main.append(mainLabel, mainText)
    const blockLabel = el('label', 'prp detail-label')
    blockLabel.textContent = `内容块(${e.blocks.length})(随发送拼入主文本之后)`
    detail.append(main, blockLabel)
    const blockList = el('div', 'prp block-list')
    const blockRows: HTMLElement[] = []
    for (const b of e.blocks) {
      const br = renderBlockRow(e, formId, b)
      blockRows.push(br)
      blockList.appendChild(br)
    }
    for (const br of blockRows) {
      const h = br.querySelector<HTMLElement>('.prp-drag-handle')
      if (h) {
        attachDrag({
          handle: h,
          item: br,
          container: blockList,
          onDrop: (items) => {
            const ids = items.map((it) => it.dataset.blockId ?? '').filter((x) => x !== '')
            const latest = fresh(e.id)
            if (!latest) return
            const byId = new Map(latest.blocks.map((x) => [x.id, x]))
            const blocks = ids.map((id) => byId.get(id)).filter((x): x is Block => !!x)
            void (async () => {
              try {
                await api.updateEntry(formId, e.id, { name: latest.name, role: latest.role, text: latest.text, blocks })
                await renderAll()
                toast('已保存内容块顺序')
              } catch (err) { toastError(err) }
            })()
          },
        })
      }
    }
    detail.append(blockList)
    const addBtn = button('prp dashed-btn', '添加内容块', () => void addBlock(e.id, formId))
    detail.appendChild(addBtn)
    return detail
  }

  function renderBlockRow(e: Entry, formId: string, b: Block): HTMLElement {
    const row = el('div', 'prp block-row')
    row.dataset.blockId = b.id
    const handle = el('span', 'prp drag-handle', '⋮⋮')
    handle.title = '拖动排序'
    const ta = document.createElement('textarea')
    ta.className = 'prp block-textarea'
    ta.value = b.text
    ta.rows = Math.max(2, Math.min(8, (b.text.match(/\n/g)?.length ?? 0) + 1))
    const saved = (): void => {
      const text = ta.value
      if (text === b.text) return
      void (async () => {
        const latest = fresh(e.id)
        if (!latest) return
        const idx = latest.blocks.findIndex((x) => x.id === b.id)
        if (idx < 0) return
        const next = latest.blocks.map((x, i) => (i === idx ? { ...x, text } : x))
        try {
          await api.updateEntry(formId, e.id, { name: latest.name, role: latest.role, text: latest.text, blocks: next })
          await renderAll()
          toast('已保存内容块')
        } catch (err) {
          ta.value = b.text // 失败回滚文本
          toastError(err)
        }
      })()
    }
    ta.addEventListener('blur', saved)
    const delBtn = button('prp text-btn danger', '删除', () => {
      confirmDialog({
        title: '删除内容块',
        desc: `确定要删除第 ${(fresh(e.id)?.blocks.findIndex((x) => x.id === b.id) ?? -1) + 1} 个内容块吗?`,
        onOk: () => {
          void (async () => {
            const latest = fresh(e.id)
            if (!latest) return
            try {
              await api.updateEntry(formId, e.id, { name: latest.name, role: latest.role, text: latest.text, blocks: latest.blocks.filter((x) => x.id !== b.id) })
              await renderAll()
              toast('已删除内容块')
            } catch (err) { toastError(err) }
          })()
        },
      })
    })
    row.append(handle, ta, delBtn)
    return row
  }

  async function addBlock(entryId: string, formId: string): Promise<void> {
    const latest = fresh(entryId)
    if (!latest) return
    const bid = 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    try {
      await api.updateEntry(formId, entryId, { name: latest.name, role: latest.role, text: latest.text, blocks: [...latest.blocks, { id: bid, text: '' }] })
      await renderAll()
      toast('已添加内容块')
    } catch (err) { toastError(err) }
  }

  // ---------- 发送(测试版) ----------
  function updateSend(): void {
    const cur = current()
    const hasContent = rows.some((r) => entryContent(r) !== '')
    sendBtn.disabled = !cur || !hasContent
  }

  async function doSend(): Promise<void> {
    if (sending) return // in-flight 保护:防止快速双击并发发送
    const cur = current()
    if (!cur) return
    sending = true
    sendBtn.disabled = true
    const count = rows.filter((r) => entryContent(r) !== '').length
    try {
      const payload = await api.sendPrompt(cur.id)
      openResult(`已发送 ${count} 条消息(空内容条目已由服务端过滤)`, payload)
      setStatus('已发送', 'success')
    } catch (e) {
      const msg = (e as Error)?.message || '发送失败'
      openResult('发送失败', { ok: false, message: msg })
      setStatus('发送失败', 'error')
    } finally {
      sending = false
      updateSend()
    }
  }

  // ---------- 初始化 ----------
  void refreshForms()
  return root
}

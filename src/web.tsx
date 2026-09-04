// agent_plugin_dev/plugin-setting/src/web.tsx
// 前端 WebPlugin:sidebar-left 齿轮按钮(展开左对齐 / 收起仅图标)→ __uiTools__.pluginModal 设置弹窗。
// 弹窗内容纯 DOM 渲染(交互移植自 ui-prototype.html v4.2,已人工确认)。
// 前后端通信路由:GET/PUT 精确匹配 host webServer.register 注册的 exact 路径(/api/setting/list、/api/setting/save)。
export interface SettingEntry { id: string; name: string; config?: unknown }

export type ControlType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'

/** 按 config 运行时值类型推断控件类型(纯函数,供测试) */
export function inferControlType(value: unknown): ControlType {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) return 'array'
  switch (typeof value) {
    case 'string': return 'string'
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    default: return 'object'
  }
}

/** 组装保存 payload:提交完整 config(整行替换语义,首次修改全量复制) */
export function buildSavePayload(entries: Array<{ id: string; config: unknown }>): { entries: Array<{ id: string; config: unknown }> } {
  return { entries }
}

type UiSlots = {
  register(slot: string, content: { name: string; render: (el: HTMLElement) => void; collapsedRender?: (el: HTMLElement) => void; unmount?: () => void }): void
  unregister(slot: string, name: string): void
}
type UiTools = {
  pluginModal(opts: { title?: string; content: string | ((el: HTMLElement) => void) | HTMLElement; actions?: Array<{ label: string; variant?: 'primary' | 'secondary' | 'danger'; onClick?: () => void }>; width?: number; source?: string }): void
  toast(msg: string, opts?: { icon?: string }): void
}
function uiSlots(): UiSlots | undefined {
  return (window as unknown as { __uiSlots__?: UiSlots }).__uiSlots__
}
function uiTools(): UiTools | undefined {
  return (window as unknown as { __uiTools__?: UiTools }).__uiTools__
}

/** 当前激活弹窗状态(模块级:document 监听只绑一次,通过 activeState 定位当前弹窗) */
let activeState: DialogState | null = null
let dragListenersBound = false
function ensureDragListeners(): void {
  if (dragListenersBound) return
  dragListenersBound = true
  document.addEventListener('mousemove', (e) => {
    const st = activeState
    if (st?.isDragging) moveDrag(st, e.clientY)
  })
  document.addEventListener('mouseup', () => {
    const st = activeState
    if (st?.isDragging) endDrag(st)
  })
}

const STYLE_ID = 'plugin-setting-style'
const GAP = 8

/** 注入弹窗/齿轮/拖拽样式(ps- 前缀,避免污染宿主) */
function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
.st-setting-btn{display:flex;align-items:center;gap:8px;width:100%;justify-content:flex-start;padding:6px 10px;border:none;background:none;cursor:pointer;color:#475569;font-size:13px;border-radius:8px;}
.st-setting-btn:hover{background:rgba(124,109,246,.08);}
.st-setting-btn .ps-ic{font-size:15px;}
.st-setting-btn.ps-compact{justify-content:center;padding:6px 0;width:32px;height:32px;border-radius:50%;background:rgba(124,109,246,.14);color:#7c6df6;font-size:15px;}
.ps-dialog{height:62vh;min-height:360px;display:flex;flex-direction:column;font-size:13px;color:#334155;line-height:1.7;}
.ps-hint{font-size:11px;color:#94a3b8;margin-bottom:8px;}
.ps-list{position:relative;flex:1;min-height:0;}
.ps-entry{position:absolute;left:0;right:0;border:1px solid rgba(148,163,184,.35);border-radius:12px;background:rgba(255,255,255,.85);will-change:top;transition:top .3s cubic-bezier(.22,.61,.36,1),box-shadow .2s ease,border-color .2s ease;}
.ps-head{display:flex;align-items:center;gap:8px;height:46px;padding:0 12px;cursor:grab;user-select:none;}
.ps-drag{color:#cbd5e1;cursor:grab;font-size:14px;}
.ps-name{flex:1;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#334155;}
.ps-id{font-size:11px;color:#aaa;font-family:monospace;margin-left:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}
.ps-caret{border:none;background:none;cursor:pointer;color:#64748b;font-size:13px;}
.ps-entry.ps-no-config{background:#fafafa;border-color:#ececec;}
.ps-entry.ps-no-config .ps-name,
.ps-entry.ps-no-config .ps-id{color:#bbb;}
.ps-entry.ps-no-config .ps-caret{display:none;}
.ps-entry.ps-no-config .ps-drag{color:#e5e7eb;}
.ps-entry.ps-no-config:hover{cursor:default;box-shadow:none;border-color:#ececec;}
.ps-detail{border-top:1px dashed rgba(148,163,184,.4);padding:12px;font-size:12px;display:none;background:rgba(248,250,252,.6);border-radius:0 0 12px 12px;}
.ps-entry.ps-open .ps-detail{display:block;}
.ps-entry.ps-dragging{z-index:100;box-shadow:0 12px 40px rgba(31,38,135,.25);border-color:rgba(124,109,246,.6);cursor:grabbing;transition:box-shadow .2s ease,border-color .2s ease;}
.ps-entry.ps-dragging .ps-drag{color:#7c6df6;}
.ps-drop-indicator{position:absolute;left:8px;right:8px;height:3px;border-radius:3px;background:#7c6df6;opacity:0;transition:opacity .15s ease;pointer-events:none;box-shadow:0 0 10px rgba(124,109,246,.5);z-index:101;}
.ps-drop-indicator.ps-visible{opacity:1;}
.ps-field{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ps-field label{width:110px;flex-shrink:0;color:#475569;}
.ps-field input[type=text],.ps-field input[type=number]{flex:1;padding:6px 8px;border:1px solid rgba(148,163,184,.5);border-radius:8px;font-size:13px;color:#1f2d3d;}
.ps-field textarea{flex:1;min-height:80px;padding:6px 8px;border:1px solid rgba(148,163,184,.5);border-radius:8px;font-family:monospace;font-size:12px;color:#1f2d3d;}
.ps-none{color:#94a3b8;}
.ps-error{color:#dc2626;font-size:13px;padding:16px;}
.ps-loading{color:#94a3b8;font-size:13px;padding:16px;}
`
  document.head.appendChild(style)
}

/** 齿轮按钮:compact=true 为收起态(40px 窄条,仅图标) */
function makeGearButton(compact: boolean, onClick: () => void): HTMLElement {
  const btn = document.createElement('button')
  btn.className = compact ? 'st-setting-btn ps-compact' : 'st-setting-btn'
  btn.title = '插件设置'
  const ic = document.createElement('span')
  ic.className = 'ps-ic'
  ic.textContent = '⚙'
  btn.appendChild(ic)
  if (!compact) {
    const label = document.createElement('span')
    label.textContent = '插件设置'
    btn.appendChild(label)
  }
  btn.addEventListener('click', onClick)
  return btn
}

// ---- 弹窗状态(闭包,content 渲染与 actions 共享) ----
interface DialogState {
  entries: SettingEntry[]
  order: number[]
  openId: number | null
  items: HTMLElement[]
  container: HTMLElement | null
  drop: HTMLElement | null
  isDragging: boolean
  dragIndex: number
  dragStartY: number
  currentTarget: number
  animFrame: number | null
}

export function openDialog(): void {
  const tools = uiTools()
  if (!tools) {
    console.warn('[plugin-setting] __uiTools__ 不可用,设置弹窗不可用')
    return
  }
  ensureStyle()
  const st: DialogState = {
    entries: [], order: [], openId: null, items: [], container: null, drop: null,
    isDragging: false, dragIndex: -1, dragStartY: 0, currentTarget: -1, animFrame: null,
  }
  tools.pluginModal({
    title: '插件设置',
    width: 760,
    source: 'plugin-setting',
    content: (el) => renderDialogContent(el, st),
    actions: [
      { label: '取消' },
      { label: '保存', variant: 'primary', onClick: () => void save(st, tools) },
    ],
  })
}

/** 渲染弹窗内容(固定高度,内部滚动;列表 + 拖拽) */
function renderDialogContent(root: HTMLElement, st: DialogState): void {
  const wrap = document.createElement('div')
  wrap.className = 'ps-dialog'
  const hint = document.createElement('p')
  hint.className = 'ps-hint'
  hint.textContent = '✨ 拖拽排序:展开的条目按实际高度让位,不重叠'
  const container = document.createElement('div')
  container.className = 'ps-list'
  const drop = document.createElement('div')
  drop.className = 'ps-drop-indicator'
  container.appendChild(drop)
  st.container = container
  st.drop = drop
  wrap.append(hint, container)
  root.appendChild(wrap)

  // 加载生效表
  const loading = document.createElement('div')
  loading.className = 'ps-loading'
  loading.textContent = '加载中…'
  container.appendChild(loading)
  fetch('/api/setting/list')
    .then((r) => r.json() as Promise<{ ok: boolean; entries?: SettingEntry[]; error?: string }>)
    .then((data) => {
      loading.remove()
      if (!data.ok || !data.entries) {
        const err = document.createElement('div')
        err.className = 'ps-error'
        err.textContent = data.error ?? '加载失败'
        container.appendChild(err)
        return
      }
      st.entries = data.entries
      st.order = data.entries.map((_, i) => i)
      renderList(st)
    })
    .catch(() => {
      loading.remove()
      const err = document.createElement('div')
      err.className = 'ps-error'
      err.textContent = '无法连接设置服务,请先 st host go'
      container.appendChild(err)
    })

  // 激活当前弹窗状态并确保 document 级监听只绑定一次
  activeState = st
  ensureDragListeners()
  // 拖拽事件:container mousedown 开始,document 全局移动/释放
  container.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement
    const head = target.closest('.ps-head') as HTMLElement | null
    if (!head || !st.container) return
    if (target.closest('.ps-caret')) return
    const box = head.closest('.ps-entry') as HTMLElement | null
    if (!box) return
    startDrag(st, parseInt(box.dataset.index ?? '-1', 10), e.clientY)
    e.preventDefault()
  })
  container.addEventListener('dragstart', (e) => e.preventDefault())
}

// ---- 列表渲染(绝对定位 + 动态高度;有 config 在前,无 config 固定底部) ----
function hasConfigEntry(e: SettingEntry): boolean {
  // 仅非空对象视为"有 config"(空对象无可配置字段,归入无 config 变暗)
  return e.config !== null && e.config !== undefined && typeof e.config === 'object' && Object.keys(e.config as Record<string, unknown>).length > 0
}
function renderList(st: DialogState): void {
  const container = st.container
  if (!container) return
  container.innerHTML = ''
  const drop = document.createElement('div')
  drop.className = 'ps-drop-indicator'
  container.appendChild(drop)
  st.drop = drop
  // 固定排序:有 config 条目在前,无 config 条目在列表底部
  st.entries = [...st.entries].sort((a, b) => (hasConfigEntry(b) ? 1 : 0) - (hasConfigEntry(a) ? 1 : 0))
  st.order = st.entries.map((_, i) => i)
  st.items = st.entries.map((e, i) => {
    const cfg = hasConfigEntry(e)
    const box = document.createElement('div')
    box.className = 'ps-entry' + (st.openId === i ? ' ps-open' : '') + (cfg ? '' : ' ps-no-config')
    box.dataset.index = String(i)
    const head = document.createElement('div')
    head.className = 'ps-head'
    const drag = document.createElement('span')
    drag.className = 'ps-drag'
    drag.textContent = '⋮⋮'
    const name = document.createElement('span')
    name.className = 'ps-name'
    name.textContent = e.name
    // id 展示在条目名称后(小字灰)
    const id = document.createElement('span')
    id.className = 'ps-id'
    id.textContent = e.id
    const caret = document.createElement('button')
    caret.className = 'ps-caret'
    if (cfg) {
      caret.textContent = st.openId === i ? '▾' : '▸'
      caret.addEventListener('click', (ev) => {
        ev.stopPropagation()
        st.openId = st.openId === i ? null : i
        renderList(st)
      })
    }
    head.append(drag, name, id, cfg ? caret : document.createElement('span'))
    box.appendChild(head)
    // 展开详情:仅 config 条目;无 config 不构建(不可展开)
    if (cfg) {
      const detail = document.createElement('div')
      detail.className = 'ps-detail'
      const keys = Object.keys(e.config as Record<string, unknown>)
      if (keys.length === 0) {
        const span = document.createElement('span')
        span.className = 'ps-none'
        span.textContent = '无配置字段(空对象)'
        detail.appendChild(span)
      } else {
        for (const key of keys) {
          detail.appendChild(controlField(st, i, key, (e.config as Record<string, unknown>)[key]))
        }
      }
      box.appendChild(detail)
    }
    container.appendChild(box)
    return box
  })
  layout(st)
}

/** 控件(按 config 运行时值类型) */
function controlField(st: DialogState, index: number, key: string, value: unknown): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'ps-field'
  const label = document.createElement('label')
  label.textContent = key
  wrap.appendChild(label)
  const onChange = (v: unknown): void => {
    const entry = st.entries[index]
    const cfg = entry.config && typeof entry.config === 'object' ? { ...(entry.config as Record<string, unknown>) } : {}
    ;(cfg as Record<string, unknown>)[key] = v
    entry.config = cfg
  }
  const type = inferControlType(value)
  if (type === 'string') {
    const input = document.createElement('input')
    input.type = 'text'
    input.value = value as string
    input.addEventListener('input', () => onChange(input.value))
    wrap.appendChild(input)
  } else if (type === 'number') {
    const input = document.createElement('input')
    input.type = 'number'
    input.value = String(value)
    input.addEventListener('input', () => onChange(Number(input.value)))
    wrap.appendChild(input)
  } else if (type === 'boolean') {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = value as boolean
    input.addEventListener('change', () => onChange(input.checked))
    wrap.appendChild(input)
  } else if (type === 'array') {
    // 数组元素全为 string → 多行输入(每行一个,含新建/删除);否则 JSON 文本域
    if (Array.isArray(value) && isStringArray(value)) {
      wrap.appendChild(stringListField(onChange, [...(value as string[])]))
    } else {
      wrap.appendChild(jsonField(value, onChange))
    }
  } else if (type === 'object') {
    wrap.appendChild(jsonField(value, onChange))
  } else {
    const span = document.createElement('span')
    span.className = 'ps-none'
    span.textContent = '无配置'
    wrap.appendChild(span)
  }
  return wrap
}

/** 判断数组元素是否全为 string(用于多行输入 vs JSON 文本域) */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === 'string')
}

/** JSON 文本域(嵌套 object / 非字符串数组) */
function jsonField(value: unknown, onChange: (v: unknown) => void): HTMLTextAreaElement {
  const ta = document.createElement('textarea')
  ta.value = JSON.stringify(value, null, 2)
  ta.addEventListener('change', () => {
    try { onChange(JSON.parse(ta.value)) } catch { /* 非法 JSON 保持原值 */ }
  })
  return ta
}

/** 字符串数组多行输入:每行一个 input + 垃圾桶删除,底部新建按钮 */
function stringListField(onChange: (v: unknown) => void, initial: string[]): HTMLElement {
  const container = document.createElement('div')
  container.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;'
  const render = (): void => {
    container.innerHTML = ''
    initial.forEach((item, i) => {
      const row = document.createElement('div')
      row.style.cssText = 'display:flex;align-items:center;gap:6px;'
      const input = document.createElement('input')
      input.type = 'text'
      input.value = item
      input.style.cssText = 'flex:1;padding:5px 8px;border:1px solid rgba(148,163,184,.5);border-radius:8px;font-size:12px;color:#1f2d3d;min-width:0;'
      input.addEventListener('input', () => { initial[i] = input.value; onChange([...initial]) })
      const del = document.createElement('button')
      del.textContent = '🗑'
      del.title = '删除'
      del.style.cssText = 'width:26px;height:26px;border:none;background:none;cursor:pointer;font-size:13px;color:#dc2626;flex-shrink:0;display:flex;align-items:center;justify-content:center;'
      del.addEventListener('click', () => { initial.splice(i, 1); onChange([...initial]); render() })
      row.append(input, del)
      container.appendChild(row)
    })
    const add = document.createElement('button')
    add.textContent = '＋ 新建'
    add.style.cssText = 'align-self:flex-start;border:1px dashed rgba(148,163,184,.5);background:none;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;color:#7c6df6;'
    add.addEventListener('click', () => { initial.push(''); onChange([...initial]); render() })
    container.appendChild(add)
  }
  render()
  return container
}

// ---- 拖拽:动态高度 + 绝对定位 + transform 落盘动画(v4.2 已验证逻辑) ----
function heightOf(st: DialogState, i: number): number {
  return (st.items[i]?.offsetHeight ?? 46) + GAP
}
function topAt(st: DialogState, pos: number): number {
  let y = 0
  for (let p = 0; p < pos; p++) y += heightOf(st, st.order[p])
  return y
}
function layout(st: DialogState): void {
  const container = st.container
  if (!container) return
  let y = 0
  for (const i of st.order) {
    if (st.isDragging && i === st.dragIndex) continue
    const el = st.items[i]
    if (el) el.style.top = y + 'px'
    y += heightOf(st, i)
  }
  container.style.height = Math.max(0, y - GAP) + 'px'
  const drop = st.drop
  if (drop) {
    if (st.isDragging && st.currentTarget >= 0) {
      drop.style.top = (topAt(st, st.currentTarget) - 2) + 'px'
      drop.classList.add('ps-visible')
    } else {
      drop.classList.remove('ps-visible')
    }
  }
}
function updateOrder(st: DialogState, targetPos: number): void {
  const cur = st.order.indexOf(st.dragIndex)
  st.order.splice(cur, 1)
  st.order.splice(targetPos, 0, st.dragIndex)
  st.currentTarget = targetPos
}
function moveDrag(st: DialogState, mouseY: number): void {
  if (st.animFrame !== null) cancelAnimationFrame(st.animFrame)
  st.animFrame = requestAnimationFrame(() => {
    const el = st.items[st.dragIndex]
    if (!el || !st.container) return
    el.style.transform = `translateY(${mouseY - st.dragStartY}px) scale(1.02)`
    const relY = mouseY - st.container.getBoundingClientRect().top
    const rest = st.order.filter((i) => i !== st.dragIndex)
    let pos = rest.length
    for (let p = 0; p < rest.length; p++) {
      const other = st.items[rest[p]]
      const center = parseFloat(other.style.top) + other.offsetHeight / 2
      if (relY < center) { pos = p; break }
    }
    if (pos !== st.currentTarget) updateOrder(st, pos)
    layout(st)
  })
}
function startDrag(st: DialogState, index: number, mouseY: number): void {
  // 无 config 条目固定底部,不可拖拽
  if (!hasConfigEntry(st.entries[index])) return
  st.isDragging = true
  st.dragIndex = index
  st.dragStartY = mouseY
  st.currentTarget = st.order.indexOf(index)
  const el = st.items[index]
  el.classList.add('ps-dragging')
  el.style.zIndex = '100'
  el.style.transform = 'translateY(0px) scale(1.02)'
  if (st.drop) {
    st.drop.classList.add('ps-visible')
    st.drop.style.top = (topAt(st, st.currentTarget) - 2) + 'px'
  }
  layout(st)
}
function endDrag(st: DialogState): void {
  if (!st.isDragging) return
  if (st.animFrame !== null) { cancelAnimationFrame(st.animFrame); st.animFrame = null }
  // 立即停止拖拽跟随:松手后鼠标继续移动不得再驱动 moveDrag
  st.isDragging = false
  const el = st.items[st.dragIndex]
  if (!el) { st.currentTarget = -1; st.dragIndex = -1; return }
  const finalTop = topAt(st, st.order.indexOf(st.dragIndex))
  st.drop?.classList.remove('ps-visible')
  // 落位:禁用过渡,松手瞬间条目即到目标位置(无 0.1s+ 延迟落盘)
  el.style.transition = 'none'
  el.style.top = finalTop + 'px'
  el.style.transform = ''
  el.style.zIndex = ''
  el.classList.remove('ps-dragging')
  st.currentTarget = -1
  st.dragIndex = -1
  layout(st)
}

// ---- 保存(经 host exact 路由 PUT /api/setting/save) ----
async function save(st: DialogState, tools: UiTools): Promise<void> {
  try {
    const payload = buildSavePayload(st.order.map((i) => ({ id: st.entries[i].id, config: st.entries[i].config ?? null })))
    const res = await fetch('/api/setting/save', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json() as { ok: boolean; error?: string }
    if (data.ok) {
      tools.toast('已保存,配置即将生效', { icon: '✓' })
    } else {
      tools.toast(data.error ?? '保存失败', { icon: '⚠' })
    }
  } catch {
    tools.toast('保存失败', { icon: '⚠' })
  }
}

const plugin = {
  name: 'plugin-setting',
  mount(_el: HTMLElement) {
    ensureStyle()
    const slots = uiSlots()
    if (!slots) {
      console.warn('[plugin-setting] 未检测到 __uiSlots__,齿轮按钮不可用')
      return
    }
    const buttons: HTMLElement[] = []
    slots.register('sidebar-left', {
      name: 'plugin-setting',
      render: (el) => {
        const btn = makeGearButton(false, openDialog)
        buttons.push(btn)
        el.appendChild(btn)
      },
      collapsedRender: (el) => {
        const btn = makeGearButton(true, openDialog)
        buttons.push(btn)
        el.appendChild(btn)
      },
      unmount: () => {
        for (const btn of buttons) btn.remove()
        buttons.length = 0
      },
    })
  },
  unmount() {
    uiSlots()?.unregister('sidebar-left', 'plugin-setting')
  },
}

export default plugin

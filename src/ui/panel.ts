// agent_plugin_dev/multi-session-plugin/src/ui/panel.ts —— 会话列表(占满 sidebar-right)
import * as api from './api.ts'
import { injectStyle } from './style.ts'

function h(tag: string, cls: string, text = ''): HTMLElement {
  const el = document.createElement(tag)
  if (cls) el.className = cls
  if (text) el.textContent = text
  return el
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + ' 分钟前'
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
    ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function emitSessionChanged(reason: 'created' | 'deleted' | 'active-changed' | 'message-appended', id?: string): void {
  window.dispatchEvent(new CustomEvent('st:session-changed', { detail: { reason, id } }))
}

export function createSessionPanel(toast: (msg: string) => void): HTMLElement {
  injectStyle()
  const root = h('div', 'multi-session')
  const head = h('div', 'ms-head')
  const title = h('span', 'ms-title', '会话')
  const addBtn = h('button', 'ms-add', '＋') as HTMLButtonElement
  addBtn.title = '新会话'
  head.append(title, addBtn)
  const list = h('div', 'ms-list')
  root.append(head, list)

  let sessions: api.SessionItem[] = []
  let activeId: string | null = null

  const render = (): void => {
    list.textContent = ''
    if (sessions.length === 0) { list.appendChild(h('div', 'ms-empty', '暂无会话')); return }
    for (const s of sessions) {
      const item = h('div', 'ms-item' + (s.id === activeId ? ' active' : ''))
      const name = h('span', 'ms-name', s.title)
      const time = h('span', 'ms-time', relTime(s.updatedAt))
      const del = h('button', 'ms-del', '✕') as HTMLButtonElement
      del.title = '删除会话'
      del.addEventListener('click', (e) => {
        e.stopPropagation()
        void confirmDelete(s)
      })
      item.append(name, time, del)
      item.addEventListener('click', async () => {
        if (s.id === activeId) return
        try { await api.setActive(s.id); activeId = s.id; render(); emitSessionChanged('active-changed', s.id) }
        catch (e) { toast((e as Error).message || '切换失败') }
      })
      list.appendChild(item)
    }
  }

  const reload = async (): Promise<void> => {
    try {
      const [ss, act] = await Promise.all([api.listSessions(), api.getActive()])
      sessions = ss; activeId = act; render()
    } catch { /* 后端未就绪时静默,下次事件/操作再拉 */ }
  }

  async function confirmDelete(s: api.SessionItem): Promise<void> {
    const tools = (window as unknown as { __uiTools__?: { modal(opts: { title: string; desc?: string; onOk?: () => void; onCancel?: () => void }): void } }).__uiTools__
    const doDel = async () => {
      try {
        await api.removeSession(s.id)
        await reload()
        emitSessionChanged('deleted', s.id)
        toast('已删除会话')
      } catch (e) { toast((e as Error).message || '删除失败') }
    }
    if (tools) tools.modal({ title: '删除会话', desc: `确定删除会话「${s.title}」吗?其全部消息将一并删除。`, onOk: () => { void doDel() } })
    else { void doDel() }
  }

  addBtn.addEventListener('click', async () => {
    try {
      const s = await api.createSession()
      await api.setActive(s.id)
      await reload()
      emitSessionChanged('active-changed', s.id)
    } catch (e) { toast((e as Error).message || '新建失败') }
  })

  const onSessionChanged = () => { void reload() }
  window.addEventListener('st:session-changed', onSessionChanged)
  void reload()

  // 卸载清理(由 web.tsx unmount 调用)
  ;(root as HTMLElement & { dispose?(): void }).dispose = () => {
    window.removeEventListener('st:session-changed', onSessionChanged)
  }
  return root
}

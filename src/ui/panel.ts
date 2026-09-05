// agent_plugin_dev/chat-plugin/src/ui/panel.ts —— 气泡对话页(纯 DOM,ui-token;AI 左/用户右/底部输入)
import * as api from './api.ts'
import { injectChatStyle } from './style.ts'

function h(tag: string, cls: string, text = ''): HTMLElement {
  const el = document.createElement(tag)
  if (cls) el.className = cls
  if (text) el.textContent = text
  return el
}

export function createChatPanel(): HTMLElement {
  injectChatStyle()
  const root = h('div', 'chat-page')
  const head = h('div', 'chat-head')
  const badge = h('span', 'chat-badge', '多会话')
  badge.title = '右侧列表切换会话'
  head.append(h('span', '', '对话'), badge)
  const list = h('div', 'chat-list')
  const empty = h('div', 'msg-empty', '开始第一段对话吧')
  list.appendChild(empty)

  const scrollBottom = () => { list.scrollTop = list.scrollHeight }

  function appendBubble(role: 'ai' | 'user', text: string): void {
    if (list.firstChild === empty) list.removeChild(empty)
    const row = h('div', `msg-row ${role}`)
    row.appendChild(h('div', 'bubble', text))
    list.appendChild(row)
    scrollBottom()
  }
  function appendError(text: string): void {
    if (list.firstChild === empty) list.removeChild(empty)
    const row = h('div', 'msg-row msg-error')
    row.textContent = text
    list.appendChild(row)
    scrollBottom()
  }

  const loadHistory = async () => {
    try {
      const active = await api.getActiveSession()
      if (!active) {
        list.textContent = ''
        const tip = h('div', 'msg-empty', '点击右侧 ＋ 新建会话')
        list.appendChild(tip)
        return
      }
      const rows = await api.listMessages()
      list.textContent = ''
      if (rows.length === 0) { list.appendChild(empty); return }
      for (const m of rows) {
        const role = m.role === 'user' ? 'user' : 'ai'
        const row = h('div', `msg-row ${role}`)
        row.appendChild(h('div', 'bubble', m.content))
        list.appendChild(row)
      }
      scrollBottom()
    } catch (e) {
      list.textContent = ''
      list.appendChild(h('div', 'msg-row msg-error', (e as Error).message || '历史加载失败'))
    }
  }
  void loadHistory()

  const ta = document.createElement('textarea')
  ta.placeholder = '输入消息,Enter 发送,Shift+Enter 换行…'
  const sendBtn = h('button', 'send-btn', '发送') as HTMLButtonElement
  const sending = (on: boolean) => {
    sendBtn.disabled = on
    sendBtn.textContent = on ? '发送中…' : '发送'
  }
  const doSend = async () => {
    const text = ta.value
    if (!text.trim()) return
    ta.value = ''
    appendBubble('user', text)
    sending(true)
    try {
      const reply = await api.sendText(text)
      appendBubble('ai', reply)
      window.dispatchEvent(new CustomEvent('st:session-changed', { detail: { reason: 'message-appended' } }))
    } catch (e) {
      appendError((e as Error).message || '发送失败')
    } finally {
      sending(false)
      ta.focus()
    }
  }
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sendBtn.disabled) void doSend() }
  })
  sendBtn.addEventListener('click', () => { if (!sendBtn.disabled) void doSend() })

  const composer = h('div', 'chat-composer')
  composer.append(ta, sendBtn)
  root.append(head, list, composer)
  ;(root as HTMLElement & { reload?(): void }).reload = loadHistory
  return root
}

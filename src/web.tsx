// agent_plugin_dev/chat-plugin/src/web.tsx —— 前端入口:注册 main(中央)插槽气泡对话页
import { createChatPanel } from './ui/panel.ts'

interface SlotsLike {
  register(slot: string, content: { name: string; render(el: HTMLElement): void }): void
  unregister(slot: string, name: string): void
}

let navTimer: ReturnType<typeof setInterval> | undefined

const webPlugin = {
  name: 'chat',
  mount() {
    if (navTimer) { clearInterval(navTimer); navTimer = undefined }
    const tryRegister = (): boolean => {
      const slots = (window as unknown as { __uiSlots__?: SlotsLike }).__uiSlots__
      if (!slots) return false
      slots.register('main', {
        name: 'chat',
        render(el: HTMLElement) {
          el.appendChild(createChatPanel())
        },
      })
      return true
    }
    if (tryRegister()) return
    navTimer = setInterval(() => { if (tryRegister()) { clearInterval(navTimer); navTimer = undefined } }, 200)
  },
  unmount() {
    if (navTimer) { clearInterval(navTimer); navTimer = undefined }
    const slots = (window as unknown as { __uiSlots__?: SlotsLike }).__uiSlots__
    slots?.unregister('main', 'chat')
  },
}

export default webPlugin

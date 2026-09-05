// agent_plugin_dev/multi-session-plugin/src/web.tsx
import { createSessionPanel } from './ui/panel.ts'

interface SlotsLike {
  register(slot: string, content: { name: string; render(el: HTMLElement): void }): void
  unregister(slot: string, name: string): void
}
interface ToolsLike { toast(msg: string): void }

let navTimer: ReturnType<typeof setInterval> | undefined
let currentPanel: (HTMLElement & { dispose?(): void }) | null = null

const webPlugin = {
  name: 'sessions',
  mount() {
    if (navTimer) { clearInterval(navTimer); navTimer = undefined }
    const tryRegister = (): boolean => {
      const slots = (window as unknown as { __uiSlots__?: SlotsLike }).__uiSlots__
      const tools = (window as unknown as { __uiTools__?: ToolsLike }).__uiTools__
      if (!slots || !tools) return false
      slots.register('sidebar-right', {
        name: 'sessions',
        render(el: HTMLElement) {
          currentPanel?.dispose?.() // st-ui-slots 重复渲染时先清理旧实例的 window 监听
          const panel = createSessionPanel((m) => tools.toast(m))
          currentPanel = panel
          el.appendChild(panel)
        },
      })
      return true
    }
    if (tryRegister()) return
    navTimer = setInterval(() => { if (tryRegister()) { clearInterval(navTimer); navTimer = undefined } }, 200)
  },
  unmount() {
    if (navTimer) { clearInterval(navTimer); navTimer = undefined }
    currentPanel?.dispose?.()
    currentPanel = null
    const slots = (window as unknown as { __uiSlots__?: SlotsLike }).__uiSlots__
    slots?.unregister('sidebar-right', 'sessions')
  },
}

export default webPlugin

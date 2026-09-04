import { createPanel } from './ui/panel.ts'

interface SlotsLike {
  register(slot: string, content: { name: string; render(el: HTMLElement): void }): void
  unregister(slot: string, name: string): void
}
interface ToolsLike {
  pluginModal(opts: { title: string; content: string | ((el: HTMLElement) => void); source?: string }): void
  toast(msg: string): void
}

let navTimer: ReturnType<typeof setInterval> | undefined

const webPlugin = {
  name: 'prompt',
  mount() {
    if (navTimer) { clearInterval(navTimer); navTimer = undefined }
    const tryRegister = (): boolean => {
      const slots = (window as unknown as { __uiSlots__?: SlotsLike }).__uiSlots__
      const tools = (window as unknown as { __uiTools__?: ToolsLike }).__uiTools__
      if (!slots || !tools) return false
      slots.register('nav', {
        name: 'prompt',
        render(el: HTMLElement) {
          const btn = document.createElement('button')
          btn.textContent = 'prompt'
          btn.style.cssText = 'border-radius:16px;padding:0 14px;font-size:12px;font-weight:600;color:#18181b;background:#fff;border:1px solid #d4d4d8;cursor:pointer;height:30px;'
          btn.addEventListener('click', () => {
            tools.pluginModal({
              title: 'Prompt 预设',
              source: 'prompt',
              content: (c: HTMLElement) => { c.appendChild(createPanel((m) => tools.toast(m))) },
            })
          })
          el.appendChild(btn)
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
    slots?.unregister('nav', 'prompt')
  },
}

export default webPlugin

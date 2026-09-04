// agent_plugin_dev/llm-plugin/src/web.tsx
import { createConfigPanel, type UiToolsLike } from './ui/config-panel.ts'
import * as api from './ui/api.ts'

interface SlotsLike {
  register(slot: string, content: { name: string; render(el: HTMLElement): void }): void
  unregister(slot: string, name: string): void
}

let navTimer: ReturnType<typeof setInterval> | undefined

const webPlugin = {
  name: 'llm',
  mount() {
    if (navTimer) { clearInterval(navTimer); navTimer = undefined }
    const tryRegister = (): boolean => {
      const slots = (window as unknown as { __uiSlots__?: SlotsLike }).__uiSlots__
      const tools = (window as unknown as { __uiTools__?: UiToolsLike }).__uiTools__
      if (!slots || !tools) return false
      slots.register('nav', {
        name: 'llm',
        render(el: HTMLElement) {
          const btn = document.createElement('button')
          btn.textContent = 'LLM'
          btn.style.cssText = 'border-radius:16px;padding:0 14px;font-size:12px;font-weight:600;color:#18181b;background:#fff;border:1px solid #d4d4d8;cursor:pointer;height:30px;'
          btn.addEventListener('click', () => {
            tools.pluginModal({
              title: 'LLM 配置',
              source: 'llm',
              content: (c: HTMLElement) => { c.appendChild(createConfigPanel(tools as UiToolsLike, api)) },
            })
          })
          el.appendChild(btn)
        },
      })
      return true
    }
    if (tryRegister()) return
    // 宿主(st-ui-slots / ui-tool-plugin)尚未挂载,轮询等待就绪后再注册
    navTimer = setInterval(() => { if (tryRegister()) { clearInterval(navTimer); navTimer = undefined } }, 200)
  },
  unmount() {
    if (navTimer) { clearInterval(navTimer); navTimer = undefined }
    const slots = (window as unknown as { __uiSlots__?: SlotsLike }).__uiSlots__
    slots?.unregister('nav', 'llm')
  },
}

export default webPlugin

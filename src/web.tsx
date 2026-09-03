// agent_plugin_dev/llm-plugin/src/web.tsx
import { createConfigPanel, type UiToolsLike } from './ui/config-panel.ts'
import * as api from './ui/api.ts'

interface SlotsLike {
  register(slot: string, content: { name: string; render(el: HTMLElement): void }): void
  unregister(slot: string, name: string): void
}

const webPlugin = {
  name: 'llm',
  mount() {
    const slots = (window as unknown as { __uiSlots__?: SlotsLike }).__uiSlots__
    const tools = (window as unknown as { __uiTools__?: UiToolsLike }).__uiTools__
    if (!slots || !tools) {
      console.warn('[llm-plugin] 需要 st-ui-slots 与 ui-tool-plugin')
      return
    }
    slots.register('nav', {
      name: 'llm',
      render(el: HTMLElement) {
        const btn = document.createElement('button')
        btn.textContent = 'LLM'
        btn.style.cssText = 'border-radius:16px;padding:0 14px;font-size:12px;font-weight:600;color:#18181b;background:#fff;border:1px solid #d4d4d8;cursor:pointer;height:30px;'
        btn.addEventListener('click', () => {
          tools.pluginModal({
            title: 'LLM 配置',
            content: (c: HTMLElement) => { c.appendChild(createConfigPanel(tools as UiToolsLike, api)) },
          })
        })
        el.appendChild(btn)
      },
    })
  },
  unmount() {
    const slots = (window as unknown as { __uiSlots__?: SlotsLike }).__uiSlots__
    slots?.unregister('nav', 'llm')
  },
}

export default webPlugin

// agent_plugin_dev/ui-tool-plugin/tests/web.spec.ts
import { describe, expect, it } from 'vitest'
import plugin from '../src/web.tsx'

const headChildren: Array<{ id: string }> = []
const bodyChildren: Array<{ id: string; className: string }> = []
let windowApi: unknown = undefined

globalThis.document = {
  head: { appendChild(el: { id?: string }) { headChildren.push({ id: el.id ?? '' }) } },
  body: { appendChild(el: { id?: string; className?: string }) { bodyChildren.push({ id: el.id ?? '', className: el.className ?? '' }) } },
  getElementById(id: string) {
    const h = headChildren.find((c) => c.id === id)
    if (h) return { ...h, remove: () => { const i = headChildren.indexOf(h); if (i >= 0) headChildren.splice(i, 1) } }
    const b = bodyChildren.find((c) => c.id === id)
    if (b) return { ...b, remove: () => { const i = bodyChildren.indexOf(b); if (i >= 0) bodyChildren.splice(i, 1) } }
    return null
  },
  querySelectorAll(sel: string) {
    const cls = sel.startsWith('.') ? sel.slice(1) : sel
    return bodyChildren
      .filter((c) => c.className.includes(cls))
      .map((c) => ({ ...c, remove: () => { const i = bodyChildren.indexOf(c); if (i >= 0) bodyChildren.splice(i, 1) } }))
  },
  createElement(tag: string) {
    return {
      tagName: tag, id: '', textContent: '', className: '', style: {},
      setAttribute() {}, appendChild() {}, remove() {}, addEventListener() {},
    }
  },
} as never
globalThis.requestAnimationFrame = (cb: () => void) => { cb(); return 1 }
;(globalThis as { window: unknown }).window = {
  set __uiTools__(v: unknown) { windowApi = v },
  get __uiTools__() { return windowApi },
  __uiSlots__: {},
}

describe('ui-tool-plugin WebPlugin', () => {
  it('mount:注入主题 + 挂载 __uiTools__(含 theme)', () => {
    plugin.mount(null as never)
    expect(headChildren.some((c) => c.id === 'ui-tool-plugin-theme')).toBe(true)
    const api = (globalThis as unknown as { window: { __uiTools__: unknown } }).window.__uiTools__ as Record<string, unknown>
    expect(typeof api).toBe('object')
    expect(typeof (api as Record<string, unknown>).toast).toBe('function')
    expect(typeof (api as Record<string, unknown>).pluginModal).toBe('function')
    const theme = (api as { theme: Record<string, unknown> }).theme
    expect(typeof theme.get).toBe('function')
    expect(typeof theme.install).toBe('function')
    expect(typeof theme.destroy).toBe('function')
  })

  it('unmount:移除主题/tools 样式 + 删除 __uiTools__', () => {
    plugin.unmount()
    expect(headChildren.some((c) => c.id === 'ui-tool-plugin-theme')).toBe(false)
    expect(headChildren.some((c) => c.id === 'ui-tool-plugin-tools')).toBe(false)
    expect((globalThis as unknown as { window: { __uiTools__?: unknown } }).window.__uiTools__).toBeUndefined()
  })
})

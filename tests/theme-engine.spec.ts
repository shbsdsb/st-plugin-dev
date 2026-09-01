// agent_plugin_dev/ui-tool-plugin/tests/theme-engine.spec.ts
import { describe, expect, it, vi } from 'vitest'
import { createThemeEngine } from '../src/theme-engine.ts'
import { DEFAULT_THEME } from '../src/theme.ts'

const headChildren: Array<{ id: string; textContent: string; tag: string }> = []
const bodyChildren: Array<{ id: string; tag: string; textContent: string }> = []

globalThis.document = {
  head: {
    appendChild(el: { tagName: string; id: string; textContent: string }) {
      headChildren.push({ tag: el.tagName, id: el.id, textContent: el.textContent })
    },
  },
  body: {
    appendChild(el: { tagName: string; id?: string; textContent?: string; className?: string }) {
      bodyChildren.push({ tag: el.tagName, id: el.id ?? '', textContent: el.textContent ?? '', })
    },
  },
  getElementById(id: string) {
    const h = headChildren.find((c) => c.id === id)
    if (h) return { ...h, remove: () => { const i = headChildren.indexOf(h); if (i >= 0) headChildren.splice(i, 1) } }
    const b = bodyChildren.find((c) => c.id === id)
    if (b) return { ...b, remove: () => { const i = bodyChildren.indexOf(b); if (i >= 0) bodyChildren.splice(i, 1) } }
    return null
  },
  querySelectorAll(sel: string) {
    // 光球按 class 匹配(简化:返回 body 中 className 含 sel 的节点)
    return []
  },
  createElement(tag: string) {
    return {
      tagName: tag, id: '', textContent: '', className: '', style: {},
      setAttribute() {}, appendChild() {}, remove() {},
    }
  },
} as never
globalThis.requestAnimationFrame = (cb: () => void) => { cb(); return 1 }

describe('createThemeEngine', () => {
  const engine = createThemeEngine()

  it('get 返回默认主题', () => {
    expect(engine.get()).toEqual(DEFAULT_THEME)
  })

  it('set 局部更新并重建样式(含新 accent)', () => {
    engine.set({ accent: '#0ea5e9' })
    expect(engine.get().accent).toBe('#0ea5e9')
    expect(engine.get().blur).toBe(DEFAULT_THEME.blur)
    const style = headChildren.find((c) => c.id === 'ui-tool-plugin-theme')
    expect(style?.textContent).toContain('#0ea5e9')
  })

  it('reset 恢复默认主题', () => {
    engine.set({ orbCount: 0 })
    engine.reset()
    expect(engine.get()).toEqual(DEFAULT_THEME)
  })

  it('install 注入 css/html/js;reset 卸载恢复默认', () => {
    engine.install({ css: 'body{color:red}', html: '<div id="tpl">tpl</div>', js: 'window.__tpl__=1' })
    const style = headChildren.find((c) => c.id === 'ui-tool-plugin-install')
    expect(style?.textContent).toContain('color:red')
    // html 注入 body(host 节点 id)
    expect(bodyChildren.some((c) => c.id === 'ui-tool-plugin-install-html')).toBe(true)
    engine.reset()
    expect(engine.get()).toEqual(DEFAULT_THEME)
    expect(headChildren.find((c) => c.id === 'ui-tool-plugin-install')).toBeUndefined()
  })
})

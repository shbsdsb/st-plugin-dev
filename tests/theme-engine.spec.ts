// agent_plugin_dev/ui-tool-plugin/tests/theme-engine.spec.ts
import { describe, expect, it, vi } from 'vitest'
import { createThemeEngine } from '../src/theme-engine.ts'
import { DEFAULT_THEME } from '../src/theme.ts'

const headChildren: Array<{ id: string; textContent: string; tag: string }> = []
const bodyChildren: Array<{ id: string; tag: string; textContent: string; className: string; dataIndex: string }> = []

globalThis.document = {
  head: {
    appendChild(el: { tagName: string; id: string; textContent: string }) {
      headChildren.push({ tag: el.tagName, id: el.id, textContent: el.textContent })
    },
  },
  body: {
    appendChild(el: { tagName: string; id?: string; textContent?: string; className?: string; dataIndex?: string }) {
      bodyChildren.push({
        tag: el.tagName, id: el.id ?? '', textContent: el.textContent ?? '',
        className: el.className ?? '', dataIndex: el.dataIndex ?? '',
      })
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
    const cls = sel.startsWith('.') ? sel.slice(1) : sel
    return bodyChildren
      .filter((c) => c.className.includes(cls))
      .map((c) => ({ ...c, remove: () => { const i = bodyChildren.indexOf(c); if (i >= 0) bodyChildren.splice(i, 1) } }))
  },
  createElement(tag: string) {
    return {
      tagName: tag, id: '', textContent: '', className: '', style: {}, dataIndex: '',
      setAttribute(k: string, v: string) { (this as Record<string, string>)[k] = v },
      appendChild() {}, remove() {},
    }
  },
} as never
globalThis.requestAnimationFrame = (cb: () => void) => { cb(); return 1 }

describe('createThemeEngine', () => {
  const engine = createThemeEngine()

  it('get 返回默认主题', () => {
    expect(engine.get()).toEqual(DEFAULT_THEME)
  })

  it('set 局部更新并重建样式(含新 accent),默认 3 个光球', () => {
    engine.set({ accent: '#0ea5e9' })
    expect(engine.get().accent).toBe('#0ea5e9')
    expect(engine.get().blur).toBe(DEFAULT_THEME.blur)
    const style = headChildren.find((c) => c.id === 'ui-tool-plugin-theme')
    expect(style?.textContent).toContain('#0ea5e9')
    const orbs = document.querySelectorAll('.st-beautify-orb')
    expect(orbs.length).toBe(3)
  })

  it('set 覆盖 orbCount 后光球数量跟随', () => {
    engine.set({ orbCount: 2 })
    expect(document.querySelectorAll('.st-beautify-orb').length).toBe(2)
    engine.reset()
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
    // js 注入 script 节点
    expect(bodyChildren.some((c) => c.id === 'ui-tool-plugin-install-js')).toBe(true)
    engine.reset()
    expect(engine.get()).toEqual(DEFAULT_THEME)
    expect(headChildren.find((c) => c.id === 'ui-tool-plugin-install')).toBeUndefined()
    expect(bodyChildren.some((c) => c.id === 'ui-tool-plugin-install-js')).toBe(false)
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import plugin from '../src/web.tsx'

const headChildren: Array<{ id: string; textContent: string; className: string }> = []
const bodyChildren: Array<{ id: string; textContent: string; className: string; innerHTML: string }> = []

function elOf(id: string) {
  const h = headChildren.find((c) => c.id === id)
  if (h) return h
  return bodyChildren.find((c) => c.id === id)
}

globalThis.document = {
  head: {
    appendChild(c: { id?: string; textContent?: string; className?: string }) { headChildren.push({ id: c.id ?? '', textContent: c.textContent ?? '', className: c.className ?? '' }) },
  },
  body: {
    appendChild(c: { id?: string; textContent?: string; className?: string; innerHTML?: string }) { bodyChildren.push({ id: c.id ?? '', textContent: c.textContent ?? '', className: c.className ?? '', innerHTML: c.innerHTML ?? '' }) },
  },
  getElementById(id: string) {
    const h = headChildren.find((c) => c.id === id)
    if (h) return { ...h, remove: () => { const i = headChildren.indexOf(h); if (i >= 0) headChildren.splice(i, 1) } }
    const b = bodyChildren.find((c) => c.id === id)
    if (b) return { ...b, remove: () => { const i = bodyChildren.indexOf(b); if (i >= 0) bodyChildren.splice(i, 1) } }
    return null
  },
  createElement(tag: string) {
    return {
      tagName: tag.toUpperCase(), id: '', textContent: '', className: '', style: {}, innerHTML: '',
      appendChild() {}, setAttribute() {}, remove() {}, addEventListener() {},
    }
  },
  querySelectorAll() { return [] },
} as never

beforeEach(() => {
  headChildren.length = 0
  bodyChildren.length = 0
})

describe('ui-polish WebPlugin', () => {
  it('mount:fetch current 并按序注入 tokens/default/css/html/js', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, name: 'dark', html: '<b>x</b>', css: ':root{--ui-bg:#000}', js: 'window.__x=1' }),
    }))
    await plugin.mount(null as never)
    expect(elOf('ui-polish-tokens')).toBeTruthy()
    expect(elOf('ui-polish-default')).toBeTruthy()
    expect(elOf('ui-polish-css')).toBeTruthy()
    expect(elOf('ui-polish-host')).toBeTruthy()
    expect(elOf('ui-polish-js')).toBeTruthy()
    const host = elOf('ui-polish-host')
    expect(host!.innerHTML).toContain('<b>x</b>')
    vi.unstubAllGlobals()
  })

  it('无激活(name:null)→ 仅 tokens/default,无用户节点', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, name: null, html: null, css: null, js: null }),
    }))
    await plugin.mount(null as never)
    expect(elOf('ui-polish-tokens')).toBeTruthy()
    expect(elOf('ui-polish-default')).toBeTruthy()
    expect(elOf('ui-polish-css')).toBeUndefined()
    expect(elOf('ui-polish-host')).toBeUndefined()
    expect(elOf('ui-polish-js')).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('重复 mount 幂等:不产生重复 id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, name: null, html: null, css: null, js: null }),
    }))
    await plugin.mount(null as never)
    await plugin.mount(null as never)
    expect(headChildren.filter((c) => c.id === 'ui-polish-tokens').length).toBe(1)
    vi.unstubAllGlobals()
  })

  it('unmount:清空全部注入节点', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, name: 'dark', html: '<i>h</i>', css: 'a{}', js: '' }),
    }))
    await plugin.mount(null as never)
    plugin.unmount()
    expect(headChildren.some((c) => c.id === 'ui-polish-tokens')).toBe(false)
    expect(headChildren.some((c) => c.id === 'ui-polish-default')).toBe(false)
    expect(headChildren.some((c) => c.id === 'ui-polish-css')).toBe(false)
    expect(bodyChildren.some((c) => c.id === 'ui-polish-host')).toBe(false)
    expect(bodyChildren.some((c) => c.id === 'ui-polish-js')).toBe(false)
    vi.unstubAllGlobals()
  })

  it('fetch 失败:console.warn 不抛,仍注入 tokens/default', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')))
    await plugin.mount(null as never)
    expect(warn).toHaveBeenCalled()
    expect(elOf('ui-polish-tokens')).toBeTruthy()
    expect(elOf('ui-polish-default')).toBeTruthy()
    warn.mockRestore()
    vi.unstubAllGlobals()
  })
})

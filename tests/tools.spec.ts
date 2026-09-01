// agent_plugin_dev/ui-tool-plugin/tests/tools.spec.ts
import { describe, expect, it, vi, afterEach } from 'vitest'
import { createTools, closeAllTools } from '../src/tools.ts'

// 简易 DOM mock:记录 append 到 body 的节点与 classList 操作
const bodyChildren: Array<{ className: string; classList: Set<string>; remove: () => void }> = []
function makeClassList() {
  const s = new Set<string>()
  return {
    add: (c: string) => s.add(c),
    remove: (c: string) => s.delete(c),
    has: (c: string) => s.has(c),
  }
}

function makeEl(tag: string) {
  const classList = makeClassList()
  return {
    tagName: tag, className: '', textContent: '', innerHTML: '', style: {} as Record<string, string>,
    classList,
    setAttribute() {}, appendChild() {},
    addEventListener() {},
    remove() { /* no-op */ },
    querySelector() { return null }, querySelectorAll() { return [] },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 30 } },
  }
}

globalThis.document = {
  body: {
    appendChild(el: { className: string; classList: Set<string>; remove: () => void }) {
      const rec = {
        className: el.className,
        classList: el.classList,
        remove: () => { const i = bodyChildren.indexOf(rec); if (i >= 0) bodyChildren.splice(i, 1) },
      }
      bodyChildren.push(rec)
      el.remove = rec.remove
    },
  },
  head: { appendChild() {} },
  createElement: makeEl,
  getElementById() { return null },
  querySelectorAll() { return [] },
} as never
globalThis.requestAnimationFrame = (cb: () => void) => { cb(); return 1 }

describe('createTools 基础工具', () => {
  const tools = createTools()
  afterEach(() => { bodyChildren.length = 0; closeAllTools() })

  it('toast:创建浮层并显示(show class)', () => {
    tools.toast('操作成功')
    expect(bodyChildren.length).toBe(1)
    expect(bodyChildren[0].classList.has('show')).toBe(true)
  })

  it('alert:顶部警告条(含关闭按钮)', () => {
    tools.alert('磁盘不足')
    expect(bodyChildren.length).toBe(1)
    expect(bodyChildren[0].className).toContain('fw-alert')
  })

  it('notify/bottomSheet/topBanner/sideSlide:各自创建对应样式浮层', () => {
    tools.notify({ title: '通知', desc: '详情' })
    tools.bottomSheet({ title: '底部' })
    tools.topBanner({ title: '公告' })
    tools.sideSlide({ title: '抽屉' })
    expect(bodyChildren.length).toBe(4)
    const names = bodyChildren.map((c) => c.className).join(',')
    expect(names).toContain('fw-notify')
    expect(names).toContain('fw-sheet')
    expect(names).toContain('fw-banner')
    expect(names).toContain('fw-slide')
  })

  it('closeAllTools:清空全部浮层(动画后移除)', () => {
    vi.useFakeTimers()
    tools.toast('a'); tools.alert('b')
    closeAllTools()
    vi.advanceTimersByTime(400)
    expect(bodyChildren.length).toBe(0)
    vi.useRealTimers()
  })
})

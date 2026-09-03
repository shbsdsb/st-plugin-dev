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
  const children: Array<{ className: string; textContent: string; style: Record<string, string> }> = []
  return {
    tagName: tag, className: '', textContent: '', innerHTML: '', style: {} as Record<string, string>,
    dataset: {} as Record<string, string>,
    classList,
    children,
    setAttribute() {},
    appendChild(child: { className?: string; textContent?: string; style?: Record<string, string> }) {
      children.push({ className: child.className ?? '', textContent: child.textContent ?? '', style: child.style ?? {} })
    },
    append(...items: Array<{ className?: string; textContent?: string; style?: Record<string, string> }>) {
      for (const c of items) this.appendChild(c)
    },
    insertBefore(child: { className?: string; textContent?: string; style?: Record<string, string> }) {
      children.unshift({ className: child.className ?? '', textContent: child.textContent ?? '', style: child.style ?? {} })
    },
    addEventListener() {},
    remove() { /* no-op */ },
    querySelector(sel: string) {
      const cls = sel.startsWith('.') ? sel.slice(1) : sel
      const found = children.find((c) => c.className.includes(cls))
      if (!found) return null
      return {
        ...found,
        remove: () => { const i = children.indexOf(found); if (i >= 0) children.splice(i, 1) },
      }
    },
    querySelectorAll() { return [] },
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

describe('createTools 模态与特殊工具', () => {
  const tools = createTools()
  afterEach(() => { bodyChildren.length = 0; closeAllTools(); vi.useRealTimers() })

  it('modal:中心模态(遮罩),创建成功', () => {
    let ok = 0
    tools.modal({ title: '确认', desc: '删除?', onOk: () => { ok++ } })
    expect(bodyChildren.length).toBe(1)
    expect(bodyChildren[0].className).toContain('fw-mask')
    expect(ok).toBe(0)
  })

  it('tooltip:绑定元素附近气泡', () => {
    const host = document.createElement('div')
    tools.tooltip(host, '解释')
    expect(bodyChildren.length).toBe(1)
    expect(bodyChildren[0].className).toContain('fw-tip')
  })

  it('badge:添加脉冲角标,再次调用隐藏', () => {
    const btn = document.createElement('button')
    tools.badge(btn, 3)
    expect(btn.querySelector('.badge-dot')?.textContent).toBe('3')
    tools.badge(btn, 3)
    expect(btn.querySelector('.badge-dot')).toBeNull()
  })

  it('progress:进度推进到 100% 后自动关闭', () => {
    vi.useFakeTimers()
    tools.progress({ title: '下载' })
    expect(bodyChildren.length).toBe(1)
    for (let i = 0; i < 10; i++) vi.advanceTimersByTime(300)
    vi.advanceTimersByTime(600)
    expect(bodyChildren.length).toBe(0)
    vi.useRealTimers()
  })

  it('dismissible:左下可关闭提示', () => {
    tools.dismissible('已保存')
    expect(bodyChildren.length).toBe(1)
    expect(bodyChildren[0].className).toContain('fw-dismiss')
  })

  it('centerPopup:中心弹出(自动消失)', () => {
    vi.useFakeTimers()
    tools.centerPopup({ title: '感谢', desc: '反馈重要' })
    expect(bodyChildren.length).toBe(1)
    expect(bodyChildren[0].className).toContain('fw-center')
    vi.advanceTimersByTime(2900)
    vi.advanceTimersByTime(400)
    expect(bodyChildren.length).toBe(0)
    vi.useRealTimers()
  })

  it('pluginModal:content 三形态 + actions + 遮罩互斥', () => {
    vi.useFakeTimers()
    tools.pluginModal({ title: '配置', content: '<input id="x">', actions: [{ label: '保存', variant: 'primary' }] })
    tools.pluginModal({ content: (el) => { el.innerHTML = '<b>fn</b>' } })
    tools.pluginModal({ content: document.createElement('div') })
    // 3 个创建,前两个被互斥关闭(250ms 后移除)
    vi.advanceTimersByTime(300)
    expect(bodyChildren.length).toBe(1)
    vi.useRealTimers()
  })

  it('modal 打开不关闭承载它的 pluginModal(嵌套确认)', () => {
    vi.useFakeTimers()
    tools.pluginModal({ title: '配置', content: (el) => { el.textContent = '面板' } })
    // harness 纯 DOM stub:按既有风格等价改写 bodyChildren 过滤,断言目标不变
    expect(bodyChildren.filter((c) => c.className.includes('fw-mask')).length).toBe(1)
    tools.modal({ title: '删除', desc: '确认?', onOk: () => {} })
    // 旧实现 modal() 内 closeMasked() 全杀父 pluginModal:advance 250ms 后被移除,只剩 1 个 mask
    // 修复后:父 pluginModal 仍在,新确认框叠于其上(共 2 个 mask)
    vi.advanceTimersByTime(300)
    expect(bodyChildren.filter((c) => c.className.includes('fw-mask')).length).toBe(2)
    vi.useRealTimers()
  })
})

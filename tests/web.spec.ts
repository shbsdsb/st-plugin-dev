import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import plugin, { openDialog, inferControlType, buildSavePayload } from '../src/web.tsx'

type SlotContent = { name: string; render: (el: unknown) => void; collapsedRender?: (el: unknown) => void; unmount?: () => void }
const registered: Array<{ slot: string; content: SlotContent }> = []
const unregistered: Array<{ slot: string; name: string }> = []
let pluginModalCalls: unknown[] = []

const headChildren: Array<{ id: string }> = []
globalThis.document = {
  head: { appendChild(el: { id?: string }) { headChildren.push({ id: el.id ?? '' }) } },
  body: { appendChild() {} },
  getElementById(id: string) { return headChildren.find((c) => c.id === id) ?? null },
  createElement(tag: string) {
    return {
      tagName: tag, className: '', textContent: '', style: {}, id: '',
      appendChild() {}, remove() {}, addEventListener() {}, setAttribute() {},
    }
  },
} as never

beforeEach(() => {
  registered.length = 0
  unregistered.length = 0
  pluginModalCalls = []
  ;(globalThis as { window: unknown }).window = {
    __uiSlots__: {
      register: (slot: string, content: SlotContent) => { registered.push({ slot, content }) },
      unregister: (slot: string, name: string) => { unregistered.push({ slot, name }) },
    },
    __uiTools__: {
      pluginModal: (opts: unknown) => { pluginModalCalls.push(opts) },
      toast: vi.fn(),
    },
  }
})
afterEach(() => { delete (globalThis as { window?: unknown }).window })

describe('inferControlType', () => {
  it('按 config 运行时值类型推断', () => {
    expect(inferControlType('x')).toBe('string')
    expect(inferControlType(1)).toBe('number')
    expect(inferControlType(true)).toBe('boolean')
    expect(inferControlType({ a: 1 })).toBe('object')
    expect(inferControlType([1])).toBe('array')
    expect(inferControlType(null)).toBe('null')
    expect(inferControlType(undefined)).toBe('null')
  })
})

describe('buildSavePayload', () => {
  it('提交完整 config(整行替换,首次修改全量复制)', () => {
    const entries = [{ id: 'host', config: { port: 9090 } }]
    expect(buildSavePayload(entries)).toEqual({ entries })
  })
})

describe('plugin-setting WebPlugin', () => {
  it('mount:注册 sidebar-left 齿轮按钮(含 render + collapsedRender + unmount)', () => {
    plugin.mount(null as never)
    expect(registered).toHaveLength(1)
    expect(registered[0].slot).toBe('sidebar-left')
    expect(registered[0].content.name).toBe('plugin-setting')
    expect(typeof registered[0].content.render).toBe('function')
    expect(typeof registered[0].content.collapsedRender).toBe('function')
  })
  it('unmount:unregister sidebar-left', () => {
    plugin.mount(null as never)
    plugin.unmount()
    expect(unregistered).toEqual([{ slot: 'sidebar-left', name: 'plugin-setting' }])
  })
  it('无 __uiSlots__ → warn 且不注册', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;(globalThis as { window: unknown }).window = {}
    plugin.mount(null as never)
    expect(registered).toHaveLength(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('openDialog(经 __uiTools__.pluginModal)', () => {
  it('调用 pluginModal,title/width/actions 结构正确', () => {
    openDialog()
    expect(pluginModalCalls).toHaveLength(1)
    const opts = pluginModalCalls[0] as { title?: string; width?: number; content: unknown; actions?: unknown[] }
    expect(opts.title).toBe('插件设置')
    expect(opts.width).toBe(760)
    expect(typeof opts.content).toBe('function')
    expect(opts.actions).toHaveLength(2)
    expect((opts.actions as Array<{ label: string; variant?: string }>)[1]).toMatchObject({ label: '保存', variant: 'primary' })
  })
})

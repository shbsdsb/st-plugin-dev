import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry, SLOT_NAMES } from '../src/slots.ts'

describe('SlotRegistry', () => {
  it('SLOT_NAMES 固定 5 插槽', () => {
    expect(SLOT_NAMES).toEqual(['nav', 'sidebar-left', 'sidebar-right', 'main', 'overlay'])
  })

  it('register + get', () => {
    const r = new SlotRegistry()
    const c = { name: 'a', render: () => {} }
    r.register('nav', c)
    expect(r.get('nav')).toEqual([c])
    expect(r.get('main')).toEqual([])
  })

  it('未知插槽 → 抛错', () => {
    const r = new SlotRegistry()
    expect(() => r.register('nope' as never, { name: 'a', render: () => {} })).toThrow('未知插槽')
  })

  it('同名重复注册 → 覆盖且先调旧 unmount', () => {
    const r = new SlotRegistry()
    const oldUnmount = vi.fn()
    r.register('nav', { name: 'a', render: () => {}, unmount: oldUnmount })
    r.register('nav', { name: 'a', render: () => {} })
    expect(r.get('nav')).toHaveLength(1)
    expect(oldUnmount).toHaveBeenCalledTimes(1)
  })

  it('unregister:移除 + 调 unmount;未注册幂等', () => {
    const r = new SlotRegistry()
    const unmount = vi.fn()
    r.register('nav', { name: 'a', render: () => {}, unmount })
    r.unregister('nav', 'a')
    expect(r.get('nav')).toEqual([])
    expect(unmount).toHaveBeenCalledTimes(1)
    expect(() => r.unregister('nav', 'a')).not.toThrow()
    expect(() => r.unregister('nav', 'missing')).not.toThrow()
  })

  it('subscribe:register/unregister 触发通知;退订后不再触发', () => {
    const r = new SlotRegistry()
    const listener = vi.fn()
    const unsubscribe = r.subscribe(listener)
    r.register('nav', { name: 'a', render: () => {} })
    expect(listener).toHaveBeenCalledTimes(1)
    r.unregister('nav', 'a')
    expect(listener).toHaveBeenCalledTimes(2)
    // 无实际变更不通知
    r.unregister('nav', 'missing')
    expect(listener).toHaveBeenCalledTimes(2)
    // 退订后不再收到通知
    unsubscribe()
    r.register('nav', { name: 'b', render: () => {} })
    expect(listener).toHaveBeenCalledTimes(2)
  })
})

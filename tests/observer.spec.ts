import { describe, it, expect, beforeEach } from 'vitest'
import { createObserver, type EventBusLike } from '../src/observer.ts'
import type { ObservedActivity } from '../src/types.ts'

function fakeFiber(name: string, uid: number | null, state = 2) {
  return { name, uid, state }
}

function makeBus() {
  const handlers = new Map<string, (...a: unknown[]) => void>()
  const bus: EventBusLike = {
    on(name, listener) { handlers.set(name, listener); return () => { handlers.delete(name); return true } },
  }
  const fire = (name: string, ...a: unknown[]) => { handlers.get(name)?.(...a) }
  return { bus, handlers, fire }
}

describe('observer 内部事件观测', () => {
  let seen: ObservedActivity[]
  let cfg: { lifecycle: boolean; service: boolean; events: boolean }

  beforeEach(() => { seen = []; cfg = { lifecycle: true, service: true, events: true } })
  const attach = (bus: EventBusLike) => createObserver(bus, { config: cfg, sink: (a) => seen.push(a), now: () => new Date(2026, 0, 5, 9, 0, 0, 0) })

  it('订阅 5 个内部事件并返回 disposer(卸载全部)', () => {
    const { bus, handlers } = makeBus()
    const dispose = attach(bus)
    expect(handlers.size).toBe(5)
    expect(handlers.has('internal/plugin')).toBe(true)
    expect(handlers.has('internal/status')).toBe(true)
    expect(handlers.has('internal/service')).toBe(true)
    expect(handlers.has('internal/dispatch')).toBe(true)
    expect(handlers.has('internal/listener')).toBe(true)
    dispose()
    expect(handlers.size).toBe(0)
  })

  it('internal/plugin:uid 有效 → load,uid null → unload;跳过 root 与自身', () => {
    const { bus, fire } = makeBus()
    attach(bus)
    fire('internal/plugin', fakeFiber('prompt-plugin', 1))
    fire('internal/plugin', fakeFiber('prompt-plugin', null))
    fire('internal/plugin', fakeFiber('root', 1))
    fire('internal/plugin', fakeFiber('logger-plugin', 1))
    expect(seen.map((a) => a.kind)).toEqual(['load', 'unload'])
    expect(seen[0].plugin).toBe('prompt-plugin')
  })

  it('internal/status:仅 FAILED(state===3)记录,其余翻转跳过', () => {
    const { bus, fire } = makeBus()
    attach(bus)
    fire('internal/status', fakeFiber('p1', 1, 3), 0)     // → FAILED
    fire('internal/status', fakeFiber('p2', 1, 2), 0)     // → ACTIVE,跳过
    expect(seen).toHaveLength(1)
    expect(seen[0].kind).toBe('status')
    expect(seen[0].detail).toContain('FAILED')
  })

  it('internal/service 与 listener:滤 internal/* 前缀;emit 记 args', () => {
    const { bus, fire } = makeBus()
    attach(bus)
    fire('internal/service', 'webServer', {})
    fire('internal/service', 'internal/update', {})
    fire('internal/listener', 'chat/request', () => {}, false)
    fire('internal/listener', 'internal/update', () => {}, false)
    fire('internal/dispatch', 'emit', 'chat/request', [{ id: 1 }], null)
    expect(seen.map((a) => a.kind)).toEqual(['service', 'on', 'emit'])
    expect(seen[0].detail).toContain('webServer')
    expect(seen[2].detail).toContain('chat/request')
  })

  it('开关关闭的事件不订阅', () => {
    cfg = { lifecycle: false, service: false, events: false }
    const { bus, handlers } = makeBus()
    attach(bus)
    expect(handlers.size).toBe(0)
  })

  it('sink 抛错不向外传播(cordis 事件链安全)', () => {
    const { bus, fire } = makeBus()
    createObserver(bus, {
      config: cfg,
      sink: () => { throw new Error('boom') },
      now: () => new Date(),
    })
    expect(() => fire('internal/plugin', fakeFiber('p1', 1))).not.toThrow()
  })
})

import { jsonArgs } from './format.ts'
import type { ActivityKind, ObservedActivity } from './types.ts'

export interface FiberLike { name: string; uid: number | null; state?: number }
export interface EventBusLike {
  on(name: string, listener: (...args: unknown[]) => void): () => boolean
}

const PLUGIN_ID = 'logger-plugin'
/** FiberState 枚举名序(与 vendor/cordis fiber.ts const enum 一致) */
const FIBER_STATES = ['PENDING', 'LOADING', 'ACTIVE', 'FAILED', 'DISPOSED', 'UNLOADING'] as const
const FAILED = 3

function pluginOf(fiber: unknown): string {
  const f = fiber as FiberLike | undefined
  return f && typeof f.name === 'string' && f.name ? f.name : 'root'
}
function isSkipped(plugin: string): boolean {
  return !plugin || plugin === 'root' || plugin === PLUGIN_ID
}

export function createObserver(bus: EventBusLike, opts: {
  config: { lifecycle: boolean; service: boolean; events: boolean }
  sink: (a: ObservedActivity) => void
  now?: () => Date
}): () => void {
  const now = opts.now ?? (() => new Date())
  const disposers: Array<() => boolean> = []
  const push = (kind: ActivityKind, plugin: string, detail: string) => {
    try { opts.sink({ date: now(), kind, plugin, detail }) } catch { /* sink 自身异常不影响 cordis 事件链 */ }
  }
  const { lifecycle, service, events } = opts.config
  if (lifecycle) {
    disposers.push(bus.on('internal/plugin', (fiber) => {
      const plugin = pluginOf(fiber)
      if (isSkipped(plugin)) return
      const f = fiber as FiberLike
      push(f.uid === null ? 'unload' : 'load', plugin, '')
    }))
    disposers.push(bus.on('internal/status', (fiber) => {
      const plugin = pluginOf(fiber)
      if (isSkipped(plugin)) return
      const next = (fiber as FiberLike).state
      if (next === FAILED) {
        push('status', plugin, `状态 → ${FIBER_STATES[next]}(装载失败)`)
      }
    }))
  }
  if (service) {
    disposers.push(bus.on('internal/service', (name) => {
      if (typeof name !== 'string' || name.startsWith('internal/')) return
      push('service', 'core', `provide ${name}`)
    }))
  }
  if (events) {
    disposers.push(bus.on('internal/dispatch', (_mode, name, args) => {
      if (typeof name !== 'string' || name.startsWith('internal/')) return
      const extra = Array.isArray(args) && args.length ? ` args=${jsonArgs(args)}` : ''
      push('emit', 'core', `emit ${name}${extra}`)
    }))
    disposers.push(bus.on('internal/listener', (name) => {
      if (typeof name !== 'string' || name.startsWith('internal/')) return
      push('on', 'core', `监听 ${name}`)
    }))
  }
  return () => {
    for (const d of disposers) { try { d() } catch { /* 忽略卸载异常 */ } }
  }
}

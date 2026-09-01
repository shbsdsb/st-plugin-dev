export const SLOT_NAMES = ['nav', 'sidebar-left', 'sidebar-right', 'main', 'overlay'] as const
export type SlotName = (typeof SLOT_NAMES)[number]

export interface SlotContent {
  name: string
  render(el: HTMLElement): void | Promise<void>
  /** 可选:左栏收起态(40px 窄条)渲染;未提供则不渲染 */
  collapsedRender?(el: HTMLElement): void | Promise<void>
  unmount?(): void
}

/** 插槽注册表(纯逻辑,供 __uiSlots__ 与测试) */
export class SlotRegistry {
  private store = new Map<SlotName, Map<string, SlotContent>>()
  private listeners = new Set<() => void>()

  /** 订阅注册表变更(register/unregister 时通知);返回退订函数 */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of [...this.listeners]) {
      listener()
    }
  }

  private mapOf(slot: SlotName): Map<string, SlotContent> {
    let map = this.store.get(slot)
    if (!map) {
      map = new Map()
      this.store.set(slot, map)
    }
    return map
  }

  register(slot: SlotName, content: SlotContent): void {
    if (!(SLOT_NAMES as readonly string[]).includes(slot)) {
      throw new Error('未知插槽: ' + slot)
    }
    const map = this.mapOf(slot)
    const existing = map.get(content.name)
    if (existing && existing !== content) {
      existing.unmount?.()
    }
    map.set(content.name, content)
    this.notify()
  }

  unregister(slot: SlotName, name: string): void {
    const map = this.store.get(slot)
    if (!map) return
    const content = map.get(name)
    if (!content) return
    content.unmount?.()
    map.delete(name)
    this.notify()
  }

  get(slot: SlotName): SlotContent[] {
    return [...(this.store.get(slot)?.values() ?? [])]
  }
}

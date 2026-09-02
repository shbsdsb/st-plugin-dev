// agent_plugin_dev/st-ui-slots/src/web.tsx
import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { SlotRegistry, type SlotName } from './slots.ts'
import { Layout } from './layout.tsx'
import { readClientConfig } from './use-is-mobile.ts'

export default {
  name: 'st-ui-slots',
  mount(el: HTMLElement) {
    const registry = new SlotRegistry()
    ;(window as unknown as { __uiSlots__: unknown }).__uiSlots__ = {
      register: (slot: SlotName, content: Parameters<SlotRegistry['register']>[1]) => registry.register(slot, content),
      unregister: (slot: SlotName, name: string) => registry.unregister(slot, name),
      get: (slot: SlotName) => registry.get(slot),
    }
    this.root = createRoot(el)
    const cfg = readClientConfig('st-ui-slots')
    this.root.render(React.createElement(Layout, { registry, showCollapsedRail: cfg.showCollapsedRail }))
  },
  unmount() {
    this.root?.unmount()
    delete (window as unknown as { __uiSlots__?: unknown }).__uiSlots__
  },
}

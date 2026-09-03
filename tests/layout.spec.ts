import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Layout } from '../src/layout.tsx'
import { SlotRegistry } from '../src/slots.ts'

function html(props: Record<string, unknown>): string {
  return renderToStaticMarkup(React.createElement(Layout, { registry: new SlotRegistry(), ...props }))
}

describe('Layout desktop', () => {
  it('renders same-layer sidebars + main + nav', () => {
    const s = html({})
    expect(s).toContain('data-slot="sidebar-left"')
    expect(s).toContain('data-slot="sidebar-right"')
    expect(s).toContain('data-slot="main"')
    expect(s).toContain('data-slot="nav"')
  })
  it('collapsed + showCollapsedRail=false hides 40px rail', () => {
    const s = html({ leftCollapsed: true, showCollapsedRail: false })
    expect(s).not.toContain('data-slot="sidebar-left"') // 窄条被隐藏
    expect(s).toContain('data-slot="main"')
  })
  it('collapsed default shows 40px rail', () => {
    const s = html({ leftCollapsed: true })
    expect(s).toContain('data-slot="sidebar-left"')
  })
})

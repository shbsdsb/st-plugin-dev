import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Layout } from '../src/layout.tsx'
import { SlotRegistry } from '../src/slots.ts'

function html(props: Record<string, unknown>): string {
  return renderToStaticMarkup(React.createElement(Layout, { registry: new SlotRegistry(), ...props }))
}

describe('Layout mobile', () => {
  it('mobile default keeps collapsed rail + hamburger, no same-layer sidebar', () => {
    const s = html({ isMobile: true })
    expect(s).toContain('data-mobile-open-left')
    expect(s).toContain('data-slots-rail="left"')
    expect(s).not.toContain('data-slot="sidebar-left"')
  })
  it('mobile showCollapsedRail=false hides collapsed rail, keeps hamburger', () => {
    const s = html({ isMobile: true, showCollapsedRail: false })
    expect(s).not.toContain('data-slots-rail="left"')
    expect(s).toContain('data-mobile-open-left')
  })
  it('desktop keeps same-layer sidebar (no mobile buttons)', () => {
    const s = html({})
    expect(s).toContain('data-slot="sidebar-left"')
    expect(s).not.toContain('data-mobile-open-left')
  })
})

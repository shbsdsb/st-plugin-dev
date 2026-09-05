import { describe, expect, it } from 'vitest'
import { buildDefaultCss } from '../src/default.ts'
import { DEFAULT_TOKENS } from '../src/tokens.ts'

describe('buildDefaultCss(默认主题美化,token 引用)', () => {
  const css = buildDefaultCss()

  it('覆盖 5 个 data-slot 与 body/button/滚动条', () => {
    for (const sel of ['html, body', '[data-slot="nav"]', '[data-slot="sidebar-left"]', '[data-slot="sidebar-right"]', '[data-slot="main"]', '[data-slot="overlay"]', 'body button', '.st-slot-btn', '::-webkit-scrollbar-thumb']) {
      expect(css).toContain(sel)
    }
  })

  it('不包含任何 #hex/rgba 硬编码色(只引用 var(--ui-*))', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/)
    expect(css).not.toContain('rgba(')
  })

  it('引用的 token 均在 DEFAULT_TOKENS 内', () => {
    const used = [...css.matchAll(/var\((--ui-[a-z-]+)/g)].map((m) => m[1])
    expect(used.length).toBeGreaterThan(0)
    for (const t of used) expect(DEFAULT_TOKENS).toHaveProperty(t)
  })
})

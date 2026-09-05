import { describe, expect, it } from 'vitest'
import { DEFAULT_TOKENS, buildTokenCss } from '../src/tokens.ts'

describe('buildTokenCss', () => {
  it('输出 :root 且含全部默认 token', () => {
    const css = buildTokenCss(DEFAULT_TOKENS)
    expect(css.startsWith(':root {')).toBe(true)
    expect(css.endsWith('}')).toBe(true)
    for (const [k, v] of Object.entries(DEFAULT_TOKENS)) {
      expect(css).toContain(`${k}: ${v};`)
    }
  })

  it('空 token 表输出仅 :root', () => {
    expect(buildTokenCss({})).toBe(':root {\n}')
  })

  it('DEFAULT_TOKENS 键均以 --ui- 开头且值为非空串', () => {
    for (const [k, v] of Object.entries(DEFAULT_TOKENS)) {
      expect(k.startsWith('--ui-')).toBe(true)
      expect(v.length).toBeGreaterThan(0)
    }
  })
})

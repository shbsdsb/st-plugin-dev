import { describe, expect, it } from 'vitest'
import { TOOLS_MOBILE_CSS } from '../src/tools.ts'
import { buildThemeCss, DEFAULT_THEME } from '../src/theme.ts'

describe('ui-tool mobile css', () => {
  it('tools mobile rules: responsive width + touch + safe-area', () => {
    expect(TOOLS_MOBILE_CSS).toContain('min(240px,90vw)')
    expect(TOOLS_MOBILE_CSS).toContain('max-width:min(92vw,480px)')
    expect(TOOLS_MOBILE_CSS).toContain('@media (hover:none)')
    expect(TOOLS_MOBILE_CSS).toContain('env(safe-area-inset-bottom')
  })
  it('theme css has mobile breakpoint', () => {
    expect(buildThemeCss(DEFAULT_THEME)).toContain('@media (max-width: 768px)')
  })
})

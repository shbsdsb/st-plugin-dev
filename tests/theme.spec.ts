// agent_plugin_dev/ui-tool-plugin/tests/theme.spec.ts
import { describe, expect, it } from 'vitest'
import { buildThemeCss, DEFAULT_THEME } from '../src/theme.ts'

describe('buildThemeCss(简约黑白灰)', () => {
  it('CSS 包含 5 个 data-slot 选择器', () => {
    const css = buildThemeCss(DEFAULT_THEME)
    for (const slot of ['nav', 'sidebar-left', 'sidebar-right', 'main', 'overlay']) {
      expect(css).toContain(`[data-slot="${slot}"]`)
    }
  })

  it('简约默认:浅灰背景 + 白面板 + 细边框 + 强调 #333333', () => {
    const css = buildThemeCss(DEFAULT_THEME)
    expect(css).toContain('background: #f5f5f5')
    expect(css).toContain('background: #fff !important')
    expect(css).toContain('border: 1px solid #e0e0e0 !important')
    expect(css).toContain('#333333')
  })

  it('简约无毛玻璃/渐变动画/光球', () => {
    const css = buildThemeCss(DEFAULT_THEME)
    expect(css).not.toContain('backdrop-filter')
    expect(css).not.toContain('@keyframes')
    expect(css).not.toContain('st-beautify-orb')
  })

  it('覆盖 accent 生效(强调色)', () => {
    const css = buildThemeCss({ ...DEFAULT_THEME, accent: '#222222' })
    expect(css).toContain('#222222')
  })

  it('orbCount 边界(0/负值/NaN 不崩溃,简约默认 0 无光球)', () => {
    expect(() => buildThemeCss({ ...DEFAULT_THEME, orbCount: 0 })).not.toThrow()
    expect(() => buildThemeCss({ ...DEFAULT_THEME, orbCount: -3 })).not.toThrow()
    expect(() => buildThemeCss({ ...DEFAULT_THEME, orbCount: Number.NaN })).not.toThrow()
    expect(buildThemeCss({ ...DEFAULT_THEME, orbCount: 3 })).not.toContain('st-beautify-orb')
  })

  it('覆盖 inline 样式需 !important(插槽容器/收放按钮)', () => {
    const css = buildThemeCss(DEFAULT_THEME)
    expect(css).toContain('background: #fff !important')
    expect(css).toContain('border: 1px solid #e0e0e0 !important')
    expect(css).toContain('box-shadow: none !important')
    expect(css).toContain('.st-slot-btn')
  })
})

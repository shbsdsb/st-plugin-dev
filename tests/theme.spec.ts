// agent_plugin_dev/st-ui-beautify/tests/theme.spec.ts
import { describe, expect, it } from 'vitest'
import { buildThemeCss, DEFAULT_THEME } from '../src/theme.ts'

describe('buildThemeCss', () => {
  it('CSS 包含 5 个 data-slot 选择器', () => {
    const css = buildThemeCss(DEFAULT_THEME)
    for (const slot of ['nav', 'sidebar-left', 'sidebar-right', 'main', 'overlay']) {
      expect(css).toContain(`[data-slot="${slot}"]`)
    }
  })

  it('默认参数值注入(blur 20px / accent #7c6df6)', () => {
    const css = buildThemeCss(DEFAULT_THEME)
    expect(css).toContain('blur(20px)')
    expect(css).toContain('#7c6df6')
  })

  it('默认含背景动画关键帧;animated=false 时不含', () => {
    expect(buildThemeCss(DEFAULT_THEME)).toContain('@keyframes stBeautifyBgShift')
    const staticCss = buildThemeCss({ ...DEFAULT_THEME, animated: false })
    expect(staticCss).not.toContain('@keyframes')
    expect(staticCss).not.toContain('animation:')
  })

  it('覆盖参数生效(blur/accent/orbCount)', () => {
    const css = buildThemeCss({ ...DEFAULT_THEME, blur: 8, accent: '#ff6600', orbCount: 2 })
    expect(css).toContain('blur(8px)')
    expect(css).toContain('#ff6600')
    // orbCount=2 时只生成前 2 个光球定位
    expect(css).toContain('.st-beautify-orb:nth-child(1)')
    expect(css).toContain('.st-beautify-orb:nth-child(2)')
    expect(css).not.toContain('.st-beautify-orb:nth-child(3)')
  })
})

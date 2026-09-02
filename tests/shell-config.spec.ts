import { describe, expect, it } from 'vitest'
import { renderShellPage } from '../src/shell-page.ts'

const boot = [{ id: 'st-ui-slots', url: '/plugins/st-ui-slots/lib/index.cjs', inject: [], immed: true }]
const service = {
  version: '0.1.0',
  modules: ['cordis'],
  importmap: { cordis: '/shell/modules/cordis.cjs' },
  resolveModule: () => undefined,
} as never

describe('renderShellPage client config', () => {
  it('inlines window.__CLIENT_CONFIG__ from 4th arg', () => {
    const html = renderShellPage(service, boot, 'st-ui-slots', { 'st-ui-slots': { showCollapsedRail: false } })
    expect(html).toContain('window.__CLIENT_CONFIG__')
    expect(html).toContain('"st-ui-slots":{"showCollapsedRail":false}')
  })
  it('defaults to empty object when 4th arg omitted', () => {
    const html = renderShellPage(service, boot, 'st-ui-slots')
    expect(html).toContain('window.__CLIENT_CONFIG__ = {}')
  })
})

// agent_plugin_dev/web-module/tests/shell-page.spec.ts
import { describe, expect, it } from 'vitest'
import { ModuleTable } from '../src/module-table.ts'
import { renderShellPage } from '../src/shell-page.ts'
import type { ClientBootEntry } from '../src/types.ts'

describe('renderShellPage', () => {
  const service = new ModuleTable()
  const boot: ClientBootEntry[] = [
    { id: 'hello-web', url: '/hello-web/index.cjs', inject: [], immed: true },
  ]

  it('HTML 注入自定义模块加载器(__ModuleLoader__,无 importmap 标签)', () => {
    const html = renderShellPage(service, boot)
    expect(html).toContain('window.__ModuleLoader__')
    expect(html).toContain('bootstrap()')
    expect(html).toContain('__ModuleLoader__.require(entryUrl)')
    expect(html).not.toContain('<script type="importmap">')
    expect(html).toContain('"/shell/modules/react.cjs"')
    expect(html).toContain('"/shell/modules/cordis.cjs"')
    expect(html).toContain('id="shell-error"')
  })

  it('HTML 内联 window.CLIENT_BOOT 启动清单', () => {
    const html = renderShellPage(service, boot)
    expect(html).toContain('window.CLIENT_BOOT')
    expect(html).toContain('"hello-web"')
    expect(html).toContain('"/hello-web/index.cjs"')
  })

  it('HTML 含宿主脚本与加载入口(load 走 bootstrap + preloadSeed + require)', () => {
    const html = renderShellPage(service, boot)
    expect(html).toContain('window.__webShell__')
    expect(html).toContain('__webShell__.load')
    expect(html).toContain('__ModuleLoader__.bootstrap()')
    expect(html).toContain('__ModuleLoader__.preloadSeed(entryUrl)')
    expect(html).toContain('__ModuleLoader__.require(entryUrl)')
    expect(html).toContain('id="shell-root"')
  })

  it('入口挂载后遍历 CLIENT_BOOT 挂载其余辅助插件(mount 校验)', () => {
    const html = renderShellPage(service, boot)
    expect(html).toContain('for (const entry of window.CLIENT_BOOT)')
    expect(html).toContain('entry.id === entryUrl')
    expect(html).toContain('__ModuleLoader__.require(entry.id)')
    expect(html).toContain("typeof aux.mount === 'function'")
    expect(html).toContain('mounted auxiliary')
  })

  it('HTML 含错误展示容器与挂载根节点', () => {
    const html = renderShellPage(service, boot)
    expect(html).toContain('id="shell-error"')
    expect(html).toContain('id="shell-root"')
  })

  it('HTML 声明空 favicon(避免 /favicon.ico 404)', () => {
    const html = renderShellPage(service, boot)
    expect(html).toContain('<link rel="icon" href="data:,">')
  })
})

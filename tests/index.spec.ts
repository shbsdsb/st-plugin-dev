// agent_plugin_dev/web-module/tests/index.spec.ts
import { describe, expect, it } from 'vitest'
import { Context } from 'cordis'
import { WebServerService } from '../../host-plugin/src/web-server.ts'
import { name, apply } from '../src/index.ts'

describe('web-module', () => {
  it('导出插件名 web-module', () => {
    expect(name).toBe('web-module')
  })

  it('apply 声明 inject: [webServer, clientBoot] 与 provide: [webModule]', () => {
    const fn = apply as unknown as { inject?: unknown; provide?: unknown }
    expect(fn.inject).toEqual(['webServer', 'clientBoot'])
    expect(fn.provide).toEqual(['webModule'])
  })

  it('真实 Context + 真实 HTTP:路由分发与 webModule service', async () => {
    const ctx = new Context()
    const ws = new WebServerService()
    ;(ctx as unknown as { provide: (k: string, v: unknown) => void }).provide('webServer', ws)
    ;(ctx as unknown as { provide: (k: string, v: unknown) => void }).provide('clientBoot', {
      boot: [{ id: 'hello-web', url: '/hello-web/index.cjs', inject: [], immed: true }],
    })
    apply(ctx as never, { defaultPlugin: 'st-ui-slots' })
    expect((ctx as unknown as { webModule: unknown }).webModule).toBeDefined()

    await ws.start(0, '127.0.0.1')
    const { port } = ws.server.address() as { port: number }
    const base = `http://127.0.0.1:${port}`
    try {
      // 根路径 302 → /shell
      const root = await fetch(base + '/', { redirect: 'manual' })
      expect(root.status).toBe(302)
      expect(root.headers.get('location')).toBe('/shell')

      const shell = await fetch(base + '/shell')
      expect(shell.status).toBe(200)
      expect(shell.headers.get('content-type')).toContain('text/html')
      const shellText = await shell.text()
      expect(shellText).toContain('window.__ModuleLoader__')
      expect(shellText).toContain('window.CLIENT_BOOT')
      expect(shellText).toContain('"hello-web"')
      expect(shellText).toContain('st-ui-slots')   // defaultPlugin 内嵌,无 plugin 参数自动加载

      const im = await fetch(base + '/shell/importmap.json')
      expect(im.status).toBe(200)
      expect((await im.json())['react']).toBe('/shell/modules/react.cjs')

      const mod = await fetch(base + '/shell/modules/react.cjs')
      expect(mod.status).toBe(200)
      expect(await mod.text()).toContain('module.exports')

      const nf = await fetch(base + '/shell/modules/vue.cjs')
      expect(nf.status).toBe(404)
    } finally {
      await ws.stop()
      ctx.dispose?.()
    }
  }, 30000)

  it('clientBoot service 缺失时 apply 抛错(必需依赖)', () => {
    const ctx = new Context()
    ;(ctx as unknown as { provide: (k: string, v: unknown) => void }).provide('webServer', new WebServerService())
    expect(() => apply(ctx as never)).toThrow()
    ctx.dispose?.()
  })
})

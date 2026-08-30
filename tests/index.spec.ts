import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Context } from 'cordis'
import { WebServerService } from '../../host-plugin/src/web-server.ts'
import { name, apply } from '../src/index.ts'

function makeStHome(profile: unknown, pkgs: Record<string, object>): string {
  const dir = mkdtempSync(resolve(tmpdir(), 'cf-idx-'))
  mkdirSync(join(dir, 'profile/default'), { recursive: true })
  writeFileSync(join(dir, 'profile/default/package.json'), JSON.stringify({ name: 'profile-default', st: { profile } }))
  for (const [pkgName, pkg] of Object.entries(pkgs)) {
    mkdirSync(join(dir, 'node_modules', pkgName), { recursive: true })
    writeFileSync(join(dir, 'node_modules', pkgName, 'package.json'), JSON.stringify(pkg))
    for (const f of ['lib/a.cjs']) {
      mkdirSync(join(dir, 'node_modules', pkgName, 'lib'), { recursive: true })
      writeFileSync(join(dir, 'node_modules', pkgName, f), `module.exports = { name: '${pkgName}' }`)
    }
  }
  return dir
}

/** 本地开发包:st.profile 用对象条目 {name, file},包位于 stHome 下(不在 node_modules) */
function makeObjStHome(): string {
  const dir = mkdtempSync(resolve(tmpdir(), 'cf-obj-'))
  mkdirSync(join(dir, 'profile/default'), { recursive: true })
  writeFileSync(join(dir, 'profile/default/package.json'), JSON.stringify({
    name: 'profile-default',
    st: { profile: [{ name: 'pkg-dev', file: 'dev/pkg-dev' }] },
  }))
  const pkgDir = join(dir, 'dev', 'pkg-dev')
  mkdirSync(join(pkgDir, 'lib'), { recursive: true })
  writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({
    name: 'pkg-dev',
    st: { client: { kind: 'web', path: 'lib/a.cjs', immed: true } },
  }))
  writeFileSync(join(pkgDir, 'lib/a.cjs'), `module.exports = { name: 'pkg-dev' }`)
  return dir
}

describe('client-find', () => {
  it('导出插件名 client-find 与 inject/provide 声明', () => {
    expect(name).toBe('client-find')
    expect((apply as unknown as { inject?: unknown }).inject).toEqual(['webServer'])
    expect((apply as unknown as { provide?: unknown }).provide).toEqual(['clientBoot'])
  })

  it('真实 Context + HTTP:provide clientBoot 与 serve /plugins/*', async () => {
    const stHome = makeStHome(['pkg-a'], {
      'pkg-a': { name: 'pkg-a', st: { client: { kind: 'web', path: 'lib/a.cjs', immed: true } } },
    })
    process.env.ST_HOME = stHome
    process.env.ST_PROFILE = 'default'
    const ctx = new Context()
    const ws = new WebServerService()
    ;(ctx as unknown as { provide: (k: string, v: unknown) => void }).provide('webServer', ws)
    apply(ctx as never)
    const boot = (ctx as unknown as { clientBoot: { boot: { id: string }[] } }).clientBoot.boot
    expect(boot).toEqual([{ id: 'pkg-a', url: '/plugins/pkg-a/lib/a.cjs', inject: [], immed: true }])

    await ws.start(0, '127.0.0.1')
    const { port } = ws.server.address() as { port: number }
    const base = `http://127.0.0.1:${port}`
    try {
      const ok = await fetch(base + '/plugins/pkg-a/lib/a.cjs')
      expect(ok.status).toBe(200)
      expect(await ok.text()).toContain('pkg-a')
      const nf = await fetch(base + '/plugins/unknown/lib/x.cjs')
      expect(nf.status).toBe(404)
      const escape = await fetch(base + '/plugins/pkg-a/..%2f..%2fsecret.cjs')
      expect(escape.status).toBe(404)
    } finally {
      await ws.stop()
      ctx.dispose?.()
      delete process.env.ST_HOME
      delete process.env.ST_PROFILE
      rmSync(stHome, { recursive: true, force: true })
    }
  }, 30000)

  it('本地开发包(对象条目 {name, file}):serve 按 file 定位 stHome 下目录', async () => {
    const stHome = makeObjStHome()
    process.env.ST_HOME = stHome
    process.env.ST_PROFILE = 'default'
    const ctx = new Context()
    const ws = new WebServerService()
    ;(ctx as unknown as { provide: (k: string, v: unknown) => void }).provide('webServer', ws)
    apply(ctx as never)
    const boot = (ctx as unknown as { clientBoot: { boot: { id: string }[] } }).clientBoot.boot
    expect(boot).toEqual([{ id: 'pkg-dev', url: '/plugins/pkg-dev/lib/a.cjs', inject: [], immed: true }])

    await ws.start(0, '127.0.0.1')
    const { port } = ws.server.address() as { port: number }
    const base = `http://127.0.0.1:${port}`
    try {
      const ok = await fetch(base + '/plugins/pkg-dev/lib/a.cjs')
      expect(ok.status).toBe(200)
      expect(await ok.text()).toContain('pkg-dev')
    } finally {
      await ws.stop()
      ctx.dispose?.()
      delete process.env.ST_HOME
      delete process.env.ST_PROFILE
      rmSync(stHome, { recursive: true, force: true })
    }
  }, 30000)
})

import { describe, expect, it, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { scanBundles } from '../src/scan.ts'

function makeStHome(profile: unknown, pkgs: Record<string, object>): string {
  const dir = mkdtempSync(resolve(tmpdir(), 'cf-scan-'))
  mkdirSync(join(dir, 'profile/default'), { recursive: true })
  writeFileSync(join(dir, 'profile/default/package.json'), JSON.stringify({ name: 'profile-default', st: { profile } }))
  for (const [name, pkg] of Object.entries(pkgs)) {
    if (name.startsWith('file:')) {
      mkdirSync(join(dir, name.slice(5)), { recursive: true })
      writeFileSync(join(dir, name.slice(5), 'package.json'), JSON.stringify(pkg))
    } else {
      mkdirSync(join(dir, 'node_modules', name), { recursive: true })
      writeFileSync(join(dir, 'node_modules', name, 'package.json'), JSON.stringify(pkg))
    }
  }
  return dir
}

const dirs: string[] = []
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })

describe('scanBundles', () => {
  it('收集 kind: web 的条目,url = /plugins/<name>/<path>', async () => {
    const stHome = makeStHome(['pkg-a'], {
      'pkg-a': { name: 'pkg-a', st: { client: { kind: 'web', path: 'lib/a.cjs', immed: true } } },
    })
    dirs.push(stHome)
    const boot = await scanBundles({ stHome })
    expect(boot).toEqual([{ id: 'pkg-a', url: '/plugins/pkg-a/lib/a.cjs', inject: [], immed: true }])
  })

  it('kind 非 web / 无 st.client → 跳过', async () => {
    const stHome = makeStHome(['pkg-a', 'pkg-b'], {
      'pkg-a': { name: 'pkg-a', st: { client: { kind: 'server' } } },
      'pkg-b': { name: 'pkg-b' },
    })
    dirs.push(stHome)
    expect(await scanBundles({ stHome })).toEqual([])
  })

  it('path 缺失 → 警告 + 跳过', async () => {
    const warnings: string[] = []
    const stHome = makeStHome(['pkg-a'], {
      'pkg-a': { name: 'pkg-a', st: { client: { kind: 'web' } } },
    })
    dirs.push(stHome)
    const boot = await scanBundles({ stHome, warn: (m) => warnings.push(m) })
    expect(boot).toEqual([])
    expect(warnings.some((w) => w.includes('pkg-a'))).toBe(true)
  })

  it('inject/immed 默认值(inject 缺失 → [],immed 缺失 → false)', async () => {
    const stHome = makeStHome(['pkg-a'], {
      'pkg-a': { name: 'pkg-a', st: { client: { kind: 'web', path: 'a.cjs' } } },
    })
    dirs.push(stHome)
    const boot = await scanBundles({ stHome })
    expect(boot[0]).toMatchObject({ id: 'pkg-a', inject: [], immed: false })
  })

  it('本地开发包(对象条目 file)→ 按 file 定位', async () => {
    const stHome = makeStHome([{ name: 'pkg-dev', file: './dev/pkg-dev' }], {
      'file:dev/pkg-dev': { name: 'pkg-dev', st: { client: { kind: 'web', path: 'b.cjs', immed: true } } },
    })
    dirs.push(stHome)
    const boot = await scanBundles({ stHome })
    expect(boot).toEqual([{ id: 'pkg-dev', url: '/plugins/pkg-dev/b.cjs', inject: [], immed: true }])
  })

  it('拓扑排序(依赖在前)+ 一致性警告输出', async () => {
    const warnings: string[] = []
    const stHome = makeStHome(['pkg-a', 'pkg-b'], {
      'pkg-a': { name: 'pkg-a', st: { client: { kind: 'web', path: 'a.cjs', inject: ['pkg-b'], immed: true } } },
      'pkg-b': { name: 'pkg-b', st: { client: { kind: 'web', path: 'b.cjs' } } },
    })
    dirs.push(stHome)
    const boot = await scanBundles({ stHome, warn: (m) => warnings.push(m) })
    expect(boot.map((b) => b.id)).toEqual(['pkg-b', 'pkg-a'])
    expect(warnings.some((w) => w.includes('不一致'))).toBe(true)
  })
})

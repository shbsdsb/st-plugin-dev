import { describe, expect, it, vi, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { apply, type SettingEntry } from '../src/index.ts'

const dirs: string[] = []
const savedEnv: Record<string, string | undefined> = {}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

function fakeRes() {
  let status = 0
  let body = ''
  const res = {
    writeHead(s: number) { status = s },
    end(b: string) { body = b },
  }
  return {
    res,
    get status() { return status },
    get body() { return JSON.parse(body) as { ok: boolean; entries?: SettingEntry[]; error?: string } },
  }
}

function fakeReq(body?: string): EventEmitter {
  const req = new EventEmitter()
  if (body !== undefined) {
    queueMicrotask(() => {
      req.emit('data', Buffer.from(body, 'utf8'))
      req.emit('end')
    })
  }
  return req
}

function makeCtx(stHome: string) {
  // apply 读 process.env.ST_HOME/ST_PROFILE(与 registry.git() 前置一致);未设置时 apply 提前 return 不注册路由
  savedEnv.ST_HOME = process.env.ST_HOME
  savedEnv.ST_PROFILE = process.env.ST_PROFILE
  process.env.ST_HOME = stHome
  process.env.ST_PROFILE = 'default'
  const routes: Array<{ kind: string; path: string; handler: (req: unknown, res: unknown) => unknown }> = []
  const ctx = {
    logger: { warn: vi.fn(), info: vi.fn() },
    webServer: {
      register: vi.fn((opts: { kind: string; path: string; handler: (req: unknown, res: unknown) => unknown }) => {
        routes.push(opts)
        return vi.fn()
      }),
    },
    registry: { git: vi.fn().mockResolvedValue('- id: host\n  name: host-plugin\n  config:\n    port: 8080\n') },
    effect: vi.fn(),
  }
  apply(ctx as never)
  return { ctx, routes }
}

describe('plugin-setting 后端', () => {
  it('apply.inject 声明 webServer;注册两条 exact 路由', () => {
    const stHome = mkdtempSync(resolve(tmpdir(), 'ps-api-'))
    dirs.push(stHome)
    const { routes } = makeCtx(stHome)
    expect((apply as unknown as { inject: string[] }).inject).toEqual(['webServer'])
    expect(routes.map((r) => r.path)).toEqual(['/api/setting/list', '/api/setting/save'])
    expect(routes.every((r) => r.kind === 'exact')).toBe(true)
  })

  it('GET list:registry.git() YAML → JSON entries', async () => {
    const stHome = mkdtempSync(resolve(tmpdir(), 'ps-api-'))
    dirs.push(stHome)
    const { ctx, routes } = makeCtx(stHome)
    const r = fakeRes()
    await routes[0].handler(fakeReq(), r.res as never)
    expect(r.status).toBe(200)
    expect(r.body.ok).toBe(true)
    expect(r.body.entries).toEqual([{ id: 'host', name: 'host-plugin', config: { port: 8080 } }])
    expect(ctx.registry.git).toHaveBeenCalled()
  })

  it('PUT save:校验失败 → 400', async () => {
    const stHome = mkdtempSync(resolve(tmpdir(), 'ps-api-'))
    dirs.push(stHome)
    const { routes } = makeCtx(stHome)
    const r = fakeRes()
    await routes[1].handler(fakeReq(JSON.stringify({ entries: [{ id: 1 }] })), r.res as never)
    expect(r.status).toBe(400)
  })

  it('PUT save:合法 → 写入 profile patch(文件生成/更新),返回 ok', async () => {
    const stHome = mkdtempSync(resolve(tmpdir(), 'ps-api-'))
    dirs.push(stHome)
    savedEnv.ST_HOME = process.env.ST_HOME
    savedEnv.ST_PROFILE = process.env.ST_PROFILE
    process.env.ST_HOME = stHome
    process.env.ST_PROFILE = 'default'
    mkdirSync(join(stHome, 'profile', 'default'), { recursive: true })
    const { routes } = makeCtx(stHome)
    const r = fakeRes()
    await routes[1].handler(
      fakeReq(JSON.stringify({ entries: [{ id: 'host', config: { port: 9090, open: true } }] })),
      r.res as never,
    )
    expect(r.status).toBe(200)
    expect(r.body.ok).toBe(true)
    const text = await import('node:fs/promises').then((m) => m.readFile(join(stHome, 'profile', 'default', 'cordis.patch.yml'), 'utf8'))
    expect(text).toContain('id: host')
    expect(text).toContain('port: 9090')
  })
})

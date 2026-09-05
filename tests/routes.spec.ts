import { describe, expect, it } from 'vitest'
import type { ServerResponse } from 'node:http'
import { registerRoutes, type Register } from '../src/routes.ts'
import type { IncomingMessage } from 'node:http'

function makeRes() {
  const calls: Array<{ status: number; body: string }> = []
  const res = {
    writeHead(status: number, _h?: unknown) { calls.push({ status, body: '' }); return res },
    end(body: string) { if (calls.length) calls[calls.length - 1].body = String(body) },
  } as unknown as ServerResponse
  return { res, calls }
}

function collect(reg: Register) {
  const routes: Array<{ kind: string; path: string }> = []
  const register: Register = (o) => { routes.push({ kind: o.kind, path: o.path }); return () => {} }
  reg(register)
  return routes
}

describe('registerRoutes /api/ui-polish/current', () => {
  it('注册 exact 路由', () => {
    const reg: Register = (o) => { expect(o.kind).toBe('exact'); expect(o.path).toBe('/api/ui-polish/current'); return () => {} }
    const dispose = registerRoutes(reg, { stHome: '', config: undefined })
    expect(typeof dispose).toBe('function')
    void collect
  })

  it('GET 返回 200 + {ok,name,html,css,js}(无 active → name:null)', async () => {
    let handler: ((req: IncomingMessage, res: ServerResponse) => void | Promise<void>) | null = null
    const reg: Register = (o) => { handler = o.handler; return () => {} }
    registerRoutes(reg, { stHome: '/no/such/home', config: undefined })
    const { res, calls } = makeRes()
    await handler!({ url: '/api/ui-polish/current' } as IncomingMessage, res)
    expect(calls[0].status).toBe(200)
    const body = JSON.parse(calls[0].body)
    expect(body.ok).toBe(true)
    expect(body.name).toBe(null)
    expect(body.html).toBe(null)
    expect(body.css).toBe(null)
    expect(body.js).toBe(null)
  })

  it('返回 dispose 函数(幂等可调)', () => {
    const dispose = registerRoutes((o) => { void o; return () => {} }, { stHome: '', config: undefined })
    dispose()
    dispose()
  })
})

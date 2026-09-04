import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from 'cordis'
import apply from '../src/index.ts'

let st: string
beforeEach(() => {
  st = mkdtempSync(join(tmpdir(), 'persist-index-'))
  process.env.ST_HOME = st
})
afterEach(() => {
  rmSync(st, { recursive: true, force: true })
  delete process.env.ST_HOME
})

describe('persist plugin', () => {
  it('provide 全部四个服务', () => {
    const ctx = new Context()
    apply(ctx, {})
    expect(typeof ctx.persistJson.read).toBe('function')
    expect(typeof ctx.persistEnv.read).toBe('function')
    expect(typeof ctx.persistDb.open).toBe('function')
    expect(typeof ctx.credential.get).toBe('function')
  })

  it('persistJson 真实读写经 ctx 服务', async () => {
    const ctx = new Context()
    apply(ctx, {})
    await ctx.persistJson.write('a/b.json', { hello: 'world' })
    expect(await ctx.persistJson.read('a/b.json')).toEqual({ hello: 'world' })
  })
})

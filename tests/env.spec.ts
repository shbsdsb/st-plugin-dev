import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createEnvStore } from '../src/env.ts'

let st: string
let store: ReturnType<typeof createEnvStore>
beforeEach(() => {
  st = mkdtempSync(join(tmpdir(), 'persist-env-'))
  store = createEnvStore(st)
})
afterEach(() => { rmSync(st, { recursive: true, force: true }) })

describe('persistEnv', () => {
  it('读不存在文件 → {}', async () => {
    expect(await store.read('e.env')).toEqual({})
  })
  it('write → read 往返,解析 KEY=VALUE 与 # 注释', async () => {
    await store.write('e.env', { A: '1', B: 'hello world' })
    expect(await store.read('e.env')).toEqual({ A: '1', B: 'hello world' })
    const raw = readFileSync(join(st, 'e.env'), 'utf8')
    expect(raw).toMatch(/^A=1$/m)
  })
  it('write 自动建父目录', async () => {
    await store.write('x/y/env', { K: 'v' })
    expect(readFileSync(join(st, 'x', 'y', 'env'), 'utf8')).toContain('K=v')
  })
})

import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createJsonStore } from '../src/json.ts'

let st: string
let store: ReturnType<typeof createJsonStore>
beforeEach(() => {
  st = mkdtempSync(join(tmpdir(), 'persist-json-'))
  store = createJsonStore(st)
})
afterEach(() => { rmSync(st, { recursive: true, force: true }) })

describe('persistJson', () => {
  it('读不存在文件 → null', async () => {
    expect(await store.read('a/b.json')).toBe(null)
  })
  it('write → read 往返', async () => {
    await store.write('data.json', { a: 1, nested: { b: [1, 2] } })
    expect(await store.read('data.json')).toEqual({ a: 1, nested: { b: [1, 2] } })
  })
  it('write 自动建父目录,产生格式化 JSON', async () => {
    await store.write('x/y/z.json', { ok: true })
    expect(existsSync(join(st, 'x', 'y', 'z.json'))).toBe(true)
    const raw = readFileSync(join(st, 'x', 'y', 'z.json'), 'utf8')
    expect(raw).toContain('"ok": true')
  })
  it('JSON 解析失败 → 抛错', async () => {
    const { writeFileSync } = await import('node:fs')
    writeFileSync(join(st, 'bad.json'), '{not json', 'utf8')
    await expect(store.read('bad.json')).rejects.toThrow()
  })
})

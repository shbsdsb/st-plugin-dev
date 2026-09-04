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
  it('list 返回目录项名;目录不存在返回空数组', async () => {
    await store.write('p/f1/form.json', { name: 'a' })
    await store.write('p/f1/e-1.json', { id: 'e-1' })
    await store.write('p/f2/form.json', { name: 'b' })
    expect((await store.list('p')).sort()).toEqual(['f1', 'f2'])
    expect(await store.list('not-exists')).toEqual([])
  })
  it('delete 递归删除目录与文件,且幂等', async () => {
    await store.write('p/f1/form.json', { name: 'a' })
    await store.write('p/f1/e-1.json', { id: 'e-1' })
    await store.delete('p/f1')
    expect(existsSync(join(st, 'p', 'f1'))).toBe(false)
    await store.delete('p/f1') // 已不存在:静默成功
    await store.write('only.json', { x: 1 })
    await store.delete('only.json')
    expect(existsSync(join(st, 'only.json'))).toBe(false)
  })
  it('list/delete 拒绝绝对路径与越界路径', async () => {
    await expect(store.list('C:/x')).rejects.toThrow('拒绝绝对路径')
    await expect(store.list('../up')).rejects.toThrow()
    await expect(store.delete('C:/x')).rejects.toThrow()
    await expect(store.delete('')).rejects.toThrow()
  })
})

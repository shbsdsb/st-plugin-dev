import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDbStore } from '../src/db.ts'

let st: string
beforeEach(() => { st = mkdtempSync(join(tmpdir(), 'persist-db-')) })
afterEach(() => { rmSync(st, { recursive: true, force: true }) })

describe('persistDb', () => {
  it('open 自动建父目录与文件', async () => {
    const db = await createDbStore(st).open('data/app.sqlite')
    expect(existsSync(join(st, 'data', 'app.sqlite'))).toBe(true)
    db.close()
  })
  it('透传 DatabaseSync 全能力(exec/all/get/run/prepare)', async () => {
    const db = await createDbStore(st).open('app.sqlite')
    db.exec('CREATE TABLE t(a INTEGER)')
    db.prepare('INSERT INTO t VALUES (?)').run(42)
    expect(db.prepare('SELECT * FROM t').all()).toEqual([{ a: 42 }])
    expect(db.prepare('SELECT * FROM t').get()).toEqual({ a: 42 })
    const r = db.prepare('UPDATE t SET a = ? WHERE a = 42').run(7)
    expect(r.changes).toBe(1)
    db.close()
  })
  it('open 到受保护路径 → 抛错', async () => {
    await expect(createDbStore(st).open('../outside.sqlite')).rejects.toThrow()
  })
})

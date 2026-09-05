import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createWriter } from '../src/writer.ts'

let dir = ''
beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), 'logger-test-')) })

function fileOf(day: string): string { return path.join(dir, `activity-${day}.log`) }

describe('writer 双通道', () => {
  it('目录自建 + 追加写行(含换行)', () => {
    const now = () => new Date(2026, 0, 5, 9, 0, 0)
    const w = createWriter({ dir, stdout: false, now })
    w.write('line1')
    w.write('line2')
    w.close()
    expect(existsSync(fileOf('2026-01-05'))).toBe(true)
    expect(readFileSync(fileOf('2026-01-05'), 'utf8')).toBe('line1\nline2\n')
  })
  it('跨天自动轮换新文件,旧文件已写内容保留', () => {
    let d = new Date(2026, 0, 5, 23, 59, 59)
    const now = () => d
    const w = createWriter({ dir, stdout: false, now })
    w.write('day1')
    d = new Date(2026, 0, 6, 0, 0, 1)
    w.write('day2')
    w.close()
    expect(readFileSync(fileOf('2026-01-05'), 'utf8')).toBe('day1\n')
    expect(readFileSync(fileOf('2026-01-06'), 'utf8')).toBe('day2\n')
  })
  it('file:false → 只写 stdout 不建文件', () => {
    const now = () => new Date(2026, 0, 5, 9, 0, 0)
    const w = createWriter({ dir, stdout: false, file: false, now })
    w.write('line')
    w.close()
    expect(existsSync(fileOf('2026-01-05'))).toBe(false)
  })
  it('写路径异常不抛(把 dir 换成已存在文件制造 mkdir 失败)', () => {
    rmSync(dir, { recursive: true, force: true })
    writeFileSync(dir, 'x')
    let err = ''
    const w = createWriter({ dir, stdout: false, onError: (m) => { err = m } })
    expect(() => w.write('line')).not.toThrow()
    w.close()
    expect(err).not.toBe('')
  })
})

import { describe, expect, it, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isValidThemeName, resolveActive, readThemeFiles } from '../src/files.ts'

const roots: string[] = []
function makeStHome(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ui-polish-'))
  roots.push(dir)
  return dir
}
afterEach(() => { for (const r of roots) rmSync(r, { recursive: true, force: true }); roots.length = 0 })

describe('isValidThemeName', () => {
  it('接受字母数字下划线连字符,拒绝其它', () => {
    expect(isValidThemeName('dark')).toBe(true)
    expect(isValidThemeName('my-theme_2')).toBe(true)
    expect(isValidThemeName('')).toBe(false)
    expect(isValidThemeName('a/b')).toBe(false)
    expect(isValidThemeName('..')).toBe(false)
    expect(isValidThemeName('a b')).toBe(false)
  })
})

describe('resolveActive', () => {
  it('active 合法且目录存在 → 返回 active', () => {
    const st = makeStHome()
    mkdirSync(join(st, 'data/frontend/dark'), { recursive: true })
    expect(resolveActive({ active: 'dark' }, st)).toBe('dark')
  })
  it('active 目录不存在 → 回退 default(若存在)', () => {
    const st = makeStHome()
    mkdirSync(join(st, 'data/frontend/default'), { recursive: true })
    expect(resolveActive({ active: 'nope' }, st)).toBe('default')
  })
  it('无 active 且无 default → null', () => {
    const st = makeStHome()
    expect(resolveActive(undefined, st)).toBe(null)
    expect(resolveActive({}, st)).toBe(null)
  })
  it('active 非法名 → null', () => {
    const st = makeStHome()
    expect(resolveActive({ active: '../x' }, st)).toBe(null)
  })
})

describe('readThemeFiles', () => {
  it('三文件齐全 → 全部读出(trim 行尾 CRLF)', () => {
    const st = makeStHome()
    const dir = join(st, 'data/frontend/dark')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'html'), '<div>hi</div>\r\n')
    writeFileSync(join(dir, 'css'), ':root { --ui-bg: #000; }\r\n')
    writeFileSync(join(dir, 'js'), 'console.log(1)\r\n')
    const f = readThemeFiles(st, 'dark')
    expect(f.html).toBe('<div>hi</div>')
    expect(f.css).toBe(':root { --ui-bg: #000; }')
    expect(f.js).toBe('console.log(1)')
  })
  it('缺文件 → 对应 null', () => {
    const st = makeStHome()
    mkdirSync(join(st, 'data/frontend/dark'), { recursive: true })
    writeFileSync(join(st, 'data/frontend/dark/css'), 'a{}')
    const f = readThemeFiles(st, 'dark')
    expect(f.html).toBe(null)
    expect(f.css).toBe('a{}')
    expect(f.js).toBe(null)
  })
  it('目录不存在 → 全 null(不抛)', () => {
    const st = makeStHome()
    expect(readThemeFiles(st, 'ghost')).toEqual({ html: null, css: null, js: null })
  })
})

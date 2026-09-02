import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolvePersistPath, StoreError, ensureRelative } from '../src/path.ts'

const ST = 'D:/UsersProject/agent_plugin/st'

describe('resolvePersistPath', () => {
  it('接受多级相对路径', () => {
    expect(resolvePersistPath(ST, 'data/settings.json')).toBe(join(ST, 'data/settings.json'))
  })
  it('不接受空串/非字符串', () => {
    expect(() => resolvePersistPath(ST, '')).toThrow(StoreError)
    expect(() => resolvePersistPath(ST, 123 as never)).toThrow(StoreError)
  })
  it('不接受绝对路径', () => {
    expect(() => resolvePersistPath(ST, 'D:/other/a.json')).toThrow(StoreError)
    expect(() => resolvePersistPath(ST, '/abs/a.json')).toThrow(StoreError)
    expect(() => resolvePersistPath(ST, '\\\\srv\\share\\a.json')).toThrow(StoreError)
  })
  it('不接受 .. 越界', () => {
    expect(() => resolvePersistPath(ST, '..\\a.json')).toThrow(StoreError)
    expect(() => resolvePersistPath(ST, '../../../etc/passwd')).toThrow(StoreError)
  })
  it('不接受指向 ST_HOME 自身', () => {
    expect(() => resolvePersistPath(ST, '.')).toThrow(StoreError)
  })
  it('ensureRelative 对相对路径返回 true', () => {
    expect(ensureRelative('a/b.json')).toBe(true)
    expect(ensureRelative('D:/x.json')).toBe(false)
    expect(ensureRelative('\\\\srv\\x.json')).toBe(false)
    expect(ensureRelative('/x.json')).toBe(false)
    expect(ensureRelative('')).toBe(false)
  })
})

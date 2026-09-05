import { describe, it, expect } from 'vitest'
import { createRegisterTable } from '../src/register.ts'

describe('register 注册表', () => {
  it('register/list/has/get 基本行为', () => {
    const t = createRegisterTable()
    const dispose = t.register({ id: 'kb-context', name: '知识库上下文', fn: () => '知识' })
    expect(t.has('kb-context')).toBe(true)
    expect(t.list()).toEqual([{ id: 'kb-context', name: '知识库上下文' }])
    expect(t.get('kb-context')?.name).toBe('知识库上下文')
    expect(typeof t.get('kb-context')?.fn).toBe('function')
    dispose()
    expect(t.has('kb-context')).toBe(false)
    expect(t.list()).toEqual([])
  })
  it('重复注册幂等覆盖;旧 disposer 注销不误删新注册', () => {
    const t = createRegisterTable()
    const d1 = t.register({ id: 'kb', name: 'A', fn: () => 'a' })
    const d2 = t.register({ id: 'kb', name: 'B', fn: () => 'b' })
    expect(t.list()).toEqual([{ id: 'kb', name: 'B' }])
    d1()
    expect(t.has('kb')).toBe(true)   // d1 不是当前注册,不删除
    d2()
    expect(t.has('kb')).toBe(false)
  })
  it('非法参数抛错:id/name 非空、name≤50、id 字符集、fn 必须函数', () => {
    const t = createRegisterTable()
    expect(() => t.register({ id: '', name: 'x', fn: () => 'x' })).toThrow()
    expect(() => t.register({ id: 'x', name: '', fn: () => 'x' })).toThrow()
    expect(() => t.register({ id: 'x', name: '长'.repeat(51), fn: () => 'x' })).toThrow()
    expect(() => t.register({ id: '../etc', name: 'x', fn: () => 'x' })).toThrow()
    expect(() => t.register({ id: 'x', name: 'n', fn: 'not-fn' as never })).toThrow()
  })
})

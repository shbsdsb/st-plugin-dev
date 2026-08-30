// agent_plugin_dev/hot-reload-plugin/tests/diff.spec.ts
import { describe, expect, it } from 'vitest'
import { parseLockImporters, diffLock } from '../src/diff.ts'

const LOCK_TPL = (deps: Record<string, [string, string]>): string => {
  const lines = ['lockfileVersion: \'9.0\'', '', 'importers:', '', '  .:', '    dependencies:']
  for (const [name, [spec, ver]] of Object.entries(deps)) {
    lines.push(`      ${name}:`, `        specifier: ${spec}`, `        version: ${ver}`)
  }
  return lines.join('\n')
}

describe('parseLockImporters', () => {
  it('解析 importers 直接依赖', () => {
    const lock = LOCK_TPL({ 'web-module': ['file:../agent_plugin_dev/web-module', 'file:../agent_plugin_dev/web-module'] })
    const parsed = parseLockImporters(lock)
    expect(parsed['web-module']).toEqual({ specifier: 'file:../agent_plugin_dev/web-module', version: 'file:../agent_plugin_dev/web-module' })
  })
})

describe('diffLock', () => {
  it('version 变化 → 变更列表', () => {
    const oldLock = LOCK_TPL({ 'pkg-a': ['^1.0.0', '1.0.0'] })
    const newLock = LOCK_TPL({ 'pkg-a': ['^1.0.0', '1.1.0'] })
    expect(diffLock(oldLock, newLock).changed).toEqual(['pkg-a'])
  })

  it('新增/移除 → 变更列表', () => {
    const oldLock = LOCK_TPL({ 'pkg-a': ['^1.0.0', '1.0.0'] })
    const newLock = LOCK_TPL({ 'pkg-a': ['^1.0.0', '1.0.0'], 'pkg-b': ['^2.0.0', '2.0.0'] })
    expect(diffLock(oldLock, newLock).changed).toEqual(['pkg-b'])
    expect(diffLock(newLock, oldLock).changed).toEqual(['pkg-b'])
  })

  it('无变化 → 空列表', () => {
    const lock = LOCK_TPL({ 'pkg-a': ['^1.0.0', '1.0.0'] })
    expect(diffLock(lock, lock).changed).toEqual([])
  })

  it('specifier 变化 → 变更列表', () => {
    const oldLock = LOCK_TPL({ 'pkg-a': ['^1.0.0', '1.0.0'] })
    const newLock = LOCK_TPL({ 'pkg-a': ['^1.1.0', '1.1.0'] })
    expect(diffLock(oldLock, newLock).changed).toEqual(['pkg-a'])
  })
})

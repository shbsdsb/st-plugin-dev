import { describe, expect, it, afterEach, vi } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createWatcher } from '../src/watcher.ts'

const dirs: string[] = []
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })

describe('createWatcher', () => {
  it('lock 变化 → onChange;无变化 → 不触发', async () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'hr-watch-'))
    dirs.push(dir)
    const lockPath = join(dir, 'pnpm-lock.yaml')
    writeFileSync(lockPath, 'lockfileVersion: \'9.0\'\n')
    const onChange = vi.fn()
    const dispose = createWatcher({ lockPath, interval: 50, onChange })
    await new Promise((r) => setTimeout(r, 80))
    expect(onChange).not.toHaveBeenCalled()   // 初始哈希不触发
    writeFileSync(lockPath, 'lockfileVersion: \'9.0\'\nimporters: {}\n')
    await new Promise((r) => setTimeout(r, 80))
    expect(onChange).toHaveBeenCalledTimes(1)
    dispose()
  })
})

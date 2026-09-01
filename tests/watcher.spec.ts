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

  it('patch 变化 → onPatchChange;lock 变化 → onChange(互不干扰)', async () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'hr-watch-'))
    dirs.push(dir)
    const lockPath = join(dir, 'pnpm-lock.yaml')
    const patchPath = join(dir, 'cordis.patch.yml')
    writeFileSync(lockPath, 'lock: 1\n')
    writeFileSync(patchPath, '# comment\n')
    const onChange = vi.fn()
    const onPatchChange = vi.fn()
    const dispose = createWatcher({ lockPath, patchPaths: [patchPath], interval: 50, onChange, onPatchChange })
    await new Promise((r) => setTimeout(r, 80))
    expect(onChange).not.toHaveBeenCalled()
    expect(onPatchChange).not.toHaveBeenCalled()
    writeFileSync(patchPath, '- id: a\n  config:\n    port: 8080\n')
    await new Promise((r) => setTimeout(r, 80))
    expect(onPatchChange).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
    writeFileSync(lockPath, 'lock: 2\n')
    await new Promise((r) => setTimeout(r, 80))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onPatchChange).toHaveBeenCalledTimes(1)
    dispose()
  })

  it('patch 文件运行中首次创建 → onPatchChange(从无到有视为变化)', async () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'hr-watch-'))
    dirs.push(dir)
    const lockPath = join(dir, 'pnpm-lock.yaml')
    const patchPath = join(dir, 'cordis.patch.yml')
    writeFileSync(lockPath, 'lock: 1\n')
    // patch 文件初始化时不存在
    const onChange = vi.fn()
    const onPatchChange = vi.fn()
    const dispose = createWatcher({ lockPath, patchPaths: [patchPath], interval: 50, onChange, onPatchChange })
    await new Promise((r) => setTimeout(r, 80))
    expect(onPatchChange).not.toHaveBeenCalled()
    writeFileSync(patchPath, '- id: a\n')
    await new Promise((r) => setTimeout(r, 80))
    expect(onPatchChange).toHaveBeenCalledTimes(1)
    dispose()
  })
})

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

export interface WatcherOptions {
  lockPath: string
  /** 额外监听的 patch 文件(变化触发 onPatchChange) */
  patchPaths?: string[]
  interval?: number
  onChange: () => void
  /** patch 文件变化回调(可选) */
  onPatchChange?: () => void
}

/** 轮询监听:lock 变化 → onChange;任一 patch 变化 → onPatchChange;初次快照不触发;返回 dispose */
export function createWatcher(opts: WatcherOptions): () => void {
  const interval = opts.interval ?? 2000
  const hashOf = (path: string): string =>
    existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : ''
  const last = new Map<string, string>()
  const timer = setInterval(() => {
    if (existsSync(opts.lockPath)) {
      const lockHash = hashOf(opts.lockPath)
      if (!last.has(opts.lockPath)) {
        last.set(opts.lockPath, lockHash)
      } else if (lockHash !== last.get(opts.lockPath)) {
        last.set(opts.lockPath, lockHash)
        opts.onChange()
      }
    }
    for (const p of opts.patchPaths ?? []) {
      if (!existsSync(p)) continue
      const h = hashOf(p)
      if (!last.has(p)) {
        last.set(p, h)
      } else if (h !== last.get(p)) {
        last.set(p, h)
        opts.onPatchChange?.()
      }
    }
  }, interval)
  return () => clearInterval(timer)
}

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
  // 初始化快照:patchPaths 中已存在的文件记录初始 hash(首轮不触发);
  // 初始化时不存在的文件不记录——运行中出现(从无到有)视为变化触发
  for (const p of opts.patchPaths ?? []) {
    if (existsSync(p)) last.set(p, hashOf(p))
  }
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
        // 运行中首次出现(初始化时不存在):视为变化,触发
        last.set(p, h)
        opts.onPatchChange?.()
      } else if (h !== last.get(p)) {
        last.set(p, h)
        opts.onPatchChange?.()
      }
    }
  }, interval)
  return () => clearInterval(timer)
}

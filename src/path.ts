import { resolve, relative, isAbsolute } from 'node:path'

/** 路径解析工具:所有文件类服务(persistJson/env/db)共用 */
export class StoreError extends Error {
  constructor(message: string) { super(message); this.name = 'StoreError' }
}

const WINDOWS_DRIVE = /^[A-Za-z]:[\\/]/

/** 是否为「不允许」的绝对路径(Windows 盘符 / UNC / 前导 / 或 \) */
export function ensureRelative(p: string): boolean {
  if (typeof p !== 'string' || p.length === 0) return false
  return !WINDOWS_DRIVE.test(p) && !p.startsWith('\\\\') && !p.startsWith('/') && !p.startsWith('\\')
}

/**
 * 将相对路径安全拼接在 stHome 之下。
 * - 非法(空/非字符串/绝对路径/.. 越界/指向 stHome 自身)→ 抛 StoreError。
 * - stHome 缺失 → 抛 StoreError。
 */
export function resolvePersistPath(stHome: string, relativePath: string): string {
  if (typeof stHome !== 'string' || stHome.length === 0) {
    throw new StoreError('ST_HOME 未设置')
  }
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new StoreError('persist 只允许相对路径(非空字符串)')
  }
  if (!ensureRelative(relativePath)) {
    throw new StoreError(`persist 只允许相对路径,拒绝绝对路径: ${relativePath}`)
  }
  const resolved = resolve(stHome, relativePath)
  const rel = relative(stHome, resolved)
  if (rel === '' || rel === '..' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new StoreError(`路径越界,不允许越出 ST_HOME: ${relativePath}`)
  }
  return resolved
}

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { resolvePersistPath } from './path.ts'
import type { EnvStore } from './types.ts'

/** 解析 .env 格式文本:KEY=VALUE,忽略空行与 # 注释行 */
function parseEnv(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    out[key] = value
  }
  return out
}

/** 序列化为 KEY=VALUE 行文本 */
function stringifyEnv(entries: Record<string, string>): string {
  return Object.entries(entries).map(([k, v]) => `${k}=${v}`).join('\n') + '\n'
}

export function createEnvStore(stHome: string): EnvStore {
  return {
    async read(relativePath) {
      const p = resolvePersistPath(stHome, relativePath)
      let raw: string
      try {
        raw = await readFile(p, 'utf8')
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {}
        throw e
      }
      return parseEnv(raw)
    },
    async write(relativePath, entries) {
      const p = resolvePersistPath(stHome, relativePath)
      await mkdir(dirname(p), { recursive: true })
      await writeFile(p, stringifyEnv(entries), 'utf8')
    },
  }
}

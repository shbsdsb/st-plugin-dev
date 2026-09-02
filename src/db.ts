import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { resolvePersistPath } from './path.ts'
import type { DbStore } from './types.ts'

export function createDbStore(stHome: string): DbStore {
  return {
    async open(relativePath) {
      const p = resolvePersistPath(stHome, relativePath)
      await mkdir(dirname(p), { recursive: true })
      return new DatabaseSync(p)
    },
  }
}

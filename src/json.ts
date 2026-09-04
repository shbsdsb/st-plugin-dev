import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
import { resolvePersistPath } from './path.ts'
import type { JsonStore } from './types.ts'

export function createJsonStore(stHome: string): JsonStore {
  return {
    async read(relativePath) {
      const p = resolvePersistPath(stHome, relativePath)
      let raw: string
      try {
        raw = await readFile(p, 'utf8')
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw e
      }
      return JSON.parse(raw)
    },
    async write(relativePath, data) {
      const p = resolvePersistPath(stHome, relativePath)
      await mkdir(dirname(p), { recursive: true })
      await writeFile(p, JSON.stringify(data, null, 2), 'utf8')
    },
    async list(relativePath) {
      const p = resolvePersistPath(stHome, relativePath)
      try {
        const items = await readdir(p, { withFileTypes: true })
        return items.map((i) => i.name)
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []
        throw e
      }
    },
    async delete(relativePath) {
      const p = resolvePersistPath(stHome, relativePath)
      await rm(p, { recursive: true, force: true })
    },
  }
}

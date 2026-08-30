// agent_plugin_dev/hot-reload-plugin/src/diff.ts
/** lock importers 直接依赖:name → { specifier, version } */
export function parseLockImporters(lock: string): Record<string, { specifier: string; version: string }> {
  const result: Record<string, { specifier: string; version: string }> = {}
  const lines = lock.split(/\r?\n/)
  let inDeps = false
  let current: string | null = null
  for (const line of lines) {
    if (line === '    dependencies:') { inDeps = true; continue }
    if (inDeps && line.startsWith('  ') && !line.startsWith('    ')) { inDeps = false; continue }
    if (!inDeps) continue
    const depMatch = line.match(/^      ([A-Za-z0-9@._/-]+):\s*$/)
    if (depMatch) { current = depMatch[1]; result[current] = { specifier: '', version: '' }; continue }
    if (!current) continue
    const specMatch = line.match(/^        specifier: (.+)$/)
    if (specMatch) { result[current].specifier = specMatch[1]; continue }
    const verMatch = line.match(/^        version: (.+)$/)
    if (verMatch) { result[current].version = verMatch[1] }
  }
  return result
}

/** diff 新旧 lock 的 importers 直接依赖 → 变更插件名列表 */
export function diffLock(oldLock: string, newLock: string): { changed: string[] } {
  const oldDeps = parseLockImporters(oldLock)
  const newDeps = parseLockImporters(newLock)
  const allNames = new Set([...Object.keys(oldDeps), ...Object.keys(newDeps)])
  const changed: string[] = []
  for (const name of allNames) {
    const oldDep = oldDeps[name]
    const newDep = newDeps[name]
    if (!oldDep || !newDep || oldDep.specifier !== newDep.specifier || oldDep.version !== newDep.version) {
      changed.push(name)
    }
  }
  return { changed }
}

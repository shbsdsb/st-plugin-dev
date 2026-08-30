import { describe, expect, it, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { verifyEntry } from '../src/verify.ts'

const dirs: string[] = []
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })

function makeBundle(applyCode: string): { url: string } {
  const dir = mkdtempSync(resolve(tmpdir(), 'hr-verify-'))
  const file = join(dir, 'plugin.ts')
  writeFileSync(file, `import { Context } from 'cordis'\nexport const name = 'v'\nexport function apply(ctx: Context) { ${applyCode} }\nexport default apply`)
  dirs.push(dir)
  return { url: pathToFileURL(file).href }
}

describe('verifyEntry', () => {
  it('正常 bundle apply → resolve', async () => {
    const { url } = makeBundle('ctx.logger.info("ok")')
    await expect(verifyEntry({ id: 'v', name: url })).resolves.toBeUndefined()
  }, 15000)

  it('apply 抛错 → reject', async () => {
    const { url } = makeBundle('throw new Error("boom")')
    await expect(verifyEntry({ id: 'v', name: url })).rejects.toThrow('boom')
  }, 15000)
})

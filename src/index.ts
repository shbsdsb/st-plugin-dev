import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Context } from 'cordis'
import { diffLock } from './diff.ts'
import { reload } from './reload.ts'
import { createWatcher } from './watcher.ts'

declare module 'cordis' {
  interface Context {
    /** bootstrap 提供的插件树构建服务(loader 为 cordis-loader 真实类型,不覆盖) */
    treeBuilder: { build(opts: { stHome: string; profile?: string }): Promise<unknown[]> }
  }
}

// 显式「无配置」schema(cordis Standard Schema v1):validate 透传输入,undefined → {}
const EmptyConfigSchema = {
  '~standard': {
    version: 1,
    vendor: 'hot-reload-plugin',
    validate: (value: unknown) => ({ value: value ?? {} }),
  },
}

export const name = 'hot-reload-plugin'

export function apply(ctx: Context) {
  if (process.env.ST_HOT_RELOAD === '0') return
  const stHome = process.env.ST_HOME
  if (!stHome) return
  const lockPath = join(stHome, 'pnpm-lock.yaml')
  if (!existsSync(lockPath)) return
  const interval = Number(process.env.ST_HOT_RELOAD_INTERVAL ?? 2000)
  let oldLock = readFileSync(lockPath, 'utf8')

  const disposeWatcher = createWatcher({
    lockPath,
    interval,
    onChange: () => {
      const newLock = readFileSync(lockPath, 'utf8')
      const { changed } = diffLock(oldLock, newLock)
      void reload(ctx as never, changed).then(() => {
        oldLock = newLock
      })
    },
  })

  ctx.effect(() => () => disposeWatcher())
}

apply.inject = ['treeBuilder', 'loader']
apply.Config = EmptyConfigSchema

export default apply

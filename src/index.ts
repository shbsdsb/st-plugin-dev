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
  const profile = process.env.ST_PROFILE ?? 'default'
  const patchPaths = [
    join(stHome, 'profile', profile, 'cordis.patch.yml'),
    join(stHome, 'cordis.patch.yml'),
  ].filter((p) => existsSync(p))

  const disposeWatcher = createWatcher({
    lockPath,
    patchPaths,
    interval,
    onChange: () => {
      const newLock = readFileSync(lockPath, 'utf8')
      const { changed } = diffLock(oldLock, newLock)
      void reload(ctx as never, changed).then(() => {
        oldLock = newLock
      })
    },
    onPatchChange: () => {
      // 配置变更不涉及代码:直接重建树(跳过隔离验证);失败保持旧树
      void (async () => {
        const stHome2 = process.env.ST_HOME ?? ''
        const profile2 = process.env.ST_PROFILE ?? 'default'
        try {
          const entries = await ctx.treeBuilder.build({ stHome: stHome2, profile: profile2 })
          await ctx.loader.root.update(entries as never)
          ctx.logger.info('[hot-reload] 配置变更已生效(cordis.patch.yml)')
        } catch (error) {
          ctx.logger.warn(`[hot-reload] 配置重载失败,保持旧插件: ${(error as Error).message}`)
        }
      })()
    },
  })

  ctx.effect(() => () => disposeWatcher())
}

apply.inject = ['treeBuilder', 'loader']
apply.Config = EmptyConfigSchema

export default apply

import { Context } from 'cordis'
import { createJsonStore } from './json.ts'
import { createEnvStore } from './env.ts'
import { createDbStore } from './db.ts'
import { createCredentialStore } from './credential.ts'

// 与 host-plugin/client-find 同款类型合并:为 cordis Context 注入服务类型
declare module 'cordis' {
  interface Context {
    persistJson: import('./types.ts').JsonStore
    persistEnv: import('./types.ts').EnvStore
    persistDb: import('./types.ts').DbStore
    credential: import('./types.ts').CredentialStore
  }
}

export const name = 'persist'

// 显式「无配置」schema(cordis Standard Schema v1)
const EmptyConfigSchema = {
  '~standard': {
    version: 1,
    vendor: 'persist',
    validate: (value: unknown) => ({ value: value ?? {} }),
  },
}

export function apply(ctx: Context, _config: Record<string, unknown>) {
  const stHome = process.env.ST_HOME ?? ''
  ctx.provide('persistJson', createJsonStore(stHome))
  ctx.provide('persistEnv', createEnvStore(stHome))
  ctx.provide('persistDb', createDbStore(stHome))
  // 凭据不依赖 stHome(走 OS 凭据管理器)
  ctx.provide('credential', createCredentialStore())
}

apply.provide = ['persistJson', 'persistEnv', 'persistDb', 'credential']
apply.Config = EmptyConfigSchema

export default apply

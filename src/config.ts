// agent_plugin_dev/host-plugin/src/config.ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as yaml from 'js-yaml'
import type { StandardSchemaV1 } from '@standard-schema/spec'

export interface HostConfig {
  host: string
  port: number
  listen: boolean
  listenWhitelist: string[]
  open: boolean
}

export const DEFAULT_CONFIG: HostConfig = {
  host: '127.0.0.1', port: 3000, listen: false, listenWhitelist: [], open: true,
}

/** listen/listenWhitelist 语义 → 监听地址 */
export function resolveListenTarget(cfg: HostConfig): string {
  if (!cfg.listen) return cfg.host
  if (cfg.listenWhitelist.length > 0) return cfg.listenWhitelist[0]
  return '0.0.0.0'
}

/** 原始值合并默认(供 cli 层轻量读取与 schema 共用;单源 DEFAULT_CONFIG) */
export function normalizeConfig(raw: Record<string, unknown> | undefined): HostConfig {
  const cfg: HostConfig = { ...DEFAULT_CONFIG }
  if (!raw) return cfg
  if (typeof raw.host === 'string') cfg.host = raw.host
  if (typeof raw.port === 'number' && Number.isInteger(raw.port) && raw.port >= 1 && raw.port <= 65535) cfg.port = raw.port
  if (typeof raw.listen === 'boolean') cfg.listen = raw.listen
  if (Array.isArray(raw.listenWhitelist) && raw.listenWhitelist.every((x) => typeof x === 'string')) cfg.listenWhitelist = raw.listenWhitelist
  if (typeof raw.open === 'boolean') cfg.open = raw.open
  return cfg
}

/** cordis Config schema:loader 校验 + 默认值(经覆盖层 patch 传入 config) */
export const HostConfigSchema = {
  '~standard': {
    version: 1,
    vendor: 'host-plugin',
    validate(value: unknown) {
      const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
      return { value: normalizeConfig(raw) }
    },
  },
} satisfies StandardSchemaV1<Record<string, unknown>, HostConfig>

/** cli 层轻量读取:读覆盖层 patch 的 id=host config 原始值(不重复 schema 校验) */
export function readHostPatchConfig(stHome: string, profile = 'default'): Record<string, unknown> {
  // 从 profile patch 与 user patch 中提取 id=host 的 config(profile → user 合并)
  const merged: Record<string, unknown> = {}
  for (const patchPath of [
    join(stHome, 'profile', profile, 'cordis.patch.yml'),
    join(stHome, 'cordis.patch.yml'),
  ]) {
    if (!existsSync(patchPath)) continue
    try {
      const entries = (yaml.load(readFileSync(patchPath, 'utf8'), { schema: yaml.JSON_SCHEMA }) ?? []) as unknown[]
      const entry = entries.find((e): e is Record<string, unknown> =>
        typeof e === 'object' && e !== null && (e as Record<string, unknown>).id === 'host')
      const config = entry?.config
      if (typeof config === 'object' && config !== null) Object.assign(merged, config as Record<string, unknown>)
    } catch {
      // 解析失败忽略(与 cli 容错一致)
    }
  }
  return merged
}

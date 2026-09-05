import { Context } from 'cordis'
import path from 'node:path'
import { normalizeConfig } from './config.ts'
import { makeTime, renderLine } from './format.ts'
import { createObserver } from './observer.ts'
import { createWriter, type LineWriter } from './writer.ts'
import type { ObservedActivity } from './types.ts'

export const name = 'logger-plugin'

const ConfigSchema = {
  '~standard': {
    version: 1,
    vendor: 'logger-plugin',
    validate: (value: unknown) => ({ value: normalizeConfig(value) }),
  },
}

function resolveStHome(): string | null {
  return process.env.ST_HOME ?? null
}

export function apply(ctx: Context, rawConfig: unknown) {
  const config = normalizeConfig(rawConfig)
  ctx.effect(() => {
    let disposeObserver: (() => void) | null = null
    const stHome = resolveStHome()
    if (config.file && !stHome) {
      ctx.logger.warn('[logger-plugin] 未设置 ST_HOME,降级为仅终端输出')
    }
    const writer: LineWriter = createWriter({
      dir: stHome ? path.join(stHome, 'data', 'logger') : '',
      stdout: true,
      file: config.file && !!stHome,   // 无 ST_HOME → 仅终端
      onError: (msg) => ctx.logger.error(`[logger-plugin] ${msg}`),
    })
    const sink = (a: ObservedActivity) => {
      const line = renderLine({
        time: makeTime(a.date, config.timeFormat),
        kind: a.kind,
        plugin: a.plugin,
        detail: a.detail,
      })
      writer?.write(line)
    }
    disposeObserver = createObserver(ctx as never, {
      config: { lifecycle: config.lifecycle, service: config.service, events: config.events },
      sink,
    })
    return () => {
      disposeObserver?.()
      disposeObserver = null
      writer?.close()
    }
  })
}

apply.inject = [] as string[]
apply.provide = [] as string[]
apply.Config = ConfigSchema

export default apply

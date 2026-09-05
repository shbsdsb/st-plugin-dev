export type TimeFormat = 'HH:mm:ss' | 'HH:mm:ss.SSS'

export interface LoggerConfig {
  lifecycle?: boolean   // load/unload/status
  service?: boolean     // provide
  events?: boolean      // emit/on
  file?: boolean        // false = 仅终端
  timeFormat?: TimeFormat
}

export interface ResolvedConfig {
  lifecycle: boolean
  service: boolean
  events: boolean
  file: boolean
  timeFormat: TimeFormat
}

export function normalizeConfig(config: unknown): ResolvedConfig {
  const c = (config && typeof config === 'object' ? config : {}) as LoggerConfig
  const timeFormat: TimeFormat = c.timeFormat === 'HH:mm:ss' ? 'HH:mm:ss' : 'HH:mm:ss.SSS'
  return {
    lifecycle: c.lifecycle !== false,
    service: c.service !== false,
    events: c.events !== false,
    file: c.file !== false,
    timeFormat,
  }
}

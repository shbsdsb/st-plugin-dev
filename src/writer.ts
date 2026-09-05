import { mkdirSync, openSync, closeSync, writeSync, type OpenMode } from 'node:fs'
import path from 'node:path'

export interface LineWriter {
  write(line: string): void
  close(): void
}

export interface WriterOptions {
  dir: string
  stdout?: boolean        // 默认 true
  file?: boolean          // 默认 true;false = 仅终端不落盘
  now?: () => Date
  onError?: (msg: string) => void
}

function dayKey(d: Date): string {
  const p = (n: number) => (n < 10 ? '0' + n : String(n))
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function createWriter(opts: WriterOptions): LineWriter {
  const { dir, onError } = opts
  const stdout = opts.stdout !== false
  const file = opts.file !== false
  const now = opts.now ?? (() => new Date())
  let fd: number | null = null
  let currentDay = ''
  let lastErrorAt = 0

  const report = (msg: string) => {
    const t = Date.now()
    if (t - lastErrorAt < 60_000) return   // 同类错误 1 次/分钟
    lastErrorAt = t
    try { onError?.(msg) } catch { /* ignore */ }
  }

  function closeFd(): void {
    if (fd !== null) {
      try { closeSync(fd) } catch { /* ignore */ }
      fd = null
    }
  }

  function rotate(day: string): void {
    if (currentDay === day && fd !== null) return
    closeFd()
    currentDay = day
    try {
      mkdirSync(dir, { recursive: true })
      fd = openSync(path.join(dir, `activity-${day}.log`), 'a' as OpenMode)
    } catch (e) {
      report(`文件输出不可用(降级仅终端): ${e instanceof Error ? e.message : String(e)}`)
      fd = null
    }
  }

  return {
    write(line: string) {
      if (stdout) {
        try { process.stdout.write(line + '\n') } catch { /* stdout 失败不处理 */ }
      }
      if (!file) return
      const day = dayKey(now())
      rotate(day)
      if (fd === null) return
      try {
        writeSync(fd, line + '\n')
      } catch (e) {
        report(`写入失败: ${e instanceof Error ? e.message : String(e)}`)
        closeFd()   // 降级仅终端;下次 write 会尝试重建
      }
    },
    close() {
      closeFd()
    },
  }
}

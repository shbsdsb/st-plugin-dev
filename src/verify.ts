import { Context } from 'cordis'
import type { EntryOptions } from '@cordisjs/plugin-loader'

/**
 * 隔离验证新 bundle:import 入口 + 在独立 Context 树 apply。
 * apply 抛错 → reject;成功 → dispose 验证树后 resolve。
 * 注:inject 依赖未满足时 cordis 为等待(fiber pending),MVP 仅验证 apply 立即抛错类失败。
 *
 * 偏差说明:销毁用 `ctx.fiber.dispose()` 而非简报草案的 `ctx.dispose()`——
 * 本 vendor 的 cordis 4.0.0-rc.8 中 Context 类没有 dispose 方法
 * (见 vendor/cordis/src/context.ts 与官方同版本 unpkg 产物),root context
 * 的销毁由 root fiber 的 dispose 承担(cordis 官方测试 plugin.spec.ts 的
 * 'root dispose' 用例即用 root.fiber.dispose());ctx.dispose() 会因
 * `cannot get property "dispose" without inject` 路径返回 undefined 并抛 TypeError。
 */
export async function verifyEntry(entry: EntryOptions): Promise<void> {
  // 同 URL 二次 import 会命中 Node ESM 缓存而验到旧代码:import 前给 URL 追加 cache-busting 参数
  let target: string
  try {
    const url = new URL(entry.name)
    url.searchParams.set('t', String(Date.now()))
    target = url.href
  } catch {
    // entry.name 非 URL(如相对路径),直接 import
    target = entry.name
  }
  const mod = await import(target)
  const plugin = mod.default ?? mod
  if (typeof plugin !== 'function' && typeof plugin?.apply !== 'function') {
    throw new Error(`入口无效(无 apply): ${entry.name}`)
  }
  const ctx = new Context()
  try {
    await ctx.plugin(plugin, entry.config)
  } finally {
    await ctx.fiber.dispose()
  }
}

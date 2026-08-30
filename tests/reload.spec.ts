import { describe, expect, it, vi } from 'vitest'
import { reload } from '../src/reload.ts'

describe('reload', () => {
  it('构建失败 → 保持旧树(不 update,不抛)', async () => {
    const ctx = {
      logger: { warn: vi.fn(), info: vi.fn() },
      treeBuilder: { build: vi.fn().mockRejectedValue(new Error('build fail')) },
      loader: { root: { update: vi.fn() } },
    }
    await expect(reload(ctx as never, ['pkg-a'])).resolves.toBeUndefined()
    expect(ctx.loader.root.update).not.toHaveBeenCalled()
    expect(ctx.logger.warn).toHaveBeenCalled()
  })

  it('验证失败 → 保持旧插件(不 update)', async () => {
    const ctx = {
      logger: { warn: vi.fn(), info: vi.fn() },
      treeBuilder: { build: vi.fn().mockResolvedValue([{ id: 'pkg-a', name: 'file:///x' }]) },
      loader: { root: { update: vi.fn() } },
    }
    await expect(reload(ctx as never, ['pkg-a'])).resolves.toBeUndefined()
    expect(ctx.loader.root.update).not.toHaveBeenCalled()
  })

  it('全部验证通过 → loader.root.update + info 日志', async () => {
    const ctx = {
      logger: { warn: vi.fn(), info: vi.fn() },
      treeBuilder: { build: vi.fn().mockResolvedValue([{ id: 'pkg-a', name: 'file:///x' }]) },
      loader: { root: { update: vi.fn().mockResolvedValue(undefined) } },
    }
    await expect(reload(ctx as never, ['pkg-b'])).resolves.toBeUndefined()
    expect(ctx.loader.root.update).toHaveBeenCalled()
  })
})

import { describe, expect, it } from 'vitest'
import type { execFileSync } from 'node:child_process'
import { createCredentialStore } from '../src/credential.ts'

describe('credential', () => {
  it('非 Windows(注入 linux)调用抛 StoreError', async () => {
    const store = createCredentialStore({ platform: 'linux' })
    await expect(store.set('t', 's')).rejects.toThrow()
    await expect(store.get('t')).rejects.toThrow()
    await expect(store.delete('t')).rejects.toThrow()
  })

  it('Windows 下用注入 execFileSync 验证脚本构造与解析', async () => {
    const scripts: string[] = []
    const fakeRun = ((_file: string, args: string[], _opts: unknown): string => {
      const script = args.join(' ')
      scripts.push(script)
      // 模拟 PasswordVault.Retrieve 返回 MARK+secret
      return script.includes('Retrieve') ? '@@CRED@@topsecret\n' : ''
    }) as unknown as typeof execFileSync

    const store = createCredentialStore({ platform: 'win32', execFileSync: fakeRun })
    await store.set('myapp', 'topsecret')
    expect(await store.get('myapp')).toBe('topsecret')
    await store.delete('myapp')

    expect(scripts.some((s) => s.includes('PasswordVault'))).toBe(true)
    expect(scripts.some((s) => s.includes('Retrieve'))).toBe(true)
    expect(scripts.every((s) => !s.includes('topsecret') || s.includes('PasswordCredential'))).toBe(true)
  })

  it('空 name 抛 StoreError', async () => {
    const store = createCredentialStore({ platform: 'win32' })
    await expect(store.set('', 's')).rejects.toThrow()
    await expect(store.get('')).rejects.toThrow()
  })
})

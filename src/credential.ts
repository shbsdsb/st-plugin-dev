import { execFileSync } from 'node:child_process'
import { StoreError } from './path.ts'
import type { CredentialStore } from './types.ts'

export interface CredentialOptions {
  platform?: NodeJS.Platform
  execFileSync?: typeof execFileSync
}

const MARK = '@@CRED@@'

function escapePs(s: string): string {
  return s.replace(/'/g, "''")
}

/**
 * Windows 凭据管理器服务(仅 win32)。经 PowerShell 通过
 * Windows.Security.Credentials.PasswordVault 读写任意 target(可读回明文)。
 * 非 win32 / PowerShell 不可用 → 调用抛 StoreError。
 */
export function createCredentialStore(opts: CredentialOptions = {}): CredentialStore {
  const platform = opts.platform ?? process.platform
  const run = opts.execFileSync ?? execFileSync

  function requireWindows(): void {
    if (platform !== 'win32') {
      throw new StoreError('credential 仅在 Windows 可用(依赖 Windows.Security.Credentials.PasswordVault)')
    }
  }

  function ps(script: string): string {
    requireWindows()
    return run('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8' })
  }

  function validateName(name: string): void {
    if (typeof name !== 'string' || name.length === 0) {
      throw new StoreError('credential name 不能为空')
    }
  }

  async function set(name: string, secret: string): Promise<void> {
    validateName(name)
    // 先删同 target 避免重复 Add 报错
    ps(
      `$v=[Windows.Security.Credentials.PasswordVault,Windows.Security.Credentials,ContentType=WindowsRuntime]::new();` +
      `try{$c=$v.Retrieve('${escapePs(name)}','default');$v.Remove($c)}catch{};` +
      `$c2=New-Object Windows.Security.Credentials.PasswordCredential '${escapePs(name)}','default','${escapePs(secret)}';` +
      `$v.Add($c2)`,
    )
  }

  async function get(name: string): Promise<string | null> {
    validateName(name)
    const out = ps(
      `$v=[Windows.Security.Credentials.PasswordVault,Windows.Security.Credentials,ContentType=WindowsRuntime]::new();` +
      `try{$c=$v.Retrieve('${escapePs(name)}','default');Write-Output ('${MARK}'+$c.Password)}catch{Write-Output '${MARK}NULL'}`,
    )
    const m = out.match(new RegExp(`${MARK}(.*)`))
    if (!m) return null
    const val = m[1].trim()
    return val === 'NULL' || val === '' ? null : val
  }

  async function remove(name: string): Promise<void> {
    validateName(name)
    ps(
      `$v=[Windows.Security.Credentials.PasswordVault,Windows.Security.Credentials,ContentType=WindowsRuntime]::new();` +
      `try{$c=$v.Retrieve('${escapePs(name)}','default');$v.Remove($c)}catch{}`,
    )
  }

  return { set, get, delete: remove }
}

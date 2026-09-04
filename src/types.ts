export interface JsonStore {
  read(relativePath: string): Promise<unknown>
  write(relativePath: string, data: unknown): Promise<void>
  /** 列出目录下的项名(文件与子目录);目录不存在返回 [] */
  list(relativePath: string): Promise<string[]>
  /** 删除文件或目录(递归);不存在时静默成功 */
  delete(relativePath: string): Promise<void>
}

export interface EnvStore {
  read(relativePath: string): Promise<Record<string, string>>
  write(relativePath: string, entries: Record<string, string>): Promise<void>
}

export interface DbStore {
  open(relativePath: string): Promise<import('node:sqlite').DatabaseSync>
}

export interface CredentialStore {
  set(name: string, secret: string): Promise<void>
  get(name: string): Promise<string | null>
  delete(name: string): Promise<void>
}

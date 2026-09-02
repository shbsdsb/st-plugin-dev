export interface JsonStore {
  read(relativePath: string): Promise<unknown>
  write(relativePath: string, data: unknown): Promise<void>
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

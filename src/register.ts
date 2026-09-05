// agent_plugin_dev/prompt-plugin/src/register.ts —— 进程内动态注入注册表
export interface RegisteredInjection { id: string; name: string }
export type InjectionFn = () => string | Promise<string>

export interface PromptRegisterService {
  /** 注册注入;重复 id 幂等覆盖。返回 disposer:注销本次注册(仅当仍是当前注册时删除)。 */
  register(opts: { id: string; name: string; fn: InjectionFn }): () => void
  list(): RegisteredInjection[]
  has(id: string): boolean
  get(id: string): (RegisteredInjection & { fn: InjectionFn }) | undefined
}

const MAX_NAME = 50
/** id 用作条目 JSON 文件名(e-<id>.json),字符集受限防路径穿越 */
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export function createRegisterTable(): PromptRegisterService {
  const map = new Map<string, { name: string; fn: InjectionFn }>()
  return {
    register({ id, name, fn }) {
      const cleanId = typeof id === 'string' ? id : ''
      const cleanName = typeof name === 'string' ? name.trim() : ''
      if (!cleanId || !ID_RE.test(cleanId)) throw new Error('注册 id 非法:需为非空且仅含字母/数字/._- ,不能以 . 开头')
      if (!cleanName) throw new Error('注册名称不能为空')
      if (cleanName.length > MAX_NAME) throw new Error(`注册名称最长 ${MAX_NAME} 字符`)
      if (typeof fn !== 'function') throw new Error('fn 必须是函数')
      map.set(cleanId, { name: cleanName, fn })
      let disposed = false
      return () => {
        if (disposed) return
        disposed = true
        // 幂等覆盖后,旧 disposer 不得误删新注册(引用比较)
        if (map.get(cleanId)?.fn === fn) map.delete(cleanId)
      }
    },
    list() {
      return [...map.entries()].map(([id, v]) => ({ id, name: v.name }))
    },
    has(id) { return map.has(id) },
    get(id) {
      const v = map.get(id)
      return v ? { id, name: v.name, fn: v.fn } : undefined
    },
  }
}

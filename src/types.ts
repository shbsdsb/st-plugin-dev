// agent_plugin_dev/web-module/src/types.ts
export type ModuleName = 'react' | 'react-dom/client' | 'cordis'

/** webModule service:其他插件通过 inject: ['webModule'] 表达依赖,获得 cordis 加载顺序保证 */
export interface WebModuleService {
  version: '0.1.0'
  /** module table 清单 = importmap 完整键列表 */
  modules: string[]
  /** 完整模块表(模块名 → 浏览器 URL 路径) */
  importmap: Record<string, string>
  /** 解析单个模块 → URL;未注册返回 undefined */
  resolveModule(name: string): string | undefined
}

/** clientBoot 启动清单条目(client find 插件提供) */
export interface ClientBootEntry {
  id: string
  url: string
  inject: string[]
  immed: boolean
}

declare module 'cordis' {
  interface Context {
    /** client find 插件提供的启动清单(必需依赖,缺失则 web-module 启动失败) */
    clientBoot: { boot: ClientBootEntry[] }
  }
}

// agent_plugin_dev/client-find/src/types.ts
/** 插件 package.json 的 st.client 声明(前端插件声明) */
export interface StClient {
  /** 固定 'web':声明这是前端插件 */
  kind?: string
  /** 前端文件入口路径(相对包根,如 lib/index.cjs) */
  path?: string
  /** 依赖(plugin name,非 cordis inject);string[] */
  inject?: string[]
  /** 预加载:true = 启动优先物化 */
  immed?: boolean
  /** 外部化声明(构建侧,暂不参与清单生成) */
  external?: string[]
}

/** 启动清单条目(结构同 web-module 的 ClientBootEntry;独立定义避免跨包依赖) */
export interface ClientBootEntry {
  id: string
  url: string
  inject: string[]
  immed: boolean
}

export type ActivityKind = 'load' | 'unload' | 'status' | 'service' | 'emit' | 'on'

/** observer 产出的归一动作(尚未渲染为行) */
export interface ObservedActivity {
  date: Date
  kind: ActivityKind
  /** 插件名;service/emit/on 无可靠归属时记 'core' */
  plugin: string
  detail: string
}

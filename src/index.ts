// st-ui-slots 后端入口(空插件:仅声明 bundle + config schema;布局在前端 web.tsx)
import { Context } from 'cordis'

export const name = 'st-ui-slots'

export interface SlotsConfig {
  /** 收敛侧栏时是否显示 40px 窄条;默认 true,桌面+移动通用 */
  showCollapsedRail?: boolean
}

export const configSchema = {
  '~standard': {
    version: 1,
    vendor: 'st-ui-slots',
    validate: (value: unknown) => ({ value: value ?? { showCollapsedRail: true } }),
  },
}

export function apply(_ctx: Context, _config: SlotsConfig) {
  // 无后端逻辑;前端布局经 st.client 声明由 web-module 加载
}

apply.Config = configSchema

export default apply

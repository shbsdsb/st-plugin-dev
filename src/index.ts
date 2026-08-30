// st-ui-slots 后端入口(空插件:仅声明 bundle 供加载;布局在前端 web.tsx)
import { Context } from 'cordis'

export const name = 'st-ui-slots'

export function apply(_ctx: Context) {
  // 无后端逻辑;前端布局经 st.client 声明由 web-module 加载
}

export default apply

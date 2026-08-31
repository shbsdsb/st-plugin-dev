// st-ui-beautify 后端入口(空插件:仅声明 bundle 供加载;主题注入在前端 web.tsx)
import { Context } from 'cordis'

export const name = 'st-ui-beautify'

export function apply(_ctx: Context) {
  // 无后端逻辑;前端主题经 st.client 声明由 web-module 加载
}

export default apply

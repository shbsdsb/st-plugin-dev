// agent_plugin_dev/st-ui-beautify/src/web.tsx
// WebPlugin:注入白色玻璃拟态主题样式 + 背景光球;unmount 全部移除(幂等)。
// 无配置覆盖点:参数用内置默认(DEFAULT_THEME);mount 时自检测宿主
// (st-ui-slots 公共接口 __uiSlots__ 或已渲染的 data-slot 容器),宿主缺失仅告警不阻塞。
import { buildThemeCss, DEFAULT_THEME, normalizeOrbCount } from './theme.ts'

const STYLE_ID = 'st-beautify-theme'

function removeInjected(): void {
  document.getElementById(STYLE_ID)?.remove()
  document.querySelectorAll('.st-beautify-orb').forEach((el) => el.remove())
}

/** 自检测宿主是否就绪:st-ui-slots 公共接口(__uiSlots__)或已渲染的 data-slot 插槽容器 */
function detectHost(): boolean {
  const uiSlots = (window as unknown as { __uiSlots__?: unknown }).__uiSlots__
  if (uiSlots !== undefined) return true
  return document.querySelectorAll('[data-slot]').length > 0
}

export default {
  name: 'st-ui-beautify',
  mount(_el: HTMLElement) {
    try {
      // 幂等:先清旧注入
      removeInjected()
      const opts = DEFAULT_THEME
      if (!detectHost()) {
        console.warn('[st-ui-beautify] 未检测到 st-ui-slots 宿主插槽,插槽主题不可见(背景主题仍注入)')
      }
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = buildThemeCss(opts)
      document.head.appendChild(style)
      for (let i = 0; i < normalizeOrbCount(opts.orbCount); i++) {
        const orb = document.createElement('div')
        orb.className = 'st-beautify-orb'
        orb.setAttribute('data-index', String(i))
        document.body.appendChild(orb)
      }
    } catch (e) {
      console.error('[st-ui-beautify] mount failed:', e)
    }
  },
  unmount() {
    removeInjected()
  },
}

// agent_plugin_dev/ui-tool-plugin/src/theme-engine.ts
// 主题引擎:小 API(get/set/reset 参数微调)+ 大 API(install 全量 css/html/js 替换)。
// install 的 css 为全局样式,作用在 st-ui-slots 布局之上(自由定义前端样式,像正常网站)。
import { buildThemeCss, DEFAULT_THEME, normalizeOrbCount, type ThemeOptions } from './theme.ts'

const STYLE_ID = 'ui-tool-plugin-theme'
const INSTALL_STYLE_ID = 'ui-tool-plugin-install'
const INSTALL_HTML_ID = 'ui-tool-plugin-install-html'
const INSTALL_JS_ID = 'ui-tool-plugin-install-js'
const ORB_CLS = 'ui-tool-plugin-orb'

export interface ThemeEngine {
  get(): ThemeOptions
  set(patch: Partial<ThemeOptions>): void
  reset(): void
  install(opts: { css: string; html?: string; js?: string }): void
}

function removeThemeInjected(): void {
  document.getElementById(STYLE_ID)?.remove()
  document.querySelectorAll('.' + ORB_CLS).forEach((el) => (el as HTMLElement).remove())
}

function applyTheme(opts: ThemeOptions): void {
  removeThemeInjected()
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = buildThemeCss(opts)
  document.head.appendChild(style)
  for (let i = 0; i < normalizeOrbCount(opts.orbCount); i++) {
    const orb = document.createElement('div')
    orb.className = ORB_CLS
    orb.style.cssText = 'position:fixed;border-radius:50%;filter:blur(100px);pointer-events:none;z-index:0;'
    document.body.appendChild(orb)
  }
}

/** 卸载 install 的 css/html/script 残留 */
function removeInstalled(): void {
  document.getElementById(INSTALL_STYLE_ID)?.remove()
  document.getElementById(INSTALL_HTML_ID)?.remove()
  document.getElementById(INSTALL_JS_ID)?.remove()
}

export function createThemeEngine(): ThemeEngine {
  let current: ThemeOptions = { ...DEFAULT_THEME }

  return {
    get() { return { ...current } },
    set(patch) {
      current = { ...current, ...patch }
      applyTheme(current)
    },
    reset() {
      current = { ...DEFAULT_THEME }
      removeInstalled()
      applyTheme(current)
    },
    install({ css, html, js }) {
      removeInstalled()
      // 移除内置玻璃主题,由插件 css 全权接管视觉
      removeThemeInjected()
      const style = document.createElement('style')
      style.id = INSTALL_STYLE_ID
      style.textContent = css
      document.head.appendChild(style)
      if (html) {
        const host = document.createElement('div')
        host.id = INSTALL_HTML_ID
        host.innerHTML = html
        document.body.appendChild(host)
      }
      if (js) {
        const sc = document.createElement('script')
        sc.id = INSTALL_JS_ID
        sc.textContent = js
        document.body.appendChild(sc)
      }
    },
  }
}

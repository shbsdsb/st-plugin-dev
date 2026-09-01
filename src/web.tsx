// agent_plugin_dev/ui-tool-plugin/src/web.tsx
// WebPlugin:挂载 window.__uiTools__(13 种玻璃拟态工具 + theme 主题引擎);
// mount 经 theme-engine 注入内置白色玻璃主题;unmount 清场(关闭浮层 + 卸载主题 + 删除 API)。
import { createTools, closeAllTools, removeToolsStyle, type Tools } from './tools.ts'
import { createThemeEngine, type ThemeEngine } from './theme-engine.ts'

export interface UiTools extends Tools {
  theme: ThemeEngine
}

/** 自检测宿主:st-ui-slots 公共接口(__uiSlots__)或已渲染的 data-slot 容器 */
function detectHost(): boolean {
  const uiSlots = (window as unknown as { __uiSlots__?: unknown }).__uiSlots__
  if (uiSlots !== undefined) return true
  return document.querySelectorAll('[data-slot]').length > 0
}

export default {
  name: 'ui-tool-plugin',
  mount(_el: HTMLElement) {
    try {
      // 主题引擎构造即注入默认白色玻璃主题(背景 + 插槽美化 + 光球)
      const theme = createThemeEngine()
      if (!detectHost()) {
        console.warn('[ui-tool-plugin] 未检测到 st-ui-slots 宿主插槽,插槽主题不可见(背景主题仍注入)')
      }
      // 挂载全局工具库(13 工具 + theme)
      ;(window as unknown as { __uiTools__?: UiTools }).__uiTools__ = {
        ...createTools(),
        theme,
      }
    } catch (e) {
      console.error('[ui-tool-plugin] mount failed:', e)
    }
  },
  unmount() {
    // 关闭全部活动浮层 + 清理定时器 + 移除工具基础样式
    closeAllTools()
    removeToolsStyle()
    // 卸载主题(内置 + install 残留)
    const ui = (window as unknown as { __uiTools__?: UiTools }).__uiTools__
    ui?.theme.destroy()
    delete (window as unknown as { __uiTools__?: UiTools }).__uiTools__
  },
}

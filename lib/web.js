// agent_plugin_dev/ui-tool-plugin/src/web.tsx
// WebPlugin:挂载 window.__uiTools__(13 种悬浮工具)。
// 主题职责已移交 ui-polish(ui-polish 注入 UI-token 默认层 + 默认美化;本插件只做纯工具库)。
// mount 挂载工具库;unmount 清场(关闭浮层 + 移除工具样式 + 删除 API)。
import { createTools, closeAllTools, removeToolsStyle } from "./tools.js";
export default {
    name: 'ui-tool-plugin',
    mount(_el) {
        try {
            ;
            window.__uiTools__ = createTools();
        }
        catch (e) {
            console.error('[ui-tool-plugin] mount failed:', e);
        }
    },
    unmount() {
        closeAllTools();
        removeToolsStyle();
        delete window.__uiTools__;
    },
};

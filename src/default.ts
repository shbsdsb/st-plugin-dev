// agent_plugin_dev/ui-polish/src/default.ts
// 默认主题美化规则(继承 ui-tool-plugin theme.ts 观感,颜色全部 token 引用)。
// 注入 style#ui-polish-default;用户 css 注入在其后,可整规则覆盖。
// !important 用于覆盖 st-ui-slots 布局的 inline style(与原 ui-tool 一致)。

export function buildDefaultCss(): string {
  return `/* ui-polish default theme(基于 UI-token) */
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--ui-bg);
  color: var(--ui-text);
}
/* ===== data-slot 容器:白面板 + 细边框 + 小圆角 ===== */
[data-slot] {
  background: var(--ui-surface) !important;
  border: 1px solid var(--ui-border) !important;
  border-radius: var(--ui-radius-s) !important;
  box-shadow: none !important;
}
/* nav:贴顶不留边,底细边 */
[data-slot="nav"] {
  border: none !important;
  border-bottom: 1px solid var(--ui-border) !important;
  border-radius: 0 0 var(--ui-radius-s) var(--ui-radius-s) !important;
  margin: 0 0 12px !important;
}
/* sidebar/main/overlay 补圆角 */
[data-slot="sidebar-left"] { border-radius: var(--ui-radius-s) !important; }
[data-slot="sidebar-right"] { border-radius: var(--ui-radius-s) !important; }
[data-slot="main"] { background: var(--ui-surface) !important; border-radius: var(--ui-radius-s) !important; }
[data-slot="overlay"] { border-radius: var(--ui-radius-s) !important; }
/* ===== 通用按钮 ===== */
body button {
  border: 1px solid var(--ui-border-strong) !important;
  background: var(--ui-surface) !important;
  color: var(--ui-text) !important;
  border-radius: var(--ui-radius-s) !important;
  cursor: pointer !important;
  transition: border-color .15s ease, color .15s ease, background .15s ease !important;
}
body button:hover { border-color: var(--ui-accent) !important; color: var(--ui-accent) !important; }
body button:active { opacity: .8 !important; }
/* ===== 插槽收放按钮(透明圆钮) ===== */
.st-slot-btn {
  border-radius: 50% !important;
  background: transparent !important;
  border: 1px solid var(--ui-border-strong) !important;
  color: var(--ui-text-muted) !important;
  box-shadow: none !important;
  transition: border-color .15s ease, color .15s ease, background .15s ease !important;
}
.st-slot-btn:hover {
  border-color: var(--ui-accent) !important;
  color: var(--ui-accent) !important;
  background: var(--ui-surface) !important;
  transform: none !important;
  box-shadow: none !important;
}
.st-slot-btn svg { width: 16px; height: 16px; }
/* ===== 滚动条 ===== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--ui-border-strong); border-radius: var(--ui-radius-s); }
::-webkit-scrollbar-thumb:hover { background: var(--ui-text-muted); }
::-webkit-scrollbar-track { background: transparent; }
/* ===== 强调:active 菜单 ===== */
[data-slot="sidebar-left"] .menu-item.active,
[data-slot="sidebar-left"] [class*="active"] {
  background: var(--ui-accent-soft) !important;
  color: var(--ui-accent) !important;
  box-shadow: inset 0 0 0 1px var(--ui-border) !important;
}
`
}

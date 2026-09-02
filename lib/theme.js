export const DEFAULT_THEME = {
    blur: 0,
    accent: '#333333',
    animated: false,
    orbCount: 0,
};
/** 归一化光球数量:非有限数回退默认 0;否则 clamp 到 [0,3] 并向下取整 */
export function normalizeOrbCount(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return DEFAULT_THEME.orbCount;
    return Math.max(0, Math.min(Math.floor(value), 3));
}
/** 生成简约黑白灰主题 CSS;accent 用于强调色(active 菜单等) */
export function buildThemeCss(opts) {
    const accent = opts.accent;
    return `/* ui-tool-plugin minimal theme (black-white-gray) */
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #f5f5f5;
  color: #444;
}
/* ===== 插槽容器:纯白面板 + 细边框 + 小圆角 ===== */
[data-slot] {
  background: #fff !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 4px !important;
  box-shadow: none !important;
}
/* nav:贴顶左右不留,底细边 + 与下方内容空隙 */
[data-slot="nav"] {
  border: none !important;
  border-bottom: 1px solid #e0e0e0 !important;
  border-radius: 0 0 4px 4px !important;
  margin: 0 0 12px !important;
}
/* sidebar:白面板(边框即边界) */
[data-slot="sidebar-left"] { border-radius: 4px !important; }
[data-slot="sidebar-right"] { border-radius: 4px !important; }
/* main:白面板 */
[data-slot="main"] { background: #fff !important; border-radius: 4px !important; }
/* overlay */
[data-slot="overlay"] { border-radius: 4px !important; }
/* ===== 通用按钮:白底细灰边,悬停加深 ===== */
body button {
  border: 1px solid #ccc;
  background: #fff;
  color: #444;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color .15s ease, color .15s ease, background .15s ease;
}
body button:hover { border-color: #333; color: #333; }
body button:active { opacity: .8; }
/* ===== 插槽收放按钮(简约:透明圆形 + 细边,悬停加深) ===== */
.st-slot-btn {
  border-radius: 50% !important;
  background: transparent !important;
  border: 1px solid #ccc !important;
  color: #666 !important;
  box-shadow: none !important;
  transition: border-color .15s ease, color .15s ease, background .15s ease !important;
}
.st-slot-btn:hover {
  border-color: #333 !important;
  color: #333 !important;
  background: #fff !important;
  transform: none !important;
  box-shadow: none !important;
}
.st-slot-btn svg { width: 16px; height: 16px; }
/* ===== 滚动条 ===== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #bbb; }
::-webkit-scrollbar-track { background: transparent; }
/* ===== accent 强调(active 菜单:浅灰底 + accent 深色文字) ===== */
[data-slot="sidebar-left"] .menu-item.active,
[data-slot="sidebar-left"] [class*="active"] {
  background: #f0f0f0 !important;
  color: ${accent} !important;
  box-shadow: inset 0 0 0 1px #e0e0e0 !important;
}
`;
}

export const DEFAULT_THEME = {
    blur: 20,
    accent: '#7c6df6',
    animated: true,
    orbCount: 3,
};
/** 光球定位:前 3 个位置(淡紫左上 / 淡蓝右下 / 淡粉中下);animated=false 时无动画 */
function orbCss(index, animated) {
    const orbs = [
        `width: 420px; height: 420px; left: -80px; top: -60px; background: radial-gradient(circle, rgba(124, 109, 246, 0.35), transparent 70%);${animated ? ' animation: stBeautifyFloat1 14s ease-in-out infinite;' : ''}`,
        `width: 380px; height: 380px; right: -70px; bottom: -80px; background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 70%);${animated ? ' animation: stBeautifyFloat2 16s ease-in-out infinite;' : ''}`,
        `width: 260px; height: 260px; left: 45%; top: 55%; background: radial-gradient(circle, rgba(232, 121, 249, 0.22), transparent 70%);${animated ? ' animation: stBeautifyFloat1 20s ease-in-out infinite reverse;' : ''}`,
    ];
    return `.st-beautify-orb:nth-child(${index + 1}) { position: fixed; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; ${orbs[index] ?? orbs[0]} }`;
}
/** 生成主题 CSS;参数插值,含背景/玻璃基元/data-slot 覆盖/控件/光球 */
export function buildThemeCss(opts) {
    const accent = opts.accent;
    const blur = opts.blur;
    const backgroundAnim = opts.animated
        ? `background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 35%, #f5f3ff 65%, #ecfeff 100%);
  background-size: 220% 220%;
  animation: stBeautifyBgShift 22s ease-in-out infinite;`
        : `background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 35%, #f5f3ff 65%, #ecfeff 100%);`;
    const keyframes = opts.animated ? `
@keyframes stBeautifyBgShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes stBeautifyFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, 30px) scale(1.08); }
}
@keyframes stBeautifyFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-36px, -24px) scale(1.06); }
}` : '';
    const orbs = Array.from({ length: Math.min(opts.orbCount, 3) }, (_, i) => orbCss(i, opts.animated)).join('\n');
    return `/* st-ui-beautify white glass theme */
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f2d3d;
  ${backgroundAnim}
}
${keyframes}
/* ===== 玻璃基元:5 插槽容器统一玻璃化 ===== */
[data-slot] {
  background: rgba(255, 255, 255, 0.58) !important;
  -webkit-backdrop-filter: blur(${blur}px) saturate(160%) !important;
  backdrop-filter: blur(${blur}px) saturate(160%) !important;
  border: 1px solid rgba(255, 255, 255, 0.72) !important;
  border-radius: 14px !important;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;
}
/* nav:取消示例边框,透明玻璃条 */
[data-slot="nav"] {
  border: none !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 0 0 14px 14px !important;
  margin: 0 10px !important;
}
/* sidebar:取消示例左右边框 */
[data-slot="sidebar-left"] { border-right: none !important; border-radius: 14px 0 0 14px !important; }
[data-slot="sidebar-right"] { border-left: none !important; border-radius: 0 14px 14px 0 !important; }
/* main:轻微玻璃,内容优先 */
[data-slot="main"] {
  background: rgba(255, 255, 255, 0.32) !important;
  border-radius: 14px !important;
}
/* overlay:悬浮玻璃卡片 */
[data-slot="overlay"] {
  border-radius: 14px !important;
}
/* ===== 通用控件 ===== */
body button {
  border: 1px solid rgba(31, 38, 135, 0.14);
  background: rgba(255, 255, 255, 0.65);
  color: #334155;
  border-radius: 8px;
  cursor: pointer;
  transition: background .18s ease, transform .12s ease, box-shadow .18s ease;
}
body button:hover { background: rgba(255, 255, 255, 0.9); box-shadow: 0 2px 8px rgba(31, 38, 135, 0.10); }
body button:active { transform: scale(0.96); }
/* ===== 滚动条 ===== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: rgba(31, 38, 135, 0.16); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(31, 38, 135, 0.28); }
::-webkit-scrollbar-track { background: transparent; }
/* ===== 背景光球(JS 注入 div) ===== */
.st-beautify-orb { pointer-events: none; }
${orbs}
/* ===== accent 强调色 ===== */
[data-slot="sidebar-left"] .menu-item.active,
[data-slot="sidebar-left"] [class*="active"] {
  background: ${accent}26 !important;
  color: ${accent} !important;
  box-shadow: inset 0 0 0 1px ${accent}47 !important;
}
`;
}

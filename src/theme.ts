// agent_plugin_dev/ui-tool-plugin/src/theme.ts
// 白色玻璃拟态主题:CSS 模板字符串 + 参数化生成。视觉源自已确认的 HTML 原型
// (agent_plugin_feat/.superpowers/sdd/glass-theme-demo.html),选择器改为 st-ui-slots 的 data-slot。
export interface ThemeOptions {
  /** 玻璃模糊强度 px */
  blur: number
  /** 强调色(active 菜单高亮) */
  accent: string
  /** 背景渐变是否流动动画 */
  animated: boolean
  /** 背景光球数量(0-3,data-index 属性选择器定位) */
  orbCount: number
}

export const DEFAULT_THEME: ThemeOptions = {
  blur: 20,
  accent: '#7c6df6',
  animated: true,
  orbCount: 3,
}

/** 归一化光球数量:非有限数回退默认 3;否则 clamp 到 [0,3] 并向下取整(两处消费方共用) */
export function normalizeOrbCount(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_THEME.orbCount
  return Math.max(0, Math.min(Math.floor(value), 3))
}

/** 光球定位:前 3 个位置(淡紫左上 / 淡蓝右下 / 淡粉中下);animated=false 时无动画 */
function orbCss(index: number, animated: boolean): string {
  const orbs = [
    `width: 420px; height: 420px; left: -80px; top: -60px; background: radial-gradient(circle, rgba(124, 109, 246, 0.35), transparent 70%);${animated ? ' animation: stBeautifyFloat1 14s ease-in-out infinite;' : ''}`,
    `width: 380px; height: 380px; right: -70px; bottom: -80px; background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 70%);${animated ? ' animation: stBeautifyFloat2 16s ease-in-out infinite;' : ''}`,
    `width: 260px; height: 260px; left: 45%; top: 55%; background: radial-gradient(circle, rgba(232, 121, 249, 0.22), transparent 70%);${animated ? ' animation: stBeautifyFloat1 20s ease-in-out infinite reverse;' : ''}`,
  ]
  return `.st-beautify-orb[data-index="${index}"] { position: fixed; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; ${orbs[index] ?? orbs[0]} }`
}

/** 生成主题 CSS;参数插值,含背景/玻璃基元/data-slot 覆盖/控件/光球 */
export function buildThemeCss(opts: ThemeOptions): string {
  const accent = opts.accent
  const blur = opts.blur
  const backgroundAnim = opts.animated
    ? `background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 35%, #f5f3ff 65%, #ecfeff 100%);
  background-size: 220% 220%;
  animation: stBeautifyBgShift 22s ease-in-out infinite;`
    : `background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 35%, #f5f3ff 65%, #ecfeff 100%);`
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
}` : ''
  const orbs = Array.from({ length: normalizeOrbCount(opts.orbCount) }, (_, i) => orbCss(i, opts.animated)).join('\n')

  // accent 必须为 6 位 hex(如 #7c6df6);`26`/`47` 为 alpha 后缀(0.15/0.28),非 6 位 hex 会产生非法 CSS

  return `/* ui-tool-plugin white glass theme */
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f2d3d;
  ${backgroundAnim}
}
${keyframes}
/* ===== 玻璃基元:5 插槽容器统一玻璃化(边框用灰蓝半透明,白色玻璃区域间边界可见) ===== */
[data-slot] {
  background: rgba(255, 255, 255, 0.58) !important;
  -webkit-backdrop-filter: blur(${blur}px) saturate(160%) !important;
  backdrop-filter: blur(${blur}px) saturate(160%) !important;
  border: 1px solid rgba(148, 163, 184, 0.45) !important;
  border-radius: 14px !important;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;
}
/* nav:取消示例边框,玻璃条;贴顶、左右不留,仅下侧圆角 + 与下方内容空隙 */
[data-slot="nav"] {
  border: none !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4) !important;
  border-radius: 0 0 14px 14px !important;
  margin: 0 0 12px !important;
}
/* sidebar:保留边框保证与 main 边界清晰;上方两角圆角,下方靠中间一侧直角 */
[data-slot="sidebar-left"] { border-radius: 14px 14px 0 14px !important; }
[data-slot="sidebar-right"] { border-radius: 14px 14px 14px 0 !important; }
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
/* ===== 插槽收放按钮(.st-slot-btn:结构/图标由 st-ui-slots 提供,美化在此;玻璃与插槽容器同款) ===== */
.st-slot-btn {
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.58) !important;
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(148, 163, 184, 0.45) !important;
  color: #7c6df6 !important;
  box-shadow: 0 4px 14px rgba(31, 38, 135, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.85);
  transition: all .2s ease;
}
.st-slot-btn:hover {
  background: rgba(255, 255, 255, 0.82) !important;
  box-shadow: 0 8px 22px rgba(124, 58, 237, 0.30);
  transform: translateY(-2px);
}
.st-slot-btn svg { width: 20px; height: 20px; }
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
`
}

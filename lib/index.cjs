"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/web.tsx
var web_exports = {};
__export(web_exports, {
  default: () => web_default
});
module.exports = __toCommonJS(web_exports);

// src/theme.ts
var DEFAULT_THEME = {
  blur: 20,
  accent: "#7c6df6",
  animated: true,
  orbCount: 3
};
function normalizeOrbCount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_THEME.orbCount;
  return Math.max(0, Math.min(Math.floor(value), 3));
}
function orbCss(index, animated) {
  const orbs = [
    `width: 420px; height: 420px; left: -80px; top: -60px; background: radial-gradient(circle, rgba(124, 109, 246, 0.35), transparent 70%);${animated ? " animation: stBeautifyFloat1 14s ease-in-out infinite;" : ""}`,
    `width: 380px; height: 380px; right: -70px; bottom: -80px; background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 70%);${animated ? " animation: stBeautifyFloat2 16s ease-in-out infinite;" : ""}`,
    `width: 260px; height: 260px; left: 45%; top: 55%; background: radial-gradient(circle, rgba(232, 121, 249, 0.22), transparent 70%);${animated ? " animation: stBeautifyFloat1 20s ease-in-out infinite reverse;" : ""}`
  ];
  return `.st-beautify-orb[data-index="${index}"] { position: fixed; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; ${orbs[index] ?? orbs[0]} }`;
}
function buildThemeCss(opts) {
  const accent = opts.accent;
  const blur = opts.blur;
  const backgroundAnim = opts.animated ? `background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 35%, #f5f3ff 65%, #ecfeff 100%);
  background-size: 220% 220%;
  animation: stBeautifyBgShift 22s ease-in-out infinite;` : `background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 35%, #f5f3ff 65%, #ecfeff 100%);`;
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
}` : "";
  const orbs = Array.from({ length: normalizeOrbCount(opts.orbCount) }, (_, i) => orbCss(i, opts.animated)).join("\n");
  return `/* st-ui-beautify white glass theme */
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f2d3d;
  ${backgroundAnim}
}
${keyframes}
/* ===== \u73BB\u7483\u57FA\u5143:5 \u63D2\u69FD\u5BB9\u5668\u7EDF\u4E00\u73BB\u7483\u5316 ===== */
[data-slot] {
  background: rgba(255, 255, 255, 0.58) !important;
  -webkit-backdrop-filter: blur(${blur}px) saturate(160%) !important;
  backdrop-filter: blur(${blur}px) saturate(160%) !important;
  border: 1px solid rgba(255, 255, 255, 0.72) !important;
  border-radius: 14px !important;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;
}
/* nav:\u53D6\u6D88\u793A\u4F8B\u8FB9\u6846,\u73BB\u7483\u6761;\u8D34\u9876\u3001\u5DE6\u53F3\u4E0D\u7559,\u4EC5\u4E0B\u4FA7\u5706\u89D2 + \u4E0E\u4E0B\u65B9\u5185\u5BB9\u7A7A\u9699 */
[data-slot="nav"] {
  border: none !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 0 0 14px 14px !important;
  margin: 0 0 12px !important;
}
/* sidebar:\u53D6\u6D88\u793A\u4F8B\u5DE6\u53F3\u8FB9\u6846;\u4E0A\u65B9\u4E24\u89D2\u5706\u89D2(\u8865\u9F50\u9760\u4E2D\u95F4\u4E00\u4FA7\u4E0A\u65B9\u5706\u89D2),\u4E0B\u65B9\u9760\u4E2D\u95F4\u4E00\u4FA7\u76F4\u89D2 */
[data-slot="sidebar-left"] { border-right: none !important; border-radius: 14px 14px 0 14px !important; }
[data-slot="sidebar-right"] { border-left: none !important; border-radius: 14px 14px 14px 0 !important; }
/* main:\u8F7B\u5FAE\u73BB\u7483,\u5185\u5BB9\u4F18\u5148 */
[data-slot="main"] {
  background: rgba(255, 255, 255, 0.32) !important;
  border-radius: 14px !important;
}
/* overlay:\u60AC\u6D6E\u73BB\u7483\u5361\u7247 */
[data-slot="overlay"] {
  border-radius: 14px !important;
}
/* ===== \u901A\u7528\u63A7\u4EF6 ===== */
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
/* ===== \u63D2\u69FD\u6536\u653E\u6309\u94AE(.st-slot-btn:\u7ED3\u6784/\u56FE\u6807\u7531 st-ui-slots \u63D0\u4F9B,\u7F8E\u5316\u5728\u6B64) ===== */
.st-slot-btn {
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.55) !important;
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  color: #6d28d9 !important;
  box-shadow: 0 4px 14px rgba(31, 38, 135, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: all .2s ease;
}
.st-slot-btn:hover {
  background: #7c3aed !important;
  border-color: #7c3aed !important;
  color: #fff !important;
  box-shadow: 0 8px 22px rgba(124, 58, 237, 0.45);
  transform: translateY(-2px);
}
.st-slot-btn svg { width: 20px; height: 20px; }
/* ===== \u6EDA\u52A8\u6761 ===== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: rgba(31, 38, 135, 0.16); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(31, 38, 135, 0.28); }
::-webkit-scrollbar-track { background: transparent; }
/* ===== \u80CC\u666F\u5149\u7403(JS \u6CE8\u5165 div) ===== */
.st-beautify-orb { pointer-events: none; }
${orbs}
/* ===== accent \u5F3A\u8C03\u8272 ===== */
[data-slot="sidebar-left"] .menu-item.active,
[data-slot="sidebar-left"] [class*="active"] {
  background: ${accent}26 !important;
  color: ${accent} !important;
  box-shadow: inset 0 0 0 1px ${accent}47 !important;
}
`;
}

// src/web.tsx
var STYLE_ID = "st-beautify-theme";
function removeInjected() {
  document.getElementById(STYLE_ID)?.remove();
  document.querySelectorAll(".st-beautify-orb").forEach((el) => el.remove());
}
function detectHost() {
  const uiSlots = window.__uiSlots__;
  if (uiSlots !== void 0) return true;
  return document.querySelectorAll("[data-slot]").length > 0;
}
var web_default = {
  name: "st-ui-beautify",
  mount(_el) {
    try {
      removeInjected();
      const opts = DEFAULT_THEME;
      if (!detectHost()) {
        console.warn("[st-ui-beautify] \u672A\u68C0\u6D4B\u5230 st-ui-slots \u5BBF\u4E3B\u63D2\u69FD,\u63D2\u69FD\u4E3B\u9898\u4E0D\u53EF\u89C1(\u80CC\u666F\u4E3B\u9898\u4ECD\u6CE8\u5165)");
      }
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = buildThemeCss(opts);
      document.head.appendChild(style);
      for (let i = 0; i < normalizeOrbCount(opts.orbCount); i++) {
        const orb = document.createElement("div");
        orb.className = "st-beautify-orb";
        orb.setAttribute("data-index", String(i));
        document.body.appendChild(orb);
      }
    } catch (e) {
      console.error("[st-ui-beautify] mount failed:", e);
    }
  },
  unmount() {
    removeInjected();
  }
};
module.exports = module.exports.default

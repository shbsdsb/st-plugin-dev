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

// src/tokens.ts
var DEFAULT_TOKENS = {
  "--ui-bg": "#f5f5f5",
  "--ui-surface": "#ffffff",
  "--ui-border": "#e0e0e0",
  "--ui-border-strong": "#ccc",
  "--ui-text": "#444444",
  "--ui-text-muted": "#888888",
  "--ui-accent": "#333333",
  "--ui-accent-soft": "#f0f0f0",
  "--ui-accent-ring": "rgba(51, 51, 51, 0.15)",
  "--ui-on-accent": "#ffffff",
  "--ui-danger": "#d9534f",
  "--ui-danger-soft": "#fef3f2",
  "--ui-warning": "#e6a23c",
  "--ui-success": "#52c41a",
  "--ui-success-soft": "#f6ffed",
  "--ui-overlay": "rgba(0, 0, 0, 0.28)",
  "--ui-radius-s": "4px",
  "--ui-radius-m": "6px",
  "--ui-shadow-m": "0 4px 16px rgba(0, 0, 0, 0.12)"
};
function buildTokenCss(tokens) {
  const lines = Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`);
  if (lines.length === 0) return ":root {\n}";
  return `:root {
${lines.join("\n")}
}`;
}

// src/default.ts
function buildDefaultCss() {
  return `/* ui-polish default theme(\u57FA\u4E8E UI-token) */
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--ui-bg);
  color: var(--ui-text);
}
/* ===== data-slot \u5BB9\u5668:\u767D\u9762\u677F + \u7EC6\u8FB9\u6846 + \u5C0F\u5706\u89D2 ===== */
[data-slot] {
  background: var(--ui-surface) !important;
  border: 1px solid var(--ui-border) !important;
  border-radius: var(--ui-radius-s) !important;
  box-shadow: none !important;
}
/* nav:\u8D34\u9876\u4E0D\u7559\u8FB9,\u5E95\u7EC6\u8FB9 */
[data-slot="nav"] {
  border: none !important;
  border-bottom: 1px solid var(--ui-border) !important;
  border-radius: 0 0 var(--ui-radius-s) var(--ui-radius-s) !important;
  margin: 0 0 12px !important;
}
/* sidebar/main/overlay \u8865\u5706\u89D2 */
[data-slot="sidebar-left"] { border-radius: var(--ui-radius-s) !important; }
[data-slot="sidebar-right"] { border-radius: var(--ui-radius-s) !important; }
[data-slot="main"] { background: var(--ui-surface) !important; border-radius: var(--ui-radius-s) !important; }
[data-slot="overlay"] { border-radius: var(--ui-radius-s) !important; }
/* ===== \u901A\u7528\u6309\u94AE ===== */
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
/* ===== \u63D2\u69FD\u6536\u653E\u6309\u94AE(\u900F\u660E\u5706\u94AE) ===== */
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
/* ===== \u6EDA\u52A8\u6761 ===== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--ui-border-strong); border-radius: var(--ui-radius-s); }
::-webkit-scrollbar-thumb:hover { background: var(--ui-text-muted); }
::-webkit-scrollbar-track { background: transparent; }
/* ===== \u5F3A\u8C03:active \u83DC\u5355 ===== */
[data-slot="sidebar-left"] .menu-item.active,
[data-slot="sidebar-left"] [class*="active"] {
  background: var(--ui-accent-soft) !important;
  color: var(--ui-accent) !important;
  box-shadow: inset 0 0 0 1px var(--ui-border) !important;
}
`;
}

// src/web.tsx
var IDS = ["ui-polish-tokens", "ui-polish-default", "ui-polish-css", "ui-polish-host", "ui-polish-js"];
function removeInjected() {
  for (const id of IDS) document.getElementById(id)?.remove();
}
function upsertStyle(id, css) {
  if (!css) return;
  document.getElementById(id)?.remove();
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}
function upsertBodyNode(id, tag, content) {
  if (!content) return;
  document.getElementById(id)?.remove();
  const node = document.createElement(tag);
  node.id = id;
  if (tag === "div") {
    node.innerHTML = content;
  } else {
    node.textContent = `try {
${content}
} catch (e) { console.error('[ui-polish] user js error:', e) }`;
  }
  document.body.appendChild(node);
}
async function applyCurrent() {
  upsertStyle("ui-polish-tokens", buildTokenCss(DEFAULT_TOKENS));
  upsertStyle("ui-polish-default", buildDefaultCss());
  let payload = null;
  try {
    const res = await fetch("/api/ui-polish/current");
    if (res.ok) payload = await res.json();
  } catch (e) {
    console.warn("[ui-polish] \u8BFB\u53D6\u6FC0\u6D3B\u4E3B\u9898\u5931\u8D25,\u4EC5\u9ED8\u8BA4 token \u5C42:", e?.message ?? e);
  }
  if (!payload?.ok) return;
  upsertStyle("ui-polish-css", payload.css ?? "");
  upsertBodyNode("ui-polish-host", "div", payload.html);
  upsertBodyNode("ui-polish-js", "script", payload.js);
}
var web_default = {
  name: "ui-polish",
  async mount(_el) {
    removeInjected();
    await applyCurrent();
  },
  unmount() {
    removeInjected();
  }
};
module.exports = module.exports.default

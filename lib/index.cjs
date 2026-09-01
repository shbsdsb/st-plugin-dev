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

// src/tools.ts
var STYLE_ID = "ui-tool-plugin-tools";
var active = [];
var masked = [];
function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.fw{position:fixed;z-index:10000;display:flex;align-items:center;gap:12px;padding:13px 18px;border-radius:16px;font-size:13px;line-height:1.4;background:rgba(255,255,255,0.62);-webkit-backdrop-filter:blur(18px) saturate(160%);backdrop-filter:blur(18px) saturate(160%);border:1px solid rgba(148,163,184,0.45);box-shadow:0 12px 32px rgba(31,38,135,0.14),inset 0 1px 0 rgba(255,255,255,0.9);color:#1f2d3d;opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;}
.fw.show{opacity:1;pointer-events:auto;}
.fw .ic{flex-shrink:0;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(124,109,246,0.14);color:#7c6df6;border:1px solid rgba(124,109,246,0.28);}
.fw .cl{background:rgba(148,163,184,0.2);border:none;font-size:12px;opacity:.7;cursor:pointer;padding:3px 8px;border-radius:40px;color:#475569;}
.fw-toast{top:24px;left:50%;transform:translateX(-50%) translateY(-16px);border-radius:40px;padding:11px 24px;}
.fw-toast.show{transform:translateX(-50%) translateY(0);}
.fw-alert{top:24px;left:50%;transform:translateX(-50%) translateY(-16px);border-left:4px solid rgba(220,38,38,0.65);}
.fw-alert.show{transform:translateX(-50%) translateY(0);}
.fw-alert .ic{background:rgba(220,38,38,0.12);color:#dc2626;border-color:rgba(220,38,38,0.3);}
.fw-notify{top:24px;right:24px;transform:translateX(28px);padding:14px 18px;}
.fw-notify.show{transform:translateX(0);}
.fw-notify .ic{background:rgba(139,92,246,0.14);color:#8b5cf6;border-color:rgba(139,92,246,0.3);}
.fw-sheet{left:50%;bottom:0;transform:translateX(-50%) translateY(100%);border-radius:24px 24px 0 0;border-top:3px solid rgba(124,109,246,0.5);flex-direction:column;align-items:stretch;gap:6px;width:min(420px,92vw);padding:14px 22px 20px;}
.fw-sheet.show{transform:translateX(-50%) translateY(0);}
.fw-banner{top:0;left:0;right:0;transform:translateY(-100%);border-radius:0 0 18px 18px;justify-content:center;padding:14px 24px;}
.fw-banner.show{transform:translateY(0);}
.fw-banner .ic{background:rgba(245,158,11,0.16);color:#d97706;border-color:rgba(245,158,11,0.35);}
.fw-slide{top:50%;right:0;transform:translate(100%,-50%);border-radius:16px 0 0 16px;border-right:4px solid rgba(59,130,246,0.55);padding:16px 20px;}
.fw-slide.show{transform:translate(0,-50%);}
.fw-slide .ic{background:rgba(59,130,246,0.14);color:#3b82f6;border-color:rgba(59,130,246,0.32);}
.fw-mask{position:fixed;inset:0;background:rgba(15,23,42,0.28);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .25s;}
.fw-mask.show{opacity:1;pointer-events:auto;}
.fw-modal{background:rgba(255,255,255,0.72);-webkit-backdrop-filter:blur(22px) saturate(160%);backdrop-filter:blur(22px) saturate(160%);border:1px solid rgba(148,163,184,0.5);box-shadow:0 24px 56px rgba(31,38,135,0.2);border-radius:22px;padding:26px 28px;width:min(320px,90vw);text-align:center;transform:scale(.92);transition:transform .25s;color:#1f2d3d;}
.fw-mask.show .fw-modal{transform:scale(1);}
.fw-tip{position:fixed;background:rgba(255,255,255,0.78);-webkit-backdrop-filter:blur(16px) saturate(160%);backdrop-filter:blur(16px) saturate(160%);border:1px solid rgba(148,163,184,0.45);border-radius:40px;padding:9px 18px;font-size:12px;color:#334155;box-shadow:0 8px 24px rgba(31,38,135,0.16);z-index:10001;}
.fw-prog{flex-direction:column;align-items:stretch;gap:8px;width:260px;}
.fw-prog .ic{background:rgba(59,130,246,0.14);color:#3b82f6;border-color:rgba(59,130,246,0.32);}
.fw-prog .pb{height:6px;background:rgba(148,163,184,0.28);border-radius:20px;overflow:hidden;}
.fw-prog .pb i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7c6df6,#38bdf8);border-radius:20px;transition:width .4s;}
.fw-dismiss{left:24px;bottom:24px;transform:translateY(16px);border-radius:40px;padding:11px 14px 11px 20px;}
.fw-dismiss.show{transform:translateY(0);}
.fw-dismiss .ic{background:rgba(34,197,94,0.14);color:#16a34a;border-color:rgba(34,197,94,0.32);}
.fw-center{top:50%;left:50%;transform:translate(-50%,-46%);border-radius:22px;padding:26px 32px;flex-direction:column;align-items:center;gap:8px;text-align:center;}
.fw-center.show{transform:translate(-50%,-50%);}
.fw-center .big{width:60px;height:60px;border-radius:50%;background:rgba(124,109,246,0.14);border:1px solid rgba(124,109,246,0.3);color:#7c6df6;font-size:24px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;}
@keyframes ui-tool-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.badge-dot{position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;border-radius:40px;padding:2px 8px;font-size:10px;font-weight:700;border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 10px rgba(239,68,68,0.4);animation:ui-tool-pulse 1.8s infinite;}
`;
  document.head.appendChild(style);
}
function createFloat(spec) {
  const el = document.createElement("div");
  el.className = `fw ${spec.mod}`;
  if (spec.icon) {
    const ic = document.createElement("span");
    ic.className = "ic";
    ic.textContent = spec.icon;
    el.appendChild(ic);
  }
  const tx = document.createElement("div");
  const b = document.createElement("b");
  b.style.cssText = "display:block;font-size:13px;color:#1f2d3d;";
  b.textContent = spec.title;
  tx.appendChild(b);
  if (spec.desc) {
    const s = document.createElement("span");
    s.style.cssText = "display:block;font-size:11px;color:#64748b;";
    s.textContent = spec.desc;
    tx.appendChild(s);
  }
  el.appendChild(tx);
  if (spec.closable) {
    const c = document.createElement("button");
    c.className = "cl";
    c.textContent = "\u2715";
    c.addEventListener("click", () => hide(el));
    el.appendChild(c);
  }
  return el;
}
function show(el, autoMs) {
  ensureStyle();
  document.body.appendChild(el);
  active.push(el);
  requestAnimationFrame(() => el.classList.add("show"));
  if (autoMs) setTimeout(() => hide(el), autoMs);
}
function hide(el) {
  el.classList.remove("show");
  setTimeout(() => {
    const i = active.indexOf(el);
    if (i >= 0) active.splice(i, 1);
    el.remove();
  }, 300);
}
function closeMasked() {
  for (const m of [...masked]) hideMask(m);
}
function hideMask(mask) {
  const i = masked.indexOf(mask);
  if (i >= 0) masked.splice(i, 1);
  const ai = active.indexOf(mask);
  if (ai >= 0) active.splice(ai, 1);
  mask.classList.remove("show");
  setTimeout(() => mask.remove(), 250);
}
function closeAllTools() {
  for (const el of [...active]) hide(el);
}
function createTools() {
  return {
    toast(msg, opts) {
      const el = createFloat({ mod: "fw-toast", icon: opts?.icon ?? "\u2713", title: msg });
      show(el, 2600);
    },
    alert(msg, opts) {
      const el = createFloat({ mod: "fw-alert", icon: opts?.icon ?? "\u26A0", title: msg, closable: true });
      show(el);
    },
    notify({ title, desc }) {
      const el = createFloat({ mod: "fw-notify", icon: "\u25CF", title, desc, closable: true });
      show(el);
    },
    bottomSheet({ title, desc }) {
      const el = createFloat({ mod: "fw-sheet", title, desc, closable: true });
      show(el);
    },
    topBanner({ title, desc }) {
      const el = createFloat({ mod: "fw-banner", icon: "\u2605", title, desc, closable: true });
      show(el);
    },
    sideSlide({ title, desc }) {
      const el = createFloat({ mod: "fw-slide", icon: "\u2192", title, desc, closable: true });
      show(el);
    },
    modal({ title, desc, onOk, onCancel }) {
      closeMasked();
      const mask = document.createElement("div");
      mask.className = "fw-mask";
      const box = document.createElement("div");
      box.className = "fw-modal";
      const h = document.createElement("h3");
      h.style.cssText = "font-size:16px;margin-bottom:8px;";
      h.textContent = title;
      const p = document.createElement("p");
      p.style.cssText = "font-size:12px;color:#64748b;margin:8px 0 18px;line-height:1.6;";
      p.textContent = desc ?? "";
      const acts = document.createElement("div");
      acts.style.cssText = "display:flex;gap:10px;justify-content:center;";
      const ok = document.createElement("button");
      ok.textContent = "\u786E\u8BA4";
      ok.style.cssText = "border:none;border-radius:40px;padding:9px 22px;font-size:12px;font-weight:600;cursor:pointer;background:#7c6df6;color:#fff;";
      ok.addEventListener("click", () => {
        hideMask(mask);
        onOk?.();
      });
      const no = document.createElement("button");
      no.textContent = "\u53D6\u6D88";
      no.style.cssText = "border:none;border-radius:40px;padding:9px 22px;font-size:12px;font-weight:600;cursor:pointer;background:rgba(148,163,184,0.2);color:#475569;";
      no.addEventListener("click", () => {
        hideMask(mask);
        onCancel?.();
      });
      acts.append(ok, no);
      box.append(h, p, acts);
      mask.append(box);
      masked.push(mask);
      show(mask);
    },
    tooltip(el, text) {
      ensureStyle();
      const tip = document.createElement("div");
      tip.className = "fw-tip";
      tip.textContent = text;
      document.body.appendChild(tip);
      active.push(tip);
      const r = el.getBoundingClientRect();
      tip.style.left = Math.max(8, r.left + r.width / 2 - 60) + "px";
      tip.style.top = Math.max(4, r.top - 40) + "px";
      setTimeout(() => {
        const i = active.indexOf(tip);
        if (i >= 0) active.splice(i, 1);
        tip.remove();
      }, 2500);
    },
    badge(el, count) {
      ensureStyle();
      const old = el.querySelector(".badge-dot");
      if (old) {
        old.remove();
        return;
      }
      const dot = document.createElement("span");
      dot.className = "badge-dot";
      dot.textContent = String(count ?? 3);
      if (!el.style.position) el.style.position = "relative";
      el.appendChild(dot);
    },
    progress({ title, onDone }) {
      const el = createFloat({ mod: "fw-prog", icon: "\u2193", title });
      const pb = document.createElement("div");
      pb.className = "pb";
      const fill = document.createElement("i");
      pb.appendChild(fill);
      el.appendChild(pb);
      show(el);
      let p = 0;
      const timer = setInterval(() => {
        p = Math.min(100, p + 14);
        fill.style.width = p + "%";
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            hide(el);
            onDone?.();
          }, 500);
        }
      }, 300);
    },
    dismissible(msg) {
      const el = createFloat({ mod: "fw-dismiss", icon: "\u2713", title: msg, closable: true });
      show(el);
    },
    centerPopup({ title, desc, icon }) {
      const el = createFloat({ mod: "fw-center", icon: void 0, title });
      const big = document.createElement("div");
      big.className = "big";
      big.textContent = icon ?? "\u2665";
      el.insertBefore(big, el.querySelector("div"));
      const sp = document.createElement("span");
      sp.textContent = desc ?? "";
      sp.style.cssText = "font-size:12px;color:#64748b;";
      el.appendChild(sp);
      show(el, 2800);
    },
    pluginModal({ title, content, actions, width }) {
      closeMasked();
      const mask = document.createElement("div");
      mask.className = "fw-mask";
      const box = document.createElement("div");
      box.className = "fw-modal";
      box.style.cssText = `width:${width ? width + "px" : "min(420px,92vw)"};max-height:82vh;display:flex;flex-direction:column;overflow:hidden;text-align:left;padding:0;`;
      const ph = document.createElement("div");
      ph.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(148,163,184,0.25);";
      const t = document.createElement("b");
      t.style.cssText = "font-size:14px;";
      t.textContent = title ?? "";
      const x = document.createElement("button");
      x.textContent = "\u2715";
      x.style.cssText = "width:26px;height:26px;border-radius:50%;border:none;background:rgba(148,163,184,0.2);color:#475569;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;";
      x.addEventListener("click", () => hideMask(mask));
      ph.append(t, x);
      const pc = document.createElement("div");
      pc.style.cssText = "padding:18px 16px;overflow:auto;flex:1;font-size:13px;color:#334155;line-height:1.7;";
      if (typeof content === "string") pc.innerHTML = content;
      else if (typeof content === "function") content(pc);
      else pc.appendChild(content);
      box.append(ph, pc);
      if (actions && actions.length > 0) {
        const pa = document.createElement("div");
        pa.style.cssText = "display:flex;gap:10px;justify-content:flex-end;padding:12px 16px;border-top:1px solid rgba(148,163,184,0.25);";
        for (const a of actions) {
          const btn = document.createElement("button");
          btn.textContent = a.label;
          btn.style.cssText = "border:none;border-radius:40px;padding:9px 22px;font-size:12px;font-weight:600;cursor:pointer;" + (a.variant === "primary" ? "background:#7c6df6;color:#fff;" : a.variant === "danger" ? "background:#dc2626;color:#fff;" : "background:rgba(148,163,184,0.2);color:#475569;");
          btn.addEventListener("click", () => {
            hideMask(mask);
            a.onClick?.();
          });
          pa.appendChild(btn);
        }
        box.append(pa);
      }
      mask.append(box);
      masked.push(mask);
      show(mask);
    }
  };
}

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
  return `/* ui-tool-plugin white glass theme */
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f2d3d;
  ${backgroundAnim}
}
${keyframes}
/* ===== \u73BB\u7483\u57FA\u5143:5 \u63D2\u69FD\u5BB9\u5668\u7EDF\u4E00\u73BB\u7483\u5316(\u8FB9\u6846\u7528\u7070\u84DD\u534A\u900F\u660E,\u767D\u8272\u73BB\u7483\u533A\u57DF\u95F4\u8FB9\u754C\u53EF\u89C1) ===== */
[data-slot] {
  background: rgba(255, 255, 255, 0.58) !important;
  -webkit-backdrop-filter: blur(${blur}px) saturate(160%) !important;
  backdrop-filter: blur(${blur}px) saturate(160%) !important;
  border: 1px solid rgba(148, 163, 184, 0.45) !important;
  border-radius: 14px !important;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;
}
/* nav:\u53D6\u6D88\u793A\u4F8B\u8FB9\u6846,\u73BB\u7483\u6761;\u8D34\u9876\u3001\u5DE6\u53F3\u4E0D\u7559,\u4EC5\u4E0B\u4FA7\u5706\u89D2 + \u4E0E\u4E0B\u65B9\u5185\u5BB9\u7A7A\u9699 */
[data-slot="nav"] {
  border: none !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4) !important;
  border-radius: 0 0 14px 14px !important;
  margin: 0 0 12px !important;
}
/* sidebar:\u4FDD\u7559\u8FB9\u6846\u4FDD\u8BC1\u4E0E main \u8FB9\u754C\u6E05\u6670;\u4E0A\u65B9\u4E24\u89D2\u5706\u89D2,\u4E0B\u65B9\u9760\u4E2D\u95F4\u4E00\u4FA7\u76F4\u89D2 */
[data-slot="sidebar-left"] { border-radius: 14px 14px 0 14px !important; }
[data-slot="sidebar-right"] { border-radius: 14px 14px 14px 0 !important; }
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
/* ===== \u63D2\u69FD\u6536\u653E\u6309\u94AE(.st-slot-btn:\u7ED3\u6784/\u56FE\u6807\u7531 st-ui-slots \u63D0\u4F9B,\u7F8E\u5316\u5728\u6B64;\u73BB\u7483\u4E0E\u63D2\u69FD\u5BB9\u5668\u540C\u6B3E) ===== */
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

// src/theme-engine.ts
var STYLE_ID2 = "ui-tool-plugin-theme";
var INSTALL_STYLE_ID = "ui-tool-plugin-install";
var INSTALL_HTML_ID = "ui-tool-plugin-install-html";
var INSTALL_JS_ID = "ui-tool-plugin-install-js";
var ORB_CLS = "st-beautify-orb";
function removeThemeInjected() {
  document.getElementById(STYLE_ID2)?.remove();
  document.querySelectorAll("." + ORB_CLS).forEach((el) => el.remove());
}
function applyTheme(opts) {
  removeThemeInjected();
  const style = document.createElement("style");
  style.id = STYLE_ID2;
  style.textContent = buildThemeCss(opts);
  document.head.appendChild(style);
  for (let i = 0; i < normalizeOrbCount(opts.orbCount); i++) {
    const orb = document.createElement("div");
    orb.className = ORB_CLS;
    orb.setAttribute("data-index", String(i));
    document.body.appendChild(orb);
  }
}
function removeInstalled() {
  document.getElementById(INSTALL_STYLE_ID)?.remove();
  document.getElementById(INSTALL_HTML_ID)?.remove();
  document.getElementById(INSTALL_JS_ID)?.remove();
}
function createThemeEngine() {
  let current = { ...DEFAULT_THEME };
  applyTheme(current);
  return {
    get() {
      return { ...current };
    },
    set(patch) {
      current = { ...current, ...patch };
      applyTheme(current);
    },
    reset() {
      current = { ...DEFAULT_THEME };
      removeInstalled();
      applyTheme(current);
    },
    install({ css, html, js }) {
      removeInstalled();
      removeThemeInjected();
      const style = document.createElement("style");
      style.id = INSTALL_STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
      if (html) {
        const host = document.createElement("div");
        host.id = INSTALL_HTML_ID;
        host.innerHTML = html;
        document.body.appendChild(host);
      }
      if (js) {
        const sc = document.createElement("script");
        sc.id = INSTALL_JS_ID;
        sc.textContent = js;
        document.body.appendChild(sc);
      }
    },
    destroy() {
      removeInstalled();
      removeThemeInjected();
    }
  };
}

// src/web.tsx
function detectHost() {
  const uiSlots = window.__uiSlots__;
  if (uiSlots !== void 0) return true;
  return document.querySelectorAll("[data-slot]").length > 0;
}
var web_default = {
  name: "ui-tool-plugin",
  mount(_el) {
    try {
      const theme = createThemeEngine();
      if (!detectHost()) {
        console.warn("[ui-tool-plugin] \u672A\u68C0\u6D4B\u5230 st-ui-slots \u5BBF\u4E3B\u63D2\u69FD,\u63D2\u69FD\u4E3B\u9898\u4E0D\u53EF\u89C1(\u80CC\u666F\u4E3B\u9898\u4ECD\u6CE8\u5165)");
      }
      ;
      window.__uiTools__ = {
        ...createTools(),
        theme
      };
    } catch (e) {
      console.error("[ui-tool-plugin] mount failed:", e);
    }
  },
  unmount() {
    closeAllTools();
    const ui = window.__uiTools__;
    ui?.theme.destroy();
    delete window.__uiTools__;
  }
};
module.exports = module.exports.default

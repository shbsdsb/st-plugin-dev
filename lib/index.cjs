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
var intervals = [];
function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.fw{position:fixed;z-index:10000;display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:6px;font-size:13px;line-height:1.4;background:#fff;border:1px solid #d9d9d9;box-shadow:0 1px 4px rgba(0,0,0,0.08);color:#444;opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease;}
.fw.show{opacity:1;pointer-events:auto;}
.fw .ic{flex-shrink:0;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;background:#999;}
.fw .cl{background:none;border:none;font-size:13px;color:#aaa;cursor:pointer;padding:2px 6px;border-radius:3px;}
.fw .cl:hover{color:#333;background:#f0f0f0;}
.fw .ic-ok{background:#333;}
.fw .ic-warn{background:#e6a23c;}
.fw .ic-err{background:#d9534f;}
.fw .ic-info{background:#555;}
.fw-toast{top:20px;left:50%;transform:translateX(-50%) translateY(-14px);background:#333;border:none;color:#f5f5f5;border-radius:20px;padding:9px 22px;}
.fw-toast.show{transform:translateX(-50%) translateY(0);}
.fw-toast .tx b{color:#f5f5f5;}
.fw-toast .tx span{color:#bbb;}
.fw-alert{top:20px;left:50%;transform:translateX(-50%) translateY(-14px);border-left:3px solid #d9534f;border-radius:4px;}
.fw-alert.show{transform:translateX(-50%) translateY(0);}
.fw-alert .ic{background:#d9534f;}
.fw-notify{top:20px;right:20px;transform:translateX(20px);border-radius:6px;}
.fw-notify.show{transform:translateX(0);}
.fw-notify .ic{background:#555;}
.fw-sheet{left:50%;bottom:0;transform:translateX(-50%) translateY(100%);border-radius:8px 8px 0 0;border-bottom:none;flex-direction:column;align-items:stretch;gap:4px;width:min(400px,92vw);padding:12px 20px 18px;}
.fw-sheet.show{transform:translateX(-50%) translateY(0);}
.fw-sheet .bar{width:34px;height:4px;background:#ddd;border-radius:2px;margin:2px auto 10px;}
.fw-sheet .ic{background:#555;}
.fw-banner{top:0;left:0;right:0;transform:translateY(-100%);border-radius:0 0 4px 4px;border-top:none;justify-content:center;padding:12px 24px;}
.fw-banner.show{transform:translateY(0);}
.fw-banner .ic{background:#999;}
.fw-slide{top:50%;right:0;transform:translate(100%,-50%);border-radius:4px 0 0 4px;border-right:none;padding:14px 18px;}
.fw-slide.show{transform:translate(0,-50%);}
.fw-slide .ic{background:#555;}
.fw-mask{position:fixed;inset:0;background:rgba(0,0,0,0.28);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s;}
.fw-mask.show{opacity:1;pointer-events:auto;}
.fw-modal{background:#fff;border:1px solid #e0e0e0;box-shadow:0 4px 16px rgba(0,0,0,0.12);border-radius:6px;padding:22px 24px;width:min(320px,90vw);text-align:center;transform:scale(.96);transition:transform .2s;color:#444;}
.fw-mask.show .fw-modal{transform:scale(1);}
.fw-tip{position:fixed;background:#333;color:#f5f5f5;border:none;border-radius:4px;padding:7px 14px;font-size:12px;box-shadow:none;z-index:10001;}
.fw-tip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:#333;}
.fw-prog{flex-direction:column;align-items:stretch;gap:8px;width:240px;border-radius:6px;}
.fw-prog .ic{background:#555;}
.fw-prog .pb{height:4px;background:#eee;border-radius:2px;overflow:hidden;}
.fw-prog .pb i{display:block;height:100%;width:0;background:#333;border-radius:2px;transition:width .4s;}
.fw-dismiss{left:20px;bottom:20px;transform:translateY(14px);border-radius:20px;padding:9px 14px 9px 18px;}
.fw-dismiss.show{transform:translateY(0);}
.fw-dismiss .ic{background:#333;}
.fw-center{top:50%;left:50%;transform:translate(-50%,-46%);border-radius:6px;padding:22px 28px;flex-direction:column;align-items:center;gap:6px;text-align:center;}
.fw-center.show{transform:translate(-50%,-50%);}
.fw-center .big{width:44px;height:44px;border-radius:50%;background:#333;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;}
@keyframes ui-tool-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.badge-dot{position:absolute;top:-6px;right:-6px;background:#d9534f;color:#fff;border-radius:10px;padding:1px 6px;font-size:10px;font-weight:600;border:1px solid #fff;animation:ui-tool-pulse 1.8s infinite;}
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
  b.style.cssText = "display:block;font-size:13px;font-weight:500;";
  b.textContent = spec.title;
  tx.appendChild(b);
  if (spec.desc) {
    const s = document.createElement("span");
    s.style.cssText = "display:block;font-size:11px;";
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
function closeMasked(except) {
  for (const m of [...masked]) {
    if (except && m.dataset.kind === except) continue;
    hideMask(m);
  }
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
  for (const t of intervals) clearInterval(t);
  intervals.length = 0;
}
function removeToolsStyle() {
  document.getElementById(STYLE_ID)?.remove();
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
      closeMasked("pluginModal");
      const mask = document.createElement("div");
      mask.className = "fw-mask";
      mask.dataset.kind = "modal";
      const box = document.createElement("div");
      box.className = "fw-modal";
      const h = document.createElement("h3");
      h.style.cssText = "font-size:16px;margin-bottom:8px;";
      h.textContent = title;
      const p = document.createElement("p");
      p.style.cssText = "font-size:12px;color:#888;margin:8px 0 18px;line-height:1.6;";
      p.textContent = desc ?? "";
      const acts = document.createElement("div");
      acts.style.cssText = "display:flex;gap:10px;justify-content:center;";
      const ok = document.createElement("button");
      ok.textContent = "\u786E\u8BA4";
      ok.style.cssText = "border:none;border-radius:4px;padding:7px 20px;font-size:12px;font-weight:500;cursor:pointer;background:#333;color:#fff;";
      ok.addEventListener("click", () => {
        hideMask(mask);
        onOk?.();
      });
      const no = document.createElement("button");
      no.textContent = "\u53D6\u6D88";
      no.style.cssText = "border:1px solid #ccc;border-radius:4px;padding:7px 20px;font-size:12px;font-weight:500;cursor:pointer;background:#fff;color:#666;";
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
          const ti = intervals.indexOf(timer);
          if (ti >= 0) intervals.splice(ti, 1);
          setTimeout(() => {
            hide(el);
            onDone?.();
          }, 500);
        }
      }, 300);
      intervals.push(timer);
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
      sp.style.cssText = "font-size:12px;color:#888;";
      el.appendChild(sp);
      show(el, 2800);
    },
    pluginModal({ title, content, actions, width }) {
      closeMasked();
      const mask = document.createElement("div");
      mask.className = "fw-mask";
      mask.dataset.kind = "pluginModal";
      const box = document.createElement("div");
      box.className = "fw-modal";
      box.style.cssText = `width:${width ? width + "px" : "min(420px,92vw)"};max-height:82vh;display:flex;flex-direction:column;overflow:hidden;text-align:left;padding:0;`;
      const ph = document.createElement("div");
      ph.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eee;";
      const t = document.createElement("b");
      t.style.cssText = "font-size:14px;";
      t.textContent = title ?? "";
      const x = document.createElement("button");
      x.textContent = "\u2715";
      x.style.cssText = "width:22px;height:22px;border-radius:50%;border:none;background:#f0f0f0;color:#888;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;";
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
        pa.style.cssText = "display:flex;gap:10px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eee;";
        for (const a of actions) {
          const btn = document.createElement("button");
          btn.textContent = a.label;
          btn.style.cssText = "border:none;border-radius:40px;padding:9px 22px;font-size:12px;font-weight:600;cursor:pointer;" + (a.variant === "primary" ? "background:#333;color:#fff;border:1px solid #333;" : a.variant === "danger" ? "background:#d9534f;color:#fff;border:1px solid #d9534f;" : "background:#fff;color:#666;border:1px solid #ccc;");
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
  blur: 0,
  accent: "#333333",
  animated: false,
  orbCount: 0
};
function normalizeOrbCount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_THEME.orbCount;
  return Math.max(0, Math.min(Math.floor(value), 3));
}
function buildThemeCss(opts) {
  const accent = opts.accent;
  return `/* ui-tool-plugin minimal theme (black-white-gray) */
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #f5f5f5;
  color: #444;
}
/* ===== \u63D2\u69FD\u5BB9\u5668:\u7EAF\u767D\u9762\u677F + \u7EC6\u8FB9\u6846 + \u5C0F\u5706\u89D2 ===== */
[data-slot] {
  background: #fff !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 4px !important;
  box-shadow: none !important;
}
/* nav:\u8D34\u9876\u5DE6\u53F3\u4E0D\u7559,\u5E95\u7EC6\u8FB9 + \u4E0E\u4E0B\u65B9\u5185\u5BB9\u7A7A\u9699 */
[data-slot="nav"] {
  border: none !important;
  border-bottom: 1px solid #e0e0e0 !important;
  border-radius: 0 0 4px 4px !important;
  margin: 0 0 12px !important;
}
/* sidebar:\u767D\u9762\u677F(\u8FB9\u6846\u5373\u8FB9\u754C) */
[data-slot="sidebar-left"] { border-radius: 4px !important; }
[data-slot="sidebar-right"] { border-radius: 4px !important; }
/* main:\u767D\u9762\u677F */
[data-slot="main"] { background: #fff !important; border-radius: 4px !important; }
/* overlay */
[data-slot="overlay"] { border-radius: 4px !important; }
/* ===== \u901A\u7528\u6309\u94AE:\u767D\u5E95\u7EC6\u7070\u8FB9,\u60AC\u505C\u52A0\u6DF1 ===== */
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
/* ===== \u63D2\u69FD\u6536\u653E\u6309\u94AE(\u7B80\u7EA6:\u900F\u660E\u5706\u5F62 + \u7EC6\u8FB9,\u60AC\u505C\u52A0\u6DF1) ===== */
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
/* ===== \u6EDA\u52A8\u6761 ===== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #bbb; }
::-webkit-scrollbar-track { background: transparent; }
/* ===== accent \u5F3A\u8C03(active \u83DC\u5355:\u6D45\u7070\u5E95 + accent \u6DF1\u8272\u6587\u5B57) ===== */
[data-slot="sidebar-left"] .menu-item.active,
[data-slot="sidebar-left"] [class*="active"] {
  background: #f0f0f0 !important;
  color: ${accent} !important;
  box-shadow: inset 0 0 0 1px #e0e0e0 !important;
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
    removeToolsStyle();
    const ui = window.__uiTools__;
    ui?.theme.destroy();
    delete window.__uiTools__;
  }
};
module.exports = module.exports.default

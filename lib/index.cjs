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

// src/ui/api.ts
async function apiFetch(path, init) {
  const res = await fetch(path, { headers: { "content-type": "application/json" }, ...init });
  let body = null;
  try {
    body = await res.json();
  } catch {
  }
  if (!res.ok || !body?.ok) throw new Error(body?.message || `HTTP ${res.status}`);
  return body;
}
function listSessions() {
  return apiFetch("/api/session/list").then((r) => r.data);
}
function createSession() {
  return apiFetch("/api/session/create", { method: "POST" }).then((r) => r.data);
}
function removeSession(id) {
  return apiFetch("/api/session/" + id, { method: "DELETE" }).then(() => void 0);
}
function getActive() {
  return apiFetch("/api/session/active").then((r) => r.data);
}
function setActive(id) {
  return apiFetch("/api/session/active", { method: "PUT", body: JSON.stringify({ sessionId: id }) }).then(() => void 0);
}

// src/ui/style.ts
var STYLE_ID = "multi-session-style";
function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.multi-session { display: flex; flex-direction: column; height: 100%; min-height: 0; color: var(--ui-text, #444); }
.multi-session .ms-head { display: flex; align-items: center; justify-content: space-between; padding: 2px 0 8px; }
.multi-session .ms-title { font-size: 13px; font-weight: 600; }
.multi-session .ms-add { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--ui-border-strong, #ccc); background: var(--ui-surface, #fff); color: var(--ui-text, #444); font-size: 15px; line-height: 1; cursor: pointer; }
.multi-session .ms-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.multi-session .ms-item { position: relative; display: flex; flex-direction: column; gap: 2px; padding: 7px 8px; border-radius: var(--ui-radius-m, 6px); cursor: pointer; border: 1px solid transparent; }
.multi-session .ms-item:hover { background: var(--ui-accent-soft, #f0f0f0); }
.multi-session .ms-item.active { background: var(--ui-accent-soft, #f0f0f0); border-color: var(--ui-accent, #333); }
.multi-session .ms-item .ms-name { font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 18px; }
.multi-session .ms-item .ms-time { font-size: 11px; color: var(--ui-text-muted, #888); }
.multi-session .ms-item .ms-del { position: absolute; top: 6px; right: 6px; width: 16px; height: 16px; border: none; border-radius: 50%; background: transparent; color: var(--ui-text-muted, #888); font-size: 11px; line-height: 1; cursor: pointer; display: none; align-items: center; justify-content: center; }
.multi-session .ms-item:hover .ms-del { display: flex; }
.multi-session .ms-item .ms-del:hover { color: var(--ui-danger, #d9534f); }
.multi-session .ms-empty { color: var(--ui-text-muted, #888); font-size: 12px; text-align: center; padding: 12px 0; }
`;
  document.head.appendChild(style);
}

// src/ui/panel.ts
function h(tag, cls, text = "") {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
}
function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 6e4) return "\u521A\u521A";
  if (diff < 36e5) return Math.floor(diff / 6e4) + " \u5206\u949F\u524D";
  const d = new Date(iso);
  const now = /* @__PURE__ */ new Date();
  return d.toDateString() === now.toDateString() ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function emitSessionChanged(reason, id) {
  window.dispatchEvent(new CustomEvent("st:session-changed", { detail: { reason, id } }));
}
function createSessionPanel(toast) {
  injectStyle();
  const root = h("div", "multi-session");
  const head = h("div", "ms-head");
  const title = h("span", "ms-title", "\u4F1A\u8BDD");
  const addBtn = h("button", "ms-add", "\uFF0B");
  addBtn.title = "\u65B0\u4F1A\u8BDD";
  head.append(title, addBtn);
  const list = h("div", "ms-list");
  root.append(head, list);
  let sessions = [];
  let activeId = null;
  const render = () => {
    list.textContent = "";
    if (sessions.length === 0) {
      list.appendChild(h("div", "ms-empty", "\u6682\u65E0\u4F1A\u8BDD"));
      return;
    }
    for (const s of sessions) {
      const item = h("div", "ms-item" + (s.id === activeId ? " active" : ""));
      const name = h("span", "ms-name", s.title);
      const time = h("span", "ms-time", relTime(s.updatedAt));
      const del = h("button", "ms-del", "\u2715");
      del.title = "\u5220\u9664\u4F1A\u8BDD";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        void confirmDelete(s);
      });
      item.append(name, time, del);
      item.addEventListener("click", async () => {
        if (s.id === activeId) return;
        try {
          await setActive(s.id);
          activeId = s.id;
          render();
          emitSessionChanged("active-changed", s.id);
        } catch (e) {
          toast(e.message || "\u5207\u6362\u5931\u8D25");
        }
      });
      list.appendChild(item);
    }
  };
  const reload = async () => {
    try {
      const [ss, act] = await Promise.all([listSessions(), getActive()]);
      sessions = ss;
      activeId = act;
      render();
    } catch {
    }
  };
  async function confirmDelete(s) {
    const tools = window.__uiTools__;
    const doDel = async () => {
      try {
        await removeSession(s.id);
        await reload();
        emitSessionChanged("deleted", s.id);
        toast("\u5DF2\u5220\u9664\u4F1A\u8BDD");
      } catch (e) {
        toast(e.message || "\u5220\u9664\u5931\u8D25");
      }
    };
    if (tools) tools.modal({ title: "\u5220\u9664\u4F1A\u8BDD", desc: `\u786E\u5B9A\u5220\u9664\u4F1A\u8BDD\u300C${s.title}\u300D\u5417?\u5176\u5168\u90E8\u6D88\u606F\u5C06\u4E00\u5E76\u5220\u9664\u3002`, onOk: () => {
      void doDel();
    } });
    else {
      void doDel();
    }
  }
  addBtn.addEventListener("click", async () => {
    try {
      const s = await createSession();
      await setActive(s.id);
      await reload();
      emitSessionChanged("active-changed", s.id);
    } catch (e) {
      toast(e.message || "\u65B0\u5EFA\u5931\u8D25");
    }
  });
  const onSessionChanged = () => {
    void reload();
  };
  window.addEventListener("st:session-changed", onSessionChanged);
  void reload();
  root.dispose = () => {
    window.removeEventListener("st:session-changed", onSessionChanged);
  };
  return root;
}

// src/web.tsx
var navTimer;
var webPlugin = {
  name: "sessions",
  mount() {
    if (navTimer) {
      clearInterval(navTimer);
      navTimer = void 0;
    }
    const tryRegister = () => {
      const slots = window.__uiSlots__;
      const tools = window.__uiTools__;
      if (!slots || !tools) return false;
      slots.register("sidebar-right", {
        name: "sessions",
        render(el) {
          const panel = createSessionPanel((m) => tools.toast(m));
          el.appendChild(panel);
        }
      });
      return true;
    };
    if (tryRegister()) return;
    navTimer = setInterval(() => {
      if (tryRegister()) {
        clearInterval(navTimer);
        navTimer = void 0;
      }
    }, 200);
  },
  unmount() {
    if (navTimer) {
      clearInterval(navTimer);
      navTimer = void 0;
    }
    const slots = window.__uiSlots__;
    slots?.unregister("sidebar-right", "sessions");
  }
};
var web_default = webPlugin;
module.exports = module.exports.default

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
function listMessages() {
  return apiFetch("/api/chat/messages").then((r) => r.data);
}
async function sendText(text) {
  const r = await apiFetch("/api/chat/send", { method: "POST", body: JSON.stringify({ text }) });
  return r.data.reply;
}
function getActiveSession() {
  return apiFetch("/api/session/active").then((r) => r.data);
}

// src/ui/style.ts
var STYLE_ID = "chat-plugin-style";
function injectChatStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.chat-page { position: absolute; inset: 0; display: flex; flex-direction: column; min-height: 0; font-family: system-ui, "Microsoft YaHei", sans-serif; color: var(--ui-text, #444); }
.chat-page .chat-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--ui-border, #e0e0e0); }
.chat-page .chat-head .chat-badge { font-size: 11px; font-weight: 400; color: var(--ui-text-muted, #888); border: 1px solid var(--ui-border, #e0e0e0); border-radius: 999px; padding: 1px 8px; }
.chat-page .chat-list { flex: 1; min-height: 0; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.chat-page .msg-row { display: flex; width: 100%; }
.chat-page .msg-row.ai { justify-content: flex-start; }
.chat-page .msg-row.user { justify-content: flex-end; }
.chat-page .msg-row .bubble { max-width: 78%; padding: 8px 12px; line-height: 1.6; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
.chat-page .msg-row.ai .bubble { background: var(--ui-accent-soft, #f0f0f0); color: var(--ui-text, #444); border-radius: var(--ui-radius-m, 6px); border-top-left-radius: var(--ui-radius-s, 4px); }
.chat-page .msg-row.user .bubble { background: var(--ui-accent, #333); color: var(--ui-on-accent, #fff); border-radius: var(--ui-radius-m, 6px); border-top-right-radius: var(--ui-radius-s, 4px); }
.chat-page .msg-empty { margin: auto; color: var(--ui-text-muted, #888); font-size: 13px; text-align: center; }
.chat-page .msg-error { justify-content: center; color: var(--ui-danger, #d9534f); font-size: 12px; text-align: center; }
.chat-page .chat-composer { border-top: 1px solid var(--ui-border, #e0e0e0); padding: 10px 12px; display: flex; gap: 8px; align-items: flex-end; }
.chat-page .chat-composer textarea { flex: 1; resize: none; height: 64px; padding: 8px 10px; font: inherit; font-size: 13px; line-height: 1.5; color: var(--ui-text, #444); background: var(--ui-surface, #fff); border: 1px solid var(--ui-border, #e0e0e0); border-radius: var(--ui-radius-m, 6px); outline: none; box-sizing: border-box; }
.chat-page .chat-composer textarea:focus { border-color: var(--ui-accent, #333); box-shadow: 0 0 0 3px var(--ui-accent-ring, rgba(51,51,51,.15)); }
.chat-page .chat-composer textarea::placeholder { color: var(--ui-text-muted, #888); }
.chat-page .chat-composer .send-btn { padding: 8px 16px; font-size: 13px; cursor: pointer; background: var(--ui-accent, #333); color: var(--ui-on-accent, #fff); border: none; border-radius: var(--ui-radius-m, 6px); }
.chat-page .chat-composer .send-btn:disabled { opacity: .5; cursor: default; }
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
function createChatPanel() {
  injectChatStyle();
  const root = h("div", "chat-page");
  const head = h("div", "chat-head");
  const badge = h("span", "chat-badge", "\u591A\u4F1A\u8BDD");
  badge.title = "\u53F3\u4FA7\u5217\u8868\u5207\u6362\u4F1A\u8BDD";
  head.append(h("span", "", "\u5BF9\u8BDD"), badge);
  const list = h("div", "chat-list");
  const empty = h("div", "msg-empty", "\u5F00\u59CB\u7B2C\u4E00\u6BB5\u5BF9\u8BDD\u5427");
  list.appendChild(empty);
  const scrollBottom = () => {
    list.scrollTop = list.scrollHeight;
  };
  function appendBubble(role, text) {
    if (list.firstChild === empty) list.removeChild(empty);
    const row = h("div", `msg-row ${role}`);
    row.appendChild(h("div", "bubble", text));
    list.appendChild(row);
    scrollBottom();
  }
  function appendError(text) {
    if (list.firstChild === empty) list.removeChild(empty);
    const row = h("div", "msg-row msg-error");
    row.textContent = text;
    list.appendChild(row);
    scrollBottom();
  }
  const loadHistory = async () => {
    try {
      const active = await getActiveSession();
      if (!active) {
        list.textContent = "";
        const tip = h("div", "msg-empty", "\u70B9\u51FB\u53F3\u4FA7 \uFF0B \u65B0\u5EFA\u4F1A\u8BDD");
        list.appendChild(tip);
        return;
      }
      const rows = await listMessages();
      list.textContent = "";
      if (rows.length === 0) {
        list.appendChild(empty);
        return;
      }
      for (const m of rows) {
        const role = m.role === "user" ? "user" : "ai";
        const row = h("div", `msg-row ${role}`);
        row.appendChild(h("div", "bubble", m.content));
        list.appendChild(row);
      }
      scrollBottom();
    } catch (e) {
      list.textContent = "";
      list.appendChild(h("div", "msg-row msg-error", e.message || "\u5386\u53F2\u52A0\u8F7D\u5931\u8D25"));
    }
  };
  void loadHistory();
  const ta = document.createElement("textarea");
  ta.placeholder = "\u8F93\u5165\u6D88\u606F,Enter \u53D1\u9001,Shift+Enter \u6362\u884C\u2026";
  const sendBtn = h("button", "send-btn", "\u53D1\u9001");
  const sending = (on) => {
    sendBtn.disabled = on;
    sendBtn.textContent = on ? "\u53D1\u9001\u4E2D\u2026" : "\u53D1\u9001";
  };
  const doSend = async () => {
    const text = ta.value;
    if (!text.trim()) return;
    ta.value = "";
    appendBubble("user", text);
    sending(true);
    try {
      const reply = await sendText(text);
      appendBubble("ai", reply);
      window.dispatchEvent(new CustomEvent("st:session-changed", { detail: { reason: "message-appended" } }));
    } catch (e) {
      appendError(e.message || "\u53D1\u9001\u5931\u8D25");
    } finally {
      sending(false);
      ta.focus();
    }
  };
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) void doSend();
    }
  });
  sendBtn.addEventListener("click", () => {
    if (!sendBtn.disabled) void doSend();
  });
  const composer = h("div", "chat-composer");
  composer.append(ta, sendBtn);
  root.append(head, list, composer);
  root.reload = loadHistory;
  return root;
}

// src/web.tsx
var navTimer;
var currentPanel = null;
var onSessionChanged = (e) => {
  const reason = e.detail?.reason;
  if (reason === "active-changed" || reason === "deleted") currentPanel?.reload?.();
};
var webPlugin = {
  name: "chat",
  mount() {
    if (navTimer) {
      clearInterval(navTimer);
      navTimer = void 0;
    }
    window.addEventListener("st:session-changed", onSessionChanged);
    const tryRegister = () => {
      const slots = window.__uiSlots__;
      if (!slots) return false;
      slots.register("main", {
        name: "chat",
        render(el) {
          currentPanel = createChatPanel();
          el.appendChild(currentPanel);
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
    window.removeEventListener("st:session-changed", onSessionChanged);
    const slots = window.__uiSlots__;
    slots?.unregister("main", "chat");
    currentPanel = null;
  }
};
var web_default = webPlugin;
module.exports = module.exports.default

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

// src/ui/state.ts
function createPanelState() {
  return { forms: [], currentId: null, expandedId: null, topOrder: [], childOrder: {}, dirtyOrder: false };
}
function fallback(forms, currentId) {
  if (currentId && forms.some((f) => f.id === currentId)) return currentId;
  return forms.length > 0 ? forms[0].id : null;
}
function applyList(s, forms) {
  return { ...s, forms, currentId: fallback(forms, s.currentId) };
}
function upsertForm(s, row) {
  const idx = s.forms.findIndex((f) => f.id === row.id);
  const forms = idx >= 0 ? s.forms.map((f, i) => i === idx ? row : f) : [...s.forms, row];
  return { ...s, forms };
}
function removeForm(s, id) {
  const forms = s.forms.filter((f) => f.id !== id);
  const currentId = s.currentId === id ? fallback(forms, null) : s.currentId;
  return { ...s, forms, currentId, expandedId: s.expandedId === id || s.currentId === id ? null : s.expandedId };
}
function selectForm(s, id) {
  if (!s.forms.some((f) => f.id === id)) return s;
  return { ...s, currentId: id };
}
function setExpand(s, id) {
  return { ...s, expandedId: id };
}
function toggleExpand(s, id) {
  return { ...s, expandedId: s.expandedId === id ? null : id };
}
function toTree(entries) {
  const top = [];
  const childrenByParent = {};
  const isChild2 = (e) => typeof e.base === "string";
  for (const e of entries) {
    if (isChild2(e)) {
      const arr = childrenByParent[e.base] ?? [];
      arr.push(e);
      childrenByParent[e.base] = arr;
    } else {
      top.push(e);
    }
  }
  return { top, childrenByParent };
}

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
function listForms() {
  return apiFetch("/api/prompt/forms").then((r) => r.data);
}
function createForm(name) {
  return apiFetch("/api/prompt/forms", { method: "POST", body: JSON.stringify({ name }) }).then((r) => r.data);
}
function renameForm(id, name) {
  return apiFetch(`/api/prompt/forms/${id}`, { method: "PUT", body: JSON.stringify({ name }) }).then(() => void 0);
}
function deleteForm(id) {
  return apiFetch(`/api/prompt/forms/${id}`, { method: "DELETE" }).then(() => void 0);
}
function listEntries(formId) {
  return apiFetch(`/api/prompt/forms/${formId}/entries`).then((r) => r.data);
}
function createEntry(formId, input) {
  return apiFetch(`/api/prompt/forms/${formId}/entries`, { method: "POST", body: JSON.stringify(input) }).then((r) => r.data);
}
function updateEntry(formId, entryId, input) {
  return apiFetch(`/api/prompt/forms/${formId}/entries/${entryId}`, { method: "PUT", body: JSON.stringify(input) }).then(() => void 0);
}
function deleteEntry(formId, entryId) {
  return apiFetch(`/api/prompt/forms/${formId}/entries/${entryId}`, { method: "DELETE" }).then(() => void 0);
}
function saveLayout(formId, layout) {
  return apiFetch(`/api/prompt/forms/${formId}/order`, { method: "PUT", body: JSON.stringify(layout) }).then(() => void 0);
}
function sendPrompt(formId) {
  return apiFetch(`/api/prompt/forms/${formId}/send`, { method: "POST", body: JSON.stringify({}) }).then((r) => r.data);
}

// src/messages.ts
function isGroup(e) {
  return e.kind === "group";
}
function isChild(e) {
  return typeof e.base === "string";
}
function isPlain(e) {
  return !isGroup(e) && !isChild(e);
}

// src/ui/style.ts
var STYLE_ID = "prompt-plugin-style";
var CSS = `
.prp .row-preset{display:flex;align-items:center;gap:8px;margin-bottom:14px;border:1px solid #e4e4e7;border-radius:8px;padding:4px 10px;background:#f4f4f5;flex-wrap:wrap}
.prp .row-preset select{flex:1;min-width:0;padding:7px 26px 7px 8px;font-size:13px;font-weight:500;border:none;background:transparent;color:#18181b;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none}
.prp .row-preset input{flex:1;min-width:0;padding:7px 10px;font-size:13px;border:1px solid #d4d4d8;border-radius:6px;background:#fff;color:#18181b;outline:none}
.prp .text-btn{padding:5px 9px;font-size:12px;font-weight:500;border:1px solid transparent;border-radius:6px;background:transparent;color:#52525b;cursor:pointer;white-space:nowrap}
.prp .text-btn:hover{background:#fff;border-color:#d4d4d8;color:#18181b}
.prp .text-btn.danger{color:#d9534f}
.prp .text-btn.danger:hover{background:#fef3f2;border-color:#f1b6b3}
.prp .pid{font-size:11px;color:#a1a1aa;background:#fff;padding:3px 8px;border-radius:20px;border:1px solid #e4e4e7;font-family:monospace;white-space:nowrap}
.prp .row-actions{display:flex;gap:8px;margin-bottom:12px}
.prp .row-actions button{flex:1;padding:8px 10px;font-size:12px;font-weight:500;border-radius:6px;border:1px solid #d4d4d8;background:#fff;color:#18181b;cursor:pointer}
.prp .row-actions button:hover{background:#f4f4f5}
.prp .row-actions button.danger{color:#d9534f}
.prp .row-actions button.danger:hover{background:#fef3f2;border-color:#f1b6b3}
.prp .row-actions button:disabled{opacity:.5;cursor:not-allowed}
.prp .fg{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.prp .fg>label{font-size:13px;font-weight:500;color:#18181b}
.prp .fg input,.prp .fg select,.prp .fg textarea{width:100%;padding:10px 14px;font-size:13px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;outline:none;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.prp .fg textarea{resize:vertical;min-height:120px;line-height:1.6}
.prp .entry-list{display:flex;flex-direction:column;gap:8px}
.prp .entry-item{display:flex;align-items:center;gap:8px;border:1px solid #e4e4e7;border-radius:8px;padding:6px 10px;background:#fff}
.prp .entry-item:hover{border-color:#d4d4d8}
.prp .entry-name{font-size:13.5px;font-weight:500;color:#18181b;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prp .entry-role{font-size:11px;color:#a1a1aa;background:#f4f4f5;border:1px solid #e4e4e7;padding:2px 8px;border-radius:20px;flex-shrink:0;font-family:monospace}
.prp .entry-spacer{flex:1}
.prp .row-bottom{display:flex;align-items:center;gap:10px;margin-top:18px;border-top:1px solid #e4e4e7;padding-top:16px}
.prp .send-btn{padding:9px 18px;font-size:13px;font-weight:600;border:1px solid #18181b;border-radius:8px;background:#18181b;color:#fff;cursor:pointer}
.prp .send-btn:hover{background:#3f3f46}
.prp .send-btn:disabled{opacity:.45;cursor:not-allowed}
.prp .empty-state{text-align:center;padding:28px 12px;color:#a1a1aa;font-size:13px}
.prp.overlay{position:fixed;inset:0;background:rgba(0,0,0,.28);z-index:10020;display:flex;align-items:center;justify-content:center;padding:20px}
.prp .float-modal{background:#fff;border:1px solid #e0e0e0;box-shadow:0 4px 16px rgba(0,0,0,.12);border-radius:6px;width:min(480px,94vw);display:flex;flex-direction:column;max-height:86vh;overflow:hidden}
.prp .float-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eee}
.prp .float-head b{font-size:14px;color:#18181b}
.prp .float-head .x{width:22px;height:22px;border-radius:50%;border:none;background:#f0f0f0;color:#888;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}
.prp .float-body{padding:16px;overflow:auto;flex:1;font-size:13px;color:#334155;line-height:1.7}
.prp .float-foot{display:flex;gap:10px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eee}
.prp .float-foot button{border:none;border-radius:40px;padding:9px 22px;font-size:12px;font-weight:600;cursor:pointer}
.prp .float-foot .s{background:#fff;color:#666;border:1px solid #ccc}
.prp .float-foot .p{background:#333;color:#fff;border:1px solid #333}
.prp .float-foot .d{background:#fff;color:#d9534f;border:1px solid #f1b6b3}
.prp .confirm-t{text-align:center;font-size:14px;font-weight:600;color:#18181b}
.prp .confirm-d{text-align:center;font-size:12.5px;color:#71717a;line-height:1.7;margin-top:6px;word-break:break-all}
.prp .result-meta{background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:8px 12px;font-size:12px;line-height:1.7;color:#52525b;white-space:pre-wrap;word-break:break-all;max-height:130px;overflow:auto;margin-bottom:12px}
.prp .result-body{background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:12px 14px;font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:1.6;color:#18181b;overflow:auto;white-space:pre-wrap;word-break:break-all;min-height:180px;flex:1}
.prp .status-row{display:flex;align-items:center;gap:8px;margin-left:auto}
.prp .status-dot{width:10px;height:10px;border-radius:50%;background:#d4d4d8;transition:background .2s}
.prp .status-dot.success{background:#18181b}
.prp .status-dot.error{background:#d9534f}
.prp .status-text{font-size:12px;color:#52525b}
.prp .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.prp .entry-wrap{display:block}
.prp .entry-head{display:flex;align-items:center;gap:8px;border:1px solid #e4e4e7;border-radius:8px;padding:6px 10px;background:#fff}
.prp .entry-head:hover{border-color:#d4d4d8}
.prp .drag-handle{cursor:grab;color:#c9c9cf;font-size:12px;user-select:none;flex-shrink:0;padding:0 2px}
.prp .drag-handle:active{cursor:grabbing}
.prp .pid-empty{flex-shrink:0}
.prp .entry-detail{margin:2px 0 8px 22px;padding:8px 10px;background:#fafafa;border:1px solid #ececec;border-radius:8px}
.prp .detail-label{display:block;font-size:12px;color:#8a8a92;margin:4px 0}
.prp .detail-text{font-size:12px;color:#6b6b73;white-space:pre-wrap;word-break:break-all;max-height:96px;overflow:auto;background:#fff;border:1px solid #efefef;border-radius:6px;padding:6px 8px;margin-bottom:6px}
.prp .block-list{display:block}
.prp .block-row{display:flex;align-items:flex-start;gap:6px;margin:4px 0;background:#fff;border:1px solid #f0f0f0;border-radius:6px;padding:4px}
.prp .block-row:hover{border-color:#e0e0e0}
.prp .block-textarea{flex:1;min-height:44px;resize:vertical;font-family:inherit;font-size:12px;line-height:1.6;border:1px solid #e4e4e9;border-radius:6px;padding:5px 7px;background:#fff}
.prp .block-textarea:focus{outline:none;border-color:#b9b9c2}
.prp .dashed-btn{border:1px dashed #c9c9cf;background:none;color:#6b6b73;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;margin-top:6px}
.prp .dashed-btn:hover{background:#f4f4f5;color:#18181b}
.prp .block-empty{font-size:12px;color:#a1a1aa;padding:8px 4px;text-align:center}
.prp .wizard-tip{font-size:12px;color:#8a8a92;margin-bottom:8px}
.prp .wizard-opt{display:block;width:100%;text-align:left;border:1px solid #e4e4e9;background:#fff;border-radius:8px;padding:10px 12px;cursor:pointer;font-size:13px;color:#333;margin-bottom:6px}
.prp .wizard-opt:hover{border-color:#b9b9c2;background:#fafafa}
.prp .entry-list.prp-dragging .entry-head,.prp .block-list.prp-dragging .block-row{transition:transform .12s ease}
.prp .drag-ghost{opacity:.85;box-shadow:0 6px 18px rgba(0,0,0,.12);z-index:20;position:relative}
.prp .save-order-btn{margin-left:0;padding:9px 18px;font-size:13px;font-weight:600;border:1px dashed #71717a;border-radius:8px;background:#fff;color:#52525b;cursor:pointer}
.prp .save-order-btn:hover:not(:disabled){background:#f4f4f5;border-style:solid}
.prp .save-order-btn:disabled{opacity:.45;cursor:not-allowed}
.prp .child-preview{flex:1;min-width:0;font-size:12px;color:#71717a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.6;padding-top:6px}
.prp .block-row .entry-name{flex-shrink:0;max-width:140px}
`;
function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

// src/ui/dom.ts
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function button(className, text, onClick) {
  const b = el("button", className, text);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

// src/ui/layers.ts
function createLayer(width) {
  const root = document.createElement("div");
  root.className = "prp overlay";
  const modal = document.createElement("div");
  modal.className = "prp float-modal";
  modal.style.width = width;
  root.appendChild(modal);
  function close() {
    document.removeEventListener("keydown", onKey);
    root.remove();
  }
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  root.addEventListener("click", (e) => {
    if (e.target === root) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(root);
  return { root, modal, close };
}
function headOf(modal, title, close) {
  const head = document.createElement("div");
  head.className = "prp float-head";
  const b = document.createElement("b");
  b.textContent = title;
  const x = document.createElement("button");
  x.className = "x";
  x.textContent = "\u2715";
  x.title = "\u5173\u95ED";
  x.addEventListener("click", close);
  head.append(b, x);
  modal.appendChild(head);
}
function footOf(modal, actions) {
  const foot = document.createElement("div");
  foot.className = "prp float-foot";
  for (const a of actions) {
    const btn = document.createElement("button");
    btn.className = a.variant;
    btn.textContent = a.label;
    btn.type = "button";
    btn.addEventListener("click", a.onClick);
    foot.appendChild(btn);
  }
  modal.appendChild(foot);
}

// src/ui/sub-modal.ts
function openEntryEditor(opts) {
  const { modal, close } = createLayer("min(520px,94vw)");
  headOf(modal, opts.title, close);
  const body = el("div", "prp float-body");
  const fg = (label, control) => {
    const w = el("div", "prp fg");
    const l = document.createElement("label");
    l.textContent = label;
    w.append(l, control);
    return w;
  };
  const nameInput = el("input");
  nameInput.value = opts.entry.name;
  nameInput.maxLength = 50;
  body.append(fg("\u540D\u79F0", nameInput));
  let roleValue = opts.entry.role;
  if (opts.withRole) {
    const roleSelect = document.createElement("select");
    for (const r of ["system", "assistant", "user"]) {
      const o = document.createElement("option");
      o.value = r;
      o.textContent = r;
      roleSelect.appendChild(o);
    }
    roleSelect.value = opts.entry.role ?? "user";
    roleSelect.addEventListener("change", () => {
      roleValue = roleSelect.value;
    });
    body.append(fg("\u89D2\u8272 (role)", roleSelect));
  }
  let textValue = opts.entry.text ?? "";
  if (opts.withText) {
    const textArea = el("textarea");
    textArea.value = textValue;
    textArea.addEventListener("input", () => {
      textValue = textArea.value;
    });
    body.append(fg("\u5185\u5BB9 (text)", textArea));
  }
  modal.appendChild(body);
  footOf(modal, [
    { label: "\u53D6\u6D88", variant: "s", onClick: close },
    {
      label: "\u4FDD\u5B58",
      variant: "p",
      onClick: async () => {
        try {
          const draft = { name: nameInput.value.trim() };
          if (roleValue) draft.role = roleValue;
          if (opts.withText) draft.text = textValue;
          await opts.onSave(draft);
          close();
        } catch {
        }
      }
    }
  ]);
  setTimeout(() => nameInput.focus(), 30);
}
function openGroupCreator(opts) {
  openEntryEditor({
    title: opts.title,
    entry: { name: "\u65B0\u6761\u76EE", role: "user", text: "" },
    withRole: true,
    withText: false,
    onSave: (input) => {
      if (!input.name) throw new Error("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
      return opts.onSave({ name: input.name, role: input.role ?? "user" });
    }
  });
}
function openChildCreator(opts) {
  openEntryEditor({
    title: "\u65B0\u5EFA\u5B50\u6761\u76EE",
    entry: { name: "\u65B0\u5B50\u6761\u76EE", text: "" },
    withRole: false,
    withText: true,
    onSave: (input) => opts.onSave({ name: input.name, text: input.text ?? "" })
  });
}
function openChildEditor(opts) {
  openEntryEditor({
    title: "\u7F16\u8F91\u5B50\u6761\u76EE",
    entry: opts.entry,
    withRole: false,
    withText: true,
    onSave: (input) => opts.onSave({ name: input.name, text: input.text ?? "" })
  });
}

// src/ui/confirm.ts
function confirmDialog(opts) {
  const { root, modal, close } = createLayer("min(360px,90vw)");
  const body = el("div", "prp float-body");
  const t = el("div", "prp confirm-t", opts.title);
  const d = el("div", "prp confirm-d", opts.desc);
  body.append(t, d);
  modal.appendChild(body);
  footOf(modal, [
    { label: "\u53D6\u6D88", variant: "s", onClick: close },
    { label: "\u5220\u9664", variant: "d", onClick: () => {
      opts.onOk();
      close();
    } }
  ]);
  void root;
}

// src/ui/result-modal.ts
function openResult(metaText, payload) {
  const { modal, close } = createLayer("min(680px,94vw)");
  headOf(modal, "\u53D1\u9001\u7ED3\u679C", close);
  const body = el("div", "prp float-body");
  body.style.display = "flex";
  body.style.flexDirection = "column";
  const meta = el("div", "prp result-meta", metaText);
  const pre = el("pre", "prp result-body");
  pre.textContent = JSON.stringify(payload, null, 2);
  body.append(meta, pre);
  modal.appendChild(body);
  footOf(modal, [{ label: "\u5173\u95ED", variant: "s", onClick: close }]);
}

// src/ui/drag.ts
function siblings(container) {
  return [...container.children].filter((c) => c instanceof HTMLElement);
}
function attachDrag(opts) {
  const { handle, item, container } = opts;
  let dragging = false;
  let raf = 0;
  let prevY = -1;
  const onMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const y = e.clientY;
    if (y === prevY) return;
    prevY = y;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const items = siblings(container);
      const cur = items.indexOf(item);
      if (cur < 0) return;
      const box = container.getBoundingClientRect();
      const rel = y - box.top;
      const len = items.length;
      let up = false;
      let down = false;
      if (cur > 0) {
        const prevBox = items[cur - 1].getBoundingClientRect();
        up = rel < prevBox.top + prevBox.height / 2;
      }
      if (!up && cur < len - 1) {
        const nextBox = items[cur + 1].getBoundingClientRect();
        down = rel > nextBox.top + nextBox.height / 2;
      }
      if (up) container.insertBefore(item, items[cur - 1]);
      else if (down) container.insertBefore(item, items[cur + 1].nextSibling);
    });
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    cancelAnimationFrame(raf);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.body.style.userSelect = "";
    item.classList.remove("prp-drag-ghost");
    container.classList.remove("prp-dragging");
    opts.onDrop(siblings(container));
  };
  const onDown = (e) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (dragging) return;
    dragging = true;
    prevY = -1;
    container.classList.add("prp-dragging");
    item.classList.add("prp-drag-ghost");
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };
  handle.addEventListener("mousedown", onDown);
  return () => {
    handle.removeEventListener("mousedown", onDown);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };
}

// src/ui/panel.ts
function createPanel(toast) {
  ensureStyle();
  const root = el("div", "prp");
  let state = createPanelState();
  let rows = [];
  let savingOrder = false;
  const toastError = (e) => toast(e?.message || "\u64CD\u4F5C\u5931\u8D25");
  const formBar = el("div", "prp row-preset");
  const actionsRow = el("div", "prp row-actions");
  const entriesLabel = el("label");
  entriesLabel.textContent = "\u6761\u76EE(\u7236\u6761\u76EE\u805A\u5408\u5176\u5B50\u6761\u76EE\u7EC4\u6210\u4E00\u6761\u6D88\u606F)";
  const listBox = el("div", "prp entry-list");
  const entriesWrap = el("div", "prp fg");
  entriesWrap.append(entriesLabel, listBox);
  const sendBtn = button("prp send-btn", "\u53D1\u9001 Prompt", () => void doSend());
  sendBtn.disabled = true;
  const saveOrderBtn = button("prp save-order-btn", "\u4FDD\u5B58\u987A\u5E8F", () => void doSaveOrder());
  saveOrderBtn.disabled = true;
  const beta = el("span", "prp pid", "\u6D4B\u8BD5\u7248");
  const dot = el("span", "prp status-dot");
  const statusText = el("span", "prp status-text", "\u5C31\u7EEA");
  const statusRow = el("div", "prp status-row");
  statusRow.append(dot, statusText);
  const sendRow = el("div", "prp row-bottom");
  sendRow.append(sendBtn, saveOrderBtn, beta, statusRow);
  root.append(formBar, actionsRow, entriesWrap, sendRow);
  const setStatus = (msg, type) => {
    dot.className = "prp status-dot" + (type === "success" ? " success" : type === "error" ? " error" : "");
    statusText.textContent = msg;
    if (type !== "idle") setTimeout(() => {
      statusText.textContent = "\u5C31\u7EEA";
    }, 3e3);
  };
  const current = () => state.forms.find((f) => f.id === state.currentId) ?? null;
  function curId() {
    const cur = current();
    if (!cur) throw new Error("\u8BF7\u5148\u65B0\u5EFA\u4E00\u4E2A\u8868\u5355");
    return cur.id;
  }
  async function refreshAll() {
    const cur = current();
    if (!cur) {
      renderEmpty("\u6682\u65E0\u8868\u5355,\u70B9\u51FB\u300C\u65B0\u5EFA\u8868\u5355\u300D\u5F00\u59CB");
      updateSendAndSave();
      return;
    }
    try {
      rows = await listEntries(cur.id);
      if (!state.dirtyOrder) {
        const { top } = toTree(rows);
        state = { ...state, topOrder: top.map((e) => e.id), childOrder: childOrderOf(rows) };
      }
      renderList();
    } catch (e) {
      renderEmpty("\u6761\u76EE\u52A0\u8F7D\u5931\u8D25:" + (e?.message ?? e));
    }
    updateSendAndSave();
  }
  function childOrderOf(list) {
    const out = {};
    for (const e of list) {
      if (isGroup(e)) out[e.id] = [...e.children];
    }
    return out;
  }
  function renderEmpty(msg) {
    listBox.innerHTML = "";
    listBox.appendChild(el("div", "prp empty-state", msg));
  }
  function renderList() {
    const { top, childrenByParent } = toTree(rows);
    listBox.innerHTML = "";
    if (top.length === 0) {
      listBox.appendChild(el("div", "prp empty-state", "\u5F53\u524D\u8868\u5355\u6CA1\u6709\u6761\u76EE,\u70B9\u51FB\u300C\u65B0\u5EFA\u6761\u76EE\u300D\u6DFB\u52A0"));
      return;
    }
    for (const e of top) {
      const wrap = renderTopRow(e, childrenByParent);
      listBox.appendChild(wrap);
      bindTopDrag(wrap, e);
    }
  }
  function renderTopRow(e, childrenByParent) {
    const wrap = el("div", "prp entry-wrap");
    wrap.dataset.entryId = e.id;
    const head = el("div", "prp entry-head");
    const handle = el("span", "prp drag-handle", "\u22EE\u22EE");
    handle.title = "\u62D6\u52A8\u6392\u5E8F(\u7EAF\u524D\u7AEF,\u70B9\u300C\u4FDD\u5B58\u987A\u5E8F\u300D\u63D0\u4EA4)";
    const name = el("span", "prp entry-name", e.name);
    name.title = e.name;
    const group = isGroup(e);
    const role = el("span", "prp entry-role", isGroup(e) ? e.role : isPlain(e) ? e.role : "");
    const expanded = state.expandedId === e.id;
    const caretBtn = button("prp text-btn", "", () => {
      if (group) void doToggleExpand(e.id);
    });
    caretBtn.textContent = group ? expanded ? "\u6536\u8D77" : "\u5C55\u5F00" : "";
    if (!group) caretBtn.style.visibility = "hidden";
    const segPid = group ? el("span", "prp pid", `${e.children.length} \u5B50`) : el("span", "prp pid-empty");
    const spacer = el("span", "prp entry-spacer");
    const editBtn = button("prp text-btn", "\u7F16\u8F91", () => {
      if (group) {
        openEntryEditor({
          title: "\u7F16\u8F91\u7236\u6761\u76EE",
          entry: { name: e.name, role: e.role },
          withRole: true,
          withText: false,
          onSave: async (input) => {
            if (!input.name) {
              toast("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
              throw new Error("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
            }
            try {
              await updateEntry(curId(), e.id, { name: input.name, role: input.role });
              await refreshAll();
              toast("\u5DF2\u4FDD\u5B58");
            } catch (err) {
              toastError(err);
              throw err;
            }
          }
        });
      } else if (isPlain(e)) {
        openEntryEditor({
          title: "\u7F16\u8F91\u6761\u76EE",
          entry: { name: e.name, role: e.role, text: e.text },
          withRole: true,
          withText: true,
          onSave: async (input) => {
            if (!input.name) {
              toast("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
              throw new Error("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
            }
            try {
              await updateEntry(curId(), e.id, { name: input.name, role: input.role, text: input.text });
              await refreshAll();
              toast("\u5DF2\u4FDD\u5B58");
            } catch (err) {
              toastError(err);
              throw err;
            }
          }
        });
      }
    });
    const delBtn = button("prp text-btn danger", "\u5220\u9664", () => {
      const children = group ? e.children.length : 0;
      confirmDialog({
        title: group ? "\u5220\u9664\u7236\u6761\u76EE" : "\u5220\u9664\u6761\u76EE",
        desc: group && children > 0 ? `\u786E\u5B9A\u8981\u5220\u9664\u7236\u6761\u76EE\u300C${e.name}\u300D\u53CA\u5176 ${children} \u4E2A\u5B50\u6761\u76EE\u5417?\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002` : `\u786E\u5B9A\u8981\u5220\u9664${group ? "\u7236\u6761\u76EE" : "\u6761\u76EE"}\u300C${e.name}\u300D\u5417?`,
        onOk: () => {
          void (async () => {
            try {
              await deleteEntry(curId(), e.id);
              await refreshAll();
              toast("\u5DF2\u5220\u9664");
            } catch (err) {
              toastError(err);
            }
          })();
        }
      });
    });
    head.append(handle, name, role, segPid, caretBtn, spacer, editBtn, delBtn);
    wrap.appendChild(head);
    if (group && expanded) {
      const children = childrenByParent[e.id] ?? [];
      wrap.appendChild(renderDetail(e, children));
    }
    return wrap;
  }
  function renderDetail(g, children) {
    const detail = el("div", "prp entry-detail");
    const label = el("label", "prp detail-label");
    label.textContent = `\u5B50\u6761\u76EE(${children.length})\u2014\u2014 role \u53D6\u7236\u6761\u76EE ${g.role},text \u6309\u5E8F\u62FC\u5165\u7236\u5185\u5BB9`;
    detail.append(label);
    const childList = el("div", "prp block-list");
    if (children.length === 0) {
      childList.appendChild(el("div", "prp block-empty", "\u6682\u65E0\u5B50\u6761\u76EE,\u70B9\u51FB\u4E0B\u65B9\u300C\u65B0\u5EFA\u5B50\u6761\u76EE\u300D"));
    } else {
      for (const c of children) {
        const rowEl = renderChildRow(g, c);
        childList.appendChild(rowEl);
        bindChildDrag(rowEl, g);
      }
    }
    detail.append(childList);
    detail.appendChild(button("prp dashed-btn", "\u65B0\u5EFA\u5B50\u6761\u76EE", () => void doCreateChild(g)));
    return detail;
  }
  function renderChildRow(g, c) {
    const rowEl = el("div", "prp block-row");
    rowEl.dataset.blockId = c.id;
    const handle = el("span", "prp drag-handle", "\u22EE\u22EE");
    handle.title = "\u62D6\u52A8\u6392\u5E8F(\u7EAF\u524D\u7AEF,\u70B9\u300C\u4FDD\u5B58\u987A\u5E8F\u300D\u63D0\u4EA4)";
    const name = el("span", "prp entry-name", c.name);
    const preview = el("span", "prp child-preview", c.text.trim() === "" ? "(\u7A7A)" : c.text);
    preview.title = c.text;
    const editBtn = button("prp text-btn", "\u7F16\u8F91", () => {
      openChildEditor({
        entry: { name: c.name, text: c.text },
        onSave: async (input) => {
          if (!input.name) {
            toast("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
            throw new Error("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
          }
          try {
            await updateEntry(curId(), c.id, { name: input.name, text: input.text });
            await refreshAll();
            toast("\u5DF2\u4FDD\u5B58");
          } catch (err) {
            toastError(err);
            throw err;
          }
        }
      });
    });
    const delBtn = button("prp text-btn danger", "\u5220\u9664", () => {
      confirmDialog({
        title: "\u5220\u9664\u5B50\u6761\u76EE",
        desc: `\u786E\u5B9A\u8981\u5220\u9664\u5B50\u6761\u76EE\u300C${c.name}\u300D\u5417?`,
        onOk: () => {
          void (async () => {
            try {
              await deleteEntry(curId(), c.id);
              await refreshAll();
              toast("\u5DF2\u5220\u9664");
            } catch (err) {
              toastError(err);
            }
          })();
        }
      });
    });
    rowEl.append(handle, name, preview, editBtn, delBtn);
    void g;
    return rowEl;
  }
  function bindTopDrag(w, _e) {
    const h = w.querySelector(".entry-head .drag-handle");
    if (!h) return;
    attachDrag({ handle: h, item: w, container: listBox, onDrop: (items) => {
      const ids = items.map((it) => it.dataset.entryId ?? "").filter((x) => x !== "");
      if (ids.length !== state.topOrder.length) return;
      if (ids.join("|") === state.topOrder.join("|")) return;
      state = { ...state, topOrder: ids, dirtyOrder: true };
      updateSendAndSave();
    } });
  }
  function bindChildDrag(rowEl, g) {
    const h = rowEl.querySelector(".drag-handle");
    if (!h || !rowEl.parentElement) return;
    const container = rowEl.parentElement;
    attachDrag({ handle: h, item: rowEl, container, onDrop: (items) => {
      const ids = items.map((it) => it.dataset.blockId ?? "").filter((x) => x !== "");
      const cur = state.childOrder[g.id] ?? [];
      if (ids.length !== cur.length) return;
      if (ids.join("|") === cur.join("|")) return;
      state = { ...state, childOrder: { ...state.childOrder, [g.id]: ids }, dirtyOrder: true };
      updateSendAndSave();
    } });
  }
  async function doSaveOrder() {
    if (savingOrder) return;
    const cur = current();
    if (!cur || !state.dirtyOrder) return;
    savingOrder = true;
    saveOrderBtn.disabled = true;
    try {
      await saveLayout(cur.id, { entries: state.topOrder, children: state.childOrder });
      state = { ...state, dirtyOrder: false };
      await refreshAll();
      toast("\u5DF2\u4FDD\u5B58\u987A\u5E8F");
    } catch (e) {
      toastError(e);
      state = { ...state, dirtyOrder: false };
      await refreshAll();
    } finally {
      savingOrder = false;
      updateSendAndSave();
    }
  }
  function updateSendAndSave() {
    const cur = current();
    const { childrenByParent } = toTree(rows);
    const hasContent = rows.some((e) => {
      if (isGroup(e)) {
        const children = childrenByParent[e.id] ?? [];
        return children.some((c) => c.text.trim() !== "");
      }
      if (isPlain(e)) return e.text.trim() !== "";
      return false;
    });
    sendBtn.disabled = !cur || !hasContent;
    saveOrderBtn.disabled = !state.dirtyOrder;
  }
  async function doSend() {
    const cur = current();
    if (!cur) return;
    try {
      const payload = await sendPrompt(cur.id);
      openResult("\u5DF2\u53D1\u9001(\u666E\u901A\u6761\u76EE\u72EC\u7ACB\u6210\u6D88\u606F;\u7236\u6761\u76EE\u805A\u5408\u5176\u5B50\u6761\u76EE)", payload);
      setStatus("\u5DF2\u53D1\u9001", "success");
    } catch (e) {
      openResult("\u53D1\u9001\u5931\u8D25", { ok: false, message: e?.message || "\u53D1\u9001\u5931\u8D25" });
      setStatus("\u53D1\u9001\u5931\u8D25", "error");
    }
  }
  function renderBar() {
    formBar.innerHTML = "";
    if (state.forms.length === 0) {
      formBar.appendChild(el("span", "", "\u6682\u65E0\u8868\u5355"));
      return;
    }
    const sel = document.createElement("select");
    for (const f of state.forms) {
      const o = document.createElement("option");
      o.value = f.id;
      o.textContent = f.name;
      if (f.id === state.currentId) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener("change", () => {
      state = selectForm(state, sel.value);
      state = { ...state, expandedId: null, dirtyOrder: false, topOrder: [], childOrder: {} };
      void refreshAll();
      renderBar();
    });
    const cur = current();
    formBar.appendChild(sel);
    if (cur) formBar.appendChild(el("span", "prp pid", `${cur.entryCount} \u4E2A\u6761\u76EE`));
    formBar.appendChild(button("prp text-btn", "\u6539\u540D", () => startRename()));
    formBar.appendChild(button("prp text-btn", "\u65B0\u5EFA\u8868\u5355", () => void doCreateForm()));
  }
  function startRename() {
    const cur = current();
    if (!cur) return;
    formBar.innerHTML = "";
    const input = el("input");
    input.value = cur.name;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void confirmRename(input);
      if (e.key === "Escape") renderBar();
    });
    formBar.append(input, button("prp text-btn", "\u786E\u5B9A", () => void confirmRename(input)), button("prp text-btn", "\u53D6\u6D88", () => renderBar()));
    input.focus();
    input.select();
  }
  async function confirmRename(input) {
    const cur = current();
    if (!cur) return;
    const name = input.value.trim();
    if (!name) {
      toast("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
      return;
    }
    try {
      await renameForm(cur.id, name);
      state = upsertForm(state, { ...cur, name });
      renderBar();
      toast("\u5DF2\u66F4\u65B0\u8868\u5355\u540D\u79F0");
    } catch (e) {
      toastError(e);
    }
  }
  function defaultFormName() {
    const base = "\u65B0\u9884\u8BBE";
    const names = new Set(state.forms.map((f) => f.name));
    let n = 1;
    while (names.has(base + (n > 1 ? " " + n : ""))) n++;
    return n > 1 ? base + " " + n : base;
  }
  async function doCreateForm() {
    const name = defaultFormName();
    try {
      const { id } = await createForm(name);
      state = selectForm(upsertForm(state, { id, name, entryCount: 0 }), id);
      state = { ...state, expandedId: null, dirtyOrder: false, topOrder: [], childOrder: {} };
      await refreshAll();
      renderBar();
      renderActions();
      toast("\u5DF2\u521B\u5EFA\u65B0\u8868\u5355");
    } catch (e) {
      toastError(e);
    }
  }
  function renderActions() {
    actionsRow.innerHTML = "";
    const hasForm = state.forms.length > 0;
    const newEntryBtn = button("", "\u65B0\u5EFA\u6761\u76EE", () => doCreateEntryWizard());
    const deleteFormBtn = button("danger", "\u5220\u9664\u8868\u5355", () => confirmDeleteForm());
    newEntryBtn.disabled = !hasForm;
    deleteFormBtn.disabled = !hasForm;
    actionsRow.append(newEntryBtn, deleteFormBtn);
  }
  function doCreateEntryWizard() {
    if (!current()) {
      toast("\u8BF7\u5148\u65B0\u5EFA\u4E00\u4E2A\u8868\u5355");
      return;
    }
    askEntryKind();
  }
  function askEntryKind() {
    const { modal, close } = createLayer("min(380px,90vw)");
    headOf(modal, "\u65B0\u5EFA\u6761\u76EE", close);
    const body = el("div", "prp float-body");
    body.appendChild(el("div", "prp wizard-tip", "\u8BF7\u9009\u62E9\u8981\u521B\u5EFA\u7684\u6761\u76EE\u7C7B\u578B"));
    const plainBtn = document.createElement("button");
    plainBtn.className = "prp wizard-opt";
    plainBtn.type = "button";
    plainBtn.textContent = "\u666E\u901A\u6761\u76EE(\u72EC\u7ACB\u6210\u4E00\u6761\u6D88\u606F)";
    plainBtn.addEventListener("click", () => {
      close();
      void createPlainEntry();
    });
    const groupBtn = document.createElement("button");
    groupBtn.className = "prp wizard-opt";
    groupBtn.type = "button";
    groupBtn.textContent = "\u7236\u6761\u76EE(\u5360\u4F4D,\u5B50\u6761\u76EE\u805A\u5408\u4E3A\u4E00\u6761\u6D88\u606F)";
    groupBtn.addEventListener("click", () => {
      close();
      createGroupEntry();
    });
    body.append(plainBtn, groupBtn);
    modal.appendChild(body);
    footOf(modal, [{ label: "\u53D6\u6D88", variant: "s", onClick: close }]);
    setTimeout(() => plainBtn.focus(), 30);
  }
  async function createPlainEntry() {
    const id = curId();
    try {
      const { entryId } = await createEntry(id, { name: "\u65B0\u6761\u76EE", role: "user", text: "" });
      await refreshAll();
      const created = rows.find((r) => r.id === entryId);
      if (created && isPlain(created)) {
        openEntryEditor({
          title: "\u7F16\u8F91\u6761\u76EE",
          entry: { name: created.name, role: created.role, text: created.text },
          withRole: true,
          withText: true,
          onSave: async (input) => {
            if (!input.name) {
              toast("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
              throw new Error("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
            }
            try {
              await updateEntry(id, entryId, { name: input.name, role: input.role, text: input.text });
              await refreshAll();
              toast("\u5DF2\u4FDD\u5B58");
            } catch (err) {
              toastError(err);
              throw err;
            }
          }
        });
      }
    } catch (e) {
      toastError(e);
    }
  }
  function createGroupEntry() {
    const id = curId();
    openGroupCreator({
      title: "\u65B0\u5EFA\u7236\u6761\u76EE(\u9009\u62E9 role \u4F5C\u4E3A\u805A\u5408\u6D88\u606F\u89D2\u8272)",
      onSave: async (input) => {
        try {
          const { entryId } = await createEntry(id, { name: input.name, role: input.role, kind: "group" });
          state = setExpand(state, entryId);
          await refreshAll();
          const addBtn = listBox.querySelector(`.entry-wrap[data-entry-id="${entryId}"] .dashed-btn`);
          addBtn?.focus();
          toast("\u5DF2\u521B\u5EFA\u7236\u6761\u76EE,\u70B9\u51FB\u300C\u65B0\u5EFA\u5B50\u6761\u76EE\u300D\u586B\u5165\u5185\u5BB9");
        } catch (e) {
          toastError(e);
        }
      }
    });
  }
  async function doCreateChild(g) {
    const id = curId();
    openChildCreator({
      onSave: async (input) => {
        try {
          await createEntry(id, { name: input.name, base: g.id, text: input.text });
          await refreshAll();
          toast("\u5DF2\u65B0\u5EFA\u5B50\u6761\u76EE");
        } catch (e) {
          toastError(e);
        }
      }
    });
  }
  async function doToggleExpand(entryId) {
    state = toggleExpand(state, entryId);
    renderList();
  }
  function confirmDeleteForm() {
    const cur = current();
    if (!cur) return;
    confirmDialog({
      title: "\u5220\u9664\u8868\u5355",
      desc: `\u786E\u5B9A\u8981\u5220\u9664\u8868\u5355\u300C${cur.name}\u300D\u53CA\u5176\u6240\u6709\u6761\u76EE\u5417?\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`,
      onOk: () => {
        void (async () => {
          try {
            await deleteForm(cur.id);
            state = removeForm(state, cur.id);
            state = { ...state, dirtyOrder: false, topOrder: [], childOrder: {} };
            await refreshAll();
            renderBar();
            renderActions();
            toast("\u5DF2\u5220\u9664\u8868\u5355");
          } catch (e) {
            toastError(e);
          }
        })();
      }
    });
  }
  void (async () => {
    try {
      state = applyList(state, await listForms());
      renderBar();
      renderActions();
      await refreshAll();
    } catch (e) {
      toastError(e);
    }
  })();
  return root;
}

// src/web.tsx
var navTimer;
var webPlugin = {
  name: "prompt",
  mount() {
    if (navTimer) {
      clearInterval(navTimer);
      navTimer = void 0;
    }
    const tryRegister = () => {
      const slots = window.__uiSlots__;
      const tools = window.__uiTools__;
      if (!slots || !tools) return false;
      slots.register("nav", {
        name: "prompt",
        render(el2) {
          const btn = document.createElement("button");
          btn.textContent = "prompt";
          btn.style.cssText = "border-radius:16px;padding:0 14px;font-size:12px;font-weight:600;color:#18181b;background:#fff;border:1px solid #d4d4d8;cursor:pointer;height:30px;";
          btn.addEventListener("click", () => {
            tools.pluginModal({
              title: "Prompt \u9884\u8BBE",
              source: "prompt",
              content: (c) => {
                c.appendChild(createPanel((m) => tools.toast(m)));
              }
            });
          });
          el2.appendChild(btn);
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
    slots?.unregister("nav", "prompt");
  }
};
var web_default = webPlugin;
module.exports = module.exports.default

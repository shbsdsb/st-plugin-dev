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
  return { forms: [], currentId: null };
}
function fallback(forms, currentId) {
  if (currentId && forms.some((f) => f.id === currentId)) return currentId;
  return forms.length > 0 ? forms[0].id : null;
}
function applyList(s, forms) {
  return { forms, currentId: fallback(forms, s.currentId) };
}
function upsertForm(s, row) {
  const idx = s.forms.findIndex((f) => f.id === row.id);
  const forms = idx >= 0 ? s.forms.map((f, i) => i === idx ? row : f) : [...s.forms, row];
  return { forms, currentId: s.currentId };
}
function removeForm(s, id) {
  const forms = s.forms.filter((f) => f.id !== id);
  const currentId = s.currentId === id ? fallback(forms, null) : s.currentId;
  return { forms, currentId };
}
function selectForm(s, id) {
  if (!s.forms.some((f) => f.id === id)) return s;
  return { forms: s.forms, currentId: id };
}

// src/ui/api.ts
async function apiFetch(path, init) {
  const res = await fetch(path, { headers: { "content-type": "application/json" }, ...init });
  let body = null;
  try {
    body = await res.json();
  } catch {
  }
  if (!res.ok || !body?.ok) {
    throw new Error(body?.message || `HTTP ${res.status}`);
  }
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
function createEntry(formId, input) {
  return apiFetch(`/api/prompt/forms/${formId}/entries`, { method: "POST", body: JSON.stringify(input) }).then((r) => r.data);
}
function listEntries(formId) {
  return apiFetch(`/api/prompt/forms/${formId}/entries`).then((r) => r.data);
}
function updateEntry(formId, entryId, input) {
  return apiFetch(`/api/prompt/forms/${formId}/entries/${entryId}`, { method: "PUT", body: JSON.stringify(input) }).then(() => void 0);
}
function deleteEntry(formId, entryId) {
  return apiFetch(`/api/prompt/forms/${formId}/entries/${entryId}`, { method: "DELETE" }).then(() => void 0);
}
function sendPrompt(formId) {
  return apiFetch(`/api/prompt/forms/${formId}/send`, { method: "POST", body: JSON.stringify({}) }).then((r) => r.data);
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
.prp .overlay{position:fixed;inset:0;background:rgba(0,0,0,.28);z-index:10020;display:flex;align-items:center;justify-content:center;padding:20px}
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
  const { root, modal, close } = createLayer("min(520px,94vw)");
  headOf(modal, "\u7F16\u8F91\u6761\u76EE", close);
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
  const roleSelect = document.createElement("select");
  for (const r of ["system", "assistant", "user"]) {
    const o = document.createElement("option");
    o.value = r;
    o.textContent = r;
    roleSelect.appendChild(o);
  }
  roleSelect.value = opts.entry.role;
  const textArea = el("textarea");
  textArea.value = opts.entry.text;
  body.append(
    fg("\u540D\u79F0", nameInput),
    fg("\u89D2\u8272 (role)", roleSelect),
    fg("\u5185\u5BB9 (text)", textArea)
  );
  modal.appendChild(body);
  footOf(modal, [
    { label: "\u53D6\u6D88", variant: "s", onClick: close },
    {
      label: "\u4FDD\u5B58",
      variant: "p",
      onClick: async () => {
        try {
          await opts.onSave({ name: nameInput.value.trim(), role: roleSelect.value, text: textArea.value });
          close();
        } catch {
        }
      }
    }
  ]);
  setTimeout(() => nameInput.focus(), 30);
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

// src/ui/panel.ts
function createPanel(toast) {
  ensureStyle();
  const root = el("div", "prp");
  let state = createPanelState();
  let rows = [];
  let seq = 0;
  let statusTimer = null;
  const toastError = (e) => toast(e?.message || "\u64CD\u4F5C\u5931\u8D25");
  const formBar = el("div", "prp row-preset");
  const actionsRow = el("div", "prp row-actions");
  const entriesLabel = el("label");
  entriesLabel.textContent = "\u6761\u76EE(\u6309\u987A\u5E8F\u7EC4\u6210 messages)";
  const listBox = el("div", "prp entry-list");
  const entriesWrap = el("div", "prp fg");
  entriesWrap.append(entriesLabel, listBox);
  const sendBtn = button("prp send-btn", "\u53D1\u9001 Prompt", () => void doSend());
  sendBtn.disabled = true;
  const beta = el("span", "prp pid", "\u6D4B\u8BD5\u7248");
  const dot = el("span", "prp status-dot");
  const statusText = el("span", "prp status-text", "\u5C31\u7EEA");
  const statusRow = el("div", "prp status-row");
  statusRow.append(dot, statusText);
  const sendRow = el("div", "prp row-bottom");
  sendRow.append(sendBtn, beta, statusRow);
  root.append(formBar, actionsRow, entriesWrap, sendRow);
  const setStatus = (msg, type) => {
    dot.className = "prp status-dot" + (type === "success" ? " success" : type === "error" ? " error" : "");
    statusText.textContent = msg;
    if (statusTimer) clearTimeout(statusTimer);
    if (type === "idle") return;
    statusTimer = setTimeout(() => {
      dot.className = "prp status-dot";
      statusText.textContent = "\u5C31\u7EEA";
    }, 3e3);
  };
  const current = () => state.forms.find((f) => f.id === state.currentId) ?? null;
  async function refreshForms() {
    try {
      state = applyList(state, await listForms());
      renderBar();
      renderActions();
      await renderEntries();
    } catch (e) {
      toastError(e);
    }
  }
  async function renderAll() {
    renderBar();
    renderActions();
    await renderEntries();
  }
  function renderBar() {
    formBar.innerHTML = "";
    if (state.forms.length === 0) {
      const hint = el("span");
      hint.textContent = "\u6682\u65E0\u8868\u5355";
      hint.style.cssText = "color:#a1a1aa;flex:1;min-width:0";
      formBar.appendChild(hint);
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
      void renderAll();
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
    formBar.appendChild(input);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void confirmRename(input);
      if (e.key === "Escape") renderBar();
    });
    formBar.appendChild(button("prp text-btn", "\u786E\u5B9A", () => void confirmRename(input)));
    formBar.appendChild(button("prp text-btn", "\u53D6\u6D88", () => renderBar()));
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
      await renderEntries();
      renderBar();
      toast("\u5DF2\u66F4\u65B0\u8868\u5355\u540D\u79F0");
    } catch (e) {
      toastError(e);
    }
  }
  function renderActions() {
    actionsRow.innerHTML = "";
    const hasForm = state.forms.length > 0;
    const newFormBtn = button("", "\u65B0\u5EFA\u8868\u5355", () => void doCreateForm());
    const newEntryBtn = button("", "\u65B0\u5EFA\u6761\u76EE", () => void doCreateEntry());
    const deleteFormBtn = button("danger", "\u5220\u9664\u8868\u5355", () => confirmDeleteForm());
    newEntryBtn.disabled = !hasForm;
    deleteFormBtn.disabled = !hasForm;
    actionsRow.append(newFormBtn, newEntryBtn, deleteFormBtn);
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
      state = upsertForm(state, { id, name, entryCount: 0 });
      state = selectForm(state, id);
      await renderAll();
      toast("\u5DF2\u521B\u5EFA\u65B0\u8868\u5355");
    } catch (e) {
      toastError(e);
    }
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
            await renderAll();
            toast("\u5DF2\u5220\u9664\u8868\u5355");
          } catch (e) {
            toastError(e);
          }
        })();
      }
    });
  }
  async function doCreateEntry() {
    const cur = current();
    if (!cur) {
      toast("\u8BF7\u5148\u65B0\u5EFA\u4E00\u4E2A\u8868\u5355");
      return;
    }
    try {
      const { entryId } = await createEntry(cur.id, { name: "\u65B0\u6761\u76EE", role: "user", text: "" });
      await renderAll();
      openEntryEditor({
        entry: { id: entryId, name: "\u65B0\u6761\u76EE", role: "user", text: "" },
        onSave: async (input) => {
          if (!input.name) {
            toast("\u6761\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
            throw new Error("\u6761\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
          }
          try {
            await updateEntry(cur.id, entryId, input);
            await renderAll();
            toast("\u5DF2\u4FDD\u5B58\u6761\u76EE");
          } catch (e) {
            toastError(e);
            throw e;
          }
        }
      });
    } catch (e) {
      toastError(e);
    }
  }
  async function renderEntries() {
    const my = ++seq;
    const cur = current();
    entriesLabel.style.display = cur ? "" : "none";
    if (!cur) {
      listBox.innerHTML = "";
      listBox.appendChild(el("div", "prp empty-state", "\u6682\u65E0\u8868\u5355,\u70B9\u51FB\u300C\u65B0\u5EFA\u8868\u5355\u300D\u5F00\u59CB"));
      rows = [];
      updateSend();
      return;
    }
    try {
      const list = await listEntries(cur.id);
      if (my !== seq) return;
      rows = list;
      listBox.innerHTML = "";
      if (rows.length === 0) {
        listBox.appendChild(el("div", "prp empty-state", "\u5F53\u524D\u8868\u5355\u6CA1\u6709\u6761\u76EE,\u70B9\u51FB\u300C\u65B0\u5EFA\u6761\u76EE\u300D\u6DFB\u52A0"));
      } else {
        for (const e of rows) listBox.appendChild(renderEntryRow(e, cur.id));
      }
      updateSend();
    } catch (e) {
      if (my !== seq) return;
      listBox.innerHTML = "";
      listBox.appendChild(el("div", "prp empty-state", "\u6761\u76EE\u52A0\u8F7D\u5931\u8D25:" + (e?.message ?? e)));
      rows = [];
      updateSend();
    }
  }
  function renderEntryRow(e, formId) {
    const row = el("div", "prp entry-item");
    const name = el("span", "prp entry-name", e.name);
    name.title = e.name;
    const role = el("span", "prp entry-role", e.role);
    const spacer = el("span", "prp entry-spacer");
    const editBtn = button("prp text-btn", "\u7F16\u8F91", () => {
      openEntryEditor({
        entry: e,
        onSave: async (input) => {
          if (!input.name) {
            toast("\u6761\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
            throw new Error("\u6761\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
          }
          try {
            await updateEntry(formId, e.id, input);
            await renderAll();
            toast("\u5DF2\u4FDD\u5B58\u6761\u76EE");
          } catch (err) {
            toastError(err);
            throw err;
          }
        }
      });
    });
    const delBtn = button("prp text-btn danger", "\u5220\u9664", () => {
      confirmDialog({
        title: "\u5220\u9664\u6761\u76EE",
        desc: `\u786E\u5B9A\u8981\u5220\u9664\u6761\u76EE\u300C${e.name}\u300D\u5417?`,
        onOk: () => {
          void (async () => {
            try {
              await deleteEntry(formId, e.id);
              await renderAll();
              toast("\u5DF2\u5220\u9664\u6761\u76EE");
            } catch (err) {
              toastError(err);
            }
          })();
        }
      });
    });
    row.append(name, role, spacer, editBtn, delBtn);
    return row;
  }
  function updateSend() {
    const cur = current();
    const hasContent = rows.some((r) => (r.text || "").trim() !== "");
    sendBtn.disabled = !cur || !hasContent;
  }
  async function doSend() {
    const cur = current();
    if (!cur) return;
    const count = rows.filter((r) => (r.text || "").trim() !== "").length;
    try {
      const payload = await sendPrompt(cur.id);
      openResult(`\u5DF2\u53D1\u9001 ${count} \u6761\u6D88\u606F(\u7A7A\u5185\u5BB9\u6761\u76EE\u5DF2\u7531\u670D\u52A1\u7AEF\u8FC7\u6EE4)`, payload);
      setStatus("\u5DF2\u53D1\u9001", "success");
    } catch (e) {
      const msg = e?.message || "\u53D1\u9001\u5931\u8D25";
      openResult("\u53D1\u9001\u5931\u8D25", { ok: false, message: msg });
      setStatus("\u53D1\u9001\u5931\u8D25", "error");
    }
  }
  void refreshForms();
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

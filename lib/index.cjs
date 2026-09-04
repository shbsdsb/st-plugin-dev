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

// src/ui/provider.ts
var VENDOR_BASE_URLS = {
  openai: "api.openai.com/v1",
  deepseek: "api.deepseek.com/v1",
  zhipu: "open.bigmodel.cn/api/paas/v4",
  qwen: "dashscope.aliyuncs.com/compatible-mode/v1",
  anthropic: "api.anthropic.com/v1",
  google: "generativelanguage.googleapis.com/v1beta"
};
var VENDOR_FORMATS = {
  openai: "openai_compatible",
  deepseek: "openai_compatible",
  zhipu: "openai_compatible",
  qwen: "openai_compatible",
  anthropic: "anthropic",
  google: "google"
};
function computeAutoValues(vendor) {
  if (!vendor) return { baseUrl: "", format: "" };
  return { baseUrl: VENDOR_BASE_URLS[vendor] ?? "", format: VENDOR_FORMATS[vendor] ?? "" };
}

// src/ui/state.ts
function createEmptyState() {
  return { id: null, name: "\u65B0\u9884\u8BBE", format: "openai_compatible", vendor: "", baseUrl: "", model: "", timeout: 30, hasKey: false };
}
function fromRow(row) {
  return { id: row.id, name: row.presetName, format: row.format, vendor: row.vendor, baseUrl: row.baseUrl, model: row.model, timeout: row.timeout, hasKey: row.hasKey };
}
function applyVendor(state, vendor) {
  const auto = computeAutoValues(vendor);
  if (!vendor) return { ...state, vendor: "", baseUrl: "", format: "openai_compatible" };
  return { ...state, vendor, baseUrl: auto.baseUrl, format: auto.format };
}
function checkSave(state, key) {
  if (!state.baseUrl.trim()) return { ok: false, field: "baseUrl" };
  if (!state.model.trim()) return { ok: false, field: "model" };
  if (state.id === null && !key.trim()) return { ok: false, field: "apiKey" };
  return { ok: true };
}
function checkTest(state, form, key) {
  if (!form.baseUrl.trim()) return { missing: "baseUrl" };
  if (!form.model.trim()) return { missing: "model" };
  if (!key.trim()) return state.id !== null ? { mode: "id" } : { missing: "apiKey" };
  return state.id !== null ? { mode: "id" } : { mode: "fields" };
}

// src/ui/style.ts
var STYLE_ID = "llm-plugin-style";
var CSS = `
.llm *{box-sizing:border-box;}
.llm .row-preset{display:flex;align-items:center;gap:8px;margin-bottom:14px;border:1px solid #e4e4e7;border-radius:8px;padding:6px 10px;background:#f4f4f5;}
.llm .row-preset select{flex:1;min-width:0;padding:7px 28px 7px 10px;font-size:13px;font-weight:500;border:none;background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;color:#18181b;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;}
.llm .preset-rename-inline{display:none;flex:1;align-items:center;gap:6px;min-width:0;}
.llm .preset-rename-inline.active{display:flex;}
.llm .preset-rename-inline input{flex:1;min-width:0;padding:6px 10px;font-size:13px;border:1px solid #d4d4d8;border-radius:6px;outline:none;background:#fff;}
.llm .preset-rename-inline input:focus{border-color:#18181b;}
.llm .preset-rename-inline button{padding:5px 10px;font-size:12px;border-radius:6px;cursor:pointer;white-space:nowrap;}
.llm .preset-rename-inline .ok{border:1px solid #18181b;background:#18181b;color:#fff;}
.llm .preset-rename-inline .cancel{border:1px solid #d4d4d8;background:#fff;color:#52525b;}
.llm .text-btn{padding:5px 9px;font-size:12px;font-weight:500;border:1px solid transparent;border-radius:6px;background:transparent;color:#52525b;cursor:pointer;white-space:nowrap;}
.llm .text-btn:hover{background:#fff;border-color:#d4d4d8;color:#18181b;}
.llm .row-actions{display:flex;gap:8px;margin-bottom:16px;}
.llm .row-actions button{flex:1;padding:8px 10px;font-size:12px;font-weight:500;border-radius:6px;border:1px solid #d4d4d8;background:#fff;color:#18181b;cursor:pointer;}
.llm .row-actions button:hover{background:#f4f4f5;}
.llm .row-actions button.primary{background:#18181b;color:#fff;border-color:#18181b;}
.llm .row-actions button.primary:hover{background:#3f3f46;}
.llm .fg{display:flex;flex-direction:column;gap:4px;margin-bottom:14px;}
.llm .fg label{font-size:13px;font-weight:500;color:#18181b;}
.llm .iw{position:relative;display:flex;align-items:center;}
.llm .iw input{width:100%;padding:10px 14px;font-size:14px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;outline:none;box-shadow:0 1px 2px rgba(0,0,0,0.04);}
.llm .iw select{width:100%;padding:10px 36px 10px 14px;font-size:14px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center;color:#18181b;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.04);}
.llm .fg select{width:100%;padding:10px 36px 10px 14px;font-size:14px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center;color:#18181b;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.04);}
.llm .iw input:focus,.llm .iw select:focus{border-color:#18181b;}
.llm .iw input:disabled,.llm .iw select:disabled{background:#f4f4f5;color:#a1a1aa;cursor:not-allowed;border-color:#e4e4e7;}
.llm .iw.has-prefix input{padding-left:78px;}
.llm .iw .prefix{position:absolute;left:14px;font-size:13px;color:#a1a1aa;pointer-events:none;}
.llm .iw .toggle{position:absolute;right:10px;background:none;border:none;color:#a1a1aa;font-size:14px;cursor:pointer;padding:5px;border-radius:6px;}
.llm .row-bottom{display:flex;align-items:center;gap:16px;margin-top:18px;border-top:1px solid #e4e4e7;padding-top:16px;}
.llm .btn-test{min-width:80px;padding:9px 16px;font-size:13px;font-weight:500;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;cursor:pointer;}
.llm .btn-test:hover{background:#f4f4f5;}
.llm .btn-test:disabled{opacity:.6;cursor:not-allowed;}
.llm .indicator-wrap{display:flex;align-items:center;gap:8px;}
.llm .indicator{width:12px;height:12px;border-radius:50%;background:#d4d4d8;display:inline-block;transition:background .2s;}
.llm .indicator.success{background:#18181b;}
.llm .indicator.error{background:#d9534f;}
.llm .indicator.info{background:#71717a;}
.llm .indicator-text{font-size:12px;color:#52525b;}

/* \u6A21\u578B\u5B57\u6BB5:\u7EC4\u5408\u8F93\u5165\u6846 + \u5185\u5D4C\u4E0B\u62C9 */
.llm .model-field{position:relative;width:100%;}
.llm .model-input-group{display:flex;align-items:stretch;border:1px solid #d4d4d8;border-radius:8px;background:#fff;transition:border-color .2s,box-shadow .2s;overflow:hidden;}
.llm .model-input-group:focus-within{border-color:#18181b;box-shadow:0 0 0 3px rgba(24,24,27,.08);}
.llm .model-input-group input{flex:1;min-width:0;border:none;padding:10px 14px;font-size:14px;font-family:inherit;color:#18181b;background:transparent;outline:none;}
.llm .model-input-group input::placeholder{color:#a1a1aa;}
.llm .model-fetch-btn{display:flex;align-items:center;gap:6px;padding:0 16px;border:none;border-left:1px solid #d4d4d8;background:#f4f4f5;color:#18181b;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s,transform .1s;user-select:none;flex-shrink:0;}
.llm .model-fetch-btn .arrow{display:inline-block;font-size:10px;transition:transform .25s ease;}
.llm .model-fetch-btn .arrow.open{transform:rotate(180deg);}
.llm .model-fetch-btn:hover{background:#e8e8ea;}
.llm .model-fetch-btn:active{transform:scale(.96);}
.llm .model-fetch-btn .label-text{font-size:12px;}
@media (max-width:480px){.llm .model-fetch-btn .label-text{font-size:11px;}.llm .model-fetch-btn{padding:0 10px;gap:4px;}}
@media (max-width:380px){.llm .model-fetch-btn .label-text{display:none;}.llm .model-fetch-btn{padding:0 12px;}}
.llm .model-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #e4e4e7;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.08);max-height:200px;overflow:auto;z-index:30;display:none;padding:4px 0;}
.llm .model-dropdown.show{display:block;animation:dropIn .18s ease;}
@keyframes dropIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
.llm .model-dropdown .item{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;font-size:13px;color:#334155;cursor:pointer;transition:background .1s;gap:8px;}
.llm .model-dropdown .item:hover{background:#f4f4f5;}
.llm .model-dropdown .item:active{background:#e8e8ea;}
.llm .model-dropdown .item .name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.llm .model-dropdown .item .check{color:#18181b;font-weight:600;font-size:13px;flex-shrink:0;}
.llm .model-dropdown .item.active{background:#f0f0f0;}
.llm .model-dropdown .item.active .name{color:#18181b;font-weight:500;}
.llm .model-dropdown .empty{padding:20px 14px;text-align:center;color:#a1a1aa;font-size:13px;}
.llm .model-dropdown .loading-item{padding:14px;text-align:center;color:#a1a1aa;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;}
.llm .model-dropdown .loading-item .spinner{display:inline-block;width:16px;height:16px;border:2px solid #e4e4e7;border-top-color:#18181b;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.llm .model-dropdown .no-match{padding:16px 14px;text-align:center;color:#a1a1aa;font-size:13px;}
@media (max-width:768px){.llm .row-bottom{flex-direction:column;align-items:stretch;}.llm .indicator-wrap{justify-content:flex-start;}.llm .iw.has-prefix input{padding-left:62px;}.llm .iw .prefix{left:10px;}}
.llm .model-dropdown::-webkit-scrollbar{width:4px;}
.llm .model-dropdown::-webkit-scrollbar-track{background:transparent;}
.llm .model-dropdown::-webkit-scrollbar-thumb{background:#d4d4d8;border-radius:4px;}
.llm .model-dropdown::-webkit-scrollbar-thumb:hover{background:#a1a1aa;}
`;
function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

// src/ui/dom.ts
function el(tag, cls = "") {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
function setStatus(indicator, text, msg, type, timer) {
  indicator.className = "indicator" + (type !== "info" ? " " + type : "");
  text.textContent = msg;
  if (timer?.ref) {
    clearTimeout(timer.ref);
    timer.ref = null;
  }
  if ((type === "success" || type === "info") && timer) {
    timer.ref = setTimeout(() => {
      indicator.className = "indicator";
      text.textContent = "\u5C31\u7EEA";
    }, 3500);
  }
}

// src/ui/config-panel.ts
function createConfigPanel(ui, api) {
  ensureStyle();
  const root = el("div", "llm");
  let state = createEmptyState();
  let rows = [];
  const statusTimer = { ref: null };
  const setStatusNow = (msg, type) => setStatus(indicator, statusText, msg, type, statusTimer);
  const presetSelect = el("select");
  const renameTrigger = el("button", "text-btn");
  renameTrigger.textContent = "\u6539\u540D";
  const renameWrap = el("div", "preset-rename-inline");
  const renameInput = el("input");
  renameInput.placeholder = "\u540D\u79F0";
  renameInput.maxLength = 50;
  const renameOk = el("button", "ok");
  renameOk.textContent = "\u786E\u8BA4";
  const renameCancel = el("button", "cancel");
  renameCancel.textContent = "\u53D6\u6D88";
  renameWrap.append(renameInput, renameOk, renameCancel);
  const presetRow = el("div", "row-preset");
  presetRow.append(presetSelect, renameWrap, renameTrigger);
  const newBtn = el("button");
  newBtn.textContent = "\u65B0\u5EFA";
  const saveBtn = el("button", "primary");
  saveBtn.textContent = "\u4FDD\u5B58";
  const deleteBtn = el("button");
  deleteBtn.textContent = "\u5220\u9664";
  const actionRow = el("div", "row-actions");
  actionRow.append(newBtn, saveBtn, deleteBtn);
  const fg = (label2, wrap) => {
    const g = el("div", "fg");
    const l = document.createElement("label");
    l.textContent = label2;
    g.append(l, wrap);
    return g;
  };
  const formatSelect = el("select");
  for (const [v, t] of [["openai_compatible", "OpenAI \u517C\u5BB9"], ["anthropic", "Anthropic"], ["google", "Google Gemini"]]) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = t;
    formatSelect.appendChild(o);
  }
  const vendorSelect = el("select");
  for (const [v, t] of [["", "-- \u8BF7\u9009\u62E9 --"], ["openai", "OpenAI"], ["deepseek", "DeepSeek"], ["zhipu", "\u667A\u8C31AI"], ["qwen", "\u901A\u4E49\u5343\u95EE"], ["anthropic", "Anthropic"], ["google", "Google"]]) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = t;
    vendorSelect.appendChild(o);
  }
  const baseUrlInput = el("input");
  baseUrlInput.placeholder = "api.example.com/v1";
  const baseWrap = el("div", "iw has-prefix");
  const pre = el("span", "prefix");
  pre.textContent = "https://";
  baseWrap.append(pre, baseUrlInput);
  const modelInput = el("input");
  modelInput.placeholder = "\u8F93\u5165\u6216\u9009\u62E9\u6A21\u578B\u2026";
  modelInput.autocomplete = "off";
  const fetchBtn = el("button", "model-fetch-btn");
  const arrow = el("span", "arrow");
  arrow.textContent = "\u25BC";
  const label = el("span", "label-text");
  label.textContent = "\u62C9\u53D6\u6A21\u578B";
  fetchBtn.append(arrow, label);
  const modelGroup = el("div", "model-input-group");
  modelGroup.append(modelInput, fetchBtn);
  const dropdown = el("div", "model-dropdown");
  const modelField = el("div", "model-field");
  modelField.append(modelGroup, dropdown);
  const keyInput = el("input");
  keyInput.type = "password";
  keyInput.placeholder = "sk-\u2026";
  const toggleBtn = el("button", "toggle");
  toggleBtn.textContent = "\u25C9";
  const keyWrap = el("div", "iw");
  keyWrap.append(keyInput, toggleBtn);
  const timeoutInput = el("input");
  timeoutInput.type = "number";
  timeoutInput.value = "30";
  timeoutInput.min = "1";
  timeoutInput.max = "300";
  const timeoutWrap = el("div", "iw");
  timeoutWrap.appendChild(timeoutInput);
  const form = el("div");
  form.append(
    fg("\u683C\u5F0F", formatSelect),
    fg("\u5382\u5546", vendorSelect),
    fg("API \u5730\u5740", baseWrap),
    fg("\u6A21\u578B", modelField),
    fg("\u5BC6\u94A5", keyWrap),
    fg("\u8D85\u65F6\uFF08\u79D2\uFF09", timeoutWrap)
  );
  const testBtn = el("button", "btn-test");
  testBtn.textContent = "\u6D4B\u8BD5";
  const indicator = el("span", "indicator");
  const statusText = document.createElement("span");
  statusText.className = "indicator-text";
  statusText.textContent = "\u5C31\u7EEA";
  const indicatorWrap = el("div", "indicator-wrap");
  indicatorWrap.append(indicator, statusText);
  const bottomRow = el("div", "row-bottom");
  bottomRow.append(testBtn, indicatorWrap);
  root.append(presetRow, actionRow, form, bottomRow);
  function applyStateToForm() {
    formatSelect.value = state.format;
    vendorSelect.value = state.vendor;
    baseUrlInput.value = state.baseUrl;
    modelInput.value = state.model;
    timeoutInput.value = String(state.timeout);
    keyInput.value = "";
    keyInput.placeholder = state.hasKey ? "\u7559\u7A7A\u4FDD\u7559\u539F\u5BC6\u94A5" : "sk-\u2026";
    const locked = !!state.vendor;
    baseUrlInput.disabled = locked;
    formatSelect.disabled = locked;
  }
  function collectFormIntoState() {
    state.format = formatSelect.value;
    state.vendor = vendorSelect.value;
    state.baseUrl = baseUrlInput.value.trim();
    state.model = modelInput.value.trim();
    state.timeout = Number(timeoutInput.value) || 30;
  }
  function syncOptions() {
    const keep = state.id !== null ? String(state.id) : "";
    presetSelect.innerHTML = "";
    if (state.id === null) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = state.name;
      presetSelect.appendChild(o);
    }
    for (const r of rows) {
      const o = document.createElement("option");
      o.value = String(r.id);
      o.textContent = r.presetName;
      presetSelect.appendChild(o);
    }
    presetSelect.value = keep;
  }
  const activateCurrent = () => {
    if (state.id != null) void api.setActive(state.id).catch(() => {
    });
  };
  presetSelect.addEventListener("change", () => {
    const v = presetSelect.value;
    if (!v) return;
    const row = rows.find((r) => r.id === Number(v));
    if (row) {
      state = fromRow(row);
      applyStateToForm();
      setStatusNow("\u5DF2\u52A0\u8F7D", "info");
      activateCurrent();
    }
  });
  function enterRename() {
    renameInput.value = state.name;
    presetRow.classList.add("renaming");
    presetSelect.style.display = "none";
    renameTrigger.style.display = "none";
    renameWrap.classList.add("active");
    renameInput.focus();
    renameInput.select();
  }
  function exitRename(save2) {
    presetRow.classList.remove("renaming");
    presetSelect.style.display = "";
    renameTrigger.style.display = "";
    renameWrap.classList.remove("active");
    if (!save2) return;
    const next = renameInput.value.trim();
    if (!next || next === state.name) return;
    const old = state.name;
    state.name = next;
    if (state.id === null) {
      syncOptions();
      setStatusNow("\u5DF2\u6539\u540D(\u4FDD\u5B58\u540E\u751F\u6548)", "info");
      return;
    }
    syncOptions();
    api.updatePreset(state.id, { ...state, presetName: state.name }).then(() => {
      const row = rows.find((r) => r.id === state.id);
      if (row) row.presetName = state.name;
      syncOptions();
      setStatusNow("\u5DF2\u6539\u540D", "success");
    }).catch((e) => {
      state.name = old;
      syncOptions();
      setStatusNow("\u6539\u540D\u5931\u8D25: " + e.message, "error");
    });
  }
  renameTrigger.addEventListener("click", enterRename);
  renameOk.addEventListener("click", () => exitRename(true));
  renameCancel.addEventListener("click", () => exitRename(false));
  renameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") exitRename(true);
    else if (e.key === "Escape") exitRename(false);
  });
  function newPreset() {
    state = createEmptyState();
    applyStateToForm();
    syncOptions();
    setStatusNow("\u5DF2\u65B0\u5EFA", "info");
  }
  newBtn.addEventListener("click", newPreset);
  async function save() {
    collectFormIntoState();
    const key = keyInput.value.trim();
    const chk = checkSave(state, key);
    if (!chk.ok) {
      const target = chk.field === "baseUrl" ? baseUrlInput : chk.field === "model" ? modelInput : keyInput;
      target.focus();
      setStatusNow(chk.field === "apiKey" ? "\u8BF7\u5148\u8F93\u5165 API Key" : "\u8BF7\u5B8C\u6574\u586B\u5199\u5730\u5740/\u6A21\u578B", "error");
      return;
    }
    saveBtn.disabled = true;
    saveBtn.textContent = "\u4FDD\u5B58\u4E2D\u2026";
    try {
      if (state.id === null) {
        const body = { ...state, presetName: state.name, apiKey: key };
        const { id } = await api.createPreset(body);
        state.id = id;
        state.hasKey = !!key;
        activateCurrent();
      } else {
        await api.updatePreset(state.id, { ...state, presetName: state.name, ...key ? { apiKey: key } : {} });
        if (key) state.hasKey = true;
      }
      rows = await api.listPresets();
      syncOptions();
      setStatusNow("\u5DF2\u4FDD\u5B58", "success");
      ui.toast("\u5DF2\u4FDD\u5B58");
    } catch (e) {
      setStatusNow("\u4FDD\u5B58\u5931\u8D25: " + e.message, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "\u4FDD\u5B58";
    }
  }
  saveBtn.addEventListener("click", () => void save());
  function removeCurrent() {
    if (state.id === null) {
      setStatusNow("\u6CA1\u6709\u53EF\u5220\u9664\u7684\u9884\u8BBE", "error");
      return;
    }
    const id = state.id;
    const name = state.name;
    ui.modal({
      title: "\u5220\u9664\u9884\u8BBE",
      desc: `\u786E\u5B9A\u5220\u9664\u300C${name}\u300D?`,
      onOk: () => {
        api.deletePreset(id).then(async () => {
          rows = (await api.listPresets()).filter((r) => r.id !== id);
          if (rows.length > 0) {
            state = fromRow(rows[0]);
            applyStateToForm();
            activateCurrent();
          } else {
            state = createEmptyState();
            applyStateToForm();
          }
          syncOptions();
          setStatusNow("\u5DF2\u5220\u9664", "info");
        }).catch((e) => setStatusNow("\u5220\u9664\u5931\u8D25: " + e.message, "error"));
      }
    });
  }
  deleteBtn.addEventListener("click", removeCurrent);
  function renderDropdown(models, current) {
    dropdown.innerHTML = "";
    const opts = models.map((name) => ({ name, active: name === current }));
    if (opts.length === 0) {
      const e = el("div", "empty");
      e.textContent = "\u6CA1\u6709\u53EF\u7528\u6A21\u578B";
      dropdown.appendChild(e);
      return;
    }
    for (const o of opts) {
      const item = el("div", "item" + (o.active ? " active" : ""));
      const name = el("span", "name");
      name.textContent = o.name;
      item.appendChild(name);
      if (o.active) {
        const ck = el("span", "check");
        ck.textContent = "\u2713";
        item.appendChild(ck);
      }
      item.addEventListener("click", () => {
        modelInput.value = o.name;
        dropdown.classList.remove("show");
        arrow.classList.remove("open");
      });
      dropdown.appendChild(item);
    }
  }
  async function openModels() {
    collectFormIntoState();
    const willShow = !dropdown.classList.contains("show");
    dropdown.classList.toggle("show", willShow);
    arrow.classList.toggle("open", willShow);
    if (!willShow) return;
    if (!state.baseUrl) {
      setStatusNow("\u8BF7\u5148\u586B API \u5730\u5740", "error");
      return;
    }
    const key = keyInput.value.trim();
    fetchBtn.disabled = true;
    fetchBtn.style.opacity = "0.6";
    try {
      const list = key ? await api.fetchModelsByInput({ format: state.format, baseUrl: state.baseUrl, apiKey: key, timeout: state.timeout }) : state.id !== null ? await api.fetchModels(state.id) : (() => {
        throw new Error("API_KEY_NEEDED");
      })();
      renderDropdown(list, modelInput.value);
    } catch (e) {
      dropdown.classList.remove("show");
      arrow.classList.remove("open");
      const msg = e.message;
      setStatusNow(msg === "API_KEY_NEEDED" || /密钥/.test(msg) ? "\u8BF7\u5148\u8F93\u5165 API Key" : "\u62C9\u53D6\u5931\u8D25: " + msg, "error");
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.style.opacity = "";
    }
  }
  fetchBtn.addEventListener("click", () => void openModels());
  async function runTest() {
    collectFormIntoState();
    const key = keyInput.value.trim();
    const chk = checkTest(state, { format: state.format, baseUrl: state.baseUrl, model: state.model }, key);
    if ("missing" in chk) {
      const target = chk.missing === "baseUrl" ? baseUrlInput : chk.missing === "model" ? modelInput : keyInput;
      target.focus();
      setStatusNow(chk.missing === "apiKey" ? "\u8BF7\u5148\u8F93\u5165 API Key \u6216\u4FDD\u5B58\u9884\u8BBE" : "\u8BF7\u586B\u5199\u6709\u6548\u4FE1\u606F", "error");
      return;
    }
    testBtn.disabled = true;
    testBtn.textContent = "\u6D4B\u8BD5\u4E2D\u2026";
    try {
      const ok = await (chk.mode === "id" ? api.testPreset({ id: state.id }) : api.testPreset({ format: state.format, baseUrl: state.baseUrl, model: state.model, apiKey: key, timeout: state.timeout }));
      setStatusNow(ok ? "\u8FDE\u63A5\u6210\u529F" : "\u8FD4\u56DE\u5F02\u5E38", ok ? "success" : "error");
    } catch (e) {
      setStatusNow("\u6D4B\u8BD5\u5931\u8D25: " + e.message, "error");
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = "\u6D4B\u8BD5";
    }
  }
  testBtn.addEventListener("click", () => void runTest());
  vendorSelect.addEventListener("change", () => {
    state = applyVendor(state, vendorSelect.value);
    baseUrlInput.value = state.baseUrl;
    formatSelect.value = state.format;
    const locked = !!state.vendor;
    baseUrlInput.disabled = locked;
    formatSelect.disabled = locked;
    if (modelInput.value) modelInput.value = "";
    state.model = "";
  });
  toggleBtn.addEventListener("click", () => {
    keyInput.type = keyInput.type === "password" ? "text" : "password";
  });
  void (async () => {
    try {
      rows = await api.listPresets();
      if (rows.length === 0) {
        state = createEmptyState();
        applyStateToForm();
      } else {
        const activeId = await api.getActive().catch(() => null);
        const target = rows.find((r) => r.id === activeId) ?? rows[0];
        state = fromRow(target);
        applyStateToForm();
        activateCurrent();
      }
    } catch (e) {
      setStatusNow("\u52A0\u8F7D\u5931\u8D25: " + e.message, "error");
    }
    syncOptions();
  })();
  return root;
}

// src/ui/api.ts
var api_exports = {};
__export(api_exports, {
  apiFetch: () => apiFetch,
  createPreset: () => createPreset,
  deletePreset: () => deletePreset,
  fetchModels: () => fetchModels,
  fetchModelsByInput: () => fetchModelsByInput,
  getActive: () => getActive,
  listPresets: () => listPresets,
  setActive: () => setActive,
  testPreset: () => testPreset,
  updatePreset: () => updatePreset
});
async function apiFetch(path, init) {
  const res = await fetch(path, { headers: { "content-type": "application/json" }, ...init });
  return res.json();
}
function listPresets() {
  return apiFetch("/api/llm/presets").then((r) => {
    if (!r.ok) throw new Error(r.message || "\u52A0\u8F7D\u9884\u8BBE\u5931\u8D25");
    return r.data;
  });
}
function createPreset(input) {
  return apiFetch("/api/llm/presets", { method: "POST", body: JSON.stringify(input) }).then((r) => {
    if (!r.ok) throw new Error(r.message || "\u4FDD\u5B58\u5931\u8D25");
    return r.data;
  });
}
function updatePreset(id, input) {
  return apiFetch(`/api/llm/presets/${id}`, { method: "PUT", body: JSON.stringify(input) }).then((r) => {
    if (!r.ok) throw new Error(r.message || "\u4FDD\u5B58\u5931\u8D25");
    return r.data;
  });
}
function deletePreset(id) {
  return apiFetch(`/api/llm/presets/${id}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error(r.message || "\u5220\u9664\u5931\u8D25");
    return r.data;
  });
}
function fetchModels(id) {
  return apiFetch("/api/llm/models", { method: "POST", body: JSON.stringify({ id }) }).then((r) => {
    if (!r.ok) throw new Error(r.message || "\u62C9\u53D6\u5931\u8D25");
    return r.data.models;
  });
}
function fetchModelsByInput(input) {
  return apiFetch("/api/llm/models", { method: "POST", body: JSON.stringify(input) }).then((r) => {
    if (!r.ok) throw new Error(r.message || "\u62C9\u53D6\u5931\u8D25");
    return r.data.models;
  });
}
function testPreset(target) {
  return apiFetch("/api/llm/test", { method: "POST", body: JSON.stringify(target) }).then((r) => {
    if (!r.ok) throw new Error(r.message || "\u6D4B\u8BD5\u5931\u8D25");
    return !!r.data?.ok;
  });
}
function setActive(id) {
  return apiFetch("/api/llm/active", { method: "PUT", body: JSON.stringify({ id }) }).then((r) => {
    if (!r.ok) throw new Error(r.message || "\u8BBE\u7F6E\u5F53\u524D\u9884\u8BBE\u5931\u8D25");
  });
}
function getActive() {
  return apiFetch("/api/llm/active").then((r) => {
    if (!r.ok) throw new Error(r.message || "\u8BFB\u53D6\u5F53\u524D\u9884\u8BBE\u5931\u8D25");
    return r.data.id;
  });
}

// src/web.tsx
var navTimer;
var webPlugin = {
  name: "llm",
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
        name: "llm",
        render(el2) {
          const btn = document.createElement("button");
          btn.textContent = "LLM";
          btn.style.cssText = "border-radius:16px;padding:0 14px;font-size:12px;font-weight:600;color:#18181b;background:#fff;border:1px solid #d4d4d8;cursor:pointer;height:30px;";
          btn.addEventListener("click", () => {
            tools.pluginModal({
              title: "LLM \u914D\u7F6E",
              content: (c) => {
                c.appendChild(createConfigPanel(tools, api_exports));
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
    slots?.unregister("nav", "llm");
  }
};
var web_default = webPlugin;
module.exports = module.exports.default

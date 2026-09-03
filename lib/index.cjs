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

// src/ui/config-panel.ts
function buildModelOptions(models, current) {
  return models.map((name) => ({ name, active: name === current }));
}
var STYLE_ID = "llm-plugin-style";
function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.llm *{box-sizing:border-box;}
.llm{color:#18181b;font-size:13px;}
.llm .row-preset{display:flex;align-items:center;gap:8px;margin-bottom:12px;border:1px solid #e4e4e7;border-radius:8px;padding:6px 10px;background:#f4f4f5;}
.llm .row-preset select{flex:1;min-width:0;padding:7px 30px 7px 10px;font-size:13px;font-weight:500;border:none;background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;color:#18181b;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer;}
.llm .row-preset .text-btn{padding:5px 9px;font-size:12px;border:1px solid transparent;border-radius:6px;background:transparent;color:#52525b;cursor:pointer;white-space:nowrap;}
.llm .row-preset .text-btn:hover{background:#fff;border-color:#d4d4d8;color:#18181b;}
.llm .row-actions{display:flex;gap:8px;margin-bottom:14px;}
.llm .row-actions button{flex:1;padding:8px 10px;font-size:12px;font-weight:500;border-radius:6px;border:1px solid #d4d4d8;background:#fff;color:#18181b;cursor:pointer;}
.llm .row-actions button:hover{background:#f4f4f5;}
.llm .row-actions button.primary{background:#18181b;color:#fff;border-color:#18181b;}
.llm .fg{display:flex;flex-direction:column;gap:4px;margin-bottom:12px;}
.llm .fg label{font-size:12px;font-weight:500;color:#18181b;}
.llm .iw{position:relative;display:flex;align-items:center;}
.llm .iw input{width:100%;padding:9px 12px;font-size:13px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;outline:none;}
.llm .iw select{width:100%;padding:9px 34px 9px 12px;font-size:13px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center;color:#18181b;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer;}
.llm .iw input:disabled,.llm .iw select:disabled{background:#f4f4f5;color:#a1a1aa;cursor:not-allowed;border-color:#e4e4e7;}
.llm .iw.has-prefix input{padding-left:70px;}
.llm .iw .prefix{position:absolute;left:12px;font-size:12px;color:#a1a1aa;pointer-events:none;}
.llm .iw .toggle{position:absolute;right:8px;background:none;border:none;color:#a1a1aa;font-size:14px;cursor:pointer;padding:5px;}
.llm .model-field{position:relative;width:100%;}
.llm .model-input-group{display:flex;align-items:stretch;border:1px solid #d4d4d8;border-radius:8px;background:#fff;overflow:hidden;}
.llm .model-input-group input{flex:1;min-width:0;border:none;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;background:transparent;color:#18181b;}
.llm .model-fetch-btn{display:flex;align-items:center;gap:6px;padding:0 14px;border:none;border-left:1px solid #d4d4d8;background:#f4f4f5;color:#18181b;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;}
.llm .model-fetch-btn:hover{background:#e8e8ea;}
.llm .model-fetch-btn .arrow{font-size:10px;transition:transform .25s;}
.llm .model-fetch-btn .arrow.open{transform:rotate(180deg);}
.llm .model-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #e4e4e7;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.08);max-height:200px;overflow:auto;z-index:30;display:none;padding:4px 0;}
.llm .model-dropdown.show{display:block;}
.llm .model-dropdown .item{display:flex;align-items:center;gap:8px;padding:8px 14px;font-size:13px;cursor:pointer;}
.llm .model-dropdown .item:hover{background:#f4f4f5;}
.llm .model-dropdown .item.active{background:#f0f0f0;}
.llm .model-dropdown .item .name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.llm .model-dropdown .item .check{color:#18181b;font-weight:600;}
.llm .model-dropdown .empty,.llm .model-dropdown .loading-item{padding:14px;text-align:center;color:#a1a1aa;font-size:13px;}
.llm .row-bottom{display:flex;align-items:center;gap:16px;margin-top:16px;border-top:1px solid #e4e4e7;padding-top:14px;}
.llm .btn-test{min-width:80px;padding:9px 16px;font-size:13px;font-weight:500;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;cursor:pointer;}
.llm .btn-test:disabled{opacity:.6;cursor:not-allowed;}
.llm .indicator-wrap{display:flex;align-items:center;gap:8px;}
.llm .indicator{width:12px;height:12px;border-radius:50%;background:#d4d4d8;display:inline-block;}
.llm .indicator.success{background:#18181b;}
.llm .indicator.error{background:#d9534f;}
.llm .indicator-text{font-size:12px;color:#52525b;}

/* ===== demo \u5B9A\u7A3F\u6837\u5F0F(\u540C\u7C7B\u9009\u62E9\u5668,\u8986\u76D6\u4E0A\u65B9) ===== */
.llm *{box-sizing:border-box;}
.llm .row-preset{display:flex;align-items:center;gap:8px;margin-bottom:14px;border:1px solid #e4e4e7;border-radius:8px;padding:6px 10px;background:#f4f4f5;}
.llm .row-preset select{flex:1;min-width:0;padding:7px 28px 7px 10px;font-size:13px;font-weight:500;border:none;background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;color:#18181b;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;}
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
.model-field{position:relative;width:100%;}
.model-input-group{display:flex;align-items:stretch;border:1px solid #d4d4d8;border-radius:8px;background:#fff;transition:border-color .2s,box-shadow .2s;overflow:hidden;}
.model-input-group:focus-within{border-color:#18181b;box-shadow:0 0 0 3px rgba(24,24,27,.08);}
.model-input-group input{flex:1;min-width:0;border:none;padding:10px 14px;font-size:14px;font-family:inherit;color:#18181b;background:transparent;outline:none;}
.model-input-group input::placeholder{color:#a1a1aa;}
.model-fetch-btn{display:flex;align-items:center;gap:6px;padding:0 16px;border:none;border-left:1px solid #d4d4d8;background:#f4f4f5;color:#18181b;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s,transform .1s;user-select:none;flex-shrink:0;}
.model-fetch-btn .arrow{display:inline-block;font-size:10px;transition:transform .25s ease;}
.model-fetch-btn .arrow.open{transform:rotate(180deg);}
.model-fetch-btn:hover{background:#e8e8ea;}
.model-fetch-btn:active{transform:scale(.96);}
.model-fetch-btn .label-text{font-size:12px;}
@media (max-width:480px){.model-fetch-btn .label-text{font-size:11px;}.model-fetch-btn{padding:0 10px;gap:4px;}}
@media (max-width:380px){.model-fetch-btn .label-text{display:none;}.model-fetch-btn{padding:0 12px;}}
.model-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #e4e4e7;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.08);max-height:200px;overflow:auto;z-index:30;display:none;padding:4px 0;}
.model-dropdown.show{display:block;animation:dropIn .18s ease;}
@keyframes dropIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
.model-dropdown .item{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;font-size:13px;color:#334155;cursor:pointer;transition:background .1s;gap:8px;}
.model-dropdown .item:hover{background:#f4f4f5;}
.model-dropdown .item:active{background:#e8e8ea;}
.model-dropdown .item .name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.model-dropdown .item .check{color:#18181b;font-weight:600;font-size:13px;flex-shrink:0;}
.model-dropdown .item.active{background:#f0f0f0;}
.model-dropdown .item.active .name{color:#18181b;font-weight:500;}
.model-dropdown .empty{padding:20px 14px;text-align:center;color:#a1a1aa;font-size:13px;}
.model-dropdown .loading-item{padding:14px;text-align:center;color:#a1a1aa;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;}
.model-dropdown .loading-item .spinner{display:inline-block;width:16px;height:16px;border:2px solid #e4e4e7;border-top-color:#18181b;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.model-dropdown .no-match{padding:16px 14px;text-align:center;color:#a1a1aa;font-size:13px;}
@media (max-width:768px){.llm .row-bottom{flex-direction:column;align-items:stretch;}.llm .indicator-wrap{justify-content:flex-start;}.llm .iw.has-prefix input{padding-left:62px;}.llm .iw .prefix{left:10px;}}
.model-dropdown::-webkit-scrollbar{width:4px;}
.model-dropdown::-webkit-scrollbar-track{background:transparent;}
.model-dropdown::-webkit-scrollbar-thumb{background:#d4d4d8;border-radius:4px;}
.model-dropdown::-webkit-scrollbar-thumb:hover{background:#a1a1aa;}
`;
  document.head.appendChild(style);
}
function el(tag, cls = "") {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
function setStatus(indicator, text, msg, type) {
  indicator.className = `indicator${type !== "info" ? " " + type : ""}`;
  text.textContent = msg;
}
function createConfigPanel(ui, api) {
  ensureStyle();
  const root = el("div", "llm");
  let currentId = 0;
  let hasKey = false;
  const presetSelect = el("select");
  const renameBtn = el("button", "text-btn");
  renameBtn.textContent = "\u6539\u540D";
  const presetRow = el("div", "row-preset");
  presetRow.append(presetSelect, renameBtn);
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
  const form = el("div");
  form.append(
    fg("\u683C\u5F0F", formatSelect),
    fg("\u5382\u5546", vendorSelect),
    fg("API \u5730\u5740", baseWrap),
    fg("\u6A21\u578B", modelField),
    fg("\u5BC6\u94A5", keyWrap),
    fg("\u8D85\u65F6\uFF08\u79D2\uFF09", timeoutInput)
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
  function presetInput(presetId) {
    const key = keyInput.value.trim();
    return {
      presetName: presetSelect.value,
      format: formatSelect.value,
      vendor: vendorSelect.value,
      baseUrl: baseUrlInput.value.trim(),
      model: modelInput.value.trim(),
      timeout: Number(timeoutInput.value) || 30,
      ...key ? { apiKey: key } : {}
    };
  }
  function fillForm(p) {
    presetSelect.value = p.presetName;
    formatSelect.value = p.format;
    vendorSelect.value = p.vendor;
    applyVendorAuto();
    if (p.vendor) {
      baseUrlInput.value = p.baseUrl;
      baseUrlInput.disabled = true;
      formatSelect.disabled = true;
    } else {
      baseUrlInput.value = p.baseUrl;
      baseUrlInput.disabled = false;
      formatSelect.disabled = false;
    }
    modelInput.value = p.model;
    timeoutInput.value = String(p.timeout);
    keyInput.value = "";
    hasKey = p.hasKey;
    keyInput.placeholder = p.hasKey ? "\u7559\u7A7A\u4FDD\u7559\u539F\u5BC6\u94A5" : "sk-\u2026";
  }
  function applyVendorAuto() {
    const { baseUrl, format } = computeAutoValues(vendorSelect.value);
    if (vendorSelect.value) {
      baseUrlInput.value = baseUrl;
      baseUrlInput.disabled = true;
      formatSelect.value = format;
      formatSelect.disabled = true;
    } else {
      baseUrlInput.value = "";
      baseUrlInput.disabled = false;
      formatSelect.disabled = false;
    }
  }
  async function loadPresets() {
    const rows = await api.listPresets();
    presetSelect.innerHTML = "";
    for (const r of rows) {
      const o = document.createElement("option");
      o.value = String(r.id);
      o.textContent = r.presetName;
      presetSelect.appendChild(o);
    }
    if (rows.length > 0) {
      const target = currentId > 0 && rows.some((r) => r.id === currentId) ? currentId : rows[0].id;
      await selectPreset(target);
    } else {
      currentId = 0;
      hasKey = false;
      resetForm();
    }
  }
  async function selectPreset(id) {
    currentId = id;
    const p = (await api.listPresets()).find((r) => r.id === id);
    if (p) fillForm(p);
  }
  function resetForm() {
    let o = Array.from(presetSelect.options).find((x) => x.value === "\u65B0\u9884\u8BBE");
    if (!o) {
      o = document.createElement("option");
      o.value = "\u65B0\u9884\u8BBE";
      o.textContent = "\u65B0\u9884\u8BBE";
      presetSelect.appendChild(o);
    }
    presetSelect.value = "\u65B0\u9884\u8BBE";
    vendorSelect.value = "";
    baseUrlInput.value = "";
    baseUrlInput.disabled = false;
    formatSelect.disabled = false;
    formatSelect.value = "openai_compatible";
    modelInput.value = "";
    keyInput.value = "";
    timeoutInput.value = "30";
    hasKey = false;
    setStatus(indicator, statusText, "\u5C31\u7EEA", "info");
  }
  presetSelect.addEventListener("change", () => void selectPreset(Number(presetSelect.value)));
  renameBtn.addEventListener("click", async () => {
    if (currentId === 0) {
      setStatus(indicator, statusText, "\u8BF7\u5148\u4FDD\u5B58\u9884\u8BBE\u518D\u6539\u540D", "error");
      return;
    }
    const name = window.prompt("\u91CD\u547D\u540D\u9884\u8BBE", presetSelect.value);
    if (name && name.trim() && name.trim() !== presetSelect.value) {
      try {
        await api.updatePreset(currentId, { ...presetInput(currentId), presetName: name.trim() });
        ui.toast("\u5DF2\u6539\u540D");
        await loadPresets();
        setStatus(indicator, statusText, "\u5DF2\u6539\u540D", "success");
      } catch (e) {
        setStatus(indicator, statusText, "\u6539\u540D\u5931\u8D25: " + e.message, "error");
      }
    }
  });
  vendorSelect.addEventListener("change", () => {
    applyVendorAuto();
    if (modelInput.value) modelInput.value = "";
  });
  saveBtn.addEventListener("click", async () => {
    if (!presetSelect.value || !baseUrlInput.value.trim() || !modelInput.value.trim()) {
      setStatus(indicator, statusText, "\u8BF7\u5B8C\u6574\u586B\u5199\u9884\u8BBE\u540D/\u5730\u5740/\u6A21\u578B", "error");
      return;
    }
    const input = presetInput(0);
    try {
      if (currentId === 0) {
        const { id } = await api.createPreset({ ...input, apiKey: keyInput.value.trim() });
        currentId = id;
      } else {
        await api.updatePreset(currentId, input);
      }
      ui.toast("\u5DF2\u4FDD\u5B58");
      setStatus(indicator, statusText, "\u5DF2\u4FDD\u5B58", "success");
      await loadPresets();
    } catch (e) {
      setStatus(indicator, statusText, "\u4FDD\u5B58\u5931\u8D25: " + e.message, "error");
    }
  });
  newBtn.addEventListener("click", () => {
    ui.modal({ title: "\u65B0\u5EFA", desc: "\u65B0\u5EFA\u5C06\u6E05\u7A7A\u5F53\u524D\u8868\u5355,\u662F\u5426\u7EE7\u7EED?", onOk: () => {
      currentId = 0;
      resetForm();
      setStatus(indicator, statusText, "\u8BF7\u9009\u62E9\u5382\u5546\u5E76\u586B\u5199", "info");
    } });
  });
  deleteBtn.addEventListener("click", () => {
    if (currentId === 0) {
      setStatus(indicator, statusText, "\u65E0\u5DF2\u9009\u9884\u8BBE", "error");
      return;
    }
    ui.modal({ title: "\u5220\u9664", desc: "\u786E\u5B9A\u5220\u9664\u5F53\u524D\u9884\u8BBE?", onOk: async () => {
      await api.deletePreset(currentId);
      currentId = 0;
      await loadPresets();
    } });
  });
  function renderDropdown(models, current) {
    dropdown.innerHTML = "";
    const opts = buildModelOptions(models, current);
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
    const willShow = !dropdown.classList.contains("show");
    dropdown.classList.toggle("show", willShow);
    arrow.classList.toggle("open", willShow);
    if (!willShow) return;
    const format = formatSelect.value;
    const baseUrl = baseUrlInput.value.trim();
    const apiKey = keyInput.value.trim();
    if (!baseUrl) {
      setStatus(indicator, statusText, "\u8BF7\u5148\u586B API \u5730\u5740", "error");
      return;
    }
    if (!apiKey) {
      setStatus(indicator, statusText, "\u8BF7\u5148\u586B\u5BC6\u94A5", "error");
      return;
    }
    try {
      const list = await api.fetchModelsByInput({ format, baseUrl, apiKey });
      renderDropdown(list, modelInput.value);
    } catch (e) {
      setStatus(indicator, statusText, "\u62C9\u53D6\u5931\u8D25: " + e.message, "error");
    }
  }
  fetchBtn.addEventListener("click", () => void openModels());
  testBtn.addEventListener("click", async () => {
    if (!currentId) {
      setStatus(indicator, statusText, "\u8BF7\u5148\u4FDD\u5B58\u9884\u8BBE\u518D\u6D4B\u8BD5", "error");
      return;
    }
    testBtn.disabled = true;
    testBtn.textContent = "\u6D4B\u8BD5\u4E2D\u2026";
    try {
      const ok = await api.testPreset(currentId);
      setStatus(indicator, statusText, ok ? "\u8FDE\u63A5\u6210\u529F" : "\u8FD4\u56DE\u5F02\u5E38", ok ? "success" : "error");
    } catch (e) {
      setStatus(indicator, statusText, "\u6D4B\u8BD5\u5931\u8D25: " + e.message, "error");
    }
    testBtn.disabled = false;
    testBtn.textContent = "\u6D4B\u8BD5";
  });
  toggleBtn.addEventListener("click", () => {
    keyInput.type = keyInput.type === "password" ? "text" : "password";
  });
  void loadPresets();
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
  listPresets: () => listPresets,
  testPreset: () => testPreset,
  updatePreset: () => updatePreset
});
async function apiFetch(path, init) {
  const res = await fetch(path, { headers: { "content-type": "application/json" }, ...init });
  return res.json();
}
function listPresets() {
  return apiFetch("/api/llm/presets").then((r) => r.ok ? r.data : []);
}
function createPreset(input) {
  return apiFetch("/api/llm/presets", { method: "POST", body: JSON.stringify(input) }).then((r) => r.data);
}
function updatePreset(id, input) {
  return apiFetch(`/api/llm/presets/${id}`, { method: "PUT", body: JSON.stringify(input) }).then((r) => r.data);
}
function deletePreset(id) {
  return apiFetch(`/api/llm/presets/${id}`, { method: "DELETE" }).then((r) => r.data);
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
function testPreset(id) {
  return apiFetch("/api/llm/test", { method: "POST", body: JSON.stringify({ id }) }).then((r) => r.ok && !!r.data?.ok);
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

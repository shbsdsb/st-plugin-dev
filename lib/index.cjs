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
  buildSavePayload: () => buildSavePayload,
  default: () => web_default,
  inferControlType: () => inferControlType,
  isStringArray: () => isStringArray,
  openDialog: () => openDialog
});
module.exports = __toCommonJS(web_exports);
function inferControlType(value) {
  if (value === null || value === void 0) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "object";
  }
}
function buildSavePayload(entries) {
  return { entries };
}
function uiSlots() {
  return window.__uiSlots__;
}
function uiTools() {
  return window.__uiTools__;
}
var activeState = null;
var dragListenersBound = false;
function ensureDragListeners() {
  if (dragListenersBound) return;
  dragListenersBound = true;
  document.addEventListener("mousemove", (e) => {
    const st = activeState;
    if (st?.isDragging) moveDrag(st, e.clientY);
  });
  document.addEventListener("mouseup", () => {
    const st = activeState;
    if (st?.isDragging) endDrag(st);
  });
}
var STYLE_ID = "plugin-setting-style";
var GAP = 8;
function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.st-setting-btn{display:flex;align-items:center;gap:8px;width:100%;justify-content:flex-start;padding:6px 10px;border:none;background:none;cursor:pointer;color:#475569;font-size:13px;border-radius:8px;}
.st-setting-btn:hover{background:rgba(124,109,246,.08);}
.st-setting-btn .ps-ic{font-size:15px;}
.st-setting-btn.ps-compact{justify-content:center;padding:6px 0;width:32px;height:32px;border-radius:50%;background:rgba(124,109,246,.14);color:#7c6df6;font-size:15px;}
.ps-dialog{height:62vh;min-height:360px;display:flex;flex-direction:column;font-size:13px;color:#334155;line-height:1.7;}
.ps-hint{font-size:11px;color:#94a3b8;margin-bottom:8px;}
.ps-list{position:relative;flex:1;min-height:0;}
.ps-entry{position:absolute;left:0;right:0;border:1px solid rgba(148,163,184,.35);border-radius:12px;background:rgba(255,255,255,.85);will-change:top;transition:top .3s cubic-bezier(.22,.61,.36,1),box-shadow .2s ease,border-color .2s ease;}
.ps-head{display:flex;align-items:center;gap:8px;height:46px;padding:0 12px;cursor:grab;user-select:none;}
.ps-drag{color:#cbd5e1;cursor:grab;font-size:14px;}
.ps-name{flex:1;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#334155;}
.ps-caret{border:none;background:none;cursor:pointer;color:#64748b;font-size:13px;}
.ps-detail{border-top:1px dashed rgba(148,163,184,.4);padding:12px;font-size:12px;display:none;background:rgba(248,250,252,.6);border-radius:0 0 12px 12px;}
.ps-entry.ps-open .ps-detail{display:block;}
.ps-entry.ps-dragging{z-index:100;box-shadow:0 12px 40px rgba(31,38,135,.25);border-color:rgba(124,109,246,.6);cursor:grabbing;transition:box-shadow .2s ease,border-color .2s ease;}
.ps-entry.ps-dragging .ps-drag{color:#7c6df6;}
.ps-drop-indicator{position:absolute;left:8px;right:8px;height:3px;border-radius:3px;background:#7c6df6;opacity:0;transition:opacity .15s ease;pointer-events:none;box-shadow:0 0 10px rgba(124,109,246,.5);z-index:101;}
.ps-drop-indicator.ps-visible{opacity:1;}
.ps-field{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ps-field label{width:110px;flex-shrink:0;color:#475569;}
.ps-field input[type=text],.ps-field input[type=number]{flex:1;padding:6px 8px;border:1px solid rgba(148,163,184,.5);border-radius:8px;font-size:13px;color:#1f2d3d;}
.ps-field textarea{flex:1;min-height:80px;padding:6px 8px;border:1px solid rgba(148,163,184,.5);border-radius:8px;font-family:monospace;font-size:12px;color:#1f2d3d;}
.ps-none{color:#94a3b8;}
.ps-error{color:#dc2626;font-size:13px;padding:16px;}
.ps-loading{color:#94a3b8;font-size:13px;padding:16px;}
`;
  document.head.appendChild(style);
}
function makeGearButton(compact, onClick) {
  const btn = document.createElement("button");
  btn.className = compact ? "st-setting-btn ps-compact" : "st-setting-btn";
  btn.title = "\u63D2\u4EF6\u8BBE\u7F6E";
  const ic = document.createElement("span");
  ic.className = "ps-ic";
  ic.textContent = "\u2699";
  btn.appendChild(ic);
  if (!compact) {
    const label = document.createElement("span");
    label.textContent = "\u63D2\u4EF6\u8BBE\u7F6E";
    btn.appendChild(label);
  }
  btn.addEventListener("click", onClick);
  return btn;
}
function openDialog() {
  const tools = uiTools();
  if (!tools) {
    console.warn("[plugin-setting] __uiTools__ \u4E0D\u53EF\u7528,\u8BBE\u7F6E\u5F39\u7A97\u4E0D\u53EF\u7528");
    return;
  }
  ensureStyle();
  const st = {
    entries: [],
    order: [],
    openId: null,
    items: [],
    container: null,
    drop: null,
    isDragging: false,
    dragIndex: -1,
    dragStartY: 0,
    currentTarget: -1,
    animFrame: null
  };
  tools.pluginModal({
    title: "\u63D2\u4EF6\u8BBE\u7F6E",
    width: 760,
    content: (el) => renderDialogContent(el, st),
    actions: [
      { label: "\u53D6\u6D88" },
      { label: "\u4FDD\u5B58", variant: "primary", onClick: () => void save(st, tools) }
    ]
  });
}
function renderDialogContent(root, st) {
  const wrap = document.createElement("div");
  wrap.className = "ps-dialog";
  const hint = document.createElement("p");
  hint.className = "ps-hint";
  hint.textContent = "\u2728 \u62D6\u62FD\u6392\u5E8F:\u5C55\u5F00\u7684\u6761\u76EE\u6309\u5B9E\u9645\u9AD8\u5EA6\u8BA9\u4F4D,\u4E0D\u91CD\u53E0";
  const container = document.createElement("div");
  container.className = "ps-list";
  const drop = document.createElement("div");
  drop.className = "ps-drop-indicator";
  container.appendChild(drop);
  st.container = container;
  st.drop = drop;
  wrap.append(hint, container);
  root.appendChild(wrap);
  const loading = document.createElement("div");
  loading.className = "ps-loading";
  loading.textContent = "\u52A0\u8F7D\u4E2D\u2026";
  container.appendChild(loading);
  fetch("/api/setting/list").then((r) => r.json()).then((data) => {
    loading.remove();
    if (!data.ok || !data.entries) {
      const err = document.createElement("div");
      err.className = "ps-error";
      err.textContent = data.error ?? "\u52A0\u8F7D\u5931\u8D25";
      container.appendChild(err);
      return;
    }
    st.entries = data.entries;
    st.order = data.entries.map((_, i) => i);
    renderList(st);
  }).catch(() => {
    loading.remove();
    const err = document.createElement("div");
    err.className = "ps-error";
    err.textContent = "\u65E0\u6CD5\u8FDE\u63A5\u8BBE\u7F6E\u670D\u52A1,\u8BF7\u5148 st host go";
    container.appendChild(err);
  });
  activeState = st;
  ensureDragListeners();
  container.addEventListener("mousedown", (e) => {
    const target = e.target;
    const head = target.closest(".ps-head");
    if (!head || !st.container) return;
    if (target.closest(".ps-caret")) return;
    const box = head.closest(".ps-entry");
    if (!box) return;
    startDrag(st, parseInt(box.dataset.index ?? "-1", 10), e.clientY);
    e.preventDefault();
  });
  container.addEventListener("dragstart", (e) => e.preventDefault());
}
function renderList(st) {
  const container = st.container;
  if (!container) return;
  container.innerHTML = "";
  const drop = document.createElement("div");
  drop.className = "ps-drop-indicator";
  container.appendChild(drop);
  st.drop = drop;
  st.items = st.entries.map((e, i) => {
    const box = document.createElement("div");
    box.className = "ps-entry" + (st.openId === i ? " ps-open" : "");
    box.dataset.index = String(i);
    const head = document.createElement("div");
    head.className = "ps-head";
    const drag = document.createElement("span");
    drag.className = "ps-drag";
    drag.textContent = "\u22EE\u22EE";
    const name = document.createElement("span");
    name.className = "ps-name";
    name.textContent = e.name;
    const caret = document.createElement("button");
    caret.className = "ps-caret";
    caret.textContent = st.openId === i ? "\u25BE" : "\u25B8";
    caret.addEventListener("click", (ev) => {
      ev.stopPropagation();
      st.openId = st.openId === i ? null : i;
      renderList(st);
    });
    head.append(drag, name, caret);
    box.appendChild(head);
    const detail = document.createElement("div");
    detail.className = "ps-detail";
    const idLine = document.createElement("div");
    idLine.style.cssText = "color:#94a3b8;margin-bottom:8px;";
    idLine.textContent = "\u63D2\u4EF6 ID: " + e.id;
    detail.appendChild(idLine);
    if (e.config && typeof e.config === "object") {
      for (const key of Object.keys(e.config)) {
        detail.appendChild(controlField(st, i, key, e.config[key]));
      }
    } else {
      const span = document.createElement("span");
      span.className = "ps-none";
      span.textContent = "\u65E0\u914D\u7F6E";
      detail.appendChild(span);
    }
    box.appendChild(detail);
    container.appendChild(box);
    return box;
  });
  layout(st);
}
function controlField(st, index, key, value) {
  const wrap = document.createElement("div");
  wrap.className = "ps-field";
  const label = document.createElement("label");
  label.textContent = key;
  wrap.appendChild(label);
  const onChange = (v) => {
    const entry = st.entries[index];
    const cfg = entry.config && typeof entry.config === "object" ? { ...entry.config } : {};
    cfg[key] = v;
    entry.config = cfg;
  };
  const type = inferControlType(value);
  if (type === "string") {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.addEventListener("input", () => onChange(input.value));
    wrap.appendChild(input);
  } else if (type === "number") {
    const input = document.createElement("input");
    input.type = "number";
    input.value = String(value);
    input.addEventListener("input", () => onChange(Number(input.value)));
    wrap.appendChild(input);
  } else if (type === "boolean") {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = value;
    input.addEventListener("change", () => onChange(input.checked));
    wrap.appendChild(input);
  } else if (type === "array") {
    if (Array.isArray(value) && isStringArray(value)) {
      wrap.appendChild(stringListField(onChange, [...value]));
    } else {
      wrap.appendChild(jsonField(value, onChange));
    }
  } else if (type === "object") {
    wrap.appendChild(jsonField(value, onChange));
  } else {
    const span = document.createElement("span");
    span.className = "ps-none";
    span.textContent = "\u65E0\u914D\u7F6E";
    wrap.appendChild(span);
  }
  return wrap;
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((x) => typeof x === "string");
}
function jsonField(value, onChange) {
  const ta = document.createElement("textarea");
  ta.value = JSON.stringify(value, null, 2);
  ta.addEventListener("change", () => {
    try {
      onChange(JSON.parse(ta.value));
    } catch {
    }
  });
  return ta;
}
function stringListField(onChange, initial) {
  const container = document.createElement("div");
  container.style.cssText = "flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;";
  const render = () => {
    container.innerHTML = "";
    initial.forEach((item, i) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:6px;";
      const input = document.createElement("input");
      input.type = "text";
      input.value = item;
      input.style.cssText = "flex:1;padding:5px 8px;border:1px solid rgba(148,163,184,.5);border-radius:8px;font-size:12px;color:#1f2d3d;min-width:0;";
      input.addEventListener("input", () => {
        initial[i] = input.value;
        onChange([...initial]);
      });
      const del = document.createElement("button");
      del.textContent = "\u{1F5D1}";
      del.title = "\u5220\u9664";
      del.style.cssText = "width:26px;height:26px;border:none;background:none;cursor:pointer;font-size:13px;color:#dc2626;flex-shrink:0;display:flex;align-items:center;justify-content:center;";
      del.addEventListener("click", () => {
        initial.splice(i, 1);
        onChange([...initial]);
        render();
      });
      row.append(input, del);
      container.appendChild(row);
    });
    const add = document.createElement("button");
    add.textContent = "\uFF0B \u65B0\u5EFA";
    add.style.cssText = "align-self:flex-start;border:1px dashed rgba(148,163,184,.5);background:none;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;color:#7c6df6;";
    add.addEventListener("click", () => {
      initial.push("");
      onChange([...initial]);
      render();
    });
    container.appendChild(add);
  };
  render();
  return container;
}
function heightOf(st, i) {
  return (st.items[i]?.offsetHeight ?? 46) + GAP;
}
function topAt(st, pos) {
  let y = 0;
  for (let p = 0; p < pos; p++) y += heightOf(st, st.order[p]);
  return y;
}
function layout(st) {
  const container = st.container;
  if (!container) return;
  let y = 0;
  for (const i of st.order) {
    if (st.isDragging && i === st.dragIndex) continue;
    const el = st.items[i];
    if (el) el.style.top = y + "px";
    y += heightOf(st, i);
  }
  container.style.height = Math.max(0, y - GAP) + "px";
  const drop = st.drop;
  if (drop) {
    if (st.isDragging && st.currentTarget >= 0) {
      drop.style.top = topAt(st, st.currentTarget) - 2 + "px";
      drop.classList.add("ps-visible");
    } else {
      drop.classList.remove("ps-visible");
    }
  }
}
function updateOrder(st, targetPos) {
  const cur = st.order.indexOf(st.dragIndex);
  st.order.splice(cur, 1);
  st.order.splice(targetPos, 0, st.dragIndex);
  st.currentTarget = targetPos;
}
function moveDrag(st, mouseY) {
  if (st.animFrame !== null) cancelAnimationFrame(st.animFrame);
  st.animFrame = requestAnimationFrame(() => {
    const el = st.items[st.dragIndex];
    if (!el || !st.container) return;
    el.style.transform = `translateY(${mouseY - st.dragStartY}px) scale(1.02)`;
    const relY = mouseY - st.container.getBoundingClientRect().top;
    const rest = st.order.filter((i) => i !== st.dragIndex);
    let pos = rest.length;
    for (let p = 0; p < rest.length; p++) {
      const other = st.items[rest[p]];
      const center = parseFloat(other.style.top) + other.offsetHeight / 2;
      if (relY < center) {
        pos = p;
        break;
      }
    }
    if (pos !== st.currentTarget) updateOrder(st, pos);
    layout(st);
  });
}
function startDrag(st, index, mouseY) {
  st.isDragging = true;
  st.dragIndex = index;
  st.dragStartY = mouseY;
  st.currentTarget = st.order.indexOf(index);
  const el = st.items[index];
  el.classList.add("ps-dragging");
  el.style.zIndex = "100";
  el.style.transform = "translateY(0px) scale(1.02)";
  if (st.drop) {
    st.drop.classList.add("ps-visible");
    st.drop.style.top = topAt(st, st.currentTarget) - 2 + "px";
  }
  layout(st);
}
function endDrag(st) {
  if (!st.isDragging) return;
  if (st.animFrame !== null) {
    cancelAnimationFrame(st.animFrame);
    st.animFrame = null;
  }
  st.isDragging = false;
  const el = st.items[st.dragIndex];
  if (!el) {
    st.currentTarget = -1;
    st.dragIndex = -1;
    return;
  }
  const finalTop = topAt(st, st.order.indexOf(st.dragIndex));
  st.drop?.classList.remove("ps-visible");
  el.style.transition = "none";
  el.style.top = finalTop + "px";
  el.style.transform = "";
  el.style.zIndex = "";
  el.classList.remove("ps-dragging");
  st.currentTarget = -1;
  st.dragIndex = -1;
  layout(st);
}
async function save(st, tools) {
  try {
    const payload = buildSavePayload(st.order.map((i) => ({ id: st.entries[i].id, config: st.entries[i].config ?? null })));
    const res = await fetch("/api/setting/save", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      tools.toast("\u5DF2\u4FDD\u5B58,\u914D\u7F6E\u5373\u5C06\u751F\u6548", { icon: "\u2713" });
    } else {
      tools.toast(data.error ?? "\u4FDD\u5B58\u5931\u8D25", { icon: "\u26A0" });
    }
  } catch {
    tools.toast("\u4FDD\u5B58\u5931\u8D25", { icon: "\u26A0" });
  }
}
var plugin = {
  name: "plugin-setting",
  mount(_el) {
    ensureStyle();
    const slots = uiSlots();
    if (!slots) {
      console.warn("[plugin-setting] \u672A\u68C0\u6D4B\u5230 __uiSlots__,\u9F7F\u8F6E\u6309\u94AE\u4E0D\u53EF\u7528");
      return;
    }
    const buttons = [];
    slots.register("sidebar-left", {
      name: "plugin-setting",
      render: (el) => {
        const btn = makeGearButton(false, openDialog);
        buttons.push(btn);
        el.appendChild(btn);
      },
      collapsedRender: (el) => {
        const btn = makeGearButton(true, openDialog);
        buttons.push(btn);
        el.appendChild(btn);
      },
      unmount: () => {
        for (const btn of buttons) btn.remove();
        buttons.length = 0;
      }
    });
  },
  unmount() {
    uiSlots()?.unregister("sidebar-left", "plugin-setting");
  }
};
var web_default = plugin;
module.exports = module.exports.default

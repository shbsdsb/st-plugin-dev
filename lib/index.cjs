"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/web.tsx
var web_exports = {};
__export(web_exports, {
  default: () => web_default
});
module.exports = __toCommonJS(web_exports);
var import_react2 = __toESM(require("react"), 1);
var import_client = require("react-dom/client");

// src/slots.ts
var SLOT_NAMES = ["nav", "sidebar-left", "sidebar-right", "main", "overlay"];
var SlotRegistry = class {
  store = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  /** 订阅注册表变更(register/unregister 时通知);返回退订函数 */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  notify() {
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
  mapOf(slot) {
    let map = this.store.get(slot);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      this.store.set(slot, map);
    }
    return map;
  }
  register(slot, content) {
    if (!SLOT_NAMES.includes(slot)) {
      throw new Error("\u672A\u77E5\u63D2\u69FD: " + slot);
    }
    const map = this.mapOf(slot);
    const existing = map.get(content.name);
    if (existing && existing !== content) {
      existing.unmount?.();
    }
    map.set(content.name, content);
    this.notify();
  }
  unregister(slot, name) {
    const map = this.store.get(slot);
    if (!map) return;
    const content = map.get(name);
    if (!content) return;
    content.unmount?.();
    map.delete(name);
    this.notify();
  }
  get(slot) {
    return [...this.store.get(slot)?.values() ?? []];
  }
};

// src/layout.tsx
var import_react = __toESM(require("react"), 1);
var NAV_H = 48;
var SIDEBAR_W = 240;
var COLLAPSED_LEFT_W = 40;
function IconDotChevron({ dir }) {
  return import_react.default.createElement(
    "svg",
    { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
    import_react.default.createElement("circle", { cx: 12, cy: 12, r: 2, fill: "currentColor", stroke: "none" }),
    import_react.default.createElement("path", { d: dir === "right" ? "M14 9l3 3-3 3" : "M10 9l-3 3 3 3" })
  );
}
function IconDotPlus() {
  return import_react.default.createElement(
    "svg",
    { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
    import_react.default.createElement("circle", { cx: 12, cy: 12, r: 2, fill: "currentColor", stroke: "none" }),
    import_react.default.createElement("path", { d: "M12 9v6M9 12h6" })
  );
}
function Layout(props) {
  const { registry } = props;
  const showRail = props.showCollapsedRail ?? true;
  const [leftW, setLeftW] = import_react.default.useState(SIDEBAR_W);
  const [rightW, setRightW] = import_react.default.useState(SIDEBAR_W);
  const [leftCollapsed, setLeftCollapsed] = import_react.default.useState(props.leftCollapsed ?? false);
  const [rightCollapsed, setRightCollapsed] = import_react.default.useState(props.rightCollapsed ?? false);
  const [overlayPos, setOverlayPos] = import_react.default.useState({ x: 20, y: 60 });
  const [overlayVisible, setOverlayVisible] = import_react.default.useState(false);
  const containers = import_react.default.useRef({});
  const [, setRevision] = import_react.default.useState(0);
  const renderSlot = import_react.default.useCallback((slot) => {
    const el = containers.current[slot];
    if (!el) return;
    el.innerHTML = "";
    for (const content of registry.get(slot)) {
      try {
        content.render(el);
      } catch (e) {
        console.error("[st-ui-slots] slot render failed:", slot, content.name, e);
      }
    }
  }, [registry]);
  const renderCollapsed = import_react.default.useCallback((slot) => {
    const el = containers.current[`collapsed-${slot}`];
    if (!el) return;
    el.innerHTML = "";
    for (const content of registry.get(slot)) {
      try {
        content.collapsedRender?.(el);
      } catch (e) {
        console.error("[st-ui-slots] collapsed render failed:", slot, content.name, e);
      }
    }
  }, [registry]);
  const renderAll = import_react.default.useCallback(() => {
    for (const slot of SLOT_NAMES) {
      renderSlot(slot);
      renderCollapsed(slot);
    }
  }, [renderSlot, renderCollapsed]);
  import_react.default.useEffect(() => {
    renderAll();
    const unsubscribe = registry.subscribe(() => {
      setRevision((r) => r + 1);
      renderAll();
    });
    return unsubscribe;
  }, [registry, renderAll]);
  const slotRefs = import_react.default.useRef({});
  const slotRef = (slot) => {
    let ref = slotRefs.current[slot];
    if (!ref) {
      ref = (el) => {
        containers.current[slot] = el;
        if (el) renderSlot(slot);
      };
      slotRefs.current[slot] = ref;
    }
    return ref;
  };
  const slotRefCollapsed = (slot) => {
    let ref = slotRefs.current[`collapsed-${slot}`];
    if (!ref) {
      ref = (el) => {
        containers.current[`collapsed-${slot}`] = el;
        if (el) renderCollapsed(slot);
      };
      slotRefs.current[`collapsed-${slot}`] = ref;
    }
    return ref;
  };
  const startDrag = (e, side) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = side === "left" ? leftW : rightW;
    const move = (ev) => {
      const delta = ev.clientX - startX;
      if (side === "left") setLeftW(Math.max(120, Math.min(480, startW + delta)));
      else setRightW(Math.max(120, Math.min(480, startW - delta)));
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };
  const startOverlayDrag = (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const base = { ...overlayPos };
    const move = (ev) => setOverlayPos({ x: base.x + ev.clientX - startX, y: base.y + ev.clientY - startY });
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };
  const btn = (icon, onClick, title, extra) => import_react.default.createElement(
    "button",
    { className: "st-slot-btn", onClick, title, style: { width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer", background: "transparent", border: "1px solid #ccc", borderRadius: "50%" }, ...extra },
    icon
  );
  const sidebar = (side, w, collapsed, setCollapsed) => {
    if (side === "left") {
      if (collapsed) {
        if (!showRail) return null;
        return import_react.default.createElement(
          "div",
          { "data-slot": "sidebar-left", style: { width: COLLAPSED_LEFT_W, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, gap: 6 } },
          btn(import_react.default.createElement(IconDotChevron, { dir: "right" }), () => setCollapsed(false), "\u5C55\u5F00\u4FA7\u8FB9\u680F"),
          import_react.default.createElement("div", { ref: slotRefCollapsed("sidebar-left"), style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 } })
        );
      }
      return import_react.default.createElement(
        import_react.default.Fragment,
        null,
        import_react.default.createElement(
          "div",
          { "data-slot": "sidebar-left", style: { width: w, flexShrink: 0, overflow: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid #ccc" } },
          import_react.default.createElement(
            "div",
            { style: { padding: "6px 8px", display: "flex", justifyContent: "flex-end" } },
            btn(import_react.default.createElement(IconDotChevron, { dir: "left" }), () => setCollapsed(true), "\u6536\u8D77\u4FA7\u8FB9\u680F")
          ),
          import_react.default.createElement("div", { ref: slotRef("sidebar-left"), style: { flex: 1, padding: 8 } })
        ),
        import_react.default.createElement("div", { className: "st-drag-handle", onMouseDown: (e) => startDrag(e, side), style: { width: 4, cursor: "col-resize", flexShrink: 0 } })
      );
    }
    if (collapsed) return null;
    return import_react.default.createElement(
      import_react.default.Fragment,
      null,
      import_react.default.createElement("div", { className: "st-drag-handle", onMouseDown: (e) => startDrag(e, side), style: { width: 4, cursor: "col-resize", flexShrink: 0 } }),
      import_react.default.createElement(
        "div",
        { "data-slot": "sidebar-right", style: { width: w, flexShrink: 0, overflow: "auto", borderLeft: "1px solid #ccc" } },
        import_react.default.createElement(
          "div",
          { style: { padding: "6px 8px", display: "flex", justifyContent: "flex-start" } },
          btn(import_react.default.createElement(IconDotPlus, null), () => setCollapsed(true), "\u6536\u8D77\u4FA7\u8FB9\u680F")
        ),
        import_react.default.createElement("div", { ref: slotRef("sidebar-right"), style: { padding: 8 } })
      )
    );
  };
  const desktopBody = import_react.default.createElement(
    "div",
    { style: { display: "flex", flex: 1, minHeight: 0 } },
    import_react.default.createElement("div", { style: { display: "flex", flexShrink: 0 } }, sidebar("left", leftW, leftCollapsed, setLeftCollapsed)),
    import_react.default.createElement(
      "div",
      { "data-slot": "main", style: { flex: 1, minWidth: 0, overflow: "auto", padding: 8, position: "relative" } },
      import_react.default.createElement("div", { ref: slotRef("main") }),
      leftCollapsed && !showRail && import_react.default.createElement(
        "div",
        { style: { position: "absolute", top: 8, left: 8, zIndex: 900 } },
        btn(import_react.default.createElement(IconDotChevron, { dir: "right" }), () => setLeftCollapsed(false), "\u5C55\u5F00\u5DE6\u4FA7\u680F")
      ),
      rightCollapsed && import_react.default.createElement(
        "div",
        { style: { position: "absolute", top: 8, right: 8, zIndex: 900 } },
        btn(import_react.default.createElement(IconDotPlus, null), () => setRightCollapsed(false), "\u5C55\u5F00\u53F3\u4FA7\u680F")
      )
    ),
    import_react.default.createElement("div", { style: { display: "flex", flexShrink: 0 } }, sidebar("right", rightW, rightCollapsed, setRightCollapsed))
  );
  const navChildren = import_react.default.createElement("div", { ref: slotRef("nav"), style: { flex: 1 } });
  return import_react.default.createElement(
    "div",
    { style: { display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui", margin: 0, overflow: "hidden" } },
    import_react.default.createElement(
      "div",
      { "data-slot": "nav", style: { height: NAV_H, display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0, borderBottom: "1px solid #ccc" } },
      navChildren
    ),
    desktopBody,
    overlayVisible && import_react.default.createElement(
      "div",
      {
        "data-slot": "overlay",
        onMouseDown: startOverlayDrag,
        style: { position: "fixed", left: overlayPos.x, top: overlayPos.y, width: 240, height: 160, border: "1px solid #999", borderRadius: 6, cursor: "move", zIndex: 1e3, display: "flex", flexDirection: "column" }
      },
      import_react.default.createElement(
        "div",
        { style: { display: "flex", justifyContent: "flex-end", padding: "2px 4px" } },
        import_react.default.createElement("button", { onClick: (e) => {
          e.stopPropagation();
          setOverlayVisible(false);
        }, style: { border: "none", background: "none", cursor: "pointer", fontSize: 12 } }, "\u2715")
      ),
      import_react.default.createElement("div", { ref: slotRef("overlay"), style: { flex: 1, padding: 4, overflow: "auto" } })
    )
  );
}

// src/client-config.ts
var DEFAULT_FRONT = { showCollapsedRail: true };
function readClientConfig(id) {
  if (typeof window === "undefined") return { ...DEFAULT_FRONT };
  const w = window;
  const cfg = w.__CLIENT_CONFIG__?.[id];
  return { showCollapsedRail: cfg?.showCollapsedRail ?? true };
}

// src/web.tsx
var web_default = {
  name: "st-ui-slots",
  mount(el) {
    const registry = new SlotRegistry();
    window.__uiSlots__ = {
      register: (slot, content) => registry.register(slot, content),
      unregister: (slot, name) => registry.unregister(slot, name),
      get: (slot) => registry.get(slot)
    };
    this.root = (0, import_client.createRoot)(el);
    const cfg = readClientConfig("st-ui-slots");
    this.root.render(import_react2.default.createElement(Layout, { registry, showCollapsedRail: cfg.showCollapsedRail }));
  },
  unmount() {
    this.root?.unmount();
    delete window.__uiSlots__;
  }
};
module.exports = module.exports.default

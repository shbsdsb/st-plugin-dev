// agent_plugin_dev/ui-tool-plugin/src/tools.ts
// 前端工具库:13 种玻璃拟态悬浮工具(创建/显示/关闭)。
// 视觉全部由注入的基础 <style> 控制(与主题一致的玻璃基元),JS 只负责结构/交互。
const STYLE_ID = 'ui-tool-plugin-tools'
const active: HTMLElement[] = []
/** 遮罩类节点集合:新开时关闭旧的 */
const masked: HTMLElement[] = []
/** 进行中的 interval(progress 等),closeAllTools 时统一清理 */
const intervals: ReturnType<typeof setInterval>[] = []

/** 首次调用时注入工具库基础样式(玻璃拟态,含 13 种浮层位置/动画) */
function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
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
`
  document.head.appendChild(style)
}

/** 创建浮层节点(结构);视觉由基础样式控制 */
function createFloat(spec: {
  mod: string
  icon?: string
  title: string
  desc?: string
  closable?: boolean
}): HTMLElement {
  const el = document.createElement('div')
  el.className = `fw ${spec.mod}`
  if (spec.icon) {
    const ic = document.createElement('span')
    ic.className = 'ic'
    ic.textContent = spec.icon
    el.appendChild(ic)
  }
  const tx = document.createElement('div')
  const b = document.createElement('b')
  b.style.cssText = 'display:block;font-size:13px;color:#1f2d3d;'
  b.textContent = spec.title
  tx.appendChild(b)
  if (spec.desc) {
    const s = document.createElement('span')
    s.style.cssText = 'display:block;font-size:11px;color:#64748b;'
    s.textContent = spec.desc
    tx.appendChild(s)
  }
  el.appendChild(tx)
  if (spec.closable) {
    const c = document.createElement('button')
    c.className = 'cl'
    c.textContent = '✕'
    c.addEventListener('click', () => hide(el))
    el.appendChild(c)
  }
  return el
}

/** 显示浮层(挂 body + show class + 可选 auto 消失) */
function show(el: HTMLElement, autoMs?: number): void {
  ensureStyle()
  document.body.appendChild(el)
  active.push(el)
  requestAnimationFrame(() => el.classList.add('show'))
  if (autoMs) setTimeout(() => hide(el), autoMs)
}

/** 关闭浮层(动画后移除) */
function hide(el: HTMLElement): void {
  el.classList.remove('show')
  setTimeout(() => {
    const i = active.indexOf(el)
    if (i >= 0) active.splice(i, 1)
    el.remove()
  }, 300)
}

/** 遮罩互斥:新开时关闭旧的 */
function closeMasked(): void {
  for (const m of [...masked]) hideMask(m)
}

/** 关闭单个遮罩 */
function hideMask(mask: HTMLElement): void {
  const i = masked.indexOf(mask)
  if (i >= 0) masked.splice(i, 1)
  const ai = active.indexOf(mask)
  if (ai >= 0) active.splice(ai, 1)
  mask.classList.remove('show')
  setTimeout(() => mask.remove(), 250)
}

/** 关闭全部活动浮层 + 清理定时器(unmount 清场) */
export function closeAllTools(): void {
  for (const el of [...active]) hide(el)
  for (const t of intervals) clearInterval(t)
  intervals.length = 0
}

/** 移除工具库基础样式(unmount 清场;仅当无活动浮层时) */
export function removeToolsStyle(): void {
  document.getElementById(STYLE_ID)?.remove()
}

export interface Tools {
  toast(msg: string, opts?: { icon?: string }): void
  alert(msg: string, opts?: { icon?: string }): void
  notify(opts: { title: string; desc?: string }): void
  bottomSheet(opts: { title: string; desc?: string }): void
  topBanner(opts: { title: string; desc?: string }): void
  sideSlide(opts: { title: string; desc?: string }): void
  modal(opts: { title: string; desc?: string; onOk?: () => void; onCancel?: () => void }): void
  tooltip(el: HTMLElement, text: string): void
  badge(el: HTMLElement, count?: number): void
  progress(opts: { title: string; onDone?: () => void }): void
  dismissible(msg: string): void
  centerPopup(opts: { title: string; desc?: string; icon?: string }): void
  pluginModal(opts: {
    title?: string
    content: string | ((el: HTMLElement) => void) | HTMLElement
    actions?: Array<{ label: string; variant?: 'primary' | 'secondary' | 'danger'; onClick?: () => void }>
    width?: number
  }): void
}

export function createTools(): Tools {
  return {
    toast(msg, opts) {
      const el = createFloat({ mod: 'fw-toast', icon: opts?.icon ?? '✓', title: msg })
      show(el, 2600)
    },
    alert(msg, opts) {
      const el = createFloat({ mod: 'fw-alert', icon: opts?.icon ?? '⚠', title: msg, closable: true })
      show(el)
    },
    notify({ title, desc }) {
      const el = createFloat({ mod: 'fw-notify', icon: '●', title, desc, closable: true })
      show(el)
    },
    bottomSheet({ title, desc }) {
      const el = createFloat({ mod: 'fw-sheet', title, desc, closable: true })
      show(el)
    },
    topBanner({ title, desc }) {
      const el = createFloat({ mod: 'fw-banner', icon: '★', title, desc, closable: true })
      show(el)
    },
    sideSlide({ title, desc }) {
      const el = createFloat({ mod: 'fw-slide', icon: '→', title, desc, closable: true })
      show(el)
    },
    modal({ title, desc, onOk, onCancel }) {
      closeMasked()
      const mask = document.createElement('div')
      mask.className = 'fw-mask'
      const box = document.createElement('div')
      box.className = 'fw-modal'
      const h = document.createElement('h3')
      h.style.cssText = 'font-size:16px;margin-bottom:8px;'
      h.textContent = title
      const p = document.createElement('p')
      p.style.cssText = 'font-size:12px;color:#64748b;margin:8px 0 18px;line-height:1.6;'
      p.textContent = desc ?? ''
      const acts = document.createElement('div')
      acts.style.cssText = 'display:flex;gap:10px;justify-content:center;'
      const ok = document.createElement('button')
      ok.textContent = '确认'
      ok.style.cssText = 'border:none;border-radius:40px;padding:9px 22px;font-size:12px;font-weight:600;cursor:pointer;background:#7c6df6;color:#fff;'
      ok.addEventListener('click', () => { hideMask(mask); onOk?.() })
      const no = document.createElement('button')
      no.textContent = '取消'
      no.style.cssText = 'border:none;border-radius:40px;padding:9px 22px;font-size:12px;font-weight:600;cursor:pointer;background:rgba(148,163,184,0.2);color:#475569;'
      no.addEventListener('click', () => { hideMask(mask); onCancel?.() })
      acts.append(ok, no)
      box.append(h, p, acts)
      mask.append(box)
      masked.push(mask)
      show(mask)
    },
    tooltip(el, text) {
      ensureStyle()
      const tip = document.createElement('div')
      tip.className = 'fw-tip'
      tip.textContent = text
      document.body.appendChild(tip)
      active.push(tip)
      const r = el.getBoundingClientRect()
      tip.style.left = Math.max(8, r.left + r.width / 2 - 60) + 'px'
      tip.style.top = Math.max(4, r.top - 40) + 'px'
      setTimeout(() => {
        const i = active.indexOf(tip)
        if (i >= 0) active.splice(i, 1)
        tip.remove()
      }, 2500)
    },
    badge(el, count) {
      ensureStyle()
      const old = el.querySelector('.badge-dot') as HTMLElement | null
      if (old) { old.remove(); return }
      const dot = document.createElement('span')
      dot.className = 'badge-dot'
      dot.textContent = String(count ?? 3)
      if (!el.style.position) el.style.position = 'relative'
      el.appendChild(dot)
    },
    progress({ title, onDone }) {
      const el = createFloat({ mod: 'fw-prog', icon: '↓', title })
      const pb = document.createElement('div')
      pb.className = 'pb'
      const fill = document.createElement('i')
      pb.appendChild(fill)
      el.appendChild(pb)
      show(el)
      let p = 0
      const timer = setInterval(() => {
        p = Math.min(100, p + 14)
        fill.style.width = p + '%'
        if (p >= 100) {
          clearInterval(timer)
          const ti = intervals.indexOf(timer)
          if (ti >= 0) intervals.splice(ti, 1)
          setTimeout(() => { hide(el); onDone?.() }, 500)
        }
      }, 300)
      intervals.push(timer)
    },
    dismissible(msg) {
      const el = createFloat({ mod: 'fw-dismiss', icon: '✓', title: msg, closable: true })
      show(el)
    },
    centerPopup({ title, desc, icon }) {
      const el = createFloat({ mod: 'fw-center', icon: undefined, title })
      const big = document.createElement('div')
      big.className = 'big'
      big.textContent = icon ?? '♥'
      el.insertBefore(big, el.querySelector('div'))
      const sp = document.createElement('span')
      sp.textContent = desc ?? ''
      sp.style.cssText = 'font-size:12px;color:#64748b;'
      el.appendChild(sp)
      show(el, 2800)
    },
    pluginModal({ title, content, actions, width }) {
      closeMasked()
      const mask = document.createElement('div')
      mask.className = 'fw-mask'
      const box = document.createElement('div')
      box.className = 'fw-modal'
      box.style.cssText = `width:${width ? width + 'px' : 'min(420px,92vw)'};max-height:82vh;display:flex;flex-direction:column;overflow:hidden;text-align:left;padding:0;`
      // 头部:标题 + 右上角固定 ✕(无条件关闭)
      const ph = document.createElement('div')
      ph.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(148,163,184,0.25);'
      const t = document.createElement('b')
      t.style.cssText = 'font-size:14px;'
      t.textContent = title ?? ''
      const x = document.createElement('button')
      x.textContent = '✕'
      x.style.cssText = 'width:26px;height:26px;border-radius:50%;border:none;background:rgba(148,163,184,0.2);color:#475569;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;'
      x.addEventListener('click', () => hideMask(mask))
      ph.append(t, x)
      // 内容区:HTML 字符串 / 渲染函数 / DOM 节点
      const pc = document.createElement('div')
      pc.style.cssText = 'padding:18px 16px;overflow:auto;flex:1;font-size:13px;color:#334155;line-height:1.7;'
      if (typeof content === 'string') pc.innerHTML = content
      else if (typeof content === 'function') content(pc)
      else pc.appendChild(content)
      box.append(ph, pc)
      // 底部按钮区(插件注册)
      if (actions && actions.length > 0) {
        const pa = document.createElement('div')
        pa.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;padding:12px 16px;border-top:1px solid rgba(148,163,184,0.25);'
        for (const a of actions) {
          const btn = document.createElement('button')
          btn.textContent = a.label
          btn.style.cssText = 'border:none;border-radius:40px;padding:9px 22px;font-size:12px;font-weight:600;cursor:pointer;' +
            (a.variant === 'primary' ? 'background:#7c6df6;color:#fff;' : a.variant === 'danger' ? 'background:#dc2626;color:#fff;' : 'background:rgba(148,163,184,0.2);color:#475569;')
          btn.addEventListener('click', () => { hideMask(mask); a.onClick?.() })
          pa.appendChild(btn)
        }
        box.append(pa)
      }
      mask.append(box)
      masked.push(mask)
      show(mask)
    },
  }
}

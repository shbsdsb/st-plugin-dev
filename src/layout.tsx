// agent_plugin_dev/st-ui-slots/src/layout.tsx
// 布局纯结构:无示例颜色/文字(具体 UI 由其他插件经插槽填充);保留尺寸/拖拽/收起/悬浮拖拽交互。
// 收放行为(功能边界):
//   - 左栏收起:保留 40px 窄条(data-slot 保留,美化不消失),展开按钮在窄条内;
//   - 右栏收起:完全收起(不渲染),展开按钮移动到 main 插槽右上角;展开时按钮回到右栏顶部。
// 按钮外观(.st-slot-btn 玻璃美化)由美化插件(st-ui-beautify)提供,本层只提供结构与图标。
// 移动端(<=768px):默认收起侧栏、打开为覆盖层;窄条显隐由 showCollapsedRail 控制(桌面+移动通用)。
import React from 'react'
import { SLOT_NAMES, type SlotName, type SlotRegistry } from './slots.ts'
import { useIsMobile } from './use-is-mobile.ts'

const NAV_H = 48
const SIDEBAR_W = 240
const COLLAPSED_LEFT_W = 40
const MOBILE_RAIL_W = 280

/** 13 号图标:圆点 + V 形(左侧收放) */
function IconDotChevron({ dir }: { dir: 'left' | 'right' }): React.ReactElement {
  return React.createElement('svg',
    { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 12, cy: 12, r: 2, fill: 'currentColor', stroke: 'none' }),
    React.createElement('path', { d: dir === 'right' ? 'M14 9l3 3-3 3' : 'M10 9l-3 3 3 3' }))
}

/** 14 号图标:圆点 + 十字(右侧收放) */
function IconDotPlus(): React.ReactElement {
  return React.createElement('svg',
    { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 12, cy: 12, r: 2, fill: 'currentColor', stroke: 'none' }),
    React.createElement('path', { d: 'M12 9v6M9 12h6' }))
}

/** 移动端汉堡(两道横线) */
function IconMenu(): React.ReactElement {
  return React.createElement('svg',
    { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' },
    React.createElement('path', { d: 'M4 7h16M4 12h16M4 17h16' }))
}

/** 移动端关闭(✕) */
function IconClose(): React.ReactElement {
  return React.createElement('svg',
    { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' },
    React.createElement('path', { d: 'M6 6l12 12M18 6L6 18' }))
}

export function Layout(props: {
  registry: SlotRegistry
  isMobile?: boolean
  showCollapsedRail?: boolean
  leftCollapsed?: boolean
  rightCollapsed?: boolean
}): React.ReactElement {
  const { registry } = props
  const mobile = props.isMobile ?? useIsMobile()
  const showRail = props.showCollapsedRail ?? true
  const [leftW, setLeftW] = React.useState(SIDEBAR_W)
  const [rightW, setRightW] = React.useState(SIDEBAR_W)
  const [leftCollapsed, setLeftCollapsed] = React.useState(props.leftCollapsed ?? false)
  const [rightCollapsed, setRightCollapsed] = React.useState(props.rightCollapsed ?? false)
  // 移动端:当前打开的覆盖侧栏(null = 关闭)
  const [openRail, setOpenRail] = React.useState<null | 'left' | 'right'>(null)
  const [overlayPos, setOverlayPos] = React.useState({ x: 20, y: 60 })
  const [overlayVisible, setOverlayVisible] = React.useState(false)
  const containers = React.useRef<Record<string, HTMLDivElement | null>>({})
  const [, setRevision] = React.useState(0)

  const renderSlot = React.useCallback((slot: SlotName) => {
    const el = containers.current[slot]
    if (!el) return
    el.innerHTML = ''
    for (const content of registry.get(slot)) {
      try { content.render(el) } catch (e) { console.error('[st-ui-slots] slot render failed:', slot, content.name, e) }
    }
  }, [registry])

  const renderCollapsed = React.useCallback((slot: SlotName) => {
    const el = containers.current[`collapsed-${slot}`]
    if (!el) return
    el.innerHTML = ''
    for (const content of registry.get(slot)) {
      try { content.collapsedRender?.(el) } catch (e) { console.error('[st-ui-slots] collapsed render failed:', slot, content.name, e) }
    }
  }, [registry])

  const renderAll = React.useCallback(() => {
    for (const slot of SLOT_NAMES) {
      renderSlot(slot)
      renderCollapsed(slot)
    }
  }, [renderSlot, renderCollapsed])

  React.useEffect(() => {
    renderAll()
    const unsubscribe = registry.subscribe(() => { setRevision((r) => r + 1); renderAll() })
    return unsubscribe
  }, [registry, renderAll])

  const slotRefs = React.useRef<Record<string, (el: HTMLDivElement | null) => void>>({})
  const slotRef = (slot: SlotName): ((el: HTMLDivElement | null) => void) => {
    let ref = slotRefs.current[slot]
    if (!ref) {
      ref = (el) => { containers.current[slot] = el; if (el) renderSlot(slot) }
      slotRefs.current[slot] = ref
    }
    return ref
  }
  const slotRefCollapsed = (slot: SlotName): ((el: HTMLDivElement | null) => void) => {
    let ref = slotRefs.current[`collapsed-${slot}`]
    if (!ref) {
      ref = (el) => { containers.current[`collapsed-${slot}`] = el; if (el) renderCollapsed(slot) }
      slotRefs.current[`collapsed-${slot}`] = ref
    }
    return ref
  }

  const startDrag = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault()
    const startX = e.clientX
    const startW = side === 'left' ? leftW : rightW
    const move = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      if (side === 'left') setLeftW(Math.max(120, Math.min(480, startW + delta)))
      else setRightW(Math.max(120, Math.min(480, startW - delta)))
    }
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  const startOverlayDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const base = { ...overlayPos }
    const move = (ev: MouseEvent) => setOverlayPos({ x: base.x + ev.clientX - startX, y: base.y + ev.clientY - startY })
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  const btn = (icon: React.ReactElement, onClick: () => void, title: string, extra?: Record<string, unknown>): React.ReactElement =>
    React.createElement('button',
      { className: 'st-slot-btn', onClick, title, style: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer', background: 'transparent', border: '1px solid #ccc', borderRadius: '50%' }, ...extra },
      icon)

  const sidebar = (side: 'left' | 'right', w: number, collapsed: boolean, setCollapsed: (v: boolean) => void) => {
    if (side === 'left') {
      if (collapsed) {
        return React.createElement('div', { 'data-slot': 'sidebar-left', style: { width: COLLAPSED_LEFT_W, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 6 } },
          btn(React.createElement(IconDotChevron, { dir: 'right' }), () => setCollapsed(false), '展开侧边栏'),
          React.createElement('div', { ref: slotRefCollapsed('sidebar-left'), style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 } }))
      }
      return React.createElement(React.Fragment, null,
        React.createElement('div', { 'data-slot': 'sidebar-left', style: { width: w, flexShrink: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', borderRight: '1px solid #ccc' } },
          React.createElement('div', { style: { padding: '6px 8px', display: 'flex', justifyContent: 'flex-end' } },
            btn(React.createElement(IconDotChevron, { dir: 'left' }), () => setCollapsed(true), '收起侧边栏')),
          React.createElement('div', { ref: slotRef('sidebar-left'), style: { flex: 1, padding: 8 } })),
        React.createElement('div', { className: 'st-drag-handle', onMouseDown: (e) => startDrag(e, side), style: { width: 4, cursor: 'col-resize', flexShrink: 0 } }))
    }
    if (collapsed) return null
    return React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'st-drag-handle', onMouseDown: (e) => startDrag(e, side), style: { width: 4, cursor: 'col-resize', flexShrink: 0 } }),
      React.createElement('div', { 'data-slot': 'sidebar-right', style: { width: w, flexShrink: 0, overflow: 'auto', borderLeft: '1px solid #ccc' } },
        React.createElement('div', { style: { padding: '6px 8px', display: 'flex', justifyContent: 'flex-start' } },
          btn(React.createElement(IconDotPlus, null), () => setCollapsed(true), '收起侧边栏')),
        React.createElement('div', { ref: slotRef('sidebar-right'), style: { padding: 8 } })))
  }

  // 移动端主体:main 全宽;showRail 时在左侧渲染 40px 窄条(可展开打开覆盖层)
  const mobileBody = React.createElement('div', { style: { display: 'flex', flex: 1, minHeight: 0 } },
    showRail && React.createElement('div', {
      'data-slots-rail': 'left',
      style: { width: COLLAPSED_LEFT_W, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 6, borderRight: '1px solid #ccc' },
    },
      btn(React.createElement(IconDotChevron, { dir: 'right' }), () => setOpenRail('left'), '打开左栏'),
      React.createElement('div', { ref: slotRefCollapsed('sidebar-left'), style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 } })),
    React.createElement('div', { 'data-slot': 'main', style: { flex: 1, minWidth: 0, overflow: 'auto', padding: 8, position: 'relative' } },
      React.createElement('div', { ref: slotRef('main') })),
    showRail && React.createElement('div', {
      'data-slots-rail': 'right',
      style: { width: COLLAPSED_LEFT_W, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 6, borderLeft: '1px solid #ccc' },
    },
      btn(React.createElement(IconDotPlus, null), () => setOpenRail('right'), '打开右栏'),
      React.createElement('div', { ref: slotRefCollapsed('sidebar-right'), style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 } })))

  const desktopBody = React.createElement('div', { style: { display: 'flex', flex: 1, minHeight: 0 } },
    React.createElement('div', { style: { display: 'flex', flexShrink: 0 } }, sidebar('left', leftW, leftCollapsed, setLeftCollapsed)),
    React.createElement('div', { 'data-slot': 'main', style: { flex: 1, minWidth: 0, overflow: 'auto', padding: 8, position: 'relative' } },
      React.createElement('div', { ref: slotRef('main') }),
      rightCollapsed && React.createElement('div', { style: { position: 'absolute', top: 8, right: 8, zIndex: 900 } },
        btn(React.createElement(IconDotPlus, null), () => setRightCollapsed(false), '展开右侧栏'))),
    React.createElement('div', { style: { display: 'flex', flexShrink: 0 } }, sidebar('right', rightW, rightCollapsed, setRightCollapsed)))

  // 移动端覆盖层(openRail 非空时渲染):fixed 面板 + 遮罩 + 关闭
  const cover = openRail && React.createElement('div', {
    'data-slots-cover': openRail,
    style: { position: 'fixed', top: 0, bottom: 0, left: openRail === 'left' ? 0 : 'auto', right: openRail === 'right' ? 0 : 'auto', width: `min(${MOBILE_RAIL_W}px, 84vw)`, zIndex: 1100, background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 0 12px rgba(0,0,0,.2)' },
  },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', padding: '4px 6px' } },
      btn(React.createElement(IconClose, null), () => setOpenRail(null), '关闭')),
    React.createElement('div', { ref: slotRef(openRail === 'left' ? 'sidebar-left' : 'sidebar-right'), style: { flex: 1, overflow: 'auto', padding: 8 } }))

  const coverMask = openRail && React.createElement('div', {
    'data-slots-mask': openRail,
    onClick: () => setOpenRail(null),
    style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.28)', zIndex: 1050 },
  })

  const navChildren = mobile
    ? React.createElement(React.Fragment, null,
        btn(React.createElement(IconMenu, null), () => setOpenRail('left'), '菜单', { 'data-mobile-open-left': true }),
        React.createElement('div', { ref: slotRef('nav'), style: { flex: 1, marginLeft: 8 } }),
        btn(React.createElement(IconDotPlus, null), () => setOpenRail('right'), '右侧栏', { 'data-mobile-open-right': true }))
    : React.createElement('div', { ref: slotRef('nav'), style: { flex: 1 } })

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui', margin: 0, overflow: 'hidden' } },
    React.createElement('div', { 'data-slot': 'nav', style: { height: NAV_H, display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0, borderBottom: '1px solid #ccc' } },
      navChildren),
    mobile ? React.createElement(React.Fragment, null, mobileBody, coverMask, cover)
      : React.createElement(React.Fragment, null, desktopBody,
        overlayVisible && React.createElement('div', {
          'data-slot': 'overlay',
          onMouseDown: startOverlayDrag,
          style: { position: 'fixed', left: overlayPos.x, top: overlayPos.y, width: 240, height: 160, border: '1px solid #999', borderRadius: 6, cursor: 'move', zIndex: 1000, display: 'flex', flexDirection: 'column' },
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', padding: '2px 4px' } },
            React.createElement('button', { onClick: (e) => { e.stopPropagation(); setOverlayVisible(false) }, style: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 12 } }, '✕')),
          React.createElement('div', { ref: slotRef('overlay'), style: { flex: 1, padding: 4, overflow: 'auto' } }))),
  )
}

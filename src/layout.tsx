// agent_plugin_dev/st-ui-slots/src/layout.tsx
// 布局纯结构:无示例颜色/文字(具体 UI 由其他插件经插槽填充);保留尺寸/拖拽/收起/悬浮拖拽交互。
// 收放行为(功能边界):
//   - 左栏收起:保留 40px 窄条(data-slot 保留,美化不消失),展开按钮在窄条内;
//   - 右栏收起:完全收起(不渲染),展开按钮移动到 main 插槽右上角;展开时按钮回到右栏顶部。
// 按钮外观(.st-slot-btn 玻璃美化)由美化插件(st-ui-beautify)提供,本层只提供结构与图标。
import React from 'react'
import { SLOT_NAMES, type SlotName, type SlotRegistry } from './slots.ts'

const NAV_H = 48
const SIDEBAR_W = 240
const COLLAPSED_LEFT_W = 40

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

export function Layout(props: { registry: SlotRegistry }): React.ReactElement {
  const { registry } = props
  const [leftW, setLeftW] = React.useState(SIDEBAR_W)
  const [rightW, setRightW] = React.useState(SIDEBAR_W)
  const [leftCollapsed, setLeftCollapsed] = React.useState(false)
  const [rightCollapsed, setRightCollapsed] = React.useState(false)
  const [overlayPos, setOverlayPos] = React.useState({ x: 20, y: 60 })
  const [overlayVisible, setOverlayVisible] = React.useState(false)
  const containers = React.useRef<Partial<Record<SlotName, HTMLDivElement | null>>>({})
  // 注册表修订计数:subscribe 通知时自增,触发 React 重渲染使新内容即时反映
  const [, setRevision] = React.useState(0)

  // 将单个插槽当前内容渲染进其容器(useCallback 稳定引用,依赖注册表实例)
  const renderSlot = React.useCallback((slot: SlotName) => {
    const el = containers.current[slot]
    if (!el) return
    el.innerHTML = ''
    for (const content of registry.get(slot)) {
      try {
        content.render(el)
      } catch (e) {
        console.error('[st-ui-slots] slot render failed:', slot, content.name, e)
      }
    }
  }, [registry])

  // 渲染全部已挂载的插槽容器
  const renderAll = React.useCallback(() => {
    for (const slot of SLOT_NAMES) renderSlot(slot)
  }, [renderSlot])

  // 订阅注册表:register/unregister 后即时重渲染并刷新容器;组件卸载时退订
  React.useEffect(() => {
    renderAll()
    const unsubscribe = registry.subscribe(() => {
      setRevision((r) => r + 1)
      renderAll()
    })
    return unsubscribe
  }, [registry, renderAll])

  // 稳定的容器 ref 回调:每插槽惰性缓存同一个函数,避免内联 ref 每次渲染触发重挂
  const slotRefs = React.useRef<Partial<Record<SlotName, (el: HTMLDivElement | null) => void>>>({})
  const slotRef = (slot: SlotName): ((el: HTMLDivElement | null) => void) => {
    let ref = slotRefs.current[slot]
    if (!ref) {
      ref = (el) => {
        containers.current[slot] = el
        if (el) renderSlot(slot)
      }
      slotRefs.current[slot] = ref
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

  // 收放按钮:结构 + 图标(className .st-slot-btn 交由美化插件提供玻璃样式)
  const btn = (icon: React.ReactElement, onClick: () => void, title: string) =>
    React.createElement('button',
      { className: 'st-slot-btn', onClick, title, style: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' } },
      icon)

  const sidebar = (side: 'left' | 'right', w: number, collapsed: boolean, setCollapsed: (v: boolean) => void) => {
    if (side === 'left') {
      if (collapsed) {
        // 左栏收起:保留 40px 窄条(data-slot 保留,玻璃美化不消失),13 号展开按钮(V 朝右)
        return React.createElement('div', { 'data-slot': 'sidebar-left', style: { width: COLLAPSED_LEFT_W, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 8 } },
          btn(React.createElement(IconDotChevron, { dir: 'right' }), () => setCollapsed(false), '展开侧边栏'))
      }
      return React.createElement(React.Fragment, null,
        React.createElement('div', { 'data-slot': 'sidebar-left', style: { width: w, flexShrink: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', borderRight: '1px solid #ccc' } },
          React.createElement('div', { style: { padding: '6px 8px', display: 'flex', justifyContent: 'flex-end' } },
            btn(React.createElement(IconDotChevron, { dir: 'left' }), () => setCollapsed(true), '收起侧边栏')),
          React.createElement('div', { ref: slotRef('sidebar-left'), style: { flex: 1, padding: 8 } })),
        React.createElement('div', { className: 'st-drag-handle', onMouseDown: (e) => startDrag(e, side), style: { width: 4, cursor: 'col-resize', flexShrink: 0 } }))
    }
    // right:完全收起(不渲染;展开按钮在 main 右上角)
    if (collapsed) return null
    // 拖拽条在容器左侧(main 侧),与 main 之间留出间隔,边界清晰且与左侧对称
    return React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'st-drag-handle', onMouseDown: (e) => startDrag(e, side), style: { width: 4, cursor: 'col-resize', flexShrink: 0 } }),
      React.createElement('div', { 'data-slot': 'sidebar-right', style: { width: w, flexShrink: 0, overflow: 'auto', borderLeft: '1px solid #ccc' } },
        React.createElement('div', { style: { padding: '6px 8px', display: 'flex', justifyContent: 'flex-start' } },
          btn(React.createElement(IconDotPlus, null), () => setCollapsed(true), '收起侧边栏')),
        React.createElement('div', { ref: slotRef('sidebar-right'), style: { padding: 8 } })))
  }

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui', margin: 0, overflow: 'hidden' } },
    // 顶部导航栏(纯结构,UI 由 nav 插槽插件填充)
    React.createElement('div', { 'data-slot': 'nav', style: { height: NAV_H, display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0, borderBottom: '1px solid #ccc' } },
      React.createElement('div', { ref: slotRef('nav'), style: { flex: 1 } })),
    // 中部:左右侧边栏 + 主页面
    React.createElement('div', { style: { display: 'flex', flex: 1, minHeight: 0 } },
      React.createElement('div', { style: { display: 'flex', flexShrink: 0 } },
        sidebar('left', leftW, leftCollapsed, setLeftCollapsed)),
      React.createElement('div', { 'data-slot': 'main', style: { flex: 1, minWidth: 0, overflow: 'auto', padding: 8, position: 'relative' } },
        React.createElement('div', { ref: slotRef('main') }),
        // 右栏收起时:展开按钮浮动到 main 右上角(14 号)
        rightCollapsed && React.createElement('div', { style: { position: 'absolute', top: 8, right: 8, zIndex: 900 } },
          btn(React.createElement(IconDotPlus, null), () => setRightCollapsed(false), '展开右侧栏'))),
      React.createElement('div', { style: { display: 'flex', flexShrink: 0 } },
        sidebar('right', rightW, rightCollapsed, setRightCollapsed))),
    // 悬浮层(纯结构,可拖拽 + 关闭;UI 由 overlay 插槽插件填充)
    overlayVisible && React.createElement('div', {
      'data-slot': 'overlay',
      onMouseDown: startOverlayDrag,
      style: { position: 'fixed', left: overlayPos.x, top: overlayPos.y, width: 240, height: 160, border: '1px solid #999', borderRadius: 6, cursor: 'move', zIndex: 1000, display: 'flex', flexDirection: 'column' },
    },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', padding: '2px 4px' } },
        React.createElement('button', { onClick: (e) => { e.stopPropagation(); setOverlayVisible(false) }, style: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 12 } }, '✕')),
      React.createElement('div', { ref: slotRef('overlay'), style: { flex: 1, padding: 4, overflow: 'auto' } })),
  )
}

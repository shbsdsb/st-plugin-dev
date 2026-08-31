// agent_plugin_dev/st-ui-slots/src/layout.tsx
// 布局纯结构:无示例颜色/文字(具体 UI 由其他插件经插槽填充);保留尺寸/拖拽/收起/悬浮拖拽交互
import React from 'react'
import { SLOT_NAMES, type SlotName, type SlotRegistry } from './slots.ts'

const NAV_H = 48
const SIDEBAR_W = 240

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

  const btn = (label: string, onClick: () => void) =>
    React.createElement('button', { onClick, style: { cursor: 'pointer', fontSize: 14, padding: '4px 8px', borderRadius: 8 } }, label)

  const sidebar = (side: 'left' | 'right', w: number, collapsed: boolean, setCollapsed: (v: boolean) => void) =>
    collapsed
      ? React.createElement('div', { style: { width: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8 } },
          btn(side === 'left' ? '»' : '«', () => setCollapsed(false)))
      : React.createElement(React.Fragment, null,
          side === 'left' && React.createElement('div', { 'data-slot': 'sidebar-left', style: { width: w, overflow: 'auto', display: 'flex', flexDirection: 'column', borderRight: '1px solid #ccc' } },
            React.createElement('div', { style: { padding: '6px 10px', display: 'flex', justifyContent: 'flex-end' } },
              btn('«', () => setCollapsed(true))),
            React.createElement('div', { ref: slotRef('sidebar-left'), style: { flex: 1, padding: 8 } })),
          React.createElement('div', { onMouseDown: (e) => startDrag(e, side), style: { width: 4, cursor: 'col-resize', flexShrink: 0 } }),
          side === 'right' && React.createElement('div', { 'data-slot': 'sidebar-right', style: { width: w, overflow: 'auto', borderLeft: '1px solid #ccc' } },
            React.createElement('div', { style: { padding: '6px 10px', display: 'flex', justifyContent: 'flex-start' } },
              btn('»', () => setCollapsed(true))),
            React.createElement('div', { ref: slotRef('sidebar-right'), style: { padding: 8 } })))

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui', margin: 0, overflow: 'hidden' } },
    // 顶部导航栏(纯结构,UI 由 nav 插槽插件填充)
    React.createElement('div', { 'data-slot': 'nav', style: { height: NAV_H, display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0, borderBottom: '1px solid #ccc' } },
      React.createElement('div', { ref: slotRef('nav'), style: { flex: 1 } })),
    // 中部:左右侧边栏 + 主页面
    React.createElement('div', { style: { display: 'flex', flex: 1, minHeight: 0 } },
      React.createElement('div', { style: { display: 'flex', flexShrink: 0 } },
        sidebar('left', leftW, leftCollapsed, setLeftCollapsed)),
      React.createElement('div', { 'data-slot': 'main', style: { flex: 1, overflow: 'auto', padding: 8 } },
        React.createElement('div', { ref: slotRef('main') })),
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

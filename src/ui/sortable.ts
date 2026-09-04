// sortable.ts —— 绝对定位拖拽排序列表(移植 plugin-setting 已验证逻辑)
// 容器 position:relative;行 position:absolute + top 由 JS layout 计算(动态行高以 offsetHeight 实测)。
// 拖拽:被拖行 transform 跟随鼠标 + 高亮;其它行按 order 让位(top 过渡);drop-indicator 指示插入位;松手落位回调。

export interface SortableOpts {
  container: HTMLElement
  /** 行选择器(container 的直接子元素;layout 时过滤 drop-indicator) */
  rowSelector: string
  /** 拖拽把手选择器(mousedown 委托命中才可拖) */
  handleSelector: string
  /** 行间距(px),对应原 flex gap */
  gap?: number
  /** 松手回调:按当前显示序传回行元素(不含 indicator) */
  onDrop?(rows: HTMLElement[]): void
}

export interface SortableList {
  /** DOM 增删/行高变化后重建布局(内部重采行;绝对定位方案必调) */
  layout(): void
  destroy(): void
}

const INDICATOR_CLASS = 'prp-drop-indicator'
const DRAGGING_CLASS = 'prp-dragging'

export function makeSortable(opts: SortableOpts): SortableList {
  const { container, rowSelector, handleSelector, gap = 8, onDrop } = opts

  const indicator = document.createElement('div')
  indicator.className = INDICATOR_CLASS

  let rows: HTMLElement[] = []
  let order: number[] = []
  let isDragging = false
  let dragIndex = -1
  let dragStartY = 0
  let currentTarget = -1
  let animFrame: number | null = null

  function collect(): HTMLElement[] {
    return [...container.children].filter(
      (c): c is HTMLElement => c instanceof HTMLElement && c.matches(rowSelector),
    )
  }

  function heightOf(i: number): number {
    return (rows[i]?.offsetHeight ?? 40) + gap
  }
  /** 逻辑序前 pos 个的总高度(含 gap) */
  function topAt(pos: number): number {
    let y = 0
    for (let p = 0; p < pos; p++) y += heightOf(order[p])
    return y
  }

  function layout(): void {
    rows = collect()
    // indicator 可能被容器重建清掉 → 重新挂回
    if (!indicator.parentElement) container.appendChild(indicator)
    if (rows.length === 0) {
      container.style.height = ''
      order = []
      indicator.classList.remove('visible')
      return
    }
    // order 仅在行集合变化时重建;拖拽中 moveDrag 已更新 order,不得覆盖
    if (order.length !== rows.length) order = rows.map((_, i) => i)
    let y = 0
    for (let i = 0; i < order.length; i++) {
      const idx = order[i]
      const el = rows[idx]
      if (!el) continue
      if (isDragging && idx === dragIndex) continue // 被拖行由 transform 跟随
      el.style.top = y + 'px'
      y += heightOf(idx)
    }
    if (!isDragging) container.style.height = Math.max(0, y - gap) + 'px'
    // drop 指示条定位
    if (isDragging && currentTarget >= 0) {
      indicator.style.top = (topAt(currentTarget) - 2) + 'px'
      indicator.classList.add('visible')
    } else {
      indicator.classList.remove('visible')
    }
  }

  function updateOrder(targetPos: number): void {
    const cur = order.indexOf(dragIndex)
    if (cur < 0) return
    order.splice(cur, 1)
    order.splice(targetPos, 0, dragIndex)
    currentTarget = targetPos
  }

  function onMove(e: MouseEvent): void {
    if (!isDragging) return
    e.preventDefault()
    if (animFrame !== null) cancelAnimationFrame(animFrame)
    const mouseY = e.clientY
    animFrame = requestAnimationFrame(() => {
      const el = rows[dragIndex]
      if (!el) return
      el.style.transform = `translateY(${mouseY - dragStartY}px) scale(1.02)`
      const relY = mouseY - container.getBoundingClientRect().top
      const rest = order.filter((i) => i !== dragIndex)
      let pos = rest.length
      for (let p = 0; p < rest.length; p++) {
        const other = rows[rest[p]]
        const center = parseFloat(other.style.top || '0') + other.offsetHeight / 2
        if (relY < center) { pos = p; break }
      }
      if (pos !== currentTarget) updateOrder(pos)
      layout()
    })
  }

  function endDrag(): void {
    if (!isDragging) return
    if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null }
    isDragging = false
    const el = rows[dragIndex]
    if (el) {
      const finalTop = topAt(order.indexOf(dragIndex))
      // 落位:禁用过渡,松手瞬间即到位(无延迟)
      el.style.transition = 'none'
      el.style.top = finalTop + 'px'
      el.style.transform = ''
      el.style.zIndex = ''
      el.classList.remove(DRAGGING_CLASS)
      // 恢复过渡(下一帧)
      void el.offsetHeight
      el.style.transition = ''
    }
    currentTarget = -1
    dragIndex = -1
    layout()
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', endDrag)
    if (onDrop) {
      // 按当前逻辑序返回(去重保序)
      const sorted = order.map((i) => rows[i]).filter((r): r is HTMLElement => !!r)
      onDrop(sorted)
    }
  }

  function onDown(e: MouseEvent): void {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    const target = e.target as HTMLElement
    const handle = target.closest(handleSelector) as HTMLElement | null
    if (!handle) return
    const row = handle.closest(rowSelector) as HTMLElement | null
    if (!row) return
    layout()
    const idx = rows.indexOf(row)
    if (idx < 0) return
    e.preventDefault()
    if (isDragging) return
    isDragging = true
    dragIndex = idx
    dragStartY = e.clientY
    currentTarget = order.indexOf(idx)
    // 确保指示条存在
    if (!indicator.parentElement) container.appendChild(indicator)
    const el = rows[idx]
    el.style.zIndex = '100'
    el.style.transform = 'translateY(0px) scale(1.02)'
    el.classList.add(DRAGGING_CLASS)
    layout()
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', endDrag)
  }

  const onDragStartPrevent = (e: DragEvent): void => { e.preventDefault() }

  container.addEventListener('mousedown', onDown)
  container.addEventListener('dragstart', onDragStartPrevent)
  container.appendChild(indicator)

  return {
    layout,
    destroy() {
      container.removeEventListener('mousedown', onDown)
      container.removeEventListener('dragstart', onDragStartPrevent)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', endDrag)
      indicator.remove()
    },
  }
}

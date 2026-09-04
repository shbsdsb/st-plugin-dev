// drag.ts —— 通用把手拖拽排序(flow 布局,推挤式:拖动中行随插入位跳格,释放回调)
export interface DragOpts {
  handle: HTMLElement // 拖拽把手(触发器)
  item: HTMLElement // 被移动行(container 的直接子元素)
  container: HTMLElement // 行容器
  onDrop(items: HTMLElement[]): void // 松手回调:按容器当前 DOM 顺序
}

function siblings(container: HTMLElement): HTMLElement[] {
  return [...container.children].filter((c): c is HTMLElement => c instanceof HTMLElement)
}

export function attachDrag(opts: DragOpts): () => void {
  const { handle, item, container } = opts
  let dragging = false
  let raf = 0
  let prevY = -1

  const onMove = (e: MouseEvent): void => {
    if (!dragging) return
    e.preventDefault()
    const y = e.clientY
    if (y === prevY) return
    prevY = y
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      const items = siblings(container)
      const cur = items.indexOf(item)
      if (cur < 0) return
      const box = container.getBoundingClientRect()
      const rel = y - box.top
      const len = items.length
      let up = false
      let down = false
      if (cur > 0) {
        const prevBox = items[cur - 1].getBoundingClientRect()
        up = rel < prevBox.top + prevBox.height / 2
      }
      if (!up && cur < len - 1) {
        const nextBox = items[cur + 1].getBoundingClientRect()
        down = rel > nextBox.top + nextBox.height / 2
      }
      // 越过相邻行中心即交换一次;长距离拖拽由逐帧累积完成
      if (up) container.insertBefore(item, items[cur - 1])
      else if (down) container.insertBefore(item, items[cur + 1].nextSibling)
    })
  }

  const onUp = (): void => {
    if (!dragging) return
    dragging = false
    cancelAnimationFrame(raf)
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.userSelect = ''
    item.classList.remove('prp-drag-ghost')
    container.classList.remove('prp-dragging')
    opts.onDrop(siblings(container))
  }

  const onDown = (e: MouseEvent): void => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (dragging) return
    dragging = true
    prevY = -1
    container.classList.add('prp-dragging')
    item.classList.add('prp-drag-ghost')
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  handle.addEventListener('mousedown', onDown)
  return () => {
    handle.removeEventListener('mousedown', onDown)
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
}

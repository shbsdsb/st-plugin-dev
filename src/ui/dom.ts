// agent_plugin_dev/llm-plugin/src/ui/dom.ts — 纯 DOM 工具(无状态)
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  return e
}

export function buildModelOptions(models: string[], current: string): Array<{ name: string; active: boolean }> {
  return models.map((name) => ({ name, active: name === current }))
}

export function setStatus(
  indicator: HTMLElement, text: HTMLElement, msg: string, type: 'success' | 'error' | 'info',
  timer?: { ref: ReturnType<typeof setTimeout> | null },
): void {
  indicator.className = 'indicator' + (type !== 'info' ? ' ' + type : '')
  text.textContent = msg
  if (timer?.ref) { clearTimeout(timer.ref); timer.ref = null }
  if ((type === 'success' || type === 'info') && timer) {
    timer.ref = setTimeout(() => { indicator.className = 'indicator'; text.textContent = '就绪' }, 3500)
  }
}

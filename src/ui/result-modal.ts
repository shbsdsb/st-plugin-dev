import { createLayer, headOf, footOf } from './layers.ts'
import { el } from './dom.ts'

export function openResult(metaText: string, payload: unknown): void {
  const { modal, close } = createLayer('min(680px,94vw)')
  headOf(modal, '发送结果', close)
  const body = el('div', 'prp float-body')
  body.style.display = 'flex'
  body.style.flexDirection = 'column'
  const meta = el('div', 'prp result-meta', metaText)
  const pre = el('pre', 'prp result-body')
  pre.textContent = JSON.stringify(payload, null, 2)
  body.append(meta, pre)
  modal.appendChild(body)
  footOf(modal, [{ label: '关闭', variant: 's', onClick: close }])
}

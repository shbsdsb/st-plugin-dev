import { createLayer, headOf, footOf } from './layers.ts'
import { el } from './dom.ts'

export function confirmDialog(opts: { title: string; desc: string; onOk(): void }): void {
  const { root, modal, close } = createLayer('min(360px,90vw)')
  const body = el('div', 'prp float-body')
  const t = el('div', 'prp confirm-t', opts.title)
  const d = el('div', 'prp confirm-d', opts.desc)
  body.append(t, d)
  modal.appendChild(body)
  footOf(modal, [
    { label: '取消', variant: 's', onClick: close },
    { label: '删除', variant: 'd', onClick: () => { opts.onOk(); close() } },
  ])
  void root
}

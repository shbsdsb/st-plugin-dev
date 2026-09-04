import type { Entry } from '../types.ts'
import { createLayer, headOf, footOf } from './layers.ts'
import { el } from './dom.ts'

export function openEntryEditor(opts: {
  entry: Entry
  onSave(input: { name: string; role: Entry['role']; text: string }): void | Promise<void>
}): void {
  const { root, modal, close } = createLayer('min(520px,94vw)')
  headOf(modal, '编辑条目', close)

  const body = el('div', 'prp float-body')
  const fg = (label: string, control: HTMLElement) => {
    const w = el('div', 'prp fg')
    const l = document.createElement('label')
    l.textContent = label
    w.append(l, control)
    return w
  }
  const nameInput = el('input') as HTMLInputElement
  nameInput.value = opts.entry.name
  nameInput.maxLength = 50
  const roleSelect = document.createElement('select')
  for (const r of ['system', 'assistant', 'user'] as const) {
    const o = document.createElement('option')
    o.value = r
    o.textContent = r
    roleSelect.appendChild(o)
  }
  roleSelect.value = opts.entry.role
  const textArea = el('textarea') as HTMLTextAreaElement
  textArea.value = opts.entry.text
  body.append(
    fg('名称', nameInput),
    fg('角色 (role)', roleSelect),
    fg('内容 (text)', textArea),
  )
  modal.appendChild(body)

  footOf(modal, [
    { label: '取消', variant: 's', onClick: close },
    {
      label: '保存', variant: 'p', onClick: async () => {
        try {
          await opts.onSave({ name: nameInput.value.trim(), role: roleSelect.value as Entry['role'], text: textArea.value })
          close()
        } catch {
          // onSave 内已提示(名称不能为空/网络失败);保持弹窗打开不关闭
        }
      },
    },
  ])
  setTimeout(() => nameInput.focus(), 30)
}

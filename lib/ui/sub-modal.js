import { createLayer, headOf, footOf } from "./layers.js";
import { el } from "./dom.js";
export function openEntryEditor(opts) {
    const { modal, close } = createLayer('min(520px,94vw)');
    headOf(modal, opts.title, close);
    const body = el('div', 'prp float-body');
    const fg = (label, control) => {
        const w = el('div', 'prp fg');
        const l = document.createElement('label');
        l.textContent = label;
        w.append(l, control);
        return w;
    };
    const nameInput = el('input');
    nameInput.value = opts.entry.name;
    nameInput.maxLength = 50;
    body.append(fg('名称', nameInput));
    let roleValue = opts.entry.role;
    if (opts.withRole) {
        const roleSelect = document.createElement('select');
        for (const r of ['system', 'assistant', 'user']) {
            const o = document.createElement('option');
            o.value = r;
            o.textContent = r;
            roleSelect.appendChild(o);
        }
        roleSelect.value = opts.entry.role ?? 'user';
        roleSelect.addEventListener('change', () => { roleValue = roleSelect.value; });
        body.append(fg('角色 (role)', roleSelect));
    }
    let textValue = opts.entry.text ?? '';
    if (opts.withText) {
        const textArea = el('textarea');
        textArea.value = textValue;
        textArea.addEventListener('input', () => { textValue = textArea.value; });
        body.append(fg('内容 (text)', textArea));
    }
    modal.appendChild(body);
    footOf(modal, [
        { label: '取消', variant: 's', onClick: close },
        {
            label: '保存', variant: 'p', onClick: async () => {
                try {
                    const draft = { name: nameInput.value.trim() };
                    if (roleValue)
                        draft.role = roleValue;
                    if (opts.withText)
                        draft.text = textValue;
                    await opts.onSave(draft);
                    close();
                }
                catch { /* onSave 内已提示 */ }
            },
        },
    ]);
    setTimeout(() => nameInput.focus(), 30);
}
/** 新建父条目弹窗:name + role 必选 */
export function openGroupCreator(opts) {
    openEntryEditor({
        title: opts.title,
        entry: { name: '新条目', role: 'user', text: '' },
        withRole: true,
        withText: false,
        onSave: (input) => {
            if (!input.name)
                throw new Error('名称不能为空');
            return opts.onSave({ name: input.name, role: input.role ?? 'user' });
        },
    });
}
/** 新建子条目弹窗:name + text,无 role */
export function openChildCreator(opts) {
    openEntryEditor({
        title: '新建子条目',
        entry: { name: '新子条目', text: '' },
        withRole: false,
        withText: true,
        onSave: (input) => opts.onSave({ name: input.name, text: input.text ?? '' }),
    });
}
/** 子条目编辑弹窗(无 role) */
export function openChildEditor(opts) {
    openEntryEditor({
        title: '编辑子条目',
        entry: opts.entry,
        withRole: false,
        withText: true,
        onSave: (input) => opts.onSave({ name: input.name, text: input.text ?? '' }),
    });
}

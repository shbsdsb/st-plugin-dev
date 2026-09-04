/** 在 body 上创建遮罩层(避开宿主 modal 的 transform 影响);返回 { root, modal, close } */
export function createLayer(width) {
    const root = document.createElement('div');
    root.className = 'prp overlay';
    const modal = document.createElement('div');
    modal.className = 'prp float-modal';
    modal.style.width = width;
    root.appendChild(modal);
    function close() {
        document.removeEventListener('keydown', onKey);
        root.remove();
    }
    const onKey = (e) => { if (e.key === 'Escape')
        close(); };
    root.addEventListener('click', (e) => { if (e.target === root)
        close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(root);
    return { root, modal, close };
}
/** 头部(标题 + ✕) */
export function headOf(modal, title, close) {
    const head = document.createElement('div');
    head.className = 'prp float-head';
    const b = document.createElement('b');
    b.textContent = title;
    const x = document.createElement('button');
    x.className = 'x';
    x.textContent = '✕';
    x.title = '关闭';
    x.addEventListener('click', close);
    head.append(b, x);
    modal.appendChild(head);
}
/** 底部按钮区 */
export function footOf(modal, actions) {
    const foot = document.createElement('div');
    foot.className = 'prp float-foot';
    for (const a of actions) {
        const btn = document.createElement('button');
        btn.className = a.variant;
        btn.textContent = a.label;
        btn.type = 'button';
        btn.addEventListener('click', a.onClick);
        foot.appendChild(btn);
    }
    modal.appendChild(foot);
}

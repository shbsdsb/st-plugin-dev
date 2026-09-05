// agent_plugin_dev/multi-session-plugin/src/ui/panel.ts —— 会话列表(占满 sidebar-right)
import * as api from "./api.js";
import { injectStyle } from "./style.js";
function h(tag, cls, text = '') {
    const el = document.createElement(tag);
    if (cls)
        el.className = cls;
    if (text)
        el.textContent = text;
    return el;
}
function relTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000)
        return '刚刚';
    if (diff < 3_600_000)
        return Math.floor(diff / 60_000) + ' 分钟前';
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString()
        ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        : `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function emitSessionChanged(reason, id) {
    window.dispatchEvent(new CustomEvent('st:session-changed', { detail: { reason, id } }));
}
export function createSessionPanel(toast) {
    injectStyle();
    const root = h('div', 'multi-session');
    const head = h('div', 'ms-head');
    const title = h('span', 'ms-title', '会话');
    const addBtn = h('button', 'ms-add', '＋');
    addBtn.title = '新会话';
    head.append(title, addBtn);
    const list = h('div', 'ms-list');
    root.append(head, list);
    let sessions = [];
    let activeId = null;
    const render = () => {
        list.textContent = '';
        if (sessions.length === 0) {
            list.appendChild(h('div', 'ms-empty', '暂无会话'));
            return;
        }
        for (const s of sessions) {
            const item = h('div', 'ms-item' + (s.id === activeId ? ' active' : ''));
            const name = h('span', 'ms-name', s.title);
            const time = h('span', 'ms-time', relTime(s.updatedAt));
            const del = h('button', 'ms-del', '✕');
            del.title = '删除会话';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                void confirmDelete(s);
            });
            item.append(name, time, del);
            item.addEventListener('click', async () => {
                if (s.id === activeId)
                    return;
                try {
                    await api.setActive(s.id);
                    activeId = s.id;
                    render();
                    emitSessionChanged('active-changed', s.id);
                }
                catch (e) {
                    toast(e.message || '切换失败');
                }
            });
            list.appendChild(item);
        }
    };
    const reload = async () => {
        try {
            const [ss, act] = await Promise.all([api.listSessions(), api.getActive()]);
            sessions = ss;
            activeId = act;
            render();
        }
        catch { /* 后端未就绪时静默,下次事件/操作再拉 */ }
    };
    async function confirmDelete(s) {
        const tools = window.__uiTools__;
        const doDel = async () => {
            try {
                await api.removeSession(s.id);
                await reload();
                emitSessionChanged('deleted', s.id);
                toast('已删除会话');
            }
            catch (e) {
                toast(e.message || '删除失败');
            }
        };
        if (tools)
            tools.modal({ title: '删除会话', desc: `确定删除会话「${s.title}」吗?其全部消息将一并删除。`, onOk: () => { void doDel(); } });
        else {
            void doDel();
        }
    }
    addBtn.addEventListener('click', async () => {
        try {
            const s = await api.createSession();
            await api.setActive(s.id);
            await reload();
            emitSessionChanged('active-changed', s.id);
        }
        catch (e) {
            toast(e.message || '新建失败');
        }
    });
    const onSessionChanged = () => { void reload(); };
    window.addEventListener('st:session-changed', onSessionChanged);
    void reload();
    root.dispose = () => {
        window.removeEventListener('st:session-changed', onSessionChanged);
    };
    return root;
}

// agent_plugin_dev/ui-polish/src/web.tsx
// WebPlugin:启动自动 fetch /api/ui-polish/current → 按序注入 5 类节点(幂等,可清理)。
// 注入契约见 ui-polish README;js 以 try/catch 隔离执行。
import { DEFAULT_TOKENS, buildTokenCss } from "./tokens.js";
import { buildDefaultCss } from "./default.js";
const IDS = ['ui-polish-tokens', 'ui-polish-default', 'ui-polish-css', 'ui-polish-host', 'ui-polish-js'];
function removeInjected() {
    for (const id of IDS)
        document.getElementById(id)?.remove();
}
function upsertStyle(id, css) {
    if (!css)
        return;
    document.getElementById(id)?.remove();
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
}
function upsertBodyNode(id, tag, content) {
    if (!content)
        return;
    document.getElementById(id)?.remove();
    const node = document.createElement(tag);
    node.id = id;
    if (tag === 'div') {
        node.innerHTML = content;
    }
    else {
        // script 经 textContent 注入,append 后浏览器执行
        node.textContent = `try {\n${content}\n} catch (e) { console.error('[ui-polish] user js error:', e) }`;
    }
    document.body.appendChild(node);
}
async function applyCurrent() {
    // 默认两层恒注入
    upsertStyle('ui-polish-tokens', buildTokenCss(DEFAULT_TOKENS));
    upsertStyle('ui-polish-default', buildDefaultCss());
    let payload = null;
    try {
        const res = await fetch('/api/ui-polish/current');
        if (res.ok)
            payload = (await res.json());
    }
    catch (e) {
        console.warn('[ui-polish] 读取激活主题失败,仅默认 token 层:', e?.message ?? e);
    }
    if (!payload?.ok)
        return;
    upsertStyle('ui-polish-css', payload.css ?? '');
    upsertBodyNode('ui-polish-host', 'div', payload.html);
    upsertBodyNode('ui-polish-js', 'script', payload.js);
}
export default {
    name: 'ui-polish',
    async mount(_el) {
        removeInjected();
        await applyCurrent();
    },
    unmount() {
        removeInjected();
    },
};

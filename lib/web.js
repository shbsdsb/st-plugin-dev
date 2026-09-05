// agent_plugin_dev/chat-plugin/src/web.tsx —— 前端入口:注册 main(中央)插槽气泡对话页(v2:会话联动)
import { createChatPanel } from "./ui/panel.js";
let navTimer;
let currentPanel = null;
const onSessionChanged = (e) => {
    const reason = e.detail?.reason;
    if (reason === 'active-changed' || reason === 'deleted')
        currentPanel?.reload?.();
};
const webPlugin = {
    name: 'chat',
    mount() {
        if (navTimer) {
            clearInterval(navTimer);
            navTimer = undefined;
        }
        window.addEventListener('st:session-changed', onSessionChanged);
        const tryRegister = () => {
            const slots = window.__uiSlots__;
            if (!slots)
                return false;
            slots.register('main', {
                name: 'chat',
                render(el) {
                    currentPanel = createChatPanel();
                    el.appendChild(currentPanel);
                },
            });
            return true;
        };
        if (tryRegister())
            return;
        navTimer = setInterval(() => { if (tryRegister()) {
            clearInterval(navTimer);
            navTimer = undefined;
        } }, 200);
    },
    unmount() {
        if (navTimer) {
            clearInterval(navTimer);
            navTimer = undefined;
        }
        window.removeEventListener('st:session-changed', onSessionChanged);
        const slots = window.__uiSlots__;
        slots?.unregister('main', 'chat');
        currentPanel = null;
    },
};
export default webPlugin;

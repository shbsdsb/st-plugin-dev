// agent_plugin_dev/chat-plugin/src/web.tsx —— 前端入口:注册 main(中央)插槽气泡对话页
import { createChatPanel } from "./ui/panel.js";
let navTimer;
const webPlugin = {
    name: 'chat',
    mount() {
        if (navTimer) {
            clearInterval(navTimer);
            navTimer = undefined;
        }
        const tryRegister = () => {
            const slots = window.__uiSlots__;
            if (!slots)
                return false;
            slots.register('main', {
                name: 'chat',
                render(el) {
                    el.appendChild(createChatPanel());
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
        const slots = window.__uiSlots__;
        slots?.unregister('main', 'chat');
    },
};
export default webPlugin;

// agent_plugin_dev/multi-session-plugin/src/web.tsx
import { createSessionPanel } from "./ui/panel.js";
let navTimer;
const webPlugin = {
    name: 'sessions',
    mount() {
        if (navTimer) {
            clearInterval(navTimer);
            navTimer = undefined;
        }
        const tryRegister = () => {
            const slots = window.__uiSlots__;
            const tools = window.__uiTools__;
            if (!slots || !tools)
                return false;
            slots.register('sidebar-right', {
                name: 'sessions',
                render(el) {
                    const panel = createSessionPanel((m) => tools.toast(m));
                    el.appendChild(panel);
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
        slots?.unregister('sidebar-right', 'sessions');
    },
};
export default webPlugin;

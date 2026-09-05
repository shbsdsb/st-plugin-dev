// agent_plugin_dev/llm-plugin/src/web.tsx
import { createConfigPanel } from "./ui/config-panel.js";
import * as api from "./ui/api.js";
let navTimer;
const webPlugin = {
    name: 'llm',
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
            slots.register('nav', {
                name: 'llm',
                render(el) {
                    const btn = document.createElement('button');
                    btn.textContent = 'LLM';
                    btn.style.cssText = 'border-radius:16px;padding:0 14px;font-size:12px;font-weight:600;color:var(--ui-text,#444444);background:var(--ui-surface,#ffffff);border:1px solid var(--ui-border,#e0e0e0);cursor:pointer;height:30px;';
                    btn.addEventListener('click', () => {
                        tools.pluginModal({
                            title: 'LLM 配置',
                            source: 'llm',
                            content: (c) => { c.appendChild(createConfigPanel(tools, api)); },
                        });
                    });
                    el.appendChild(btn);
                },
            });
            return true;
        };
        if (tryRegister())
            return;
        // 宿主(st-ui-slots / ui-tool-plugin)尚未挂载,轮询等待就绪后再注册
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
        slots?.unregister('nav', 'llm');
    },
};
export default webPlugin;

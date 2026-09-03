// agent_plugin_dev/llm-plugin/src/web.tsx
import { createConfigPanel } from "./ui/config-panel.js";
import * as api from "./ui/api.js";
const webPlugin = {
    name: 'llm',
    mount() {
        const slots = window.__uiSlots__;
        const tools = window.__uiTools__;
        if (!slots || !tools) {
            console.warn('[llm-plugin] 需要 st-ui-slots 与 ui-tool-plugin');
            return;
        }
        slots.register('nav', {
            name: 'llm',
            render(el) {
                const btn = document.createElement('button');
                btn.textContent = 'LLM';
                btn.style.cssText = 'border-radius:16px;padding:0 14px;font-size:12px;font-weight:600;color:#18181b;background:#fff;border:1px solid #d4d4d8;cursor:pointer;height:30px;';
                btn.addEventListener('click', () => {
                    tools.pluginModal({
                        title: 'LLM 配置',
                        content: (c) => { c.appendChild(createConfigPanel(tools, api)); },
                    });
                });
                el.appendChild(btn);
            },
        });
    },
    unmount() {
        const slots = window.__uiSlots__;
        slots?.unregister('nav', 'llm');
    },
};
export default webPlugin;

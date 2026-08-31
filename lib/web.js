// agent_plugin_dev/st-ui-beautify/src/web.tsx
// WebPlugin:注入白色玻璃拟态主题样式 + 背景光球;unmount 全部移除(幂等)
import { buildThemeCss, DEFAULT_THEME } from "./theme.js";
const STYLE_ID = 'st-beautify-theme';
/** 读取运行时覆盖(window.__ST_BEAUTIFY__),未提供时用默认值 */
function resolveOptions() {
    const override = window.__ST_BEAUTIFY__;
    return { ...DEFAULT_THEME, ...(override ?? {}) };
}
function removeInjected() {
    document.getElementById(STYLE_ID)?.remove();
    document.querySelectorAll('.st-beautify-orb').forEach((el) => el.remove());
}
export default {
    name: 'st-ui-beautify',
    mount(_el) {
        try {
            // 幂等:先清旧注入
            removeInjected();
            const opts = resolveOptions();
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = buildThemeCss(opts);
            document.head.appendChild(style);
            for (let i = 0; i < Math.min(opts.orbCount, 3); i++) {
                const orb = document.createElement('div');
                orb.className = 'st-beautify-orb';
                document.body.appendChild(orb);
            }
        }
        catch (e) {
            console.error('[st-ui-beautify] mount failed:', e);
        }
    },
    unmount() {
        removeInjected();
    },
};

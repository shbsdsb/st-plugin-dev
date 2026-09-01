// agent_plugin_dev/ui-tool-plugin/src/theme-engine.ts
// 主题引擎:小 API(get/set/reset 参数微调)+ 大 API(install 全量 css/html/js 替换)。
// install 的 css 为全局样式,作用在 st-ui-slots 布局之上(自由定义前端样式,像正常网站)。
import { buildThemeCss, DEFAULT_THEME, normalizeOrbCount } from "./theme.js";
const STYLE_ID = 'ui-tool-plugin-theme';
const INSTALL_STYLE_ID = 'ui-tool-plugin-install';
const INSTALL_HTML_ID = 'ui-tool-plugin-install-html';
const INSTALL_JS_ID = 'ui-tool-plugin-install-js';
const ORB_CLS = 'st-beautify-orb'; // 与 theme.ts buildThemeCss 的定位 CSS 一致(.st-beautify-orb[data-index])
function removeThemeInjected() {
    document.getElementById(STYLE_ID)?.remove();
    document.querySelectorAll('.' + ORB_CLS).forEach((el) => el.remove());
}
function applyTheme(opts) {
    removeThemeInjected();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = buildThemeCss(opts);
    document.head.appendChild(style);
    for (let i = 0; i < normalizeOrbCount(opts.orbCount); i++) {
        const orb = document.createElement('div');
        orb.className = ORB_CLS;
        orb.setAttribute('data-index', String(i));
        document.body.appendChild(orb);
    }
}
/** 卸载 install 的 css/html/script 残留 */
function removeInstalled() {
    document.getElementById(INSTALL_STYLE_ID)?.remove();
    document.getElementById(INSTALL_HTML_ID)?.remove();
    document.getElementById(INSTALL_JS_ID)?.remove();
}
export function createThemeEngine() {
    let current = { ...DEFAULT_THEME };
    // 构造即注入默认白色玻璃主题
    applyTheme(current);
    return {
        get() { return { ...current }; },
        set(patch) {
            current = { ...current, ...patch };
            applyTheme(current);
        },
        reset() {
            current = { ...DEFAULT_THEME };
            removeInstalled();
            applyTheme(current);
        },
        install({ css, html, js }) {
            removeInstalled();
            // 移除内置玻璃主题,由插件 css 全权接管视觉
            removeThemeInjected();
            const style = document.createElement('style');
            style.id = INSTALL_STYLE_ID;
            style.textContent = css;
            document.head.appendChild(style);
            if (html) {
                const host = document.createElement('div');
                host.id = INSTALL_HTML_ID;
                host.innerHTML = html;
                document.body.appendChild(host);
            }
            if (js) {
                const sc = document.createElement('script');
                sc.id = INSTALL_JS_ID;
                sc.textContent = js;
                document.body.appendChild(sc);
            }
        },
        destroy() {
            removeInstalled();
            removeThemeInjected();
        },
    };
}

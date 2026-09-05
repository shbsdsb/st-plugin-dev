// agent_plugin_dev/ui-polish/src/files.ts
// 读取 $ST_HOME/data/frontend/<name>/{html,css,js};只读不改。
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
export const THEME_NAME_RE = /^[A-Za-z0-9_-]+$/;
export function isValidThemeName(name) {
    return typeof name === 'string' && THEME_NAME_RE.test(name) && !name.startsWith('.');
}
function frontendRoot(stHome) {
    return join(stHome, 'data', 'frontend');
}
export function resolveActive(config, stHome) {
    const root = frontendRoot(stHome);
    const active = config?.active;
    if (typeof active === 'string' && isValidThemeName(active) && existsSync(join(root, active))) {
        return active;
    }
    if (existsSync(join(root, 'default')))
        return 'default';
    return null;
}
export function readThemeFiles(stHome, name) {
    if (!isValidThemeName(name))
        return { html: null, css: null, js: null };
    const dir = join(frontendRoot(stHome), name);
    if (!existsSync(dir))
        return { html: null, css: null, js: null };
    const read = (file) => {
        try {
            const p = join(dir, file);
            if (!existsSync(p))
                return null;
            return readFileSync(p, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
        }
        catch {
            return null;
        }
    };
    return { html: read('html'), css: read('css'), js: read('js') };
}

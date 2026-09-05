import { resolveActive, readThemeFiles } from "./files.js";
const CURRENT = '/api/ui-polish/current';
export function registerRoutes(register, dep) {
    const { stHome, config } = dep;
    const disposers = [];
    disposers.push(register({
        kind: 'exact',
        path: CURRENT,
        handler: (_req, res) => {
            const name = resolveActive(config, stHome);
            const files = name ? readThemeFiles(stHome, name) : { html: null, css: null, js: null };
            res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true, name, html: files.html, css: files.css, js: files.js }));
        },
    }));
    return () => { for (const d of disposers)
        d(); };
}

// agent_plugin_dev/web-module/src/module-table.ts
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
export const MODULE_DEFS = {
    react: {
        importNames: ['react'],
        out: 'react.cjs',
        entry: require.resolve('react'),
        external: [],
    },
    'react-dom/client': {
        importNames: ['react-dom', 'react-dom/client'],
        out: 'react-dom-client.cjs',
        entry: require.resolve('react-dom/client'),
        external: ['react'],
    },
    cordis: {
        importNames: ['cordis'],
        out: 'cordis.cjs',
        entry: require.resolve('cordis'),
        external: [],
    },
};
export class ModuleTable {
    version = '0.1.0';
    cache = new Map();
    get modules() {
        return Object.values(MODULE_DEFS).flatMap((d) => d.importNames);
    }
    get importmap() {
        const map = {};
        for (const def of Object.values(MODULE_DEFS)) {
            for (const name of def.importNames)
                map[name] = '/shell/modules/' + def.out;
        }
        return map;
    }
    resolveModule(name) {
        for (const def of Object.values(MODULE_DEFS)) {
            if (def.importNames.includes(name))
                return '/shell/modules/' + def.out;
        }
        return undefined;
    }
    /** out: 'react.cjs' | 'react-dom-client.cjs' | 'cordis.cjs';返回浏览器 CJS 代码,未知返回 undefined */
    async build(out) {
        const def = Object.values(MODULE_DEFS).find((d) => d.out === out);
        if (!def)
            return undefined;
        const cached = this.cache.get(def.out);
        if (cached !== undefined)
            return cached;
        const result = await build({
            entryPoints: [def.entry],
            bundle: true,
            format: 'cjs',
            platform: 'browser',
            write: false,
            external: def.external,
            logLevel: 'silent',
        });
        const code = result.outputFiles[0].text;
        this.cache.set(def.out, code);
        return code;
    }
}

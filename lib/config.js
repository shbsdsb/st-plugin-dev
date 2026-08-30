// agent_plugin_dev/host-plugin/src/config.ts
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';
export const DEFAULT_CONFIG = {
    host: '127.0.0.1', port: 3000, listen: false, listenWhitelist: [], open: true,
};
/** listen/listenWhitelist 语义 → 监听地址 */
export function resolveListenTarget(cfg) {
    if (!cfg.listen)
        return cfg.host;
    if (cfg.listenWhitelist.length > 0)
        return cfg.listenWhitelist[0];
    return '0.0.0.0';
}
/** 原始值合并默认(供 cli 层轻量读取与 schema 共用;单源 DEFAULT_CONFIG) */
export function normalizeConfig(raw) {
    const cfg = { ...DEFAULT_CONFIG };
    if (!raw)
        return cfg;
    if (typeof raw.host === 'string')
        cfg.host = raw.host;
    if (typeof raw.port === 'number' && Number.isInteger(raw.port) && raw.port >= 1 && raw.port <= 65535)
        cfg.port = raw.port;
    if (typeof raw.listen === 'boolean')
        cfg.listen = raw.listen;
    if (Array.isArray(raw.listenWhitelist) && raw.listenWhitelist.every((x) => typeof x === 'string'))
        cfg.listenWhitelist = raw.listenWhitelist;
    if (typeof raw.open === 'boolean')
        cfg.open = raw.open;
    return cfg;
}
/** cordis Config schema:loader 校验 + 默认值(经覆盖层 patch 传入 config) */
export const HostConfigSchema = {
    '~standard': {
        version: 1,
        vendor: 'host-plugin',
        validate(value) {
            const raw = (value && typeof value === 'object' ? value : {});
            return { value: normalizeConfig(raw) };
        },
    },
};
/** cli 层轻量读取:读覆盖层 patch 的 id=host config 原始值(不重复 schema 校验) */
export function readHostPatchConfig(stHome, profile = 'default') {
    // 从 profile patch 与 user patch 中提取 id=host 的 config(profile → user 合并)
    const merged = {};
    for (const patchPath of [
        join(stHome, 'profile', profile, 'cordis.patch.yml'),
        join(stHome, 'cordis.patch.yml'),
    ]) {
        if (!existsSync(patchPath))
            continue;
        try {
            const entries = (yaml.load(readFileSync(patchPath, 'utf8'), { schema: yaml.JSON_SCHEMA }) ?? []);
            const entry = entries.find((e) => typeof e === 'object' && e !== null && e.id === 'host');
            const config = entry?.config;
            if (typeof config === 'object' && config !== null)
                Object.assign(merged, config);
        }
        catch {
            // 解析失败忽略(与 cli 容错一致)
        }
    }
    return merged;
}

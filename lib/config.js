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
    // listen=true:绑定所有接口(0.0.0.0),让局域网设备(手机等)可访问;
    // listenWhitelist 仅作来源 IP 白名单过滤(见 web-server 403),不决定绑定地址。
    return '0.0.0.0';
}
/** 解析 IPv4 字符串为 32 位无符号整数;非法返回 null */
export function ipv4ToInt(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4)
        return null;
    let n = 0;
    for (const p of parts) {
        const o = Number(p);
        if (!Number.isInteger(o) || o < 0 || o > 255)
            return null;
        n = (n << 8) | o;
    }
    return n >>> 0;
}
/** 解析 CIDR "x.x.x.x/prefix" → {base, prefix};非 CIDR 返回 null */
export function parseCIDR(s) {
    const idx = s.indexOf('/');
    if (idx < 0)
        return null;
    const base = ipv4ToInt(s.slice(0, idx));
    const prefix = Number(s.slice(idx + 1));
    if (base === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32)
        return null;
    return { base, prefix };
}
/** 判断远程 IP 是否命中白名单(精确 IP 或 IPv4 CIDR;自动剥离 ::ffff: 前缀) */
export function ipInWhitelist(ip, whitelist) {
    const addr = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
    for (const entry of whitelist) {
        if (addr === entry)
            return true;
        const cidr = parseCIDR(entry);
        const a = ipv4ToInt(addr);
        if (cidr && a !== null) {
            const mask = cidr.prefix === 0 ? 0 : (0xffffffff << (32 - cidr.prefix)) >>> 0;
            if ((a & mask) === (cidr.base & mask))
                return true;
        }
    }
    return false;
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

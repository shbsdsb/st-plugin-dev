import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkImmedConsistency, topoSort } from "./topo.js";
function readJson(file) {
    if (!existsSync(file))
        return undefined;
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    }
    catch {
        return undefined;
    }
}
/** 解析 bundle 包目录:字符串 → node_modules/<name>;对象 → stHome/<file> */
function resolveBundleDir(stHome, entry) {
    if (typeof entry === 'string')
        return join(stHome, 'node_modules', entry);
    return resolve(stHome, entry.file);
}
/**
 * 扫描 st.profile 声明的 bundles,返回 包名 → 目录 映射。
 * 与 scanBundlesSync 共用 resolveBundleDir 的定位规则:字符串条目 → node_modules/<name>;
 * 对象条目 → stHome/<file>。供 serve 侧按包名定位资源(对象条目包不在 node_modules 下)。
 */
export function scanBundleDirs(stHome, profile) {
    const profileName = profile ?? 'default';
    const profilePkg = readJson(join(stHome, 'profile', profileName, 'package.json'));
    const profileList = profilePkg?.st?.profile ?? [];
    const dirs = new Map();
    for (const item of profileList) {
        const dir = resolveBundleDir(stHome, item);
        const name = typeof item === 'string' ? item : item.name;
        if (!dir || !name)
            continue;
        dirs.set(name, dir);
    }
    return dirs;
}
/** 扫描 st.profile 声明的 bundles,收集 st.client(kind: web)生成 boot 条目(拓扑排序 + 一致性警告) */
export async function scanBundles(opts) {
    return scanBundlesSync(opts);
}
/**
 * 同步版扫描(scanBundles 的同步底层)。
 * 函数体全为同步 fs + 纯计算(无 IO await);client-find/index.ts 用它同步 provide clientBoot,
 * 保证 apply 返回时清单立即可用(异步 promise.then 会因微任务时序晚于同步读取)。
 */
export function scanBundlesSync(opts) {
    const warn = opts.warn ?? (() => { });
    const profile = opts.profile ?? 'default';
    const profilePkg = readJson(join(opts.stHome, 'profile', profile, 'package.json'));
    const profileList = profilePkg?.st?.profile ?? [];
    if (profileList.length === 0)
        return [];
    const entries = [];
    for (const item of profileList) {
        const dir = resolveBundleDir(opts.stHome, item);
        if (!dir)
            continue;
        const pkg = readJson(join(dir, 'package.json'));
        const client = pkg?.st?.client;
        if (!client || client.kind !== 'web')
            continue;
        const name = pkg?.name ?? (typeof item === 'string' ? item : item.name);
        if (!name || typeof client.path !== 'string' || client.path.length === 0) {
            warn(`[client-find] ${name ?? '未知包'} 声明 st.client 但缺少 path,已跳过`);
            continue;
        }
        entries.push({
            id: name,
            url: `/plugins/${name}/${client.path.replace(/^\/+/, '')}`,
            inject: client.inject ?? [],
            immed: client.immed ?? false,
        });
    }
    // 拓扑排序(依赖在前;环/缺失 → 警告 + 末尾)
    const { order, warnings } = topoSort(entries.map((e) => ({ id: e.id, deps: e.inject })));
    for (const w of warnings)
        warn(`[client-find] ${w}`);
    const byId = new Map(entries.map((e) => [e.id, e]));
    const sorted = order.map((id) => byId.get(id)).filter(Boolean);
    // 依赖-立即性一致性警告
    for (const w of checkImmedConsistency(sorted))
        warn(`[client-find] ${w}`);
    return sorted;
}

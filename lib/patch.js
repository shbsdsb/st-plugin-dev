// agent_plugin_dev/plugin-setting/src/patch.ts
// profile 级 cordis.patch.yml 读写(纯函数,可独立测试)。
// 覆盖语义:整行替换——保存必须写入完整 config;首次修改须全量复制生效配置。
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import * as yaml from 'js-yaml';
/** 解析 patch 文本 → 条目列表;顶层必须为数组,条目仅允许 id + config */
export function parsePatch(content, source) {
    const data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) ?? [];
    if (!Array.isArray(data))
        throw new Error(`cordis.patch.yml 顶层必须为数组: ${source}`);
    return data.map((item, i) => {
        const rec = item;
        const keys = Object.keys(rec);
        if (keys.some((k) => k !== 'id' && k !== 'config')) {
            throw new Error(`patch 条目仅允许 id + config(第 ${i + 1} 条,发现: ${keys.join(', ')}): ${source}`);
        }
        if (typeof rec.id !== 'string' || rec.id.length === 0) {
            throw new Error(`patch 条目缺少 id(第 ${i + 1} 条): ${source}`);
        }
        const entry = { id: rec.id };
        if (rec.config !== undefined)
            entry.config = rec.config;
        return entry;
    });
}
/** 读取 patch 文件;不存在 → [] */
export async function readPatch(path) {
    if (!existsSync(path))
        return [];
    return parsePatch(await readFile(path, 'utf8'), path);
}
/**
 * 按 id 应用条目:存在 → 整行替换 config;不存在 → 追加到末尾;
 * config 为 null/undefined → 删除该条目的 config 字段(保留 id 行)。
 */
export function applyEntries(list, entries) {
    const result = [...list];
    for (const { id, config } of entries) {
        const hasConfig = config !== undefined && config !== null;
        const idx = result.findIndex((e) => e.id === id);
        if (idx >= 0) {
            const target = { ...result[idx] };
            if (hasConfig)
                target.config = config;
            else
                delete target.config;
            result[idx] = target;
        }
        else {
            const entry = { id };
            if (hasConfig)
                entry.config = config;
            result.push(entry);
        }
    }
    return result;
}
/** 提取文件顶部连续注释块(含紧随空行);写回时保留,避免 js-yaml dump 丢注释 */
export function extractHeaderComments(content) {
    const lines = content.split(/\r?\n/);
    const header = [];
    for (const line of lines) {
        if (line.trim().startsWith('#')) {
            header.push(line);
        }
        else if (header.length > 0 && line.trim() === '') {
            header.push(line);
        }
        else {
            break;
        }
    }
    return header.join('\n');
}
/** 写入 patch 文件:保留原文件顶部注释 + 条目 yaml dump */
export async function writePatch(path, list) {
    const old = existsSync(path) ? await readFile(path, 'utf8') : '';
    const header = extractHeaderComments(old);
    const body = yaml.dump(list, { lineWidth: -1 });
    await writeFile(path, header ? `${header}\n${body}` : body, 'utf8');
}

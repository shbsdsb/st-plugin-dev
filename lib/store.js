import { buildMessages } from "./messages.js";
export class NotFoundError extends Error {
    constructor(message) { super(message); this.name = 'NotFoundError'; }
}
const ROOT = 'data/prompt';
const VALID_ROLES = ['system', 'user', 'assistant'];
const MAX_BLOCKS = 50;
const MAX_BLOCK_TEXT = 20000;
function genId(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function dirOf(formId) { return `${ROOT}/${formId}`; }
function formFile(formId) { return `${dirOf(formId)}/form.json`; }
function entryFile(formId, entryId) { return `${dirOf(formId)}/e-${entryId}.json`; }
function cleanName(v) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (!s)
        throw new Error('名称不能为空');
    if (s.length > 50)
        throw new Error('名称最长 50 字符');
    return s;
}
function cleanRole(v) {
    const r = String(v ?? '');
    if (!VALID_ROLES.includes(r))
        throw new Error('role 非法,仅支持 system/user/assistant');
    return r;
}
function cleanText(v) {
    return typeof v === 'string' ? v : '';
}
function cleanEntryInput(b) {
    return { name: cleanName(b.name), role: cleanRole(b.role), text: cleanText(b.text), blocks: cleanBlocks(b.blocks) };
}
function cleanBlocks(v) {
    if (v === undefined || v === null)
        return [];
    if (!Array.isArray(v))
        throw new Error('内容块必须为数组');
    if (v.length > MAX_BLOCKS)
        throw new Error(`内容块最多 ${MAX_BLOCKS} 个`);
    const seen = new Set();
    return v.map((item, i) => {
        if (!item || typeof item !== 'object')
            throw new Error(`内容块第 ${i + 1} 项格式非法`);
        const b = item;
        const id = typeof b.id === 'string' ? b.id.trim() : '';
        if (!id)
            throw new Error('内容块 id 不能为空');
        if (seen.has(id))
            throw new Error('内容块 id 重复');
        seen.add(id);
        const text = typeof b.text === 'string' ? b.text : '';
        if (text.length > MAX_BLOCK_TEXT)
            throw new Error(`内容块文本最长 ${MAX_BLOCK_TEXT} 字符`);
        return { id, text };
    });
}
async function readForm(persist, formId) {
    const raw = await persist.read(formFile(formId));
    if (!raw || typeof raw !== 'object')
        throw new NotFoundError('表单不存在');
    const f = raw;
    const entries = Array.isArray(f.entries) ? f.entries.filter((x) => typeof x === 'string') : [];
    return { name: typeof f.name === 'string' ? f.name : '未命名', entries };
}
/** 读取归一化:损坏文件/缺 id 或 text → null;缺 blocks → [] */
function parseEntry(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const e = raw;
    if (typeof e.id !== 'string' || typeof e.text !== 'string')
        return null;
    const role = VALID_ROLES.includes(e.role) ? e.role : 'user';
    const blocks = Array.isArray(e.blocks)
        ? e.blocks.filter((b) => !!b && typeof b === 'object' && typeof b.id === 'string' && typeof b.text === 'string')
        : [];
    return { id: e.id, name: typeof e.name === 'string' ? e.name : '未命名', role, text: e.text, blocks };
}
export function createStore(persist) {
    return {
        async listForms() {
            const dirs = await persist.list(ROOT);
            const out = [];
            for (const d of dirs) {
                try {
                    const f = await readForm(persist, d);
                    out.push({ id: d, name: f.name, entryCount: f.entries.length });
                }
                catch {
                    // 损坏/缺失 form.json 的目录跳过,不作为表单暴露
                }
            }
            out.sort((a, b) => a.name.localeCompare(b.name, 'zh') || a.id.localeCompare(b.id));
            return out;
        },
        async listEntries(formId) {
            const f = await readForm(persist, formId);
            const out = [];
            for (const eid of f.entries) {
                const e = parseEntry(await persist.read(entryFile(formId, eid)));
                if (e)
                    out.push(e);
            }
            return out;
        },
        async createForm(name) {
            const id = genId('f');
            await persist.write(formFile(id), { name: cleanName(name), entries: [] });
            return { id };
        },
        async renameForm(id, name) {
            const f = await readForm(persist, id);
            f.name = cleanName(name);
            await persist.write(formFile(id), f);
        },
        async deleteForm(id) {
            await readForm(persist, id); // 不存在 → NotFoundError
            await persist.delete(dirOf(id));
        },
        async createEntry(formId, input) {
            const f = await readForm(persist, formId);
            const clean = cleanEntryInput(input);
            const entryId = genId('e');
            const entry = { id: entryId, name: clean.name, role: clean.role, text: clean.text, blocks: clean.blocks };
            await persist.write(entryFile(formId, entryId), entry);
            f.entries.push(entryId);
            await persist.write(formFile(formId), f);
            return { entryId };
        },
        async updateEntry(formId, entryId, input) {
            const f = await readForm(persist, formId);
            if (!f.entries.includes(entryId))
                throw new NotFoundError('条目不存在');
            const clean = cleanEntryInput(input);
            const existing = await persist.read(entryFile(formId, entryId));
            if (!existing)
                throw new NotFoundError('条目不存在');
            await persist.write(entryFile(formId, entryId), { id: entryId, name: clean.name, role: clean.role, text: clean.text, blocks: clean.blocks });
        },
        async deleteEntry(formId, entryId) {
            const f = await readForm(persist, formId);
            if (!f.entries.includes(entryId))
                throw new NotFoundError('条目不存在');
            f.entries = f.entries.filter((x) => x !== entryId);
            // 先移除顺序引用,后删文件(删失败仅留孤儿文件,无害)
            await persist.write(formFile(formId), f);
            await persist.delete(entryFile(formId, entryId));
        },
        async reorderEntries(formId, ids) {
            const f = await readForm(persist, formId);
            if (!Array.isArray(ids))
                throw new Error('顺序与当前条目不一致');
            const cur = f.entries;
            if (cur.length !== ids.length)
                throw new Error('顺序与当前条目不一致');
            const curSet = new Set(cur);
            const idSet = new Set(ids);
            if (idSet.size !== ids.length || ids.some((x) => !curSet.has(x)))
                throw new Error('顺序与当前条目不一致');
            await persist.write(formFile(formId), { ...f, entries: [...ids] });
        },
        async getMessages(formId) {
            const f = await readForm(persist, formId);
            const entries = [];
            for (const eid of f.entries) {
                const e = parseEntry(await persist.read(entryFile(formId, eid)));
                if (e)
                    entries.push(e);
            }
            return buildMessages(entries);
        },
    };
}

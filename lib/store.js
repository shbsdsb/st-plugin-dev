import { buildMessages } from "./messages.js";
export class NotFoundError extends Error {
    constructor(message) { super(message); this.name = 'NotFoundError'; }
}
const ROOT = 'data/prompt';
const VALID_ROLES = ['system', 'user', 'assistant'];
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
    return { name: cleanName(b.name), role: cleanRole(b.role), text: cleanText(b.text) };
}
async function readForm(persist, formId) {
    const raw = await persist.read(formFile(formId));
    if (!raw || typeof raw !== 'object')
        throw new NotFoundError('表单不存在');
    const f = raw;
    const entries = Array.isArray(f.entries) ? f.entries.filter((x) => typeof x === 'string') : [];
    return { name: typeof f.name === 'string' ? f.name : '未命名', entries };
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
                const raw = await persist.read(entryFile(formId, eid));
                if (!raw || typeof raw !== 'object')
                    continue;
                const e = raw;
                if (typeof e.id !== 'string' || typeof e.text !== 'string')
                    continue;
                const role = VALID_ROLES.includes(e.role) ? e.role : 'user';
                out.push({ id: e.id, name: typeof e.name === 'string' ? e.name : '未命名', role, text: e.text });
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
            const entry = { id: entryId, name: clean.name, role: clean.role, text: clean.text };
            // 先写条目文件,后追加顺序(form.json 可能指向已写文件)
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
            const existing = (await persist.read(entryFile(formId, entryId)));
            if (!existing)
                throw new NotFoundError('条目不存在');
            await persist.write(entryFile(formId, entryId), { id: entryId, ...clean });
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
        async getMessages(formId) {
            const f = await readForm(persist, formId);
            const entries = [];
            for (const eid of f.entries) {
                const raw = await persist.read(entryFile(formId, eid));
                if (!raw || typeof raw !== 'object')
                    continue; // 条目文件缺失 → 跳过
                const e = raw;
                if (typeof e.id !== 'string' || typeof e.text !== 'string')
                    continue;
                const role = VALID_ROLES.includes(e.role) ? e.role : 'user';
                entries.push({ id: e.id, name: typeof e.name === 'string' ? e.name : '未命名', role, text: e.text });
            }
            return buildMessages(entries);
        },
    };
}

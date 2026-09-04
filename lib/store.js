import { contentFor, isChild, isGroup, isPlain } from "./messages.js";
export class NotFoundError extends Error {
    constructor(message) { super(message); this.name = 'NotFoundError'; }
}
const ROOT = 'data/prompt';
const VALID_ROLES = ['system', 'user', 'assistant'];
const MAX_NAME = 50;
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
    if (s.length > MAX_NAME)
        throw new Error(`名称最长 ${MAX_NAME} 字符`);
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
function cleanPerm(v, current, msg) {
    if (!Array.isArray(v))
        throw new Error(msg);
    if (v.length !== current.length)
        throw new Error(msg);
    const curSet = new Set(current);
    const idSet = new Set(v);
    if (idSet.size !== v.length || v.some((x) => typeof x !== 'string' || !curSet.has(x)))
        throw new Error(msg);
    return v;
}
function cleanChildren(v, currentIds) {
    return cleanPerm(v, currentIds, '顺序与当前子条目不一致');
}
async function readForm(persist, formId) {
    const raw = await persist.read(formFile(formId));
    if (!raw || typeof raw !== 'object')
        throw new NotFoundError('表单不存在');
    const f = raw;
    return {
        name: typeof f.name === 'string' ? f.name : '未命名',
        entries: Array.isArray(f.entries) ? f.entries.filter((x) => typeof x === 'string') : [],
    };
}
/** 读取归一化:损坏文件 → null */
async function readEntry(persist, formId, id) {
    const raw = await persist.read(entryFile(formId, id));
    if (!raw || typeof raw !== 'object')
        return null;
    const e = raw;
    if (typeof e.id !== 'string')
        return null;
    const role = VALID_ROLES.includes(e.role) ? e.role : 'user';
    const name = typeof e.name === 'string' ? e.name : '未命名';
    if (e.kind === 'group') {
        const children = Array.isArray(e.children) ? e.children.filter((x) => typeof x === 'string') : [];
        return { id, name, role, kind: 'group', children };
    }
    if (typeof e.base === 'string' && e.base !== '') {
        return { id, name, base: e.base, text: typeof e.text === 'string' ? e.text : '' };
    }
    return { id, name, role, text: typeof e.text === 'string' ? e.text : '' };
}
/** 顶层条目数组(entries 引用不存在文件则跳过) + 父条目 map */
async function loadFormEntries(persist, formId) {
    const f = await readForm(persist, formId);
    const groupMap = new Map();
    const top = [];
    for (const id of f.entries) {
        const e = await readEntry(persist, formId, id);
        if (!e)
            continue;
        top.push(e);
        if (isGroup(e))
            groupMap.set(e.id, e);
    }
    return { top, groupMap };
}
/** 依父 children 顺序收集子条目(文件缺失/非子跳过) */
async function childrenOf(persist, formId, g) {
    const out = [];
    for (const cid of g.children) {
        const c = await readEntry(persist, formId, cid);
        if (c && isChild(c))
            out.push(c);
    }
    return out;
}
export function createStore(persist) {
    async function writeForm(formId, f) {
        await persist.write(formFile(formId), f);
    }
    async function writeEntry(formId, e) {
        await persist.write(entryFile(formId, e.id), e);
    }
    return {
        async listForms() {
            const dirs = await persist.list(ROOT);
            const out = [];
            for (const d of dirs) {
                try {
                    const f = await readForm(persist, d);
                    out.push({ id: d, name: f.name, entryCount: f.entries.length });
                }
                catch { /* 损坏目录跳过 */ }
            }
            out.sort((a, b) => a.name.localeCompare(b.name, 'zh') || a.id.localeCompare(b.id));
            return out;
        },
        async listEntries(formId) {
            const { top, groupMap } = await loadFormEntries(persist, formId);
            const out = [];
            for (const e of top) {
                out.push(e);
                if (isGroup(e)) {
                    const g = groupMap.get(e.id);
                    for (const c of await childrenOf(persist, formId, g))
                        out.push(c);
                }
            }
            return out;
        },
        async createForm(name) {
            const id = genId('f');
            await writeForm(id, { name: cleanName(name), entries: [] });
            return { id };
        },
        async renameForm(id, name) {
            const f = await readForm(persist, id);
            f.name = cleanName(name);
            await writeForm(id, f);
        },
        async deleteForm(id) {
            await readForm(persist, id);
            await persist.delete(dirOf(id));
        },
        async createEntry(formId, input) {
            const f = await readForm(persist, formId);
            const entryId = genId('e');
            const kindIsGroup = input.kind === 'group';
            const baseIsSet = typeof input.base === 'string' && input.base !== '';
            if (kindIsGroup && baseIsSet)
                throw new Error('kind 与 base 不能同时出现');
            if (kindIsGroup) {
                const e = { id: entryId, name: cleanName(input.name), role: cleanRole(input.role), kind: 'group', children: [] };
                await writeEntry(formId, e);
                f.entries.push(entryId);
                await writeForm(formId, f);
                return { entryId };
            }
            if (baseIsSet) {
                const baseId = input.base;
                const parent = await readEntry(persist, formId, baseId);
                if (!parent || !isGroup(parent))
                    throw new Error('base 必须指向本表单存在的父条目');
                const e = { id: entryId, name: cleanName(input.name), base: baseId, text: cleanText(input.text) };
                await writeEntry(formId, e);
                const g = parent;
                const gp = { ...g, children: [...g.children, entryId] };
                await writeEntry(formId, gp);
                return { entryId };
            }
            // 普通条目
            const e = { id: entryId, name: cleanName(input.name), role: cleanRole(input.role), text: cleanText(input.text) };
            await writeEntry(formId, e);
            f.entries.push(entryId);
            await writeForm(formId, f);
            return { entryId };
        },
        async updateEntry(formId, entryId, input) {
            const cur = await readEntry(persist, formId, entryId);
            if (!cur)
                throw new NotFoundError('条目不存在');
            if (input.kind !== undefined && input.kind !== 'group')
                throw new Error('kind 非法,仅支持 group');
            if (input.kind !== undefined && !isGroup(cur))
                throw new Error('kind 不可修改');
            if (input.base !== undefined && !(isChild(cur) && cur.base === String(input.base)))
                throw new Error('base 不可修改');
            if (isGroup(cur)) {
                if (input.text !== undefined)
                    throw new Error('父条目不能包含 text');
                const g = { id: cur.id, name: cleanName(input.name ?? cur.name), role: cleanRole(input.role ?? cur.role), kind: 'group', children: cur.children };
                await writeEntry(formId, g);
                return;
            }
            if (isChild(cur)) {
                const c = { id: cur.id, name: cleanName(input.name ?? cur.name), base: cur.base, text: cleanText(input.text ?? cur.text) };
                await writeEntry(formId, c);
                return;
            }
            const p = { id: cur.id, name: cleanName(input.name ?? cur.name), role: cleanRole(input.role ?? cur.role), text: cleanText(input.text ?? cur.text) };
            await writeEntry(formId, p);
        },
        async deleteEntry(formId, entryId) {
            const f = await readForm(persist, formId);
            const cur = await readEntry(persist, formId, entryId);
            if (!cur)
                throw new NotFoundError('条目不存在');
            if (isGroup(cur)) {
                // 级联:先删 children,再从顶层移除父
                for (const cid of cur.children)
                    await persist.delete(entryFile(formId, cid));
                f.entries = f.entries.filter((x) => x !== entryId);
                await writeForm(formId, f);
                await persist.delete(entryFile(formId, entryId));
                return;
            }
            if (isChild(cur)) {
                const parent = await readEntry(persist, formId, cur.base);
                if (parent && isGroup(parent)) {
                    const g = { ...parent, children: parent.children.filter((x) => x !== entryId) };
                    await writeEntry(formId, g);
                }
                await persist.delete(entryFile(formId, entryId));
                return;
            }
            f.entries = f.entries.filter((x) => x !== entryId);
            await writeForm(formId, f);
            await persist.delete(entryFile(formId, entryId));
        },
        async saveLayout(formId, input) {
            const f = await readForm(persist, formId);
            if (input.entries !== undefined) {
                const ids = cleanPerm(input.entries, f.entries, '顺序与当前条目不一致');
                await writeForm(formId, { ...f, entries: ids });
            }
            if (input.children !== undefined) {
                if (!input.children || typeof input.children !== 'object' || Array.isArray(input.children))
                    throw new Error('children 必须为对象');
                const map = input.children;
                for (const [pid, ids] of Object.entries(map)) {
                    const g = await readEntry(persist, formId, pid);
                    if (!g || !isGroup(g))
                        throw new Error('父条目不存在: ' + pid);
                    const cleaned = cleanChildren(ids, g.children);
                    const next = { ...g, children: cleaned };
                    await writeEntry(formId, next);
                }
            }
        },
        async getMessages(formId) {
            const { top, groupMap } = await loadFormEntries(persist, formId);
            const out = [];
            for (const e of top) {
                if (isGroup(e)) {
                    const g = groupMap.get(e.id);
                    const children = await childrenOf(persist, formId, g);
                    const content = contentFor(e, children);
                    if (content === '')
                        continue;
                    out.push({ role: e.role, content });
                }
                else if (isPlain(e)) {
                    const content = contentFor(e);
                    if (content === '')
                        continue;
                    out.push({ role: e.role, content });
                }
                // 顶层不应出现子条目;若出现则跳过
            }
            return out;
        },
    };
}

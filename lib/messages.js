export function isGroup(e) { return e.kind === 'group'; }
export function isChild(e) { return typeof e.base === 'string'; }
export function isPlain(e) { return !isGroup(e) && !isChild(e); }
/** 普通条目或子条目的可发送文本(trim 非空才有效) */
export function entryText(e) {
    return typeof e.text === 'string' ? e.text : '';
}
/** 前端发送可用性 + 组装共用:children 需已按序(由调用方传 childrenMap[父id] 对应条目) */
export function contentFor(e, children = []) {
    if (isGroup(e)) {
        const parts = children.map((c) => c.text).filter((s) => typeof s === 'string' && s.trim() !== '');
        return parts.join('\n\n');
    }
    const t = entryText(e);
    return t.trim() === '' ? '' : t;
}

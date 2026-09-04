export function createPanelState() {
    return { forms: [], currentId: null, expandedId: null, topOrder: [], childOrder: {}, dirtyOrder: false };
}
function fallback(forms, currentId) {
    if (currentId && forms.some((f) => f.id === currentId))
        return currentId;
    return forms.length > 0 ? forms[0].id : null;
}
export function applyList(s, forms) {
    return { ...s, forms, currentId: fallback(forms, s.currentId) };
}
export function upsertForm(s, row) {
    const idx = s.forms.findIndex((f) => f.id === row.id);
    const forms = idx >= 0 ? s.forms.map((f, i) => (i === idx ? row : f)) : [...s.forms, row];
    return { ...s, forms };
}
export function removeForm(s, id) {
    const forms = s.forms.filter((f) => f.id !== id);
    const currentId = s.currentId === id ? fallback(forms, null) : s.currentId;
    return { ...s, forms, currentId, expandedId: s.expandedId === id || s.currentId === id ? null : s.expandedId };
}
export function selectForm(s, id) {
    if (!s.forms.some((f) => f.id === id))
        return s;
    return { ...s, currentId: id };
}
export function setExpand(s, id) {
    return { ...s, expandedId: id };
}
export function toggleExpand(s, id) {
    return { ...s, expandedId: s.expandedId === id ? null : id };
}
/** 归组纯函数:平铺(父后紧跟其子) → 顶层 + childrenByParent */
export function toTree(entries) {
    const top = [];
    const childrenByParent = {};
    const isChild = (e) => typeof e.base === 'string';
    for (const e of entries) {
        if (isChild(e)) {
            const arr = childrenByParent[e.base] ?? [];
            arr.push(e);
            childrenByParent[e.base] = arr;
        }
        else {
            top.push(e);
        }
    }
    return { top, childrenByParent };
}

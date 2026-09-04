export function createPanelState() {
    return { forms: [], currentId: null, expandedId: null };
}
function fallback(forms, currentId) {
    if (currentId && forms.some((f) => f.id === currentId))
        return currentId;
    return forms.length > 0 ? forms[0].id : null;
}
export function applyList(s, forms) {
    return { forms, currentId: fallback(forms, s.currentId), expandedId: s.expandedId };
}
export function upsertForm(s, row) {
    const idx = s.forms.findIndex((f) => f.id === row.id);
    const forms = idx >= 0 ? s.forms.map((f, i) => (i === idx ? row : f)) : [...s.forms, row];
    return { forms, currentId: s.currentId, expandedId: s.expandedId };
}
export function removeForm(s, id) {
    const forms = s.forms.filter((f) => f.id !== id);
    const currentId = s.currentId === id ? fallback(forms, null) : s.currentId;
    const expandedId = s.expandedId === id ? null : s.expandedId;
    return { forms, currentId, expandedId };
}
export function selectForm(s, id) {
    if (!s.forms.some((f) => f.id === id))
        return s;
    return { forms: s.forms, currentId: id, expandedId: s.expandedId };
}
export function setExpand(s, id) {
    return { forms: s.forms, currentId: s.currentId, expandedId: id };
}
export function toggleExpand(s, id) {
    return { forms: s.forms, currentId: s.currentId, expandedId: s.expandedId === id ? null : id };
}
/** 条目内容块数量(n 段徽标;容错空条目与非数组) */
export function segmentCount(e) {
    return e && Array.isArray(e.blocks) ? e.blocks.length : 0;
}

export function createPanelState() {
    return { forms: [], currentId: null };
}
function fallback(forms, currentId) {
    if (currentId && forms.some((f) => f.id === currentId))
        return currentId;
    return forms.length > 0 ? forms[0].id : null;
}
export function applyList(s, forms) {
    return { forms, currentId: fallback(forms, s.currentId) };
}
export function upsertForm(s, row) {
    const idx = s.forms.findIndex((f) => f.id === row.id);
    const forms = idx >= 0 ? s.forms.map((f, i) => (i === idx ? row : f)) : [...s.forms, row];
    return { forms, currentId: s.currentId };
}
export function removeForm(s, id) {
    const forms = s.forms.filter((f) => f.id !== id);
    const currentId = s.currentId === id ? fallback(forms, null) : s.currentId;
    return { forms, currentId };
}
export function selectForm(s, id) {
    if (!s.forms.some((f) => f.id === id))
        return s;
    return { forms: s.forms, currentId: id };
}

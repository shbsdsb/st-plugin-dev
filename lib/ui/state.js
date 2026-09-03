import { computeAutoValues } from "./provider.js";
export function createEmptyState() {
    return { id: null, name: '新预设', format: 'openai_compatible', vendor: '', baseUrl: '', model: '', timeout: 30, hasKey: false };
}
export function fromRow(row) {
    return { id: row.id, name: row.presetName, format: row.format, vendor: row.vendor, baseUrl: row.baseUrl, model: row.model, timeout: row.timeout, hasKey: row.hasKey };
}
export function applyVendor(state, vendor) {
    const auto = computeAutoValues(vendor);
    if (!vendor)
        return { ...state, vendor: '', baseUrl: '', format: 'openai_compatible' };
    return { ...state, vendor, baseUrl: auto.baseUrl, format: auto.format };
}
export function checkSave(state, key) {
    if (!state.baseUrl.trim())
        return { ok: false, field: 'baseUrl' };
    if (!state.model.trim())
        return { ok: false, field: 'model' };
    if (state.id === null && !key.trim())
        return { ok: false, field: 'apiKey' };
    return { ok: true };
}
export function checkTest(state, form, key) {
    if (!form.baseUrl.trim())
        return { missing: 'baseUrl' };
    if (!form.model.trim())
        return { missing: 'model' };
    if (!key.trim())
        return state.id !== null ? { mode: 'id' } : { missing: 'apiKey' };
    return state.id !== null ? { mode: 'id' } : { mode: 'fields' };
}

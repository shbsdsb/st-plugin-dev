export async function apiFetch(path, init) {
    const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...init });
    let body = null;
    try {
        body = (await res.json());
    }
    catch { /* 非 JSON */ }
    if (!res.ok || !body?.ok)
        throw new Error(body?.message || `HTTP ${res.status}`);
    return body;
}
export function listForms() {
    return apiFetch('/api/prompt/forms').then((r) => r.data);
}
export function createForm(name) {
    return apiFetch('/api/prompt/forms', { method: 'POST', body: JSON.stringify({ name }) }).then((r) => r.data);
}
export function renameForm(id, name) {
    return apiFetch(`/api/prompt/forms/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }).then(() => undefined);
}
export function deleteForm(id) {
    return apiFetch(`/api/prompt/forms/${id}`, { method: 'DELETE' }).then(() => undefined);
}
export function listEntries(formId) {
    return apiFetch(`/api/prompt/forms/${formId}/entries`).then((r) => r.data);
}
export function createEntry(formId, input) {
    return apiFetch(`/api/prompt/forms/${formId}/entries`, { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data);
}
export function updateEntry(formId, entryId, input) {
    return apiFetch(`/api/prompt/forms/${formId}/entries/${entryId}`, { method: 'PUT', body: JSON.stringify(input) }).then(() => undefined);
}
export function deleteEntry(formId, entryId) {
    return apiFetch(`/api/prompt/forms/${formId}/entries/${entryId}`, { method: 'DELETE' }).then(() => undefined);
}
export function saveLayout(formId, layout) {
    return apiFetch(`/api/prompt/forms/${formId}/order`, { method: 'PUT', body: JSON.stringify(layout) }).then(() => undefined);
}
export function previewPrompt(formId) {
    return apiFetch(`/api/prompt/forms/${formId}/preview`, { method: 'POST', body: JSON.stringify({}) }).then((r) => r.data);
}
export function listRegistered() {
    return apiFetch('/api/prompt/registered').then((r) => r.data);
}
export function addRegisteredEntry(formId, id) {
    return apiFetch(`/api/prompt/forms/${formId}/registered-entry`, { method: 'POST', body: JSON.stringify({ id }) }).then((r) => r.data);
}
export function getActiveForm() {
    return apiFetch('/api/prompt/active').then((r) => r.data);
}
export function setActiveForm(formId) {
    return apiFetch('/api/prompt/active', { method: 'PUT', body: JSON.stringify({ formId }) }).then(() => undefined);
}

export async function apiFetch(path, init) {
    const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...init });
    return res.json();
}
export function listPresets() {
    return apiFetch('/api/llm/presets').then((r) => (r.ok ? r.data : []));
}
export function createPreset(input) {
    return apiFetch('/api/llm/presets', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data);
}
export function updatePreset(id, input) {
    return apiFetch(`/api/llm/presets/${id}`, { method: 'PUT', body: JSON.stringify(input) }).then((r) => r.data);
}
export function deletePreset(id) {
    return apiFetch(`/api/llm/presets/${id}`, { method: 'DELETE' }).then((r) => r.data);
}
export function fetchModels(id) {
    return apiFetch('/api/llm/models', { method: 'POST', body: JSON.stringify({ id }) })
        .then((r) => r.data.models);
}
export function fetchModelsByInput(input) {
    return apiFetch('/api/llm/models', { method: 'POST', body: JSON.stringify(input) })
        .then((r) => r.data.models);
}
export function testPreset(id) {
    return apiFetch('/api/llm/test', { method: 'POST', body: JSON.stringify({ id }) })
        .then((r) => r.ok && !!r.data?.ok);
}

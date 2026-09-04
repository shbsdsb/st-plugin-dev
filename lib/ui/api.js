export async function apiFetch(path, init) {
    const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...init });
    return res.json();
}
export function listPresets() {
    return apiFetch('/api/llm/presets').then((r) => {
        if (!r.ok)
            throw new Error(r.message || '加载预设失败');
        return r.data;
    });
}
export function createPreset(input) {
    return apiFetch('/api/llm/presets', { method: 'POST', body: JSON.stringify(input) })
        .then((r) => { if (!r.ok)
        throw new Error(r.message || '保存失败'); return r.data; });
}
export function updatePreset(id, input) {
    return apiFetch(`/api/llm/presets/${id}`, { method: 'PUT', body: JSON.stringify(input) })
        .then((r) => { if (!r.ok)
        throw new Error(r.message || '保存失败'); return r.data; });
}
export function deletePreset(id) {
    return apiFetch(`/api/llm/presets/${id}`, { method: 'DELETE' })
        .then((r) => { if (!r.ok)
        throw new Error(r.message || '删除失败'); return r.data; });
}
export function fetchModels(id) {
    return apiFetch('/api/llm/models', { method: 'POST', body: JSON.stringify({ id }) })
        .then((r) => { if (!r.ok)
        throw new Error(r.message || '拉取失败'); return r.data.models; });
}
export function fetchModelsByInput(input) {
    return apiFetch('/api/llm/models', { method: 'POST', body: JSON.stringify(input) })
        .then((r) => { if (!r.ok)
        throw new Error(r.message || '拉取失败'); return r.data.models; });
}
export function testPreset(target) {
    return apiFetch('/api/llm/test', { method: 'POST', body: JSON.stringify(target) })
        .then((r) => { if (!r.ok)
        throw new Error(r.message || '测试失败'); return !!r.data?.ok; });
}
export function setActive(id) {
    return apiFetch('/api/llm/active', { method: 'PUT', body: JSON.stringify({ id }) })
        .then((r) => { if (!r.ok)
        throw new Error(r.message || '设置当前预设失败'); });
}
export function getActive() {
    return apiFetch('/api/llm/active').then((r) => {
        if (!r.ok)
            throw new Error(r.message || '读取当前预设失败');
        return r.data.id;
    });
}

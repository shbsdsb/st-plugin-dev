async function apiFetch(path, init) {
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
export function listSessions() {
    return apiFetch('/api/session/list').then((r) => r.data);
}
export function createSession() {
    return apiFetch('/api/session/create', { method: 'POST' }).then((r) => r.data);
}
export function removeSession(id) {
    return apiFetch('/api/session/' + id, { method: 'DELETE' }).then(() => undefined);
}
export function getActive() {
    return apiFetch('/api/session/active').then((r) => r.data);
}
export function setActive(id) {
    return apiFetch('/api/session/active', { method: 'PUT', body: JSON.stringify({ sessionId: id }) }).then(() => undefined);
}

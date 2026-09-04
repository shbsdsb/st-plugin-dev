export const PROVIDER_BASE_URLS = {
    openai: 'api.openai.com/v1',
    deepseek: 'api.deepseek.com/v1',
    zhipu: 'open.bigmodel.cn/api/paas/v4',
    qwen: 'dashscope.aliyuncs.com/compatible-mode/v1',
    anthropic: 'api.anthropic.com/v1',
    google: 'generativelanguage.googleapis.com/v1beta',
};
export const PROVIDER_FORMATS = {
    openai: 'openai_compatible',
    deepseek: 'openai_compatible',
    zhipu: 'openai_compatible',
    qwen: 'openai_compatible',
    anthropic: 'anthropic',
    google: 'google',
};
export function normalizeBase(url) {
    return url.replace(/\/+$/, '');
}
function withProtocol(base) {
    return /^https?:\/\//i.test(base) ? base : `https://${base}`;
}
export function buildModelRequest(format, baseUrl, key) {
    const base = withProtocol(normalizeBase(baseUrl));
    if (format === 'anthropic') {
        return { method: 'GET', url: `${base}/models`, headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } };
    }
    if (format === 'google') {
        return { method: 'GET', url: `${base}/models?key=${encodeURIComponent(key)}`, headers: {} };
    }
    return { method: 'GET', url: `${base}/models`, headers: { Authorization: `Bearer ${key}` } };
}
export function parseModelList(format, json) {
    const j = json;
    if (!j)
        return [];
    if (format === 'google') {
        const rows = (j.models ?? []);
        return rows.map((m) => String(m.name ?? '').replace(/^models\//, '')).filter(Boolean);
    }
    const rows = (j.data ?? []);
    return rows.map((m) => String(m.id ?? '')).filter(Boolean);
}
export function buildTestRequest(format, opts) {
    const base = withProtocol(normalizeBase(opts.baseUrl));
    if (format === 'anthropic') {
        return {
            method: 'POST',
            url: `${base}/messages`,
            headers: { 'x-api-key': opts.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
            body: JSON.stringify({ model: opts.model, max_tokens: 8, messages: [{ role: 'user', content: 'ping' }] }),
        };
    }
    if (format === 'google') {
        const body = JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] });
        return {
            method: 'POST',
            url: `${base}/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(opts.key)}`,
            headers: { 'content-type': 'application/json' },
            body,
        };
    }
    return {
        method: 'POST',
        url: `${base}/chat/completions`,
        headers: { Authorization: `Bearer ${opts.key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: opts.model, messages: [{ role: 'user', content: 'ping' }] }),
    };
}
export async function sendJson(req, timeout, fetchImpl = fetch) {
    const res = await fetchImpl(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        signal: AbortSignal.timeout(timeout * 1000),
    });
    const text = await res.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    }
    catch {
        json = null;
    }
    return { status: res.status, json };
}
export function isOk(format, json) {
    const j = json;
    if (!j)
        return false;
    if (format === 'google')
        return Array.isArray(j.candidates) && j.candidates.length > 0;
    if (format === 'anthropic')
        return Array.isArray(j.content) && j.content.length > 0;
    return Array.isArray(j.choices) && j.choices.length > 0;
}
export async function sendChat(format, opts, timeout, fetchImpl = fetch) {
    const base = withProtocol(normalizeBase(opts.baseUrl));
    if (opts.messages.length === 0)
        throw new Error('messages 不能为空');
    if (format === 'anthropic') {
        return sendJson({
            method: 'POST',
            url: `${base}/messages`,
            headers: { 'x-api-key': opts.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
            body: JSON.stringify({ model: opts.model, max_tokens: 8, messages: opts.messages }),
        }, timeout, fetchImpl);
    }
    if (format === 'google') {
        const contents = opts.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
        return sendJson({
            method: 'POST',
            url: `${base}/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(opts.key)}`,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ contents }),
        }, timeout, fetchImpl);
    }
    return sendJson({
        method: 'POST',
        url: `${base}/chat/completions`,
        headers: { Authorization: `Bearer ${opts.key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: opts.model, messages: opts.messages }),
    }, timeout, fetchImpl);
}

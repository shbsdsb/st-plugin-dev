import { listPresets, getPreset, createPreset, updatePreset, deletePreset } from "./db.js";
import { buildModelRequest, parseModelList, buildTestRequest, sendJson, isOk } from "./format.js";
export function readBody(req) {
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', () => resolve(raw));
    });
}
function ok(res, data) {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, data }));
}
function fail(res, message) {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, message }));
}
function toPresetInput(b) {
    return {
        presetName: String(b.presetName ?? ''),
        format: String(b.format ?? 'openai_compatible'),
        vendor: String(b.vendor ?? ''),
        baseUrl: String(b.baseUrl ?? ''),
        model: String(b.model ?? ''),
        timeout: Number(b.timeout ?? 30),
    };
}
export function registerRoutes(register, dep) {
    const { db, cred } = dep;
    const fetchFn = dep.fetchImpl ?? fetch;
    const disposers = [];
    const add = (kind, path, handler) => disposers.push(register({ kind, path, handler }));
    // /api/llm/presets : GET list / POST create
    add('exact', '/api/llm/presets', async (req, res) => {
        try {
            if (req.method === 'GET') {
                const rows = listPresets(db);
                const withKey = await Promise.all(rows.map(async (r) => ({ ...r, hasKey: (await cred.get(`llm:${r.id}`)) != null })));
                return ok(res, withKey);
            }
            // POST
            const b = JSON.parse(await readBody(req));
            const input = toPresetInput(b);
            if (!input.baseUrl || !input.presetName)
                return fail(res, 'presetName/baseUrl 必填');
            const key = String(b.apiKey ?? '');
            if (!key)
                return fail(res, '新建必须提供 apiKey');
            const id = createPreset(db, input);
            await cred.set(`llm:${id}`, key);
            ok(res, { id });
        }
        catch (e) {
            fail(res, e.message);
        }
    });
    // /api/llm/presets/<id> : PUT update / DELETE remove
    add('prefix', '/api/llm/presets/', async (req, res) => {
        try {
            const id = Number(String(req.url ?? '').split('/').pop());
            if (!Number.isFinite(id))
                return fail(res, '非法 id');
            if (req.method === 'DELETE') {
                deletePreset(db, id);
                await cred.delete(`llm:${id}`);
                return ok(res, { id });
            }
            // PUT
            const b = JSON.parse(await readBody(req));
            const input = toPresetInput(b);
            if (!updatePreset(db, id, input))
                return fail(res, '预设不存在');
            const key = String(b.apiKey ?? '');
            if (key)
                await cred.set(`llm:${id}`, key);
            ok(res, { id });
        }
        catch (e) {
            fail(res, e.message);
        }
    });
    // /api/llm/models : 拉取模型(已存预设 id 或 当前表单字段)
    add('exact', '/api/llm/models', async (req, res) => {
        try {
            const b = JSON.parse(await readBody(req));
            let format, baseUrl, key, timeout = 30;
            if (b.id) {
                const p = getPreset(db, Number(b.id));
                if (!p)
                    return fail(res, '预设不存在');
                key = (await cred.get(`llm:${p.id}`)) ?? '';
                if (!key)
                    return fail(res, '未保存密钥');
                format = p.format;
                baseUrl = p.baseUrl;
                timeout = p.timeout;
            }
            else {
                format = String(b.format ?? '');
                baseUrl = String(b.baseUrl ?? '');
                key = String(b.apiKey ?? '');
                if (!format || !baseUrl || !key)
                    return fail(res, '请提供 format/baseUrl/apiKey(或已保存的 id)');
                timeout = Number(b.timeout) || 30;
            }
            const r = buildModelRequest(format, baseUrl, key);
            const { status, json } = await sendJson({ method: r.method, url: r.url, headers: r.headers }, timeout, fetchFn);
            if (status < 200 || status >= 300)
                return fail(res, `拉取失败: HTTP ${status}`);
            ok(res, { models: parseModelList(format, json) });
        }
        catch (e) {
            fail(res, e.message);
        }
    });
    // /api/llm/test : 真实测试
    add('exact', '/api/llm/test', async (req, res) => {
        try {
            const b = JSON.parse(await readBody(req));
            const p = getPreset(db, Number(b.id));
            if (!p)
                return fail(res, '预设不存在');
            const key = await cred.get(`llm:${p.id}`);
            if (!key)
                return fail(res, '未保存密钥');
            const r = buildTestRequest(p.format, { baseUrl: p.baseUrl, key, model: p.model });
            const { status, json } = await sendJson({ method: r.method, url: r.url, headers: r.headers, body: r.body }, p.timeout, fetchFn);
            if (status < 200 || status >= 300)
                return fail(res, `请求失败: HTTP ${status}`);
            ok(res, { ok: isOk(p.format, json) });
        }
        catch (e) {
            fail(res, '请求失败: ' + e.message);
        }
    });
    return () => disposers.forEach((d) => d());
}

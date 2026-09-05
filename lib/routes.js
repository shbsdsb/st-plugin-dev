import { NotFoundError } from "./store.js";
const PREFIX = '/api/prompt/';
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
function fail(res, status, message) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, message }));
}
function errStatus(e) {
    if (e instanceof NotFoundError)
        return 404;
    if (e instanceof SyntaxError)
        return 400;
    const msg = e?.message ?? '';
    if (/名称|role 非法|kind|base|text|children|顺序|父条目|子条目|内容|插件|注册|注入|占位/.test(msg))
        return 400;
    return 500;
}
function decode(seg) {
    try {
        return decodeURIComponent(seg);
    }
    catch {
        return seg;
    }
}
function parseBody(req) {
    return readBody(req).then((raw) => JSON.parse(raw || '{}'));
}
function notAllowed(res) {
    fail(res, 405, '不支持的方法');
}
/**
 * 路由分派(spec v4.1 §3.3):
 *   GET/PUT /api/prompt/active                     使用表单(active form)读写
 *   GET/POST /api/prompt/forms                     表单集合
 *   PUT/DELETE /api/prompt/forms/:id               改名/删除
 *   GET/POST /api/prompt/forms/:id/entries         平铺条目 / 建条目(普通|父|子)
 *   PUT/DELETE /api/prompt/forms/:id/entries/:eid  更新/删除(级联/剔父)
 *   PUT /api/prompt/forms/:id/order                保存全层级顺序 {entries?, children?}
 *   GET /api/prompt/registered                     已注册动态注入列表
 *   POST /api/prompt/forms/:id/registered-entry    添加注册条目(父+占位符子条)
 *   POST /api/prompt/forms/:id/preview             只拼不发的预览
 */
export function registerRoutes(register, dep) {
    const disposers = [];
    const { store, registry, chaining } = dep;
    disposers.push(register({
        kind: 'prefix', path: PREFIX,
        handler: async (req, res) => {
            try {
                const url = (req.url ?? '/').split('?')[0];
                const rest = url.startsWith(PREFIX) ? url.slice(PREFIX.length) : '';
                const seg = rest.split('/').filter((s) => s !== '').map(decode);
                const method = req.method ?? 'GET';
                if (seg.length === 0)
                    return fail(res, 404, '接口不存在');
                if (seg[0] === 'registered' && seg.length === 1) {
                    if (method !== 'GET')
                        return notAllowed(res);
                    return ok(res, registry.list());
                }
                if (seg[0] === 'active' && seg.length === 1) {
                    if (method === 'GET')
                        return ok(res, await store.getActiveFormId());
                    if (method === 'PUT') {
                        const { formId } = await parseBody(req);
                        await store.setActiveFormId(String(formId ?? ''));
                        return ok(res, { formId: String(formId ?? '') });
                    }
                    return notAllowed(res);
                }
                if (seg[0] !== 'forms')
                    return fail(res, 404, '接口不存在');
                if (seg.length === 1) {
                    if (method === 'GET')
                        return ok(res, await store.listForms());
                    if (method === 'POST') {
                        const { name } = await parseBody(req);
                        return ok(res, await store.createForm(String(name ?? '')));
                    }
                    return notAllowed(res);
                }
                const fid = seg[1];
                if (seg.length === 2) {
                    if (method === 'PUT') {
                        const { name } = await parseBody(req);
                        await store.renameForm(fid, String(name ?? ''));
                        return ok(res, { id: fid });
                    }
                    if (method === 'DELETE') {
                        await store.deleteForm(fid);
                        return ok(res, { id: fid });
                    }
                    return notAllowed(res);
                }
                const sub = seg[2];
                if (sub === 'entries') {
                    if (seg.length === 3) {
                        if (method === 'GET')
                            return ok(res, await store.listEntries(fid));
                        if (method === 'POST') {
                            const b = await parseBody(req);
                            return ok(res, await store.createEntry(fid, b));
                        }
                        return notAllowed(res);
                    }
                    if (seg.length === 4) {
                        const eid = seg[3];
                        if (method === 'PUT') {
                            const b = await parseBody(req);
                            await store.updateEntry(fid, eid, b);
                            return ok(res, { entryId: eid });
                        }
                        if (method === 'DELETE') {
                            await store.deleteEntry(fid, eid);
                            return ok(res, { entryId: eid });
                        }
                        return notAllowed(res);
                    }
                    return fail(res, 404, '接口不存在');
                }
                if (sub === 'order' && seg.length === 3) {
                    if (method !== 'PUT')
                        return notAllowed(res);
                    const b = await parseBody(req);
                    await store.saveLayout(fid, b);
                    return ok(res, { id: fid });
                }
                if (sub === 'preview' && seg.length === 3) {
                    if (method !== 'POST')
                        return notAllowed(res);
                    const messages = await dep.preview(fid);
                    if (messages.length === 0)
                        return fail(res, 400, '当前表单没有可拼接的内容');
                    return ok(res, { messages });
                }
                if (sub === 'registered-entry' && seg.length === 3) {
                    if (method !== 'POST')
                        return notAllowed(res);
                    const { id } = await parseBody(req);
                    const inj = registry.get(String(id ?? ''));
                    if (!inj)
                        return fail(res, 400, `注册条目不存在: ${String(id ?? '')}`);
                    return ok(res, await store.addRegisteredEntry(fid, { regId: inj.id, name: inj.name }));
                }
                return fail(res, 404, '接口不存在');
            }
            catch (e) {
                fail(res, errStatus(e), e.message);
            }
        },
    }));
    return () => { disposers.forEach((d) => d()); };
}

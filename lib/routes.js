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
    if (/名称|role 非法|kind|base|text|children|顺序|父条目|子条目|内容/.test(msg))
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
 * 路由分派(spec v3 §4.2):
 *   GET/POST /api/prompt/forms                     表单集合
 *   PUT/DELETE /api/prompt/forms/:id               改名/删除
 *   GET/POST /api/prompt/forms/:id/entries         全量平铺 / 建条目(普通|父|子)
 *   PUT/DELETE /api/prompt/forms/:id/entries/:eid  更新/删除(级联/剔父)
 *   PUT /api/prompt/forms/:id/order                保存全层级顺序 {entries?, children?}
 *   POST /api/prompt/forms/:id/send                后端组装发送
 */
export function registerRoutes(register, dep) {
    const disposers = [];
    const { store, llm } = dep;
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
                if (sub === 'send' && seg.length === 3) {
                    if (method !== 'POST')
                        return notAllowed(res);
                    const messages = await store.getMessages(fid);
                    if (messages.length === 0)
                        return fail(res, 400, '当前表单没有可发送的内容');
                    return ok(res, await llm.send(messages));
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

// agent_plugin_dev/multi-session-plugin/src/index.ts —— 服务入口:provide multiSession + /api/session/* 路由
import { Context } from 'cordis';
import { createMultiStore } from "./store.js";
import { createSessionService } from "./service.js";
import { registerRoutes } from "./routes.js";
export const name = 'multi-session-plugin';
export function apply(ctx, _config) {
    // 数据库异步就绪:服务对象同步 provide(host-plugin 运行时 provide 先例),方法体 await ready
    const ready = ctx.persistDb.open('data/session/sessions.db').then((db) => {
        const store = createMultiStore(db);
        return {
            svc: createSessionService(store),
            close: () => { db.close(); },
        };
    });
    const multiSession = {
        listSessions: async () => (await ready).svc.listSessions(),
        createSession: async () => (await ready).svc.createSession(),
        deleteSession: async (id) => { await (await ready).svc.deleteSession(id); },
        getActiveSessionId: async () => (await ready).svc.getActiveSessionId(),
        setActiveSessionId: async (id) => { await (await ready).svc.setActiveSessionId(id); },
        listMessages: async (sid) => (await ready).svc.listMessages(sid),
        appendMessage: async (sid, role, content) => { await (await ready).svc.appendMessage(sid, role, content); },
    };
    ctx.provide('multiSession', multiSession);
    ctx.effect(() => {
        let disposed = false;
        let disposer;
        let handle;
        void ready.then((r) => {
            if (disposed) {
                r.close();
                return;
            }
            handle = r;
            disposer = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { svc: r.svc });
        }).catch((e) => { console.error('[multi-session-plugin] init error:', e?.message ?? e); });
        return () => {
            disposed = true;
            disposer?.();
            handle?.close();
        };
    });
}
apply.inject = ['webServer', 'persistDb'];
apply.provide = [];
apply.Config = {
    '~standard': { version: 1, vendor: 'multi-session-plugin', validate: (value) => ({ value: value ?? {} }) },
};
export default apply;

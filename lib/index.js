// agent_plugin_dev/chat-plugin/src/index.ts —— 服务入口:注册 history/input 注入 + /api/chat/* 路由
import { Context } from 'cordis';
import { createChatStore } from "./store.js";
import { createHistoryText } from "./history.js";
import { sendMessage } from "./send.js";
import { registerRoutes } from "./routes.js";
export const name = 'chat-plugin';
const EmptyConfigSchema = {
    '~standard': { version: 1, vendor: 'chat-plugin', validate: (value) => ({ value: value ?? {} }) },
};
export function apply(ctx, _config) {
    ctx.effect(async () => {
        let db = null;
        let pending = null;
        const disposers = [];
        try {
            db = await ctx.persistDb.open('data/message/chat.db');
            const store = createChatStore(db);
            const pendingBox = {
                get: () => pending,
                set: (v) => { pending = v; },
            };
            disposers.push(ctx.promptRegister.register({
                id: 'history',
                name: 'chat-history',
                fn: createHistoryText(() => store.listMessages()),
            }));
            disposers.push(ctx.promptRegister.register({
                id: 'input',
                name: 'user-input',
                fn: () => {
                    const v = pendingBox.get();
                    if (!v)
                        throw new Error('未在发送会话中,user-input 仅可在发送时注入');
                    return v;
                },
            }));
            disposers.push(registerRoutes(ctx.webServer.register.bind(ctx.webServer), {
                store,
                send: (text) => sendMessage({ store, chaining: ctx.promptChaining, llm: ctx.llmPrompt, pending: pendingBox }, text),
            }));
            return () => {
                for (const d of disposers)
                    d();
                db?.close();
                db = null;
            };
        }
        catch (e) {
            console.error('[chat-plugin] init error:', e?.message ?? e);
            return () => { };
        }
    });
}
apply.inject = ['webServer', 'persistDb', 'promptChaining', 'promptRegister', 'llmPrompt'];
apply.provide = [];
apply.Config = EmptyConfigSchema;
export default apply;

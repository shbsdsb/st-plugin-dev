// agent_plugin_dev/llm-plugin/src/index.ts
import { Context } from 'cordis';
import { initPresets } from "./db.js";
import { registerRoutes } from "./routes.js";
import { createLlmPromptService } from "./service.js";
export const name = 'llm-plugin';
const EmptyConfigSchema = {
    '~standard': { version: 1, vendor: 'llm-plugin', validate: (value) => ({ value: value ?? {} }) },
};
export function apply(ctx, _config) {
    let db = null;
    let disposeRoutes = null;
    ctx.effect(async () => {
        let disposePrompt = null;
        try {
            db = await ctx.persistDb.open('data/llm/presets.db');
            initPresets(db);
            // ctx.provide 注册服务槽(runtime 后直接 ctx.xxx= 会抛 "cannot set ... without provide")
            disposePrompt = ctx.provide('llmPrompt', createLlmPromptService({ db, cred: ctx.credential }));
            disposeRoutes = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { db, cred: ctx.credential });
            return () => {
                disposeRoutes?.();
                disposeRoutes = null;
                disposePrompt?.();
                disposePrompt = null;
                db?.close();
                db = null;
            };
        }
        catch (e) {
            console.error('[llm-plugin] init error:', e?.message ?? e);
            return () => { };
        }
    });
}
apply.inject = ['webServer', 'persistDb', 'credential'];
apply.provide = ['llmPrompt'];
apply.Config = EmptyConfigSchema;
export default apply;

import { Context } from 'cordis';
import { registerRoutes } from "./routes.js";
import { createStore } from "./store.js";
export const name = 'prompt-plugin';
const EmptyConfigSchema = {
    '~standard': { version: 1, vendor: 'prompt-plugin', validate: (value) => ({ value: value ?? {} }) },
};
export function apply(ctx, _config) {
    ctx.effect(async () => {
        let disposeRoutes = null;
        try {
            const store = createStore(ctx.persistJson);
            disposeRoutes = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { store, llm: ctx.llmPrompt });
            return () => { disposeRoutes?.(); disposeRoutes = null; };
        }
        catch (e) {
            console.error('[prompt-plugin] init error:', e?.message ?? e);
            return () => { };
        }
    });
}
apply.inject = ['webServer', 'persistJson', 'llmPrompt'];
apply.provide = [];
apply.Config = EmptyConfigSchema;
export default apply;

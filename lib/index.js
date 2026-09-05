import { Context } from 'cordis';
import { registerRoutes } from "./routes.js";
import { createStore } from "./store.js";
import { createRegisterTable } from "./register.js";
import { buildWithActive, buildPreview } from "./chain.js";
export const name = 'prompt-plugin';
const EmptyConfigSchema = {
    '~standard': { version: 1, vendor: 'prompt-plugin', validate: (value) => ({ value: value ?? {} }) },
};
export function apply(ctx, _config) {
    ctx.effect(async () => {
        let disposeRoutes = null;
        let disposeReg = null;
        let disposeChain = null;
        try {
            const store = createStore(ctx.persistJson);
            const registry = createRegisterTable();
            const chaining = {
                active: () => store.getActiveFormId(),
                hasRegistered: (formId, regId) => store.hasRegisteredEntry(formId, regId),
                build: (formId) => buildWithActive(store, registry, formId),
            };
            disposeReg = ctx.provide('promptRegister', registry);
            disposeChain = ctx.provide('promptChaining', chaining);
            disposeRoutes = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { store, registry, chaining, preview: (formId) => buildPreview(formId, store) });
            return () => {
                disposeRoutes?.();
                disposeRoutes = null;
                disposeReg?.();
                disposeReg = null;
                disposeChain?.();
                disposeChain = null;
            };
        }
        catch (e) {
            console.error('[prompt-plugin] init error:', e?.message ?? e);
            return () => { };
        }
    });
}
apply.inject = ['webServer', 'persistJson']; // v4:不再依赖 llmPrompt(只拼不发,发送由调用方决定)
apply.provide = ['promptChaining', 'promptRegister'];
apply.Config = EmptyConfigSchema;
export default apply;

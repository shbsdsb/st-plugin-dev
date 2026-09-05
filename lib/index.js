import { Context } from 'cordis';
import { registerRoutes } from "./routes.js";
export const name = 'ui-polish';
const ConfigSchema = {
    '~standard': {
        version: 1,
        vendor: 'ui-polish',
        validate: (value) => ({ value: (value ?? {}) }),
    },
};
export function apply(ctx, config) {
    const stHome = process.env.ST_HOME ?? '';
    ctx.effect(() => {
        if (stHome.length === 0) {
            ctx.logger.warn('[ui-polish] ST_HOME 未设置,定制主题不可用(仅默认 token 层)');
        }
        const dispose = registerRoutes(ctx.webServer.register.bind(ctx.webServer), { stHome, config });
        return () => dispose();
    });
}
apply.inject = ['webServer'];
apply.provide = [];
apply.Config = ConfigSchema;
export default apply;

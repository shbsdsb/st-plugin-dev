import { Context } from 'cordis';
import path from 'node:path';
import { normalizeConfig } from "./config.js";
import { makeTime, renderLine } from "./format.js";
import { createObserver } from "./observer.js";
import { createWriter } from "./writer.js";
export const name = 'logger-plugin';
const ConfigSchema = {
    '~standard': {
        version: 1,
        vendor: 'logger-plugin',
        validate: (value) => ({ value: normalizeConfig(value) }),
    },
};
function resolveStHome() {
    return process.env.ST_HOME ?? null;
}
export function apply(ctx, rawConfig) {
    const config = normalizeConfig(rawConfig);
    ctx.effect(() => {
        let disposeObserver = null;
        const stHome = resolveStHome();
        if (config.file && !stHome) {
            ctx.logger.warn('[logger-plugin] 未设置 ST_HOME,降级为仅终端输出');
        }
        const writer = createWriter({
            dir: stHome ? path.join(stHome, 'data', 'logger') : '',
            stdout: true,
            file: config.file && !!stHome, // 无 ST_HOME → 仅终端
            onError: (msg) => ctx.logger.error(`[logger-plugin] ${msg}`),
        });
        const sink = (a) => {
            const line = renderLine({
                time: makeTime(a.date, config.timeFormat),
                kind: a.kind,
                plugin: a.plugin,
                detail: a.detail,
            });
            writer?.write(line);
        };
        disposeObserver = createObserver(ctx, {
            config: { lifecycle: config.lifecycle, service: config.service, events: config.events },
            sink,
        });
        return () => {
            disposeObserver?.();
            disposeObserver = null;
            writer?.close();
        };
    });
}
apply.inject = [];
apply.provide = [];
apply.Config = ConfigSchema;
export default apply;

// agent_plugin_dev/host-plugin/src/index.ts(改造)
import { execFileSync } from 'node:child_process';
import { resolveListenTarget, HostConfigSchema } from "./config.js";
import { WebServerService } from "./web-server.js";
export const name = 'host';
export function apply(ctx, config) {
    // config 来自覆盖层 patch(经 HostConfigSchema 校验 + 默认值),不再旁路读文件
    ctx.provide('host', { config });
    const webserver = new WebServerService(config.listenWhitelist);
    ctx.provide('webServer', webserver);
    ctx.effect(() => async () => {
        await webserver.stop();
    });
    if (process.env.ST_HOST_START === 'true') {
        return (async () => {
            const target = resolveListenTarget(config);
            try {
                await webserver.start(config.port, target);
            }
            catch (error) {
                console.error(`Host 启动失败: ${error instanceof Error ? error.message : String(error)}`);
                process.exit(1);
            }
            ctx.logger.info(`Host listening on http://${target}:${config.port}`);
            if (config.open) {
                try {
                    execFileSync('cmd', ['/c', 'start', '', `http://${target}:${config.port}`], { stdio: 'ignore' });
                }
                catch {
                    // 浏览器打开失败不阻塞服务
                }
            }
        })();
    }
}
apply.Config = HostConfigSchema;
export default apply;

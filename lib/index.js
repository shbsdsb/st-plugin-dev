import { ModuleTable } from "./module-table.js";
import { renderShellPage } from "./shell-page.js";
/** web-module Config schema(空:不接收任何实现信息,默认宿主自生成) */
export const WebModuleConfigSchema = {
    '~standard': {
        version: 1,
        vendor: 'web-module',
        validate() {
            return { value: {} };
        },
    },
};
export const name = 'web-module';
export function apply(ctx, config) {
    const table = new ModuleTable();
    ctx.provide('webModule', table);
    const boot = ctx.clientBoot.boot; // inject ['clientBoot'] 保证可用(必需依赖)
    // 自生成默认宿主:不从 config 取实现信息,自动选 boot 清单第一个可加载插件
    const defaultPlugin = boot[0]?.id;
    const write = (res, status, body, type) => {
        res.writeHead(status, { 'content-type': type });
        res.end(body);
    };
    // 收集所有路由的 disposer,插件卸载/热重载时统一清理,避免路由残留
    const disposers = [];
    // 根路径:重定向到 /shell(宿主按 defaultPlugin 自动加载主页面)
    disposers.push(ctx.webServer.register({
        kind: 'exact',
        path: '/',
        handler: (_req, res) => {
            res.writeHead(302, { location: '/shell' });
            res.end();
        },
    }));
    disposers.push(ctx.webServer.register({
        kind: 'exact',
        path: '/shell',
        handler: (_req, res) => write(res, 200, renderShellPage(table, boot, defaultPlugin), 'text/html; charset=utf-8'),
    }));
    disposers.push(ctx.webServer.register({
        kind: 'exact',
        path: '/shell/importmap.json',
        handler: (_req, res) => write(res, 200, JSON.stringify(table.importmap), 'application/json; charset=utf-8'),
    }));
    disposers.push(ctx.webServer.register({
        kind: 'prefix',
        path: '/shell/modules',
        handler: async (req, res) => {
            const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
            const out = pathname.slice('/shell/modules/'.length); // 'react.cjs' 等,不再 strip 扩展名
            try {
                const code = await table.build(out);
                if (code === undefined) {
                    write(res, 404, '404 module not found: ' + pathname, 'text/plain; charset=utf-8');
                    return;
                }
                write(res, 200, code, 'text/javascript; charset=utf-8');
            }
            catch (error) {
                ctx.logger.error('[web-module] esbuild 打包失败 %s: %s', pathname, error.message);
                write(res, 500, '500 build failed: ' + error.message, 'text/plain; charset=utf-8');
            }
        },
    }));
    // 插件卸载时逐个调用路由 disposer,移除已注册的路由
    ctx.effect(() => () => disposers.forEach((dispose) => dispose()));
}
apply.inject = ['webServer', 'clientBoot'];
apply.provide = ['webModule'];
apply.Config = WebModuleConfigSchema;
// cordis-loader 的 unwrapExports 取 default export 作为插件对象;
// 无 default 时返回整个 namespace,registry.plugin 会读 namespace.inject(undefined),
// 导致 apply 上的 inject/provide 静态属性失效 → 必须显式 default 导出 apply
export default apply;
